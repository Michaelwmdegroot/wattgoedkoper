<?php
declare(strict_types=1);
// Manual, CLI-only production backup. Does not import, alter MySQL or modify private config.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/backup.php';

$archive = null; $credentialFile = null; $success = false; $proc = null; $errorMessage = null;
try {
    $options = getopt('', ['output:', 'dump-binary::']);
    $output = $options['output'] ?? '';
    if (!is_string($output) || !preg_match('/^\/[a-zA-Z0-9_\/.\-]+\.wgbk$/D', $output)) {
        throw new RuntimeException('Gebruik --output=/beveiligde/map/wattgoedkoper-YYYYMMDD.wgbk.');
    }
    wg_backup_safe_directory(dirname($output), dirname(__DIR__));
    if (is_file($output) || is_link($output) || file_exists($output)) {
        throw new RuntimeException('Dit back-upbestand bestaat al; overschrijven is verboden.');
    }
    $binary = $options['dump-binary'] ?? 'mysqldump';
    if (!in_array($binary, ['mysqldump', 'mariadb-dump'], true)) {
        throw new RuntimeException('Alleen mysqldump of mariadb-dump is toegestaan.');
    }
    if (!function_exists('proc_open')) {
        throw new RuntimeException('PHP proc_open is niet beschikbaar; geen back-up uitgevoerd.');
    }
    $config = wg_config();
    if (!$config || ($config['database']['driver'] ?? '') !== 'mysql') {
        throw new RuntimeException('Bestaande private MySQL-configuratie ontbreekt of is ongeldig.');
    }
    $rawConfig = @file_get_contents($config['private_dir'] . '/config.php');
    $mailPath = $config['private_dir'] . '/mail-config.php';
    $rawMail = is_file($mailPath) ? @file_get_contents($mailPath) : null;
    if (!is_string($rawConfig) || strlen($rawConfig) > 65536 || $rawConfig === ''
        || ($rawMail !== null && (!is_string($rawMail) || strlen($rawMail) > 65536))) {
        throw new RuntimeException('Private herstelbestanden niet veilig leesbaar.');
    }
    $passphrase = fgets(STDIN);
    if ($passphrase === false) throw new RuntimeException('Herstelwachtzin niet ontvangen via standaardinvoer.');
    $passphrase = rtrim($passphrase, "\r\n");
    if (strlen($passphrase) < 20) throw new RuntimeException('Herstelwachtzin moet ten minste 20 tekens bevatten.');
    // Credentials live only in a tightly permissioned temporary client file, never in arguments.
    $database = $config['database'];
    foreach (['host', 'user', 'password'] as $key) {
        if (!is_string($database[$key] ?? null) || preg_match('/[\r\n\0]/', $database[$key])) {
            throw new RuntimeException('Database-instellingen kunnen niet veilig worden doorgegeven.');
        }
    }
    $credentialFile = $config['private_dir'] . '/wg-backup-client-' . bin2hex(random_bytes(12)) . '.cnf';
    $credentialHandle = @fopen($credentialFile, 'x');
    if (!$credentialHandle) throw new RuntimeException('Kan tijdelijk beveiligd databaseprofiel niet maken.');
    @chmod($credentialFile, 0600);
    $quoted = static fn(string $s): string => '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $s) . '"';
    try {
        wg_backup_write_all($credentialHandle,
            "[client]\nhost=" . $quoted($database['host']) . "\nuser=" . $quoted($database['user'])
            . "\npassword=" . $quoted($database['password']) . "\n");
    } finally { fclose($credentialHandle); }
    umask(0077);
    $archive = @fopen($output, 'x+b');
    if (!$archive) throw new RuntimeException('Kon exclusief back-upbestand niet maken.');
    $createdArchive = true;
    @chmod($output, 0600);
    $streamState = wg_backup_begin($archive, $passphrase);
    sodium_memzero($passphrase);
    wg_backup_record($archive, $streamState, 'T', json_encode([
        'format' => 'wg-mysql-v1', 'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'consistency' => 'single-transaction', 'storage' => 'encrypted-sodium'
    ], JSON_THROW_ON_ERROR));
    wg_backup_record($archive, $streamState, 'C', $rawConfig);
    if (is_string($rawMail)) wg_backup_record($archive, $streamState, 'M', $rawMail);
    unset($rawConfig, $rawMail);
    $command = [$binary, '--defaults-extra-file=' . $credentialFile, '--single-transaction',
        '--quick', '--hex-blob', '--no-tablespaces', '--default-character-set=utf8mb4', $database['name']];
    $pipes = [];
    $proc = @proc_open($command, [0 => ['file', '/dev/null', 'r'],
        1 => ['pipe', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes, null, null, ['bypass_shell' => true]);
    if (!is_resource($proc)) throw new RuntimeException('MySQL-exportprogramma is niet beschikbaar.');
    $sqlBytes = 0;
    while (!feof($pipes[1])) {
        $chunk = fread($pipes[1], 65536);
        if ($chunk === false) throw new RuntimeException('Lezen van MySQL-export mislukt.');
        if ($chunk !== '') {
            $sqlBytes += strlen($chunk);
            wg_backup_record($archive, $streamState, 'S', $chunk);
        }
    }
    fclose($pipes[1]);
    $exit = proc_close($proc); $proc = null;
    if ($exit !== 0 || $sqlBytes < 100) throw new RuntimeException('MySQL-export faalde of leverde onvoldoende gegevens.');
    wg_backup_record($archive, $streamState, 'E', '', true);
    if (!fflush($archive)) throw new RuntimeException('Back-up kon niet definitief geschreven worden.');
    fclose($archive); $archive = null;
    $success = true;
    fwrite(STDOUT, "Versleutelde back-up aangemaakt. Voer een onafhankelijke inspectie en afgeschermde hersteltest uit.\n");
} catch (Throwable $error) {
    $errorMessage = $error->getMessage();
} finally {
    if (is_resource($proc)) @proc_terminate($proc);
    if (is_resource($archive)) @fclose($archive);
    if (is_string($credentialFile)) @unlink($credentialFile);
    if (!$success && isset($output) && is_string($output) && str_ends_with($output, '.wgbk')
        && is_resource($archive) === false) {
        // Never delete a pre-existing archive: only remove a file this invocation created.
        if ($createdArchive ?? false) @unlink($output);
    }
}
if (!$success) { fwrite(STDERR, 'Back-up NIET bevestigd: ' . ($errorMessage ?? 'onbekende fout') . "\n"); exit(1); }

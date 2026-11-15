<?php
declare(strict_types=1);
// Inspect encrypted recovery bundle, or extract ONLY on a separate isolated host.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/backup.php';
$opened = []; $created = []; $complete = false; $errorMessage = null;
try {
    $options = getopt('', ['file:', 'extract-dir:', 'confirm-isolated']);
    $file = $options['file'] ?? null;
    if (!is_string($file) || !is_file($file)) throw new RuntimeException('Gebruik --file=/pad/naar/back-up.wgbk.');
    $extract = $options['extract-dir'] ?? null;
    if ($extract !== null) {
        if (!is_string($extract) || !isset($options['confirm-isolated'])) {
            throw new RuntimeException('Uitpakken vereist --extract-dir en --confirm-isolated.');
        }
        if (wg_backup_installed_here(dirname(__DIR__), wg_private_dir())) {
            throw new RuntimeException('Uitpakken op een geïnstalleerde WattGoedkoper-server is verboden.');
        }
        $destination = wg_backup_safe_directory($extract, dirname(__DIR__));
        if (count(scandir($destination)) !== 2) throw new RuntimeException('Kies een lege, afgeschermde herstelmap.');
        $sourceDir = realpath(dirname($file));
        if ($sourceDir === $destination) throw new RuntimeException('Herstelmap moet gescheiden zijn van de back-up.');
    }
    $passphrase = fgets(STDIN);
    if ($passphrase === false) throw new RuntimeException('Geen herstelwachtzin ontvangen via standaardinvoer.');
    $passphrase = rtrim($passphrase, "\r\n");
    // Always authenticate the entire archive before creating any plaintext files.
    $info = wg_backup_read($file, $passphrase, static function (): void {});
    if ($extract !== null) {
        wg_backup_read($file, $passphrase, static function (string $type, string $data) use ($destination, &$opened, &$created): void {
            $name = match ($type) {
                'C' => 'config.php', 'M' => 'mail-config.php', 'S' => 'database.sql', default => null
            };
            if ($name === null) return;
            if (!isset($opened[$name])) {
                $filePath = $destination . '/' . $name;
                $handle = @fopen($filePath, 'x+b');
                if (!$handle) throw new RuntimeException('Isolatie-uitvoer bestaat al of is niet schrijfbaar.');
                chmod($filePath, 0600);
                $opened[$name] = $handle; $created[] = $filePath;
            }
            wg_backup_write_all($opened[$name], $data);
        });
        foreach ($opened as $handle) { if (!fflush($handle)) throw new RuntimeException('Hersteluitvoer niet veilig geschreven.'); fclose($handle); }
        $opened = [];
    }
    sodium_memzero($passphrase);
    $complete = true;
    echo json_encode(['ok' => true, 'authenticated' => true, 'format' => $info['format'],
        'createdAt' => $info['createdAt'], 'sqlBytes' => $info['sqlBytes'],
        'configIncluded' => $info['configIncluded'], 'mailConfigIncluded' => $info['mailConfigIncluded'],
        'extracted' => $extract !== null], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $error) {
    $errorMessage = $error->getMessage();
} finally {
    foreach ($opened as $handle) if (is_resource($handle)) @fclose($handle);
    if (!$complete) foreach ($created as $path) @unlink($path);
}
if (!$complete) { fwrite(STDERR, 'Back-up NIET geverifieerd: ' . ($errorMessage ?? 'onbekende fout') . "\n"); exit(1); }

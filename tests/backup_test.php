<?php
declare(strict_types=1);
/** Synthetic-only encrypted archive tests. Never connects to a real database or mailbox. */
require dirname(__DIR__) . '/lib/backup.php';
function checkBackup(bool $ok, string $name): void {
    if (!$ok) throw new RuntimeException('Backup test failed: ' . $name);
    global $checks; $checks++;
}
function deniedBackup(callable $operation, string $name): void {
    try { $operation(); } catch (Throwable) { checkBackup(true, $name); return; }
    throw new RuntimeException('Expected backup rejection: ' . $name);
}
function runBackupInspect(string $path, string $passphrase, ?string $dest = null): array {
    $args = [PHP_BINARY, dirname(__DIR__) . '/scripts/backup-inspect.php', '--file=' . $path];
    if ($dest !== null) { $args[] = '--extract-dir=' . $dest; $args[] = '--confirm-isolated'; }
    $pipes = [];
    $proc = proc_open($args, [0 => ['pipe','r'], 1 => ['pipe','w'], 2 => ['pipe','w']], $pipes,
        dirname(__DIR__), ['WG_PRIVATE_DIR' => '/path/that-does-not-exist']);
    if (!is_resource($proc)) throw new RuntimeException('Cannot run backup inspection CLI.');
    fwrite($pipes[0], $passphrase . "\n"); fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]); fclose($pipes[1]);
    $err = stream_get_contents($pipes[2]); fclose($pipes[2]);
    return [proc_close($proc), $out, $err];
}
$checks = 0;
$dir = sys_get_temp_dir() . '/wg-backup-fixture-' . bin2hex(random_bytes(8));
mkdir($dir, 0700);
$path = $dir . '/synthetic.wgbk';
$pass = 'CI synthetic passphrase at least twenty characters 2026';
$mockConfig = "<?php return ['encryption_key'=>'FICTIONAL_ONLY'];\n";
$mockMail = "<?php return ['username'=>'example.invalid'];\n";
$mockSql = "-- Synthetic mysqldump\nCREATE TABLE fixture (id INT);\nINSERT INTO fixture VALUES (1);\n";
try {
    $fp = fopen($path, 'x+b');
    $state = wg_backup_begin($fp, $pass);
    wg_backup_record($fp, $state, 'T', json_encode(['format' => 'wg-mysql-v1', 'createdAt' => '2026-11-15T00:00:00Z']));
    wg_backup_record($fp, $state, 'C', $mockConfig);
    wg_backup_record($fp, $state, 'M', $mockMail);
    wg_backup_record($fp, $state, 'S', $mockSql);
    wg_backup_record($fp, $state, 'E', '', true);
    fclose($fp);
    $seen = ['C'=>'', 'M'=>'', 'S'=>''];
    $info = wg_backup_read($path, $pass, static function (string $type, string $data) use (&$seen) {
        if (array_key_exists($type, $seen)) $seen[$type] .= $data;
    });
    checkBackup($info['authenticated'] && $info['configIncluded'] && $info['mailConfigIncluded'], 'archive authenticated including both config files');
    checkBackup($info['sqlBytes'] === strlen($mockSql), 'SQL length verified');
    checkBackup($seen['C'] === $mockConfig && $seen['M'] === $mockMail && $seen['S'] === $mockSql, 'exact decrypted roundtrip');
    checkBackup(!str_contains(file_get_contents($path), 'FICTIONAL_ONLY'), 'raw archive contains no sensitive config text');
    deniedBackup(fn()=>wg_backup_read($path, 'Incorrect passphrase 01234567890123', static function () {}), 'wrong passphrase rejected');
    [$code, $out] = runBackupInspect($path, $pass);
    checkBackup($code === 0 && str_contains($out, '"authenticated":true') && !str_contains($out, 'FICTIONAL_ONLY'), 'CLI inspect gives safe redacted evidence');
    $dest = $dir . '/isolated'; mkdir($dest, 0700);
    [$code, $out, $err] = runBackupInspect($path, $pass, $dest);
    checkBackup($code === 0 && $err === '', 'explicit isolated extraction works');
    checkBackup(file_get_contents($dest . '/config.php') === $mockConfig && file_get_contents($dest . '/mail-config.php') === $mockMail && file_get_contents($dest . '/database.sql') === $mockSql, 'isolated extracted data exact');
    checkBackup((fileperms($dest . '/config.php') & 0077) === 0, 'extracted config permissions 0600');
    [$code] = runBackupInspect($path, $pass, $dest);
    checkBackup($code !== 0, 'nonempty extraction destination rejected');
    deniedBackup(fn()=>wg_backup_safe_directory(dirname(__DIR__), dirname(__DIR__)), 'webroot prohibited');
    $mockSite=$dir.'/mock-site'; $mockWebroot=$mockSite.'/public_html';
    $mockPrivate=$mockSite.'/wattgoedkoper-private';
    mkdir($mockSite,0700); mkdir($mockWebroot,0700); mkdir($mockPrivate,0700);
    checkBackup(!wg_backup_installed_here($mockWebroot,$dir.'/environment-override'),
        'absent installation is not falsely detected');
    file_put_contents($mockPrivate.'/config.php',$mockConfig);
    checkBackup(wg_backup_installed_here($mockWebroot,$dir.'/environment-override'),
        'production sibling config still blocks extraction with manipulated WG_PRIVATE_DIR');
    @unlink($mockPrivate.'/config.php');
    checkBackup(!wg_backup_installed_here($mockWebroot,$dir.'/environment-override'),
        'isolation marker removed after fixture test');
    $copy = $dir . '/corrupt.wgbk';
    $bytes = file_get_contents($path); $bytes[65] = chr(ord($bytes[65]) ^ 0x01); file_put_contents($copy, $bytes);
    deniedBackup(fn()=>wg_backup_read($copy, $pass, static function () {}), 'tampered encrypted frame rejected');
    file_put_contents($copy, substr($bytes, 0, -10));
    deniedBackup(fn()=>wg_backup_read($copy, $pass, static function () {}), 'truncation rejected');
    file_put_contents($copy, file_get_contents($path) . 'extra');
    deniedBackup(fn()=>wg_backup_read($copy, $pass, static function () {}), 'trailing data rejected');
    echo "BACKUP: $checks synthetic-only crypto, CLI and restore-extraction checks passed\n";
} finally {
    foreach (['config.php','mail-config.php','database.sql'] as $file) @unlink($dir . '/isolated/' . $file);
    @rmdir($dir . '/isolated');
    @unlink($dir.'/mock-site/wattgoedkoper-private/config.php');
    @rmdir($dir.'/mock-site/wattgoedkoper-private');
    @rmdir($dir.'/mock-site/public_html'); @rmdir($dir.'/mock-site');
    @unlink($dir . '/corrupt.wgbk'); @unlink($path); @rmdir($dir);
}

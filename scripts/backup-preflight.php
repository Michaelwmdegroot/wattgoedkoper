<?php
declare(strict_types=1);
/**
 * Safe Hostinger backup readiness check. CLI-only and strictly read-only:
 * no database connection, no MySQL shell calls, no secrets, no archive,
 * no configuration changes or email delivery.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/backup.php';

function wg_preflight_find_dump(): ?string {
    $search = explode(PATH_SEPARATOR, (string) (getenv('PATH') ?: ''));
    foreach (['mysqldump', 'mariadb-dump'] as $name) {
        foreach ($search as $directory) {
            if ($directory === '' || !str_starts_with($directory, '/')) { continue; }
            $candidate = rtrim($directory, '/') . '/' . $name;
            if (is_file($candidate) && is_executable($candidate)) {
                return $name;
            }
        }
    }
    return null;
}
function wg_preflight_private_file_safe(string $path): bool {
    $mode = @fileperms($path);
    return is_file($path) && !is_link($path) && is_readable($path)
        && $mode !== false && ($mode & 0077) === 0;
}
function wg_preflight_private_dir_safe(string $dir, string $webroot): bool {
    $resolved = realpath($dir);
    $root = realpath($webroot);
    $mode = $resolved ? @fileperms($resolved) : false;
    return $resolved !== false && $root !== false
        && $resolved !== $root
        && !str_starts_with($resolved, $root . DIRECTORY_SEPARATOR)
        && !str_starts_with($root, $resolved . DIRECTORY_SEPARATOR)
        && !is_link($dir)
        && is_dir($resolved)
        && is_writable($resolved)
        && $mode !== false && ($mode & 0077) === 0;
}

$options = getopt('', ['directory:']);
$directory = $options['directory'] ?? null;
$root = dirname(__DIR__);
$private = wg_private_dir();
$config = wg_config();
$issues = [];

$privateSafe = wg_preflight_private_dir_safe($private, $root);
$configSafe = $privateSafe && wg_preflight_private_file_safe($private . '/config.php');
$mailPresent = is_file($private . '/mail-config.php');
$mailSafe = !$mailPresent || ($privateSafe && wg_preflight_private_file_safe($private . '/mail-config.php'));
if (!$config || ($config['database']['driver'] ?? null) !== 'mysql') {
    $issues[] = 'PRIVATE_MYSQL_CONFIG_UNAVAILABLE';
}
if (!$privateSafe || !$configSafe || !$mailSafe) {
    $issues[] = 'PRIVATE_PERMISSIONS_REVIEW';
}
$crypto = extension_loaded('sodium')
    && function_exists('sodium_crypto_pwhash')
    && function_exists('sodium_crypto_secretstream_xchacha20poly1305_init_push')
    && defined('SODIUM_CRYPTO_PWHASH_ALG_ARGON2ID13');
if (!$crypto) { $issues[] = 'SODIUM_UNAVAILABLE'; }
$pdo = extension_loaded('pdo_mysql');
if (!$pdo) { $issues[] = 'PDO_MYSQL_UNAVAILABLE'; }
$process = function_exists('proc_open');
if (!$process) { $issues[] = 'PROC_OPEN_UNAVAILABLE'; }
$dump = wg_preflight_find_dump();
if ($dump === null) { $issues[] = 'MYSQL_DUMP_BINARY_UNAVAILABLE'; }

$backupDirSafe = false;
if (is_string($directory) && str_starts_with($directory, '/')) {
    try {
        $safeDir = wg_backup_safe_directory($directory, $root);
        $backupDirSafe = is_writable($safeDir);
    } catch (Throwable) {
        // Deliberately do not print attempted filesystem paths.
    }
}
if (!$backupDirSafe) { $issues[] = 'BACKUP_DIRECTORY_UNSAFE_OR_MISSING'; }

$tempFound = false;
if ($privateSafe) {
    $temp = @glob(rtrim($private, '/') . '/wg-backup-client-*.cnf');
    $tempFound = is_array($temp) && count($temp) > 0;
}
if ($tempFound) { $issues[] = 'TEMP_MYSQL_CREDENTIAL_FILE_REVIEW'; }

$result = [
    'ok' => true,
    'checkedAt' => gmdate('Y-m-d\TH:i:s\Z'),
    'readyToAttemptBackup' => $issues === [],
    'checks' => [
        'privateConfigValid' => $config !== null && ($config['database']['driver'] ?? null) === 'mysql',
        'privatePermissionsSafe' => $privateSafe && $configSafe && $mailSafe,
        'cryptoAvailable' => $crypto,
        'pdoMysqlAvailable' => $pdo,
        'procOpenAvailable' => $process,
        'dumpBinary' => $dump ?? 'missing',
        'backupDirectorySafe' => $backupDirSafe,
        'tempCredentialFilesAbsent' => !$tempFound,
    ],
    'issues' => $issues,
    // Even an entirely green preflight cannot attest to a live dump or restore.
    'archiveCreated' => false,
    'archiveAuthenticated' => false,
    'isolatedRestoreVerified' => false,
];
echo json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";

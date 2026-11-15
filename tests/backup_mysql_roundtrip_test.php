<?php
declare(strict_types=1);
/** CI-only MySQL encrypted backup -> isolated restore -> AES decrypt. Never use on production. */
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/backup.php';
$checks = 0;
function backupMysqlCheck(bool $ok, string $reason): void {
    global $checks;
    if (!$ok) throw new RuntimeException('CI backup-restore test: ' . $reason);
    $checks++;
}
function backupMysqlCommand(array $args, ?string $stdinFile = null, ?array $env = null, ?string $input = null): array {
    $pipes = [];
    $descriptors = [
        0 => $stdinFile ? ['file', $stdinFile, 'r'] : ['pipe','r'],
        1 => ['pipe','w'], 2 => ['pipe','w']
    ];
    $proc = proc_open($args, $descriptors, $pipes, dirname(__DIR__), $env, ['bypass_shell'=>true]);
    if (!is_resource($proc)) throw new RuntimeException('CI subprocess unavailable.');
    if ($stdinFile === null) { fwrite($pipes[0], $input ?? ''); fclose($pipes[0]); }
    $out = stream_get_contents($pipes[1]); fclose($pipes[1]);
    $err = stream_get_contents($pipes[2]); fclose($pipes[2]);
    return [proc_close($proc), $out, $err];
}
$source = getenv('WG_TEST_MYSQL_NAME') ?: '';
$user = getenv('WG_TEST_MYSQL_USER') ?: '';
$pass = getenv('WG_TEST_MYSQL_PASSWORD') ?: '';
$rootPass = getenv('WG_TEST_MYSQL_ROOT_PASSWORD') ?: '';
if (getenv('GITHUB_ACTIONS') !== 'true' || $source !== 'wattgoedkoper_ci'
    || $user !== 'wattgoedkoper_ci' || $pass !== 'ci-password-not-a-secret'
    || $rootPass !== 'local-ci-root') {
    throw new RuntimeException('CI-only backup restore test refuses unknown environment.');
}
$dir = sys_get_temp_dir() . '/wg-mysql-recovery-ci-' . bin2hex(random_bytes(6));
$private = $dir . '/private';
$backups = $dir . '/backups';
$recovery = $dir . '/recovery';
foreach ([$dir, $private, $backups, $recovery] as $folder) {
    if (!mkdir($folder, 0700)) throw new RuntimeException('Unable to allocate CI-only folder.');
}
$archive = $backups . '/synthetic-ci.wgbk';
$configFile = $private . '/config.php';
$rootFile = $private . '/root-client.cnf';
$restoreName = 'wattgoedkoper_ci_restore';
$passphrase = 'CI-only backup passphrase of more than twenty characters';
$restoredSql = $recovery . '/database.sql';
$restoreDb = null;
$createdDatabase = false;
try {
    $config = [
        'origin'=>'http://localhost',
        'admin_username'=>'ci-only',
        'admin_password_hash'=>password_hash('ci-only-password', PASSWORD_DEFAULT),
        'encryption_key'=>base64_encode(random_bytes(32)),
        'hmac_key'=>bin2hex(random_bytes(32)),
        'retention_days'=>90,
        'database'=>['driver'=>'mysql', 'host'=>'127.0.0.1', 'name'=>$source,
            'user'=>$user, 'password'=>$pass]
    ];
    file_put_contents($configFile, "<?php return " . var_export($config,true) . ";\n");
    chmod($configFile,0600);
    $db = wg_db(array_replace($config, ['private_dir'=>$private]));
    $id = 'WG-RESTORE-CI-' . strtoupper(bin2hex(random_bytes(4)));
    $payload = ['name'=>'TEST SYNTHESE', 'email'=>'synthetic@example.invalid',
        'marker'=>'ci_restore_only', 'consent'=>true, 'consentVersion'=>WG_CONSENT_VERSION];
    $at = gmdate('Y-m-d\TH:i:s\Z');
    $db->prepare('INSERT INTO leads
       (id,idempotency_hash,request_hash,created_at,updated_at,status,partner,payload,consent_version)
       VALUES(?,?,?,?,?,?,?,?,?)')->execute([$id,hash('sha256','id'.$id),
        hash('sha256','body'.$id),$at,$at,'new','nivo',wg_encrypt($payload,$config),WG_CONSENT_VERSION]);
    $db = null;
    $environment = array_replace((array)getenv(), ['WG_PRIVATE_DIR'=>$private]);
    [$exit, $output, $error] = backupMysqlCommand(
        [PHP_BINARY, dirname(__DIR__) . '/scripts/backup-create.php', '--output=' . $archive],
        null, $environment, $passphrase . "\n"
    );
    backupMysqlCheck($exit===0 && is_file($archive) && str_contains($output,'Versleutelde back-up')
        && !str_contains($output,'synthetic@example'), 'actual MySQL export into encrypted stream');
    $bundle = wg_backup_read($archive, $passphrase, static function () {});
    backupMysqlCheck($bundle['authenticated'] && $bundle['configIncluded']
        && $bundle['sqlBytes']>100 && $bundle['sqlChunks']>0,
        'full archive authenticates with private config and SQL');
    $unconfigured = $dir . '/no-config';
    mkdir($unconfigured,0700);
    [$exit, $output, $error] = backupMysqlCommand(
        [PHP_BINARY,dirname(__DIR__) . '/scripts/backup-inspect.php', '--file=' . $archive,
            '--extract-dir=' . $recovery, '--confirm-isolated'],
        null, array_replace($environment, ['WG_PRIVATE_DIR'=>$unconfigured]), $passphrase . "\n"
    );
    backupMysqlCheck($exit===0 && str_contains($output,'"extracted":true')
        && is_file($restoredSql), 'separate isolated extraction of authenticated archive');
    $keyConfig = require $recovery . '/config.php';
    backupMysqlCheck(is_array($keyConfig) && $keyConfig['encryption_key'] === $config['encryption_key'],
        'existing AES key preserved byte-for-byte');
    file_put_contents($rootFile, "[client]\nhost=127.0.0.1\nuser=root\npassword=\"local-ci-root\"\n");
    chmod($rootFile, 0600);
    [$exit] = backupMysqlCommand(['mysql','--defaults-extra-file='.$rootFile,
        '-e','CREATE DATABASE '.$restoreName.' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci']);
    backupMysqlCheck($exit===0, 'ephemeral CI restore database created');
    $createdDatabase = true;
    [$exit] = backupMysqlCommand(['mysql','--defaults-extra-file='.$rootFile,$restoreName],$restoredSql);
    backupMysqlCheck($exit===0,'real SQL import into separate CI MySQL database succeeded');
    $restoreDb = new PDO('mysql:host=127.0.0.1;dbname='.$restoreName.';charset=utf8mb4',
        'root',$rootPass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $stmt = $restoreDb->prepare('SELECT payload FROM leads WHERE id=?');
    $stmt->execute([$id]);
    $cipher = $stmt->fetchColumn();
    backupMysqlCheck(is_string($cipher) && $cipher !== '', 'restored encrypted lead exists');
    backupMysqlCheck(wg_decrypt($cipher,$keyConfig)===$payload,
        'restored payload decrypts using exactly recovered original AES key');
    $tables = $restoreDb->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    backupMysqlCheck(in_array('delivery_outbox',$tables,true)
        && in_array('metadata',$tables,true) && in_array('daily_events',$tables,true),
        'full production-compatible schema restored');
    echo "BACKUP MYSQL CI: $checks end-to-end export, authenticated archive, separate restore and AES tests passed\n";
} finally {
    $restoreDb = null;
    if ($createdDatabase) {
        backupMysqlCommand(['mysql','--defaults-extra-file='.$rootFile,
            '-e','DROP DATABASE IF EXISTS '.$restoreName]);
    }
    foreach (['config.php','root-client.cnf'] as $file) @unlink($private.'/'.$file);
    foreach (['config.php','mail-config.php','database.sql'] as $file) @unlink($recovery.'/'.$file);
    @unlink($archive);
    @rmdir($dir.'/no-config');
    @rmdir($recovery); @rmdir($backups); @rmdir($private); @rmdir($dir);
}

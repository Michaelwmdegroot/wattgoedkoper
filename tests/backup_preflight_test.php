<?php
declare(strict_types=1);
// CI-only: synthetic config, fake executable. This test does not connect to MySQL or run mysqldump.
function preflightAssert(bool $ok, string $message): void {
    global $checks;
    if (!$ok) throw new RuntimeException('Backup preflight test failed: ' . $message);
    $checks++;
}
function preflightRun(string $private, string $directory, string $path): array {
    $pipes = [];
    $env = array_replace((array)getenv(), ['WG_PRIVATE_DIR'=>$private, 'PATH'=>$path]);
    $process = proc_open([PHP_BINARY, dirname(__DIR__) . '/scripts/backup-preflight.php',
            '--directory=' . $directory],
        [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']], $pipes, dirname(__DIR__), $env);
    if (!is_resource($process)) throw new RuntimeException('Cannot start backup preflight');
    fclose($pipes[0]);
    $stdout=stream_get_contents($pipes[1]); fclose($pipes[1]);
    $stderr=stream_get_contents($pipes[2]); fclose($pipes[2]);
    return [proc_close($process),json_decode($stdout,true,16,JSON_THROW_ON_ERROR),$stdout,$stderr];
}
$checks=0;
$root=sys_get_temp_dir() . '/wg-backup-preflight-' . bin2hex(random_bytes(8));
$private=$root.'/private';
$backups=$root.'/backups';
$fakeBin=$root.'/bin';
$emptyBin=$root.'/empty-bin';
foreach ([$root,$private,$backups,$fakeBin,$emptyBin] as $path) {
    preflightAssert(mkdir($path,0700), 'create isolated synthetic directory');
}
$configFile=$private.'/config.php';
$dump=$fakeBin.'/mysqldump';
$temp=$private.'/wg-backup-client-synthetic.cnf';
try {
    $config = [
        'origin'=>'http://localhost',
        'admin_username'=>'test_admin',
        'admin_password_hash'=>password_hash('ci-only-password',PASSWORD_DEFAULT),
        'encryption_key'=>base64_encode(random_bytes(32)),
        'hmac_key'=>bin2hex(random_bytes(32)),
        'retention_days'=>90,
        // PDO connection data is NEVER used by this preflight or its test.
        'database'=>['driver'=>'mysql','host'=>'127.0.0.1',
            'name'=>'wattgoedkoper_ci','user'=>'wattgoedkoper_ci',
            'password'=>'SYNTHETIC_SECRET_DO_NOT_OUTPUT']
    ];
    file_put_contents($configFile,'<?php return '.var_export($config,true).';');
    chmod($configFile,0600);
    file_put_contents($dump, "#!/bin/sh\nexit 91\n");
    chmod($dump,0700);

    [$code,$data,$raw,$err]=preflightRun($private,$backups,$fakeBin);
    preflightAssert($code===0&&$err===''&&$data['ok']===true,'ready JSON command succeeded');
    preflightAssert($data['readyToAttemptBackup']===true&&$data['issues']===[],
        'valid private fixture, dump, crypto, mode 0700 and target are ready');
    preflightAssert($data['checks']['dumpBinary']==='mysqldump',
        'found a fake executable without ever executing it');
    preflightAssert($data['archiveCreated']===false&&$data['isolatedRestoreVerified']===false,
        'readiness is not falsely called a backup or restore');
    preflightAssert(!str_contains($raw,$config['database']['password'])
        &&!str_contains($raw,$config['encryption_key'])
        &&!str_contains($raw,$config['hmac_key'])
        &&!str_contains($raw,$private)
        &&!str_contains($raw,$backups),
        'no credentials, keys or actual private file paths in stdout');
    preflightAssert(!is_file($root.'/fake-dump-was-executed'),
        'preflight never launched dump or MySQL');
    [$code,$data]=preflightRun($private,$backups,$emptyBin);
    preflightAssert($code===0&&!$data['readyToAttemptBackup']
        &&in_array('MYSQL_DUMP_BINARY_UNAVAILABLE',$data['issues'],true),
        'missing dump program is reported without attempting fallback export');
    chmod($backups,0755);
    [$code,$data]=preflightRun($private,$backups,$fakeBin);
    preflightAssert(!$data['readyToAttemptBackup']
        &&in_array('BACKUP_DIRECTORY_UNSAFE_OR_MISSING',$data['issues'],true),
        'world-readable backup directory is rejected');
    chmod($backups,0700);
    chmod($configFile,0644);
    [$code,$data]=preflightRun($private,$backups,$fakeBin);
    preflightAssert(!$data['readyToAttemptBackup']
        &&in_array('PRIVATE_PERMISSIONS_REVIEW',$data['issues'],true),
        'group/world-readable config file is rejected');
    chmod($configFile,0600);
    file_put_contents($temp,'FAKE_CREDENTIALS_DO_NOT_PRINT');
    chmod($temp,0600);
    [$code,$data,$raw]=preflightRun($private,$backups,$fakeBin);
    preflightAssert(!$data['readyToAttemptBackup']
        &&in_array('TEMP_MYSQL_CREDENTIAL_FILE_REVIEW',$data['issues'],true)
        &&!str_contains($raw,'FAKE_CREDENTIALS'),
        'leftover client credential file is flagged without printing contents');
    unlink($temp);
    [$code,$data]=preflightRun($private,$root.'/absent',$fakeBin);
    preflightAssert(!$data['readyToAttemptBackup']
        &&in_array('BACKUP_DIRECTORY_UNSAFE_OR_MISSING',$data['issues'],true),
        'missing archive directory does not get created');
    rename($configFile,$private.'/config.disabled');
    [$code,$data]=preflightRun($private,$backups,$fakeBin);
    preflightAssert(!$data['readyToAttemptBackup']
        &&in_array('PRIVATE_MYSQL_CONFIG_UNAVAILABLE',$data['issues'],true),
        'no configured MySQL is reported as unavailable');
    rename($private.'/config.disabled',$configFile);
    preflightAssert(count(scandir($backups))===2 && count(scandir($private))===3,
        'all probes left private fixture and directory contents unchanged');
    echo "BACKUP PREFLIGHT: $checks CI-only no-write checks passed\n";
} finally {
    @unlink($temp); @unlink($dump);
    @unlink($configFile); @unlink($private.'/config.disabled');
    foreach ([$emptyBin,$fakeBin,$backups,$private,$root] as $path) @rmdir($path);
}

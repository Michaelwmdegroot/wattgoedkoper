<?php
declare(strict_types=1);
// CI-only MySQL fixture. The production observer must never run UPDATE/INSERT/DDL.
require dirname(__DIR__).'/lib/bootstrap.php';
$checks=0;
function observerCheck(bool $ok,string $message): void {
    global $checks;
    if(!$ok) throw new RuntimeException('Read-only observer test: '.$message);
    $checks++;
}
function observerRun(string $dir): array {
    $pipes=[];
    $env=array_replace((array)getenv(),['WG_PRIVATE_DIR'=>$dir]);
    $proc=proc_open([PHP_BINARY,dirname(__DIR__).'/scripts/ops-readonly.php'],
        [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,dirname(__DIR__),$env);
    if(!is_resource($proc)) throw new RuntimeException('Cannot start read-only observer');
    fclose($pipes[0]);
    $text=stream_get_contents($pipes[1]);fclose($pipes[1]);
    $error=stream_get_contents($pipes[2]);fclose($pipes[2]);
    return [proc_close($proc),$text,$error];
}
if (getenv('GITHUB_ACTIONS')!=='true' || getenv('WG_TEST_MYSQL_NAME')!=='wattgoedkoper_ci'
    || getenv('WG_TEST_MYSQL_USER')!=='wattgoedkoper_ci') {
    throw new RuntimeException('Observer integration tests require the isolated GitHub CI database');
}
$private=sys_get_temp_dir().'/wg-ops-readonly-ci-'.bin2hex(random_bytes(7));
observerCheck(mkdir($private,0700),'create isolated fixture');
$config=[
  'origin'=>'http://localhost','admin_username'=>'ci_reader',
  'admin_password_hash'=>password_hash('synthetic-ci-only',PASSWORD_DEFAULT),
  'encryption_key'=>base64_encode(random_bytes(32)),
  'hmac_key'=>bin2hex(random_bytes(32)),
  'retention_days'=>90,'operations_monitor_enabled'=>true,
  'database'=>['driver'=>'mysql','host'=>'127.0.0.1',
    'name'=>getenv('WG_TEST_MYSQL_NAME'),'user'=>getenv('WG_TEST_MYSQL_USER'),
    'password'=>getenv('WG_TEST_MYSQL_PASSWORD')]
];
$path=$private.'/config.php';
try {
    file_put_contents($path,'<?php return '.var_export($config,true).';'); chmod($path,0600);
    $db=wg_db(array_replace($config,['private_dir'=>$private])); // Fixture schema only.
    $baseline=[
       'metadata'=>(int)$db->query('SELECT COUNT(*) FROM metadata')->fetchColumn(),
       'leads'=>(int)$db->query('SELECT COUNT(*) FROM leads')->fetchColumn(),
       'outbox'=>(int)$db->query('SELECT COUNT(*) FROM delivery_outbox')->fetchColumn(),
       'rates'=>(int)$db->query('SELECT COUNT(*) FROM rate_limits')->fetchColumn()
    ];
    [$exit,$raw,$err]=observerRun($private);
    observerCheck($exit===0&&$err==='','observer accepts prepared CI MySQL fixture');
    $data=json_decode($raw,true,20,JSON_THROW_ON_ERROR);
    observerCheck($data['ok']===true&&$data['backupStatus']==='not_verified',
        'backups remain unknown without real restore evidence');
    observerCheck(isset($data['cron']['observedDistinctRuns'])
        &&array_key_exists('previousSuccessAt',$data['cron'])
        &&in_array($data['cron']['status'],['fresh','stale','unknown'],true),
        'safe monitoring fields available without claims of automatic scheduler');
    observerCheck(is_array($data['delivery'])&&array_key_exists('smtp_accepted',$data['delivery'])
        &&array_key_exists('failed',$data['delivery']),
        'current SMTP technical counts only');
    observerCheck(!str_contains($raw,$config['database']['password'])
        &&!str_contains($raw,$config['hmac_key'])
        &&!str_contains($raw,$config['encryption_key'])
        &&!str_contains($raw,'synthetic@example')
        &&!str_contains($raw,'WG-CI-'),
        'no secrets, contact details or lead identifiers in output');
    [$again,$raw2,$err2]=observerRun($private);
    observerCheck($again===0 && $err2==='' && $raw2!=='' ,'repeat observer succeeds');
    $after=[
       'metadata'=>(int)$db->query('SELECT COUNT(*) FROM metadata')->fetchColumn(),
       'leads'=>(int)$db->query('SELECT COUNT(*) FROM leads')->fetchColumn(),
       'outbox'=>(int)$db->query('SELECT COUNT(*) FROM delivery_outbox')->fetchColumn(),
       'rates'=>(int)$db->query('SELECT COUNT(*) FROM rate_limits')->fetchColumn()
    ];
    observerCheck($baseline===$after,'observer made no schema, lead, outbox, metadata or rate-limit changes');
    [$missing,$nothing,$generic]=observerRun($private.'/not-installed');
    observerCheck($missing===1&&$nothing===''&&str_contains($generic,'inspectie mislukt'),
        'fails closed with generic message if no config exists');
    echo "OPS READ ONLY: $checks isolated MySQL CLI checks passed\n";
}finally{
    $db=null; @unlink($path);@rmdir($private);
}

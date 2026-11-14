<?php
declare(strict_types=1);
// Offline operations tests with invented data. Does not send email or NIVO requests.
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/delivery.php';
require dirname(__DIR__).'/lib/operations.php';

function opsCheck(bool $condition,string $message): void {
    if(!$condition){throw new RuntimeException('Operations test: '.$message);}
}
function runOperations(string $private): array {
    $pipes=[];
    $env=array_replace((array)getenv(),['WG_PRIVATE_DIR'=>$private]);
    $proc=proc_open([PHP_BINARY,dirname(__DIR__).'/scripts/operations.php'],
        [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,dirname(__DIR__),$env);
    if(!is_resource($proc)){throw new RuntimeException('Cannot start operations CLI');}
    fclose($pipes[0]);
    $stdout=stream_get_contents($pipes[1]);fclose($pipes[1]);
    $stderr=stream_get_contents($pipes[2]);fclose($pipes[2]);
    return [proc_close($proc),$stdout,$stderr];
}
$private=sys_get_temp_dir().'/wg-operations-test-'.bin2hex(random_bytes(7));
opsCheck(mkdir($private,0700),'private test directory');
$config=[
    'private_dir'=>$private,'origin'=>'http://localhost',
    'admin_username'=>'ci_admin','admin_password_hash'=>password_hash('synthetic-only-password',PASSWORD_DEFAULT),
    'encryption_key'=>base64_encode(random_bytes(32)),
    'hmac_key'=>bin2hex(random_bytes(32)),'retention_days'=>90,
    'operations_monitor_enabled'=>true,
    'operations_max_age_seconds'=>900
];
$checks=0;
try{
    $configFile=$private.'/config.php';
    opsCheck(file_put_contents($configFile,'<?php return '.var_export($config,true).';')!==false,'write private fixture config');
    chmod($configFile,0600);
    $db=wg_db($config);
    $initial=wg_ops_status($db,$config);
    opsCheck($initial['cron']['status']==='unknown'&&in_array('CRON_MISSING_OR_STALE',$initial['warnings'],true),
        'unrun cron is unknown and flagged when monitoring required');
    opsCheck($initial['backup']['status']==='not_verified','no assumed Hostinger backups');
    $checks+=2;
    $old=gmdate('Y-m-d\\TH:i:s\\Z',time()-95*86400);
    $new=gmdate('Y-m-d\\TH:i:s\\Z');
    $payload=wg_encrypt(['name'=>'Fictieve Oude Lead','email'=>'synthetic@example.test'],$config);
    $db->prepare('INSERT INTO leads
      (id,idempotency_hash,request_hash,created_at,updated_at,status,partner,payload,consent_version)
      VALUES(?,?,?,?,?,?,?,?,?)')->execute(['WG-OPS-OLD',str_repeat('4',64),str_repeat('5',64),
      $old,$old,'new','nivo',$payload,WG_CONSENT_VERSION]);
    [$exit,$stdout,$stderr]=runOperations($private);
    opsCheck($exit===0&&$stderr===''&&str_contains($stdout,'Retentie: 1'),'single CLI runs retention without personal output');
    opsCheck(!str_contains($stdout,'Fictieve')&&!str_contains($stdout,'synthetic@'),
        'CLI output excludes PII');
    opsCheck((int)$db->query("SELECT COUNT(*) FROM leads WHERE id='WG-OPS-OLD'")->fetchColumn()===0,
        'expired personal record purged');
    $checks+=3;
    $status=wg_ops_status($db,$config);
    opsCheck($status['cron']['status']==='fresh'&&$status['cron']['lastSuccessAt']!==null,
        'persisted heartbeat after successful run');
    opsCheck(!in_array('CRON_MISSING_OR_STALE',$status['warnings'],true),
        'healthy heartbeat clears missing-cron warning');
    $checks+=2;
    [$exit,$stdout,$stderr]=runOperations($private);
    opsCheck($exit===0&&str_contains($stdout,'Retentie: 0'),'repeat maintenance idempotent');
    $checks++;
    $lock=fopen($private.'/operations.lock','c');
    opsCheck(is_resource($lock)&&flock($lock,LOCK_EX|LOCK_NB),'acquire test process lock');
    [$exit,$stdout,$stderr]=runOperations($private);
    flock($lock,LOCK_UN);fclose($lock);
    opsCheck($exit===75&&str_contains($stderr,'een eerdere uitvoering'),'parallel scheduler rejected');
    $checks+=2;
    wg_ops_upsert($db,'ops_last_success_at','2020-01-01T00:00:00Z');
    $stale=wg_ops_status($db,$config);
    opsCheck($stale['cron']['status']==='stale'&&in_array('CRON_MISSING_OR_STALE',$stale['warnings'],true),
        'missed cron test yields actionable warning');
    $checks++;
    $config['operations_monitor_enabled']=false;
    $staleOff=wg_ops_status($db,$config);
    opsCheck($staleOff['cron']['status']==='stale'&&!in_array('CRON_MISSING_OR_STALE',$staleOff['warnings'],true),
        'monitor feature gate prevents alerts without owner enablement');
    $checks++;
    $fixture=$private.'/editorial.json';
    file_put_contents($fixture,'{"checkedOn":"2025-01-01"}');
    $editorial=wg_ops_source_review($fixture,time());
    opsCheck($editorial['status']==='review_due','stale editorial claims require human review');
    file_put_contents($fixture,'{"checkedOn":"2099-01-01"}');
    opsCheck(wg_ops_source_review($fixture,time())['status']==='unknown','future review dates never trusted');
    $checks+=2;
    $config['operations_monitor_enabled']=true;
    $db->prepare('INSERT INTO leads
      (id,idempotency_hash,request_hash,created_at,updated_at,status,partner,payload,consent_version)
      VALUES(?,?,?,?,?,?,?,?,?)')->execute(['WG-OPS-FAILED',str_repeat('6',64),str_repeat('7',64),
      $new,$new,'new','nivo',$payload,WG_CONSENT_VERSION]);
    wg_delivery_enqueue($db,'WG-OPS-FAILED',$new);
    $db->exec("UPDATE delivery_outbox SET status='failed',last_error='HTTP_REJECTED' WHERE lead_id='WG-OPS-FAILED'");
    $failure=wg_ops_status($db,$config);
    opsCheck(in_array('NIVO_DELIVERY_FAILED',$failure['warnings'],true),'failed transport triggers admin warning');
    opsCheck(!str_contains(json_encode($failure),'synthetic@example.test'),'warning payload contains no PII');
    $checks+=2;
    echo "Operations runner: $checks offline checks passed\n";
}finally{
    $db=null;
    foreach(['config.php','operations.lock','editorial.json','wattgoedkoper.sqlite','wattgoedkoper.sqlite-wal','wattgoedkoper.sqlite-shm'] as $filename){@unlink($private.'/'.$filename);}
    @rmdir($private);
}

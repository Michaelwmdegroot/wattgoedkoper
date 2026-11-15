<?php
declare(strict_types=1);
// CI-only integration test. Uses an ephemeral, empty MySQL service, never Hostinger production.
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/delivery.php';
function check(bool $ok,string $what): void {
    if (!$ok) { throw new RuntimeException('MySQL backend test failed: '.$what); }
}
if(!extension_loaded('pdo_mysql')){throw new RuntimeException('pdo_mysql required by MySQL integration test');}
$name=getenv('WG_TEST_MYSQL_NAME')?:'wattgoedkoper_ci';
$user=getenv('WG_TEST_MYSQL_USER')?:'wattgoedkoper_ci';
$pass=getenv('WG_TEST_MYSQL_PASSWORD')?:'ci-password-not-a-secret';
$cfg=[
    'origin'=>'https://wattgoedkoper.nl',
    'admin_username'=>'testadmin',
    'admin_password_hash'=>password_hash('local-only-testing-password',PASSWORD_DEFAULT),
    'encryption_key'=>base64_encode(random_bytes(32)),
    'hmac_key'=>bin2hex(random_bytes(32)),
    'retention_days'=>90, 'private_dir'=>sys_get_temp_dir(),
    'database'=>['driver'=>'mysql','host'=>'127.0.0.1','name'=>$name,'user'=>$user,'password'=>$pass]
];
$db=wg_db($cfg);
check(wg_is_mysql($db),'MySQL PDO selected');
check($db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql','driver name');
$tables=$db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
foreach (['leads','daily_events','rate_limits','metadata','delivery_outbox'] as $table) { check(in_array($table,$tables,true),'table '.$table); }
$payload=['name'=>'CI Test','email'=>'test@example.invalid','consent'=>true,'consentVersion'=>WG_CONSENT_VERSION];
$encrypted=wg_encrypt($payload,$cfg);
check(!str_contains($encrypted,'CI Test'),'PII not plaintext in DB payload');
check(wg_decrypt($encrypted,$cfg)===$payload,'AES-256-GCM roundtrip');
$now=gmdate('Y-m-d\TH:i:s\Z');
$insert=$db->prepare('INSERT INTO leads(id,idempotency_hash,request_hash,created_at,updated_at,status,partner,payload,consent_version) VALUES(?,?,?,?,?,?,?,?,?)');
$insert->execute(['WG-CI-FRESH',str_repeat('a',64),str_repeat('b',64),$now,$now,'new','tbt',$encrypted,WG_CONSENT_VERSION]);
$db->prepare('UPDATE leads SET status=? WHERE id=?')->execute(['contacted','WG-CI-FRESH']);
$checkLead=$db->query("SELECT * FROM leads WHERE id='WG-CI-FRESH'")->fetch();
check($checkLead['status']==='contacted','update status');
check(wg_decrypt($checkLead['payload'],$cfg)===$payload,'lead decryption');
wg_event($db,'scan_complete');wg_event($db,'scan_complete');
$ct=(int)$db->query("SELECT `count` FROM daily_events WHERE `event`='scan_complete'")->fetchColumn();
check($ct===2,'mysql event upsert');
$_SERVER['REMOTE_ADDR']='127.0.0.10';
wg_rate($db,$cfg,'unit-test',10,600);wg_rate($db,$cfg,'unit-test',10,600);
check((int)$db->query('SELECT MAX(hits) FROM rate_limits')->fetchColumn()===2,'mysql rate limit upsert');
$old=gmdate('Y-m-d\TH:i:s\Z',time()-95*86400);
$insert->execute(['WG-CI-OLD',str_repeat('c',64),str_repeat('d',64),$old,$old,'new','nivo',$encrypted,WG_CONSENT_VERSION]);
$cleared=wg_housekeeping($db,$cfg,true);
check($cleared['leads']===1,'retention removes old lead');
check((int)$db->query('SELECT COUNT(*) FROM leads')->fetchColumn()===1,'recent lead kept');
check((int)$db->query("SELECT COUNT(*) FROM metadata WHERE `key`='last_purge'")->fetchColumn()===1,'metadata mysql upsert');
check(wg_housekeeping($db,$cfg,false)['leads']===0,'skip premature housekeeping');
$update=$db->prepare("UPDATE leads SET status='contacted' WHERE id='WG-CI-FRESH'");
$update->execute();
check($update->rowCount()===1,'status update found-rows semantics');
// Real MySQL outbox integration against ephemeral GitHub Actions MySQL.
$db->beginTransaction();
$insert->execute(['WG-CI-DELIVERY',str_repeat('g',64),str_repeat('h',64),$now,$now,'new','nivo',
    wg_encrypt([
       'name'=>'CI Fictief','email'=>'ci@example.test','phone'=>'','postcode'=>'',
       'interests'=>['battery'],'note'=>'',
       'partner'=>'nivo','consent'=>true,'consentVersion'=>WG_CONSENT_VERSION,
       'consentText'=>WG_CONSENT_TEXT,'acceptedAt'=>$now,
       'summary'=>['modelVersion'=>'test-v1','year'=>2027,'selectedIds'=>['battery']]
    ],$cfg),WG_CONSENT_VERSION]);
wg_delivery_enqueue($db,'WG-CI-DELIVERY',$now);
$db->commit();
check(wg_delivery_summary($db)['pending']===1,'transactionally created MySQL outbox');
$inactive=wg_delivery_process($db,$cfg);
check($inactive['disabled']&&$inactive['attempted']===0,'MySQL transport default disabled');
$synthetic=wg_delivery_process($db,$cfg,1,static fn(array $envelope):array=>
    ['kind'=>'ack','reference'=>'CI-RECEIPT']);
check($synthetic['acknowledged']===1,'MySQL outbox synthetic ACK');
check(wg_delivery_summary($db)['acknowledged']===1,'MySQL delivery receipt persisted');
$fake=$db->query("SELECT ack_reference FROM delivery_outbox WHERE lead_id='WG-CI-DELIVERY'")->fetchColumn();
check($fake==='CI-RECEIPT','MySQL receipt references saved lead');
check(!wg_delivery_retry($db,'WG-CI-DELIVERY'),'delivered MySQL lead cannot be retried');
$db->prepare("DELETE FROM leads WHERE id='WG-CI-DELIVERY'")->execute();
check((int)$db->query("SELECT COUNT(*) FROM delivery_outbox WHERE lead_id='WG-CI-DELIVERY'")->fetchColumn()===0,
    'deleting MySQL lead cascades transport metadata');
// Execute the actual maintenance CLI with isolated CI-only MySQL configuration.
// This catches SQLite-only statements accidentally invoked against PDO MySQL.
$oldCron=gmdate('Y-m-d\\TH:i:s\\Z',time()-95*86400);
$insert->execute(['WG-CI-CRON-OLD',str_repeat('e',64),str_repeat('f',64),$oldCron,$oldCron,'new','nivo',$encrypted,WG_CONSENT_VERSION]);
$private=sys_get_temp_dir().'/wattgoedkoper-maintenance-ci-'.bin2hex(random_bytes(8));
check(mkdir($private,0700),'create isolated maintenance test directory');
try {
    $cliConfig=$cfg;
    unset($cliConfig['private_dir']);
    $configFile=$private.'/config.php';
    check(file_put_contents($configFile,'<?php return '.var_export($cliConfig,true).';')!==false,'write isolated CI configuration');
    chmod($configFile,0600);
    $runMaintenance=static function (string $dir): array {
        $pipes=[];
        $env=array_replace((array)getenv(),['WG_PRIVATE_DIR'=>$dir]);
        $process=proc_open([PHP_BINARY,dirname(__DIR__).'/scripts/maintenance.php'],
            [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,dirname(__DIR__), $env);
        if (!is_resource($process)) { throw new RuntimeException('Cannot start maintenance CLI'); }
        fclose($pipes[0]);
        $stdout=stream_get_contents($pipes[1]); fclose($pipes[1]);
        $stderr=stream_get_contents($pipes[2]); fclose($pipes[2]);
        return [proc_close($process),$stdout,$stderr];
    };
    [$exit,$stdout,$stderr]=$runMaintenance($private);
    check($exit===0 && $stderr==='' && str_contains($stdout,'Verwijderde aanvragen: 1.'),
        'MySQL maintenance CLI exits successfully and purges expired lead');
    check((int)$db->query("SELECT COUNT(*) FROM leads WHERE id='WG-CI-CRON-OLD'")->fetchColumn()===0
        && (int)$db->query("SELECT COUNT(*) FROM leads WHERE id='WG-CI-FRESH'")->fetchColumn()===1,
        'MySQL maintenance preserves current and historical consented data within retention');
    [$exit,$stdout,$stderr]=$runMaintenance($private);
    check($exit===0 && $stderr==='' && str_contains($stdout,'Verwijderde aanvragen: 0.'),
        'Repeated MySQL maintenance run is harmless');
    [$exit,$stdout,$stderr]=$runMaintenance($private.'/missing');
    check($exit===1 && str_contains($stderr,'Configuratie ontbreekt.')
        && !str_contains($stderr,$pass),'Missing private config fails closed without leaking credentials');
} finally {
    @unlink($private.'/config.php');
    @rmdir($private);
}
echo "MySQL backend, delivery outbox and maintenance CLI: passed\n";

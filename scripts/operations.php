<?php
declare(strict_types=1);
// The one intended Hostinger scheduled entrypoint. CLI only; never a public URL.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/delivery.php';
require dirname(__DIR__).'/lib/operations.php';

$config=wg_config();
if(!$config){fwrite(STDERR,"WattGoedkoper onderhoud: private configuratie ontbreekt.\n");exit(1);}
$lockFile=$config['private_dir'].'/operations.lock';
$lock=@fopen($lockFile,'c');
if(!is_resource($lock)){fwrite(STDERR,"WattGoedkoper onderhoud: private lock niet beschikbaar.\n");exit(1);}
@chmod($lockFile,0600);
if(!flock($lock,LOCK_EX|LOCK_NB)){
    fclose($lock);
    // Non-zero so an unexpected overlapping job can be investigated.
    fwrite(STDERR,"WattGoedkoper onderhoud: een eerdere uitvoering is nog actief.\n");
    exit(75);
}
$db=null;
try {
    $db=wg_db($config);
    wg_ops_upsert($db,'ops_last_start_at',gmdate('Y-m-d\\TH:i:s\\Z'));
    $retained=wg_housekeeping($db,$config,false);
    if($db->getAttribute(PDO::ATTR_DRIVER_NAME)==='sqlite'){
        $db->exec('PRAGMA wal_checkpoint(TRUNCATE)');
    }
    $transport=wg_delivery_process($db,$config,10);
    // Two distinct timestamps establish separate successful executions,
    // not by themselves whether the invocations came from Hostinger cron.
    $successAt=gmdate('Y-m-d\TH:i:s\Z');
    $priorSuccess=wg_ops_read($db,'ops_last_success_at');
    if($priorSuccess && strtotime($priorSuccess)!==false && $priorSuccess!==$successAt){
        wg_ops_upsert($db,'ops_previous_success_at',$priorSuccess);
    }
    wg_ops_upsert($db,'ops_last_error_code','NONE');
    wg_ops_upsert($db,'ops_last_success_at',$successAt);
    // Only aggregate action counts; never leak a lead ID, PII or credentials in output.
    fwrite(STDOUT,"WattGoedkoper onderhoud uitgevoerd. Retentie: ".$retained['leads']
        .", bezorgpogingen: ".$transport['attempted']
        .", bevestigd: ".$transport['acknowledged']
        .", fouten: ".$transport['failed']
        .", transport actief: ".($transport['disabled']?'nee':'ja').".\n");
} catch(Throwable) {
    try{
        if($db instanceof PDO){wg_ops_upsert($db,'ops_last_error_code','RUN_FAILED');}
    }catch(Throwable){}
    fwrite(STDERR,"WattGoedkoper onderhoud: controleer private status; uitvoering niet bevestigd.\n");
    exit(1);
} finally {
    flock($lock,LOCK_UN);
    fclose($lock);
}

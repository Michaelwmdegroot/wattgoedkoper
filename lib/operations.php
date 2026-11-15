<?php
declare(strict_types=1);
/*
 * Read-only operational status + minimal private heartbeat metadata.
 * No PII, IP, keys or serialized exceptions in observability records.
 */
/**
 * Public, non-secret fingerprint of deployable code only. Excludes private
 * configuration, customer data and files outside the repository.
 */
function wg_release_fingerprint(): string {
    $root=dirname(__DIR__);
    $paths=['api/index.php','lib/bootstrap.php','lib/delivery.php','lib/operations.php','lib/mail.php','lib/report.php'];
    $hashes=[];
    foreach($paths as $file){
        $digest=hash_file('sha256',$root.'/'.$file);
        if(!is_string($digest)){throw new RuntimeException('Release file unreadable');}
        $hashes[]=$digest;
    }
    return hash('sha256',implode("\n",$hashes));
}
function wg_ops_upsert(PDO $db,string $key,string $value): void {
    if(!preg_match('/^ops_[a-z_]{1,48}$/D',$key)){throw new InvalidArgumentException('Invalid monitoring key');}
    $sql=wg_is_mysql($db)
      ? 'INSERT INTO metadata(`key`,`value`) VALUES(?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)'
      : 'INSERT INTO metadata(`key`,`value`) VALUES(?,?) ON CONFLICT(`key`) DO UPDATE SET `value`=excluded.`value`';
    $q=$db->prepare($sql);$q->execute([$key,$value]);
}
function wg_ops_read(PDO $db,string $key): ?string {
    if(!preg_match('/^ops_[a-z_]{1,48}$/D',$key)){throw new InvalidArgumentException('Invalid monitoring key');}
    $q=$db->prepare('SELECT `value` FROM metadata WHERE `key`=?');
    $q->execute([$key]);$value=$q->fetchColumn();
    return is_string($value)?$value:null;
}
function wg_ops_source_review(string $path,int $now): array {
    if(!is_file($path)||!is_readable($path)){
        return ['status'=>'unknown','checkedOn'=>null,'ageDays'=>null];
    }
    $text=file_get_contents($path);
    $data=$text!==false?json_decode($text,true):null;
    $checkedOn=is_array($data)?($data['checkedOn']??null):null;
    if(!is_string($checkedOn)||!preg_match('/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/D',$checkedOn)){
        return ['status'=>'unknown','checkedOn'=>null,'ageDays'=>null];
    }
    $timestamp=strtotime($checkedOn.' 00:00:00 UTC');
    if($timestamp===false||$timestamp>$now+86400){return ['status'=>'unknown','checkedOn'=>null,'ageDays'=>null];}
    $days=max(0,(int)floor(($now-$timestamp)/86400));
    return ['status'=>$days>45?'review_due':'recently_checked','checkedOn'=>$checkedOn,'ageDays'=>$days];
}
function wg_ops_status(PDO $db,array $config,?int $now=null): array {
    $now??=time();
    $last=wg_ops_read($db,'ops_last_success_at');
    $started=wg_ops_read($db,'ops_last_start_at');
    $lastError=wg_ops_read($db,'ops_last_error_code');
    $lastTime=$last?strtotime($last):false;
    $age=$lastTime!==false?max(0,$now-$lastTime):null;
    $maxAge=max(300,min(86400,(int)($config['operations_max_age_seconds']??1800)));
    $required=($config['operations_monitor_enabled']??false)===true;
    $cronStatus=$age===null?'unknown':($age<=$maxAge?'fresh':'stale');
    $delivery=wg_delivery_summary($db);
    $source=wg_ops_source_review(dirname(__DIR__).'/docs/seo-cluster-v08.json',$now);
    $warnings=[];
    if($required&&$cronStatus!=='fresh'){$warnings[]='CRON_MISSING_OR_STALE';}
    if($lastError==='RUN_FAILED'){$warnings[]='CRON_LAST_RUN_FAILED';}
    if(($delivery['failed']??0)>0){$warnings[]='NIVO_DELIVERY_FAILED';}
    if($source['status']==='review_due'){$warnings[]='SOURCE_REVIEW_DUE';}
    $seo=[
        'sitemapOnDisk'=>is_file(dirname(__DIR__).'/sitemap.xml'),
        'robotsOnDisk'=>is_file(dirname(__DIR__).'/robots.txt')
    ];
    if(!$seo['sitemapOnDisk']||!$seo['robotsOnDisk']){$warnings[]='SEO_PUBLICATION_FILES_MISSING';}
    return [
      'ok'=>true,
      'cron'=>[
         'monitorEnabled'=>$required,'status'=>$cronStatus,
         'lastSuccessAt'=>$last,'lastStartAt'=>$started,'lastErrorCode'=>$lastError,'ageSeconds'=>$age,
         'maxAgeSeconds'=>$maxAge
      ],
      'delivery'=>$delivery,
      'transportConfigured'=>wg_delivery_settings($config)!==null,
      'editorial'=>$source,
      'seo'=>$seo,
      // Hostinger backup presence/restore cannot be inferred from application files.
      'backup'=>['status'=>'not_verified','lastVerifiedAt'=>null],
      'warnings'=>$warnings
    ];
}

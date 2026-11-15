<?php
declare(strict_types=1);

/*
 * NIVO-only transport. It is deliberately inactive unless private configuration
 * explicitly approves an exact HTTPS host and provides a server-side credential.
 * No customer data is ever logged by the worker.
 */
function wg_delivery_enqueue(PDO $db, string $leadId, string $createdAt): void {
    $q=$db->prepare("INSERT INTO delivery_outbox
      (lead_id,status,attempts,next_attempt_at,created_at,updated_at)
      VALUES(?,'pending',0,?,?,?)");
    $q->execute([$leadId,$createdAt,$createdAt,$createdAt]);
}
function wg_delivery_summary(PDO $db): array {
    $counts=array_fill_keys(['pending','processing','acknowledged','failed'],0);
    foreach ($db->query('SELECT status,COUNT(*) AS total FROM delivery_outbox GROUP BY status') as $row) {
        if(array_key_exists((string)$row['status'],$counts)){$counts[$row['status']]=(int)$row['total'];}
    }
    return $counts;
}
function wg_delivery_public(array $row): ?array {
    if (!isset($row['delivery_status']) || $row['delivery_status']===null) {return null;}
    return [
        'status'=>$row['delivery_status'],
        'attempts'=>(int)$row['delivery_attempts'],
        'nextAttemptAt'=>$row['delivery_next_attempt'],
        'acknowledgedAt'=>$row['delivery_acknowledged_at'],
        'reference'=>$row['delivery_ack_reference'],
        'errorCode'=>$row['delivery_last_error']
    ];
}
function wg_delivery_retry(PDO $db, string $id): bool {
    // Only a failed item can be manually retried. ACKs are immutable.
    $now=gmdate('Y-m-d\\TH:i:s\\Z');
    $q=$db->prepare("UPDATE delivery_outbox SET status='pending',attempts=0,
      next_attempt_at=?,lease_until=NULL,last_error=NULL,updated_at=?
      WHERE lead_id=? AND status='failed'");
    $q->execute([$now,$now,$id]);
    return $q->rowCount()===1;
}
function wg_delivery_settings(array $config): ?array {
    if(($config['nivo_delivery_enabled']??false)!==true){return null;}
    $url=$config['nivo_delivery_endpoint']??null;
    $token=$config['nivo_delivery_token']??null;
    $hosts=$config['nivo_delivery_allowed_hosts']??null;
    if(!is_string($url)||!is_string($token)||strlen($token)<32
        ||preg_match('/[\\r\\n]/',$token)||!is_array($hosts)||!function_exists('curl_init')){return null;}
    $parts=parse_url($url);
    if(!is_array($parts)||($parts['scheme']??null)!=='https'||empty($parts['host'])
        ||(isset($parts['user'])||isset($parts['pass']))||isset($parts['query'])||isset($parts['fragment'])
        ||isset($parts['port'])&&(int)$parts['port']!==443){return null;}
    $host=strtolower($parts['host']);
    // An exact, owner-approved hostname is required; no wildcard or IP destination.
    if(filter_var($host,FILTER_VALIDATE_IP)||!preg_match('/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/D',$host)
        ||!in_array($host,$hosts,true)){return null;}
    return ['url'=>$url,'token'=>$token];
}
function wg_delivery_claim(PDO $db): ?array {
    $now=gmdate('Y-m-d\\TH:i:s\\Z');
    $lease=gmdate('Y-m-d\\TH:i:s\\Z',time()+90);
    $db->beginTransaction();
    try{
        $sql="SELECT lead_id,attempts FROM delivery_outbox
          WHERE (status='pending' AND next_attempt_at<=?)
          OR (status='processing' AND lease_until<=?)
          ORDER BY next_attempt_at ASC LIMIT 1";
        if(wg_is_mysql($db)){$sql.=' FOR UPDATE';}
        $q=$db->prepare($sql);$q->execute([$now,$now]);$row=$q->fetch();
        if(!$row){$db->rollBack();return null;}
        $q=$db->prepare("UPDATE delivery_outbox SET status='processing',
          attempts=attempts+1,lease_until=?,updated_at=?
          WHERE lead_id=? AND ((status='pending' AND next_attempt_at<=?)
            OR (status='processing' AND lease_until<=?))");
        $q->execute([$lease,$now,$row['lead_id'],$now,$now]);
        if($q->rowCount()!==1){$db->rollBack();return null;}
        $db->commit();
        return ['id'=>$row['lead_id'],'attempts'=>(int)$row['attempts']+1,'lease'=>$lease];
    }catch(Throwable $error){
        if($db->inTransaction()){$db->rollBack();}
        throw $error;
    }
}
function wg_delivery_envelope(string $id, array $row, array $payload): array {
    if($row['partner']!=='nivo'||$row['consent_version']!==WG_CONSENT_VERSION
        ||($payload['consent']??false)!==true||($payload['consentVersion']??'')!==WG_CONSENT_VERSION
        ||($payload['partner']??'')!=='nivo'||empty($payload['consentText'])||empty($payload['acceptedAt'])){
        throw new RuntimeException('Lead is not eligible for delivery');
    }
    $summary=$payload['summary']??[];
    return [
      'schema'=>'wattgoedkoper.nivo.lead.v1',
      'requestId'=>$id,
      'createdAt'=>$row['created_at'],
      'recipient'=>'NIVO Groep Holland',
      'contact'=>[
        'name'=>$payload['name']??'',
        'email'=>$payload['email']??'',
        'phone'=>$payload['phone']??'',
        'postcode'=>$payload['postcode']??''
      ],
      'interests'=>$payload['interests']??[],
      'plan'=>[
        'modelVersion'=>$summary['modelVersion']??null,
        'year'=>$summary['year']??null,
        'selectedIds'=>$summary['selectedIds']??[],
        'annualSavingsLow'=>$summary['annualSavingsLow']??null,
        'annualSavingsHigh'=>$summary['annualSavingsHigh']??null
      ],
      'note'=>$payload['note']??'',
      'consent'=>[
        'version'=>$payload['consentVersion'],
        'text'=>$payload['consentText'],
        'acceptedAt'=>$payload['acceptedAt'],
        'recipient'=>'NIVO Groep Holland'
      ]
    ];
}
function wg_delivery_transport(array $envelope,array $settings): array {
    $body=json_encode($envelope,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    $answer='';
    $handle=curl_init($settings['url']);
    if($handle===false){return ['kind'=>'retry','error'=>'TRANSPORT_UNAVAILABLE'];}
    curl_setopt_array($handle,[
        CURLOPT_POST=>true,
        CURLOPT_POSTFIELDS=>$body,
        CURLOPT_HTTPHEADER=>[
            'Authorization: Bearer '.$settings['token'],
            'Content-Type: application/json',
            'Accept: application/json',
            'Idempotency-Key: '.$envelope['requestId']
        ],
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>12,
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
        CURLOPT_WRITEFUNCTION=>static function($ch,string $chunk)use(&$answer):int{
            if(strlen($answer)+strlen($chunk)>8192){return 0;}
            $answer.=$chunk;return strlen($chunk);
        }
    ]);
    $success=curl_exec($handle);
    $code=(int)curl_getinfo($handle,CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    if($success===false||$code===0){return ['kind'=>'retry','error'=>'NETWORK_UNCERTAIN'];}
    $ack=json_decode($answer,true);
    // 200/201 or idempotent 409 only count after an explicit, valid receipt.
    if(($code>=200&&$code<300||$code===409)&&is_array($ack)
        &&($ack['acknowledged']??false)===true
        &&isset($ack['receiptId'])&&is_string($ack['receiptId'])
        &&preg_match('/^[A-Za-z0-9._:-]{1,128}$/D',$ack['receiptId'])){
        return ['kind'=>'ack','reference'=>$ack['receiptId']];
    }
    if(in_array($code,[408,409,425,429],true)||$code>=500||($code>=200&&$code<300)){
        return ['kind'=>'retry','error'=>$code>=200&&$code<300?'ACK_MISSING':'HTTP_RETRYABLE'];
    }
    return ['kind'=>'fail','error'=>$code>=300&&$code<400?'HTTP_REDIRECT':'HTTP_REJECTED'];
}
function wg_delivery_finish(PDO $db,array $claim,array $outcome): string {
    $now=gmdate('Y-m-d\\TH:i:s\\Z');
    $kind=$outcome['kind']??'retry';
    $reference=$outcome['reference']??null;
    $isAck=$kind==='ack'&&is_string($reference)
        &&preg_match('/^[A-Za-z0-9._:-]{1,128}$/D',$reference);
    if($isAck){
        $q=$db->prepare("UPDATE delivery_outbox SET status='acknowledged',
          ack_reference=?,acknowledged_at=?,lease_until=NULL,last_error=NULL,updated_at=?
          WHERE lead_id=? AND status='processing' AND lease_until=?");
        $q->execute([$reference,$now,$now,$claim['id'],$claim['lease']]);
        return $q->rowCount()===1?'acknowledged':'stale';
    }
    $permanent=$kind==='fail'||$claim['attempts']>=5;
    $state=$permanent?'failed':'pending';
    $delay=min(3600,60*(2**min(4,max(0,$claim['attempts']-1))));
    $next=gmdate('Y-m-d\\TH:i:s\\Z',time()+$delay);
    $allowed=['NETWORK_UNCERTAIN','TRANSPORT_UNAVAILABLE','ACK_MISSING','HTTP_RETRYABLE','HTTP_REDIRECT','HTTP_REJECTED','INVALID_CONSENT'];
    $error=$outcome['error']??'NETWORK_UNCERTAIN';
    if(!in_array($error,$allowed,true)){$error='NETWORK_UNCERTAIN';}
    $q=$db->prepare("UPDATE delivery_outbox SET status=?,next_attempt_at=?,
      lease_until=NULL,last_error=?,updated_at=?
      WHERE lead_id=? AND status='processing' AND lease_until=?");
    $q->execute([$state,$next,$error,$now,$claim['id'],$claim['lease']]);
    return $q->rowCount()===1?$state:'stale';
}
function wg_delivery_process(PDO $db,array $config,int $limit=10,?callable $syntheticSender=null): array {
    $summary=['attempted'=>0,'acknowledged'=>0,'pending'=>0,'failed'=>0,'stale'=>0,'disabled'=>false];
    $settings=$syntheticSender!==null?[]:wg_delivery_settings($config);
    if($settings===null){$summary['disabled']=true;return $summary;}
    $limit=max(1,min(50,$limit));
    for($i=0;$i<$limit;$i++){
        $claim=wg_delivery_claim($db);
        if(!$claim){break;}
        $summary['attempted']++;
        try{
            $q=$db->prepare('SELECT id,created_at,partner,consent_version,payload FROM leads WHERE id=?');
            $q->execute([$claim['id']]);$row=$q->fetch();
            if(!$row){$outcome=['kind'=>'fail','error'=>'INVALID_CONSENT'];}
            else{
                $data=wg_decrypt($row['payload'],$config);
                $envelope=wg_delivery_envelope($claim['id'],$row,$data);
            }
        }catch(Throwable){$outcome=['kind'=>'fail','error'=>'INVALID_CONSENT'];}
        if(isset($envelope)&&is_array($envelope)){
            try{
                $outcome=$syntheticSender!==null?$syntheticSender($envelope,$config):wg_delivery_transport($envelope,$settings);
            }catch(Throwable){$outcome=['kind'=>'retry','error'=>'NETWORK_UNCERTAIN'];}
            unset($envelope);
        }
        $status=wg_delivery_finish($db,$claim,$outcome);
        if(isset($summary[$status])){$summary[$status]++;}
    }
    return $summary;
}

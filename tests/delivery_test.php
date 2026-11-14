<?php
declare(strict_types=1);
// Isolated contract + retry tests. No external network, approved receiver or real customer data.
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/delivery.php';

function deliveryCheck(bool $condition,string $message): void {
    if(!$condition){throw new RuntimeException('NIVO delivery test: '.$message);}
}
function deliveryRow(PDO $db,string $id): array {
    $q=$db->prepare('SELECT * FROM delivery_outbox WHERE lead_id=?');
    $q->execute([$id]);return (array)$q->fetch(PDO::FETCH_ASSOC);
}
$private=sys_get_temp_dir().'/wg-delivery-test-'.bin2hex(random_bytes(8));
deliveryCheck(mkdir($private,0700),'create isolated private fixture');
$config=[
    'private_dir'=>$private,
    'hmac_key'=>bin2hex(random_bytes(32)),
    'encryption_key'=>base64_encode(random_bytes(32)),
    'retention_days'=>90
];
$checks=0;
try{
    $db=wg_db($config);
    deliveryCheck($db->getAttribute(PDO::ATTR_DRIVER_NAME)==='sqlite','ephemeral SQLite database');
    $checks++;
    deliveryCheck((int)$db->query('PRAGMA foreign_keys')->fetchColumn()===1,'SQLite foreign keys enforced for outbox retention');
    $checks++;
    $now=gmdate('Y-m-d\\TH:i:s\\Z');
    $insert=$db->prepare('INSERT INTO leads
      (id,idempotency_hash,request_hash,created_at,updated_at,status,partner,payload,consent_version)
      VALUES(?,?,?,?,?,?,?,?,?)');
    $enroll=function(string $id,string $partner='nivo',string $consent=WG_CONSENT_VERSION)
        use($db,$config,$insert,$now): void{
        $payload=[
          'name'=>'Fictieve Consument','email'=>'synthetic@example.test','phone'=>'',
          'postcode'=>'2311AB','interests'=>['battery'],'note'=>'Fictieve aanvraag',
          'partner'=>$partner,'consent'=>true,'consentVersion'=>$consent,
          'consentText'=>WG_CONSENT_TEXT,'acceptedAt'=>$now,
          'inputs'=>['electricityUse'=>3500,'homeType'=>'terraced'],
          'summary'=>['modelVersion'=>'v1','year'=>2027,'selectedIds'=>['battery'],'annualSavingsLow'=>100]
        ];
        $db->beginTransaction();
        $insert->execute([$id,hash('sha256','idem:'.$id),hash('sha256','req:'.$id),
          $now,$now,'new',$partner,wg_encrypt($payload,$config),$consent]);
        wg_delivery_enqueue($db,$id,$now);
        $db->commit();
    };
    $enroll('WG-000000000001');
    deliveryCheck(deliveryRow($db,'WG-000000000001')['status']==='pending','enqueued atomically');
    $checks++;
    $disabled=wg_delivery_process($db,$config);
    deliveryCheck($disabled['disabled']&&$disabled['attempted']===0,'no unapproved destination means zero delivery calls');
    deliveryCheck(deliveryRow($db,'WG-000000000001')['attempts']==0,'worker does not consume queue while disabled');
    $checks+=2;
    $sent=[];
    $fakeAck=static function(array $envelope)use(&$sent):array{
        $sent[]=$envelope;
        return ['kind'=>'ack','reference'=>'NIVO-RECEIPT-001'];
    };
    $result=wg_delivery_process($db,$config,10,$fakeAck);
    deliveryCheck($result['acknowledged']===1&&count($sent)===1,'synthetic receiver ACK accepted');
    $checks++;
    deliveryCheck($sent[0]['schema']==='wattgoedkoper.nivo.lead.v1'
        &&$sent[0]['requestId']==='WG-000000000001'
        &&$sent[0]['consent']['version']===WG_CONSENT_VERSION
        &&$sent[0]['recipient']==='NIVO Groep Holland'
        &&$sent[0]['contact']['email']==='synthetic@example.test'
        &&!isset($sent[0]['inputs'])&&!isset($sent[0]['consent']['marketing']),
        'minimal, consented envelope does not forward full house profile or marketing');
    $checks++;
    deliveryCheck(deliveryRow($db,'WG-000000000001')['ack_reference']==='NIVO-RECEIPT-001','receipt stored');
    $checks++;
    $again=wg_delivery_process($db,$config,10,$fakeAck);
    deliveryCheck($again['attempted']===0&&count($sent)===1,'acknowledged lead never re-sent');
    deliveryCheck(!wg_delivery_retry($db,'WG-000000000001'),'admin cannot retry acknowledged lead');
    $checks+=2;
    $enroll('WG-000000000002');
    $attempts=0;
    $unstable=static function(array $env)use(&$attempts):array{
        $attempts++;
        if($attempts===1){throw new RuntimeException('Transient receiver outage');}
        return ['kind'=>'ack','reference'=>'NIVO-RECEIPT-002'];
    };
    $first=wg_delivery_process($db,$config,1,$unstable);
    $state=deliveryRow($db,'WG-000000000002');
    deliveryCheck($first['pending']===1&&$state['status']==='pending'
        &&$state['last_error']==='NETWORK_UNCERTAIN'
        &&(int)$state['attempts']===1,'network exception is retryable and sanitized');
    $checks++;
    $noBackoff=wg_delivery_process($db,$config,1,$unstable);
    deliveryCheck($noBackoff['attempted']===0,'backoff prevents immediate retry');
    $checks++;
    $db->prepare('UPDATE delivery_outbox SET next_attempt_at=? WHERE lead_id=?')
      ->execute(['2020-01-01T00:00:00Z','WG-000000000002']);
    $retry=wg_delivery_process($db,$config,1,$unstable);
    deliveryCheck($retry['acknowledged']===1&&$attempts===2,'later retry stores technical ACK once');
    $checks++;
    $enroll('WG-000000000003');
    $failure=static fn(array $envelope):array=>['kind'=>'retry','error'=>'HTTP_RETRYABLE'];
    for($n=0;$n<5;$n++){
        if($n>0){
            $db->prepare('UPDATE delivery_outbox SET next_attempt_at=? WHERE lead_id=?')
              ->execute(['2020-01-01T00:00:00Z','WG-000000000003']);
        }
        $result=wg_delivery_process($db,$config,1,$failure);
        deliveryCheck($result['attempted']===1,'bounded attempt '.($n+1));
        $checks++;
    }
    $failed=deliveryRow($db,'WG-000000000003');
    deliveryCheck($failed['status']==='failed'&&(int)$failed['attempts']===5,
        'max five attempts moves to failed without deletion');
    $checks++;
    deliveryCheck(wg_delivery_retry($db,'WG-000000000003')
      &&deliveryRow($db,'WG-000000000003')['status']==='pending','admin retry schedules failed lead');
    $checks++;
    $result=wg_delivery_process($db,$config,1,static fn()=>['kind'=>'ack','reference'=>'NIVO-RECOVERY-003']);
    deliveryCheck($result['acknowledged']===1,'manual retry can recover a failed delivery');
    $checks++;
    $enroll('WG-000000000004','tbt','legacy');
    $invalid=wg_delivery_process($db,$config,1,static function():array{
        throw new RuntimeException('Historic partner must never be sent');
    });
    deliveryCheck($invalid['failed']===1
      &&deliveryRow($db,'WG-000000000004')['last_error']==='INVALID_CONSENT',
      'historical partner/consent cannot be forwarded even with queued row');
    $checks++;
    $db->prepare('DELETE FROM leads WHERE id=?')->execute(['WG-000000000001']);
    deliveryCheck(deliveryRow($db,'WG-000000000001')===[],'deleted lead cascades outbox metadata');
    $checks++;
    deliveryCheck(!wg_delivery_retry($db,'WG-NOTEXIST'),'unknown lead not retried');
    $checks++;
    $counts=wg_delivery_summary($db);
    deliveryCheck($counts['acknowledged']===2&&$counts['failed']===1
      &&$counts['pending']===0,'dashboard aggregates proven delivery states');
    $checks++;
    echo "NIVO outbox: $checks offline regression checks passed\n";
}finally{
    $db=null;
    foreach(['wattgoedkoper.sqlite','wattgoedkoper.sqlite-wal','wattgoedkoper.sqlite-shm'] as $file){@unlink($private.'/'.$file);}
    @rmdir($private);
}

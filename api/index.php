<?php
declare(strict_types=1);
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/mail.php';
require dirname(__DIR__) . '/lib/report.php';
require dirname(__DIR__) . '/lib/delivery.php';
wg_headers();
ini_set('display_errors', '0');
try {
    $action = (string)($_GET['action'] ?? 'health');
    $config = wg_config();
    if ($action === 'health') {
        wg_method('GET');
        $databaseReady=false;
        if ($config !== null) {
            try { $db=wg_db($config); $databaseReady=(bool)$db->query('SELECT 1')->fetchColumn(); }
            catch (Throwable $ignored) { $databaseReady=false; }
            unset($db);
        }
        wg_json(['ok'=>true, 'service'=>'WattGoedkoper', 'configured'=>$config !== null && $databaseReady, 'databaseReady'=>$databaseReady, 'version'=>'1.2.0']);
    }
    if ($action === 'session' && !$config) { wg_method('GET'); wg_json(['ok'=>true,'configured'=>false,'csrf'=>null,'createdAt'=>null,'authenticated'=>false,'reportMailEnabled'=>false]); }
    $config = wg_require_config($config);
    $db = wg_db($config);
    wg_housekeeping($db, $config);
    if ($action === 'session') {
        wg_method('GET'); wg_rate($db,$config,'session',120,600); wg_session($config);
        wg_json(['ok'=>true,'configured'=>true,'csrf'=>$_SESSION['csrf'],'createdAt'=>$_SESSION['created_at'],'authenticated'=>!empty($_SESSION['admin']),'reportMailEnabled'=>wg_report_enabled($config)]);
    }
    if ($action === 'leads') {
        $data = wg_input($config); wg_rate($db,$config,'lead',8,3600);
        if (($data['website'] ?? '') !== '') { wg_fail(422,'INVALID_REQUEST','De aanvraag kan niet worden verwerkt.'); }
        if (time() - (int)$_SESSION['created_at'] < 2) { wg_fail(429,'TOO_FAST','Wacht twee seconden en verstuur je aanvraag opnieuw.'); }
        $lead = wg_validate_lead($data);
        $idempotency = hash_hmac('sha256',$lead['idempotencyKey'],$config['hmac_key']);
        unset($lead['idempotencyKey']);
        $requestHash = hash_hmac('sha256',json_encode($lead,JSON_THROW_ON_ERROR),$config['hmac_key']);
        $db->beginTransaction();
        $q=$db->prepare('SELECT id,request_hash,status FROM leads WHERE idempotency_hash=?'); $q->execute([$idempotency]); $existing=$q->fetch();
        if ($existing) {
            $db->rollBack();
            if (!hash_equals($existing['request_hash'],$requestHash)) { wg_fail(409,'IDEMPOTENCY_CONFLICT','Deze aanvraagcode is al gebruikt voor andere gegevens. Vernieuw de pagina.'); }
            wg_json(['ok'=>true,'id'=>$existing['id'],'status'=>$existing['status'],'replayed'=>true]);
        }
        $id='WG-' . strtoupper(bin2hex(random_bytes(6))); $now=gmdate('Y-m-d\TH:i:s\Z'); $lead['acceptedAt']=$now;
        $q=$db->prepare('INSERT INTO leads(id,idempotency_hash,request_hash,created_at,updated_at,status,partner,payload,consent_version) VALUES(?,?,?,?,?,?,?,?,?)');
        $q->execute([$id,$idempotency,$requestHash,$now,$now,'new',$lead['partner'],wg_encrypt($lead,$config),WG_CONSENT_VERSION]);
        wg_delivery_enqueue($db,$id,$now);
        if ($lead['analyticsConsent']) { wg_event($db,'lead_accepted'); }
        $db->commit();
        wg_json(['ok'=>true,'id'=>$id,'status'=>'new','replayed'=>false],201);
    }
    if ($action === 'report_email') {
        $data=wg_input($config);
        // Never create a lead or an analytics event for mail-only requests.
        if (!wg_report_enabled($config)) {
            wg_fail(503,'REPORT_MAIL_DISABLED','Rapportmail is nog niet ingeschakeld. Je energieplan blijft gratis beschikbaar.');
        }
        if (time() - (int)$_SESSION['created_at'] < 2) {
            wg_fail(429,'TOO_FAST','Wacht even en verstuur je rapport opnieuw.');
        }
        $prepared=wg_report_validate($data);
        $attempt=wg_report_reserve($db,$config,$prepared);
        if ($attempt['state']==='replayed') {
            wg_json(['ok'=>true,'accepted'=>true,'replayed'=>true]);
        }
        $letter=wg_report_content($prepared);
        try {
            wg_mail_send($config,$prepared['email'],$letter['subject'],$letter['text'],$letter['html']);
            wg_report_finish($db,$attempt['id'],true);
        } catch (Throwable $error) {
            // A timeout after SMTP DATA can be ambiguous. Never blindly retry.
            wg_report_finish($db,$attempt['id'],false);
            wg_fail(503,'REPORT_SEND_UNCERTAIN','Verzending is niet bevestigd. Controleer je inbox voordat je een nieuw verzoek doet.');
        }
        wg_json(['ok'=>true,'accepted'=>true,'replayed'=>false]);
    }
    if ($action === 'events') {
        $data=wg_input($config); wg_rate($db,$config,'events',120,600);
        if (($data['consent']??false)!==true) { wg_fail(422,'CONSENT_REQUIRED','Statistieken worden alleen met toestemming gemeten.'); }
        $event=$data['event']??'';
        if (!in_array($event,['page_view','scan_start','scan_complete','advice_open'],true)) { wg_fail(422,'VALIDATION','Onbekend statistiekevent.'); }
        // Only counters persist: no URL, IP, session ID or scan input in analytics.
        $_SESSION['event_counts'][$event]=(int)($_SESSION['event_counts'][$event]??0)+1;
        if ($_SESSION['event_counts'][$event]>30) { wg_fail(429,'RATE_LIMIT','Er zijn voldoende metingen voor deze sessie.'); }
        wg_event($db,$event); wg_json(['ok'=>true]);
    }
    if ($action === 'admin_login') {
        $data=wg_input($config); wg_rate($db,$config,'login',8,900);
        $username=wg_text($data['username']??'','gebruikersnaam',120);
        $password=$data['password']??'';
        if(!is_string($password)||strlen($password)>200){wg_fail(422,'VALIDATION','Controleer het wachtwoord.');}
        $validPassword=password_verify($password,$config['admin_password_hash']);
        if (!hash_equals($config['admin_username'],$username) || !$validPassword) { wg_fail(401,'LOGIN_FAILED','Gebruikersnaam of wachtwoord klopt niet.'); }
        session_regenerate_id(true); $_SESSION['admin']=true; $_SESSION['auth_at']=time(); $_SESSION['last_activity']=time(); $_SESSION['csrf']=bin2hex(random_bytes(32));
        wg_json(['ok'=>true,'csrf'=>$_SESSION['csrf'],'username'=>$config['admin_username']]);
    }
    if (str_starts_with($action,'admin_')) { wg_auth($config); }
    if ($action === 'admin_logout') {
        wg_input($config); $_SESSION=[]; session_regenerate_id(true); $_SESSION['csrf']=bin2hex(random_bytes(32)); $_SESSION['created_at']=time(); wg_json(['ok'=>true]);
    }
    if ($action === 'admin_stats') {
        wg_method('GET');
        $since=gmdate('Y-m-d',time()-29*86400); $q=$db->prepare('SELECT `day`,`event`,`count` FROM daily_events WHERE `day`>=? ORDER BY `day`');$q->execute([$since]);$events=$q->fetchAll();
        $totals=array_fill_keys(['page_view','scan_start','scan_complete','advice_open','lead_accepted'],0);
        foreach($events as $e){if(array_key_exists($e['event'],$totals)){$totals[$e['event']]+=(int)$e['count'];}}
        $q=$db->prepare('SELECT COUNT(*) FROM leads WHERE created_at >= ?');$q->execute([$since]);$leadCount=(int)$q->fetchColumn();
        $statuses=$db->query('SELECT status,COUNT(*) AS count FROM leads GROUP BY status')->fetchAll();
        $byPartner=$db->query('SELECT partner,COUNT(*) AS count FROM leads GROUP BY partner')->fetchAll();
        $overdue=$db->prepare("SELECT COUNT(*) FROM leads WHERE status='new' AND created_at < ?");
        $overdue->execute([gmdate('Y-m-d\TH:i:s\Z',time()-86400)]);
        $overdueNew=(int)$overdue->fetchColumn();
        wg_json(['ok'=>true,'days'=>30,'since'=>$since,'events'=>$events,'totals'=>$totals,'leadCount'=>$leadCount,'statuses'=>$statuses,'partners'=>$byPartner,'overdueNew'=>$overdueNew,'retentionDays'=>$config['retention_days'],'conversion'=>$totals['scan_complete']>0?round($totals['lead_accepted']/$totals['scan_complete']*100,1):null, 'delivery'=>wg_delivery_summary($db), 'deliveryConfigured'=>wg_delivery_settings($config)!==null]);
    }
    if ($action === 'admin_leads') {
        wg_method('GET');$status=(string)($_GET['status']??'');$offset=max(0,min(100000,(int)($_GET['offset']??0)));
        if($status!==''&&!in_array($status,['new','contacted','qualified','closed'],true)){wg_fail(422,'VALIDATION','Onbekende status.');}
        $where=$status!==''?' WHERE leads.status=?':'';$q=$db->prepare('SELECT COUNT(*) FROM leads'.$where);$q->execute($status!==''?[$status]:[]);$total=(int)$q->fetchColumn();
        $q=$db->prepare('SELECT leads.*,d.status AS delivery_status,
          d.attempts AS delivery_attempts,d.next_attempt_at AS delivery_next_attempt,
          d.acknowledged_at AS delivery_acknowledged_at,d.ack_reference AS delivery_ack_reference,
          d.last_error AS delivery_last_error
          FROM leads LEFT JOIN delivery_outbox d ON d.lead_id=leads.id'
          .$where.' ORDER BY leads.created_at DESC LIMIT 50 OFFSET '. $offset);
        $q->execute($status!==''?[$status]:[]);
        $rows=[];foreach($q->fetchAll() as $row){
            $public=wg_lead_public($row,$config);
            $public['delivery']=wg_delivery_public($row);
            $rows[]=$public;
        }
        wg_json(['ok'=>true,'leads'=>$rows,'total'=>$total,'offset'=>$offset,'limit'=>50]);
    }
    if ($action === 'admin_status') {
        $data=wg_input($config);$id=wg_text($data['id']??'','aanvraagcode',40,true);$status=$data['status']??'';
        if(!in_array($status,['new','contacted','qualified','closed'],true)){wg_fail(422,'VALIDATION','Onbekende status.');}
        $q=$db->prepare('UPDATE leads SET status=?,updated_at=? WHERE id=?');$q->execute([$status,gmdate('Y-m-d\TH:i:s\Z'),$id]);
        if(!$q->rowCount()){wg_fail(404,'NOT_FOUND','Aanvraag niet gevonden.');}wg_json(['ok'=>true]);
    }
    if ($action === 'admin_delivery_retry') {
        $data=wg_input($config);
        $id=wg_text($data['id']??'','aanvraagcode',40,true);
        if(!preg_match('/^WG-[A-F0-9]{12}$/D',$id)){
            wg_fail(422,'VALIDATION','De aanvraagcode is ongeldig.');
        }
        if(!wg_delivery_retry($db,$id,($data['confirmMailboxChecked']??false)===true)){
            wg_fail(409,'DELIVERY_NOT_RETRYABLE','Alleen mislukte afleveringen kunnen opnieuw worden ingepland.');
        }
        // Only schedules a retry; no network request from an admin browser action.
        wg_json(['ok'=>true,'status'=>'pending']);
    }
    if ($action === 'admin_delete') {
        $data=wg_input($config);$id=wg_text($data['id']??'','aanvraagcode',40,true);$q=$db->prepare('DELETE FROM leads WHERE id=?');$q->execute([$id]);
        if(!$q->rowCount()){wg_fail(404,'NOT_FOUND','Aanvraag niet gevonden.');}wg_json(['ok'=>true]);
    }
    // All mail endpoints are protected by wg_auth above and never expose credentials.
    if ($action === 'admin_mail_status') {
        wg_method('GET'); wg_json(['ok'=>true] + wg_mail_ready($config));
    }
    if ($action === 'admin_mail_list') {
        wg_method('GET'); wg_rate($db,$config,'admin_mail_read',50,600);
        wg_json(['ok'=>true,'messages'=>wg_mail_list($config)]);
    }
    if ($action === 'admin_mail_read') {
        wg_method('GET'); wg_rate($db,$config,'admin_mail_read',50,600);
        $uid=filter_var($_GET['uid']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
        if($uid===false) { wg_fail(422,'VALIDATION','Ongeldige berichtcode.'); }
        wg_json(['ok'=>true,'message'=>wg_mail_read($config,$uid)]);
    }
    if ($action === 'admin_mail_send') {
        $data=wg_input($config);
        wg_rate($db,$config,'admin_mail_send',15,3600);
        $to=wg_text($data['to']??'','e-mailadres',254,true);
        $subject=wg_text($data['subject']??'','onderwerp',220,true);
        $body=wg_text($data['body']??'','bericht',15000,true);
        wg_mail_send($config,$to,$subject,$body);
        wg_json(['ok'=>true,'sent'=>true]);
    }
    if ($action === 'admin_export') {
        wg_input($config);$rows=$db->query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5000');
        header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="wattgoedkoper-aanvragen-'.gmdate('Y-m-d').'.csv"');
        $out=fopen('php://output','wb');fwrite($out,"\xEF\xBB\xBF");
        fputcsv($out,['Aanvraag','Ontvangen (UTC)','Status','Partner','Naam','E-mail','Telefoon','Postcode','Onderwerpen','Toestemmingsversie','Toelichting'],';', '"', '');
        foreach($rows as $row){$d=wg_decrypt($row['payload'],$config);fputcsv($out,array_map('wg_csv_cell',[$row['id'],$row['created_at'],$row['status'],$row['partner'],$d['name'],$d['email'],$d['phone'],$d['postcode'],implode(', ',$d['interests']),$d['consentVersion'],$d['note']]),';','"','');}
        fclose($out);exit;
    }
    wg_fail(404,'NOT_FOUND','Deze actie bestaat niet.');
} catch(WgHttpError $error) {
    if(isset($db)&&$db instanceof PDO&&$db->inTransaction()){$db->rollBack();}
    wg_json(['ok'=>false,'error'=>['code'=>$error->errorCode,'message'=>$error->getMessage()]],$error->status);
} catch(Throwable $error) {
    if(isset($db)&&$db instanceof PDO&&$db->inTransaction()){$db->rollBack();}
    // No submitted personal details, SQL text, file paths or credentials in logs/responses.
    error_log('WattGoedkoper API: internal operation failed.');
    wg_json(['ok'=>false,'error'=>['code'=>'INTERNAL_ERROR','message'=>'Opslaan is niet gelukt. Probeer het later opnieuw; je aanvraag is nog niet bevestigd.']],500);
}

<?php
declare(strict_types=1);
/**
 * Non-destructive, CLI-only Hostinger NIVO SMTP preflight.
 * --check: private mail config + aggregated queue state, no email sent.
 * --send-test: one synthetic email via exact same production SMTP adapter,
 *              never touching the lead/outbox records.
 */
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/delivery.php';

$mode=$argv[1]??'--check';
if(!in_array($mode,['--check','--send-test'],true)||count($argv)>2){
    fwrite(STDERR,"Gebruik: php scripts/nivo-smtp-pilot.php [--check|--send-test]\n");
    exit(2);
}
$config=wg_config();
if(!$config){
    fwrite(STDERR,"WattGoedkoper pilot: private configuratie ontbreekt of is ongeldig. Geen wijziging.\n");
    exit(1);
}
$pilotConfig=$config;
$pilotConfig['nivo_delivery_enabled']=true; // In memory only; never edit private config.
$pilotConfig['nivo_delivery_channel']='smtp';
$pilotConfig['nivo_delivery_recipient']=WG_NIVO_MAIL_RECIPIENT;
$settings=wg_delivery_settings($pilotConfig);
if(!$settings){
    fwrite(STDERR,"WattGoedkoper pilot: veilige info@-mailboxconfiguratie ontbreekt. Geen wijziging.\n");
    exit(1);
}
try{
    $db=wg_db($config);
    $summary=wg_delivery_summary($db);
}catch(Throwable){
    fwrite(STDERR,"WattGoedkoper pilot: databasecontrole mislukt. Geen mail verstuurd.\n");
    exit(1);
}
$active=wg_delivery_settings($config)!==null;
fwrite(STDOUT,
  "NIVO-ontvanger: ".WG_NIVO_MAIL_RECIPIENT."\n".
  "Mailconfig: beschikbaar (SMTP-authenticatie wordt alleen bij verzenden getest)\n".
  "Productie NIVO-transport actief: ".($active?'ja':'nee')."\n".
  "Afleverwachtrij (geen persoonsgegevens): ".
  "pending=".$summary['pending'].", processing=".$summary['processing'].
  ", smtp_accepted=".$summary['smtp_accepted'].
  ", api_acknowledged=".$summary['acknowledged'].
  ", failed=".$summary['failed']."\n"
);
if($mode==='--check'){
    fwrite(STDOUT,"Geen e-mail verstuurd; geen bestaande aanvraag gewijzigd.\n");
    exit(0);
}
// Explicitly requested test send; same delivery formatter and fixed SMTP recipient.
$id='WG-'.strtoupper(bin2hex(random_bytes(6)));
$now=gmdate('Y-m-d\\TH:i:s\\Z');
$payload=[
 'name'=>'FICTIEVE TESTAANVRAAG - GEEN KLANT',
 'email'=>'synthetic@example.invalid','phone'=>'','postcode'=>'',
 'interests'=>['battery'],'note'=>'TECHNISCHE PILOT - NIET BELLEN OF OPVOLGEN. GEEN ECHTE CONSUMENT.',
 'partner'=>'nivo','consent'=>true,'consentVersion'=>WG_CONSENT_VERSION,
 'consentText'=>WG_CONSENT_TEXT,'acceptedAt'=>$now,
 'summary'=>['modelVersion'=>'smtp-pilot-test','year'=>(int)gmdate('Y'),
   'selectedIds'=>['battery'],'annualSavingsLow'=>null,'annualSavingsHigh'=>null]
];
try{
    $envelope=wg_delivery_envelope($id,
        ['partner'=>'nivo','consent_version'=>WG_CONSENT_VERSION,'created_at'=>$now],
        $payload
    );
    $outcome=wg_delivery_send_smtp($envelope,$config,$settings,null,true);
}catch(Throwable){
    fwrite(STDERR,"SMTP-proef: technische fout, geen bevestigde acceptatie. Controleer NIVO-inbox vóór een herpoging.\n");
    exit(1);
}
if(($outcome['kind']??null)!=='smtp_accepted'){
    fwrite(STDERR,"SMTP-proef niet bevestigd. Status: ".($outcome['error']??'ONBEKEND').
        ". Controleer NIVO-inbox vóór een herpoging.\n");
    exit(1);
}
fwrite(STDOUT,
    "SYNTHETISCHE PILOT: mailserver heeft één testbericht geaccepteerd.\n".
    "Aanvraagcode: ".$id."\n".
    "Controleer de feitelijke ontvangst van het bericht [TEST - GEEN KLANT] in ".
    WG_NIVO_MAIL_RECIPIENT.".\n".
    "Productie-outbox, echte klantdata en transport-toggle zijn NIET gewijzigd.\n"
);

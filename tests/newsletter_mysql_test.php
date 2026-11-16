<?php
declare(strict_types=1);
/** Isolated CI-only MySQL integration. Never use real production credentials. */
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/mail.php';
require dirname(__DIR__).'/lib/newsletter.php';
$name=getenv('WG_TEST_MYSQL_NAME');
$user=getenv('WG_TEST_MYSQL_USER');
$password=getenv('WG_TEST_MYSQL_PASSWORD');
if(!$name||!$user||!$password || $name!=='wattgoedkoper_ci') {
    fwrite(STDERR,"Refusing outside isolated CI database.\n");exit(2);
}
$db=new PDO('mysql:host=127.0.0.1;dbname='.$name.';charset=utf8mb4',$user,$password,[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES=>false,
]);
$config=['encryption_key'=>base64_encode(random_bytes(32)),'hmac_key'=>str_repeat('newsletter-ci-mysql-only-',3)];
wg_newsletter_schema($db);
$db->exec('DELETE FROM newsletter_subscribers');
try {
  $intent=wg_newsletter_prepare($db,$config,'synthetic@example.test');
  if(!$intent['send'])throw new RuntimeException('No pending confirmation');
  if(wg_newsletter_active($db,$config)!==[])throw new RuntimeException('Pending entered export');
  if(!wg_newsletter_confirm($db,$config,$intent['token']))throw new RuntimeException('Confirmation failed');
  $active=wg_newsletter_active($db,$config);
  if(count($active)!==1||$active[0]['email']!=='synthetic@example.test')throw new RuntimeException('Active row unavailable');
  $token=explode('=', $active[0]['unsubscribeUrl'],2)[1];
  if(!wg_newsletter_unsubscribe($db,$config,$token))throw new RuntimeException('Unsubscribe failed');
  if(wg_newsletter_active($db,$config)!==[])throw new RuntimeException('Opt-out still exportable');
  $click=wg_newsletter_subscribe_single($db,$config,'oneclick@example.test');
  if(!$click['subscribed']||$click['alreadySubscribed'])throw new RuntimeException('Single-click consent not active');
  $hash=wg_newsletter_hash($config,'email','oneclick@example.test');
  $read=$db->prepare('SELECT status,confirm_hash,consent_version,consent_source,payload FROM newsletter_subscribers WHERE email_hash=?');
  $read->execute([$hash]);$single=$read->fetch();
  if($single['status']!=='active'||$single['confirm_hash']!==null
     ||$single['consent_version']!==WG_NEWSLETTER_CONSENT_VERSION
     ||$single['consent_source']!=='report_success_single_click')
     throw new RuntimeException('MySQL single-click evidence invalid');
  $decoded=wg_decrypt($single['payload'],$config);
  if(($decoded['consentText']??'')!==WG_NEWSLETTER_CONSENT_TEXT)throw new RuntimeException('Consent text not encrypted');
  if(!wg_newsletter_unsubscribe($db,$config,$decoded['unsubscribeToken']))throw new RuntimeException('MySQL single-click opt-out failed');
  if(wg_newsletter_active($db,$config)!==[])throw new RuntimeException('Active export contains opted-out subscriber');
  echo "NEWSLETTER MYSQL: legacy plus immediate single opt-in, encrypted proof and opt-out verified with synthetic data\n";
} finally {
  $db->exec('DELETE FROM newsletter_subscribers');
}

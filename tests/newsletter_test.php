<?php
declare(strict_types=1);
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/mail.php';
require dirname(__DIR__).'/lib/newsletter.php';
$checks=0;
function nt(bool $condition,string $description): void {
    global $checks;
    if(!$condition)throw new RuntimeException($description);
    $checks++;
}
if (!extension_loaded('pdo_sqlite')) {
    echo "NEWSLETTER: SQLite unavailable, synthetic database checks skipped\n";
    exit(0);
}
$config=[
    'encryption_key'=>base64_encode(random_bytes(32)),
    'hmac_key'=>str_repeat('fake-consent-test-key-',4),
    'newsletter_optin_enabled'=>false,
];
$db=new PDO('sqlite::memory:',null,null,[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC
]);
nt(!wg_newsletter_enabled($config),'Newsletters must be off by default');
wg_newsletter_schema($db);
nt((int)$db->query('SELECT COUNT(*) FROM newsletter_subscribers')->fetchColumn()===0,'Empty mailing list');
$intent=wg_newsletter_prepare($db,$config,'testperson@example.test');
nt($intent['send']===true && strlen($intent['token'])===64,'Pending confirmation token');
nt(count(wg_newsletter_active($db,$config))===0,'No marketing before double confirmation');
$duplicate=wg_newsletter_prepare($db,$config,'testperson@example.test');
nt($duplicate['send']===false,'No repeated confirmation email for same pending signup');
$letter=wg_newsletter_confirmation_mail($intent['token']);
nt(str_contains($letter['text'],$intent['token'])&&str_contains($letter['html'],'Bevestig mijn aanmelding'),'Confirmation link in transactional email');
nt(!str_contains($letter['html'],'unsubscribeToken'),'Unsubscribe credential not leaked to pending mail');
nt(!wg_newsletter_confirm($db,$config,str_repeat('0',64)),'Incorrect token cannot activate');
nt(wg_newsletter_confirm($db,$config,$intent['token']),'Correct confirmation activates');
nt(!wg_newsletter_confirm($db,$config,$intent['token']),'Confirmation single-use');
$active=wg_newsletter_active($db,$config);
nt(count($active)===1&&$active[0]['email']==='testperson@example.test','Only confirmed address in secured export');
nt($active[0]['consentVersion']===WG_NEWSLETTER_LEGACY_CONSENT_VERSION,'Historic double opt-in version preserved');
nt($active[0]['source']==='report_success'&&!empty($active[0]['confirmedAt']),'Proof time/source present');
$raw=$db->query('SELECT payload FROM newsletter_subscribers')->fetchColumn();
nt(!str_contains($raw,'testperson')&&!str_contains($raw,'example.test'),'Email never plaintext at rest');
$unsub=explode('=', $active[0]['unsubscribeUrl'],2)[1];
nt(!wg_newsletter_unsubscribe($db,$config,str_repeat('f',64)),'Incorrect token cannot remove subscriber');
nt(wg_newsletter_unsubscribe($db,$config,$unsub),'Subscriber can unsubscribe without login');
nt(wg_newsletter_active($db,$config)===[],'Unsubscribed address excluded from future exports');
nt($db->query('SELECT payload FROM newsletter_subscribers')->fetchColumn()==='','Email ciphertext cleared after opt-out');
$repeat=wg_newsletter_prepare($db,$config,'testperson@example.test');
nt($repeat['send']===true,'Opted-out user must explicitly confirm again to reactivate');
nt(wg_newsletter_active($db,$config)===[],'A new pending request is not automatically active');
nt(!wg_newsletter_confirm($db,$config,$intent['token']),'Old confirmation token never reactivates');
nt(wg_newsletter_confirm($db,$config,$repeat['token']),'New confirmation token can activate');
nt((int)$db->query("SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active'")->fetchColumn()===1,'No duplicate records');
nt((int)$db->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='leads'")->fetchColumn()===0,'No NIVO lead table or account needed');
nt((int)$db->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='daily_events'")->fetchColumn()===0,'No analytics storage affected');
// Single-click consent: explicit affirmative action after an accepted report.
// This exercises consent/audit storage without a confirmation email or SMTP.
$proof=['emailHash'=>wg_newsletter_hash($config,'report','click@example.test'),'at'=>time()];
nt(wg_newsletter_report_proof_matches($config,$proof,'click@example.test',time()),'Matching recent report accepted');
nt(!wg_newsletter_report_proof_matches($config,$proof,'other@example.test',time()),'Different email cannot reuse proof');
nt(!wg_newsletter_report_proof_matches($config,$proof,'click@example.test',time()+86401),'Old proof expires');
nt(!wg_newsletter_report_proof_matches($config,['emailHash'=>$proof['emailHash'],'at'=>null],'click@example.test',time()),'Malformed proof denied');
$direct=wg_newsletter_subscribe_single($db,$config,'click@example.test');
nt($direct['subscribed']===true&&!$direct['alreadySubscribed'],'One click activates a new record immediately');
$hash=wg_newsletter_hash($config,'email','click@example.test');
$q=$db->prepare('SELECT * FROM newsletter_subscribers WHERE email_hash=?');$q->execute([$hash]);$row=$q->fetch();
nt($row['status']==='active'&&$row['confirm_hash']===null&&$row['confirm_expires_at']===null,'Single opt-in is active, without a confirmation link');
nt($row['consent_version']===WG_NEWSLETTER_CONSENT_VERSION
  && $row['consent_source']==='report_success_single_click'&&!empty($row['confirmed_at']),
  'Consent provenance and timestamp are persisted');
$data=wg_decrypt($row['payload'],$config);
nt($data['email']==='click@example.test'&&$data['consentText']===WG_NEWSLETTER_CONSENT_TEXT,
  'Exact affirmative consent text is stored encrypted');
$again=wg_newsletter_subscribe_single($db,$config,'click@example.test');
nt($again['subscribed']&&$again['alreadySubscribed'],'Repeated click does not create new consent');
$q->execute([$hash]);$same=$q->fetch();
nt($same['payload']===$row['payload']&&$same['confirmed_at']===$row['confirmed_at'],'Idempotent click preserves original evidence');
nt(count(wg_newsletter_active($db,$config))===2,'One historic opt-in and one single-click opt-in, no duplicates');
$singleUnsub=$data['unsubscribeToken'];
nt(wg_newsletter_unsubscribe($db,$config,$singleUnsub),'One-click consent can be withdrawn via the existing link');
$q->execute([$hash]);$removed=$q->fetch();
nt($removed['payload']===''&&$removed['status']==='unsubscribed','Withdrawal clears contact data');
$restart=wg_newsletter_subscribe_single($db,$config,'click@example.test');
nt($restart['subscribed']&&!$restart['alreadySubscribed'],'Opted-out address requires a new affirmative click');
nt(!wg_newsletter_unsubscribe($db,$config,$singleUnsub),'Stale unsubscribe token cannot affect new consent');
echo "NEWSLETTER SAFETY: $checks synthetic checks passed\n";

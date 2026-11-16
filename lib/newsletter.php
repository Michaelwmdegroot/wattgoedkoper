<?php
declare(strict_types=1);

/**
 * Separate, confirmed newsletter opt-in. A report delivery is never a subscription.
 * The existing private AES key encrypts addresses; the HMAC key indexes opaque
 * tokens. No CRM, bulk mailer, analytics event or second cron is added.
 */
const WG_NEWSLETTER_CONSENT_VERSION = '2026-11-newsletter-v1';
const WG_NEWSLETTER_CONSENT_TEXT = 'Ja, ik ontvang graag ongeveer maandelijks e-mails van WattGoedkoper met energiebespaartips en af en toe aanbiedingen van NIVO Groep Holland. Ik kan mij altijd gratis afmelden.';

function wg_newsletter_enabled(array $config): bool {
    return ($config['newsletter_optin_enabled'] ?? false) === true
        && wg_mail_ready($config)['sendAvailable'] === true;
}
function wg_newsletter_hash(array $config, string $scope, string $value): string {
    return hash_hmac('sha256', 'newsletter-'.$scope.'|'.$value, $config['hmac_key']);
}
function wg_newsletter_schema(PDO $db): void {
    if (wg_is_mysql($db)) {
        $db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            email_hash CHAR(64) NOT NULL PRIMARY KEY,
            payload LONGTEXT NOT NULL,
            status VARCHAR(16) NOT NULL,
            confirm_hash CHAR(64) NULL UNIQUE,
            confirm_expires_at CHAR(20) NULL,
            unsubscribe_hash CHAR(64) NOT NULL UNIQUE,
            consent_version VARCHAR(40) NOT NULL,
            consent_source VARCHAR(32) NOT NULL,
            requested_at CHAR(20) NOT NULL,
            confirmed_at CHAR(20) NULL,
            unsubscribed_at CHAR(20) NULL,
            updated_at CHAR(20) NOT NULL,
            INDEX wg_newsletter_status (status,confirmed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } else {
        $db->exec("CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            email_hash TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT NOT NULL,
            confirm_hash TEXT UNIQUE, confirm_expires_at TEXT,
            unsubscribe_hash TEXT NOT NULL UNIQUE, consent_version TEXT NOT NULL,
            consent_source TEXT NOT NULL, requested_at TEXT NOT NULL,
            confirmed_at TEXT, unsubscribed_at TEXT, updated_at TEXT NOT NULL
        ); CREATE INDEX IF NOT EXISTS wg_newsletter_status ON newsletter_subscribers(status,confirmed_at);");
    }
}
function wg_newsletter_prepare(PDO $db, array $config, string $email): array {
    wg_newsletter_schema($db);
    $email = strtolower(wg_text($email,'e-mailadres',254,true));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[<>\r\n]/', $email)) {
        wg_fail(422,'VALIDATION','Controleer je e-mailadres.');
    }
    $id = wg_newsletter_hash($config,'email',$email);
    $now = gmdate('Y-m-d\TH:i:s\Z');
    // Invalid/abandoned confirmation requests expire after seven days.
    $db->prepare("DELETE FROM newsletter_subscribers WHERE status='pending' AND confirm_expires_at < ?")->execute([$now]);
    $q=$db->prepare('SELECT status,confirm_expires_at FROM newsletter_subscribers WHERE email_hash=?');
    $q->execute([$id]);$previous=$q->fetch();
    if ($previous && ($previous['status']==='active'
        || ($previous['status']==='pending' && $previous['confirm_expires_at'] >= $now))) {
        return ['send'=>false];
    }
    $confirm=bin2hex(random_bytes(32));
    $unsubscribe=bin2hex(random_bytes(32));
    $values=[
        $id, wg_encrypt(['email'=>$email,'unsubscribeToken'=>$unsubscribe],$config),
        'pending', wg_newsletter_hash($config,'confirm',$confirm),
        gmdate('Y-m-d\TH:i:s\Z',time()+7*86400),
        wg_newsletter_hash($config,'unsubscribe',$unsubscribe),
        WG_NEWSLETTER_CONSENT_VERSION,'report_success',$now,$now,
    ];
    if ($previous) {
        $db->prepare("UPDATE newsletter_subscribers SET payload=?,status='pending',
            confirm_hash=?,confirm_expires_at=?,unsubscribe_hash=?,
            consent_version=?,consent_source=?,requested_at=?,
            confirmed_at=NULL,unsubscribed_at=NULL,updated_at=? WHERE email_hash=?")
            ->execute([$values[1],$values[3],$values[4],$values[5],$values[6],
                $values[7],$values[8],$values[9],$values[0]]);
    } else {
        $db->prepare("INSERT INTO newsletter_subscribers
            (email_hash,payload,status,confirm_hash,confirm_expires_at,unsubscribe_hash,
             consent_version,consent_source,requested_at,updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?)")->execute($values);
    }
    return ['send'=>true,'token'=>$confirm,'email'=>$email];
}
function wg_newsletter_confirmation_mail(string $token): array {
    $url='https://wattgoedkoper.nl/nieuwsbrief/#bevestig='.$token;
    $subject='Bevestig je aanmelding voor WattGoedkoper energietips';
    $text="Je hebt gevraagd om ongeveer maandelijks e-mails van WattGoedkoper te ontvangen met energiebespaartips en af en toe aanbiedingen van NIVO Groep Holland.\n\nBevestig je aanmelding binnen 7 dagen via:\n".$url."\n\nGeen aanmelding aangevraagd? Negeer dit bericht; je adres komt dan niet op de mailinglijst.\n\nWattGoedkoper.nl · info@wattgoedkoper.nl · https://wattgoedkoper.nl/privacy.html\n";
    $html='<div style="font-family:Arial,sans-serif;max-width:550px;margin:auto;color:#173f49;">'
        .'<h1 style="font-family:Georgia,serif;font-weight:400">Houd je energie slimmer.</h1>'
        .'<p>Bevestig dat je ongeveer maandelijks e-mails van WattGoedkoper wilt ontvangen met energiebespaartips en af en toe aanbiedingen van NIVO Groep Holland.</p>'
        .'<p><a href="'.htmlspecialchars($url,ENT_QUOTES,'UTF-8').'" style="display:inline-block;background:#ffda4a;padding:13px 20px;border-radius:9px;color:#173f49;font-weight:700;text-decoration:none">Bevestig mijn aanmelding</a></p>'
        .'<p>De link is 7 dagen geldig. Niet aangevraagd? Negeer dit bericht; dan word je niet ingeschreven.</p>'
        .'<small><a href="https://wattgoedkoper.nl/privacy.html">Privacyverklaring</a> · info@wattgoedkoper.nl</small></div>';
    return ['subject'=>$subject,'text'=>$text,'html'=>$html];
}
function wg_newsletter_confirm(PDO $db, array $config, string $token): bool {
    if (!preg_match('/^[a-f0-9]{64}$/D',$token)) return false;
    wg_newsletter_schema($db);
    $hash=wg_newsletter_hash($config,'confirm',$token);
    $q=$db->prepare("UPDATE newsletter_subscribers SET status='active',
        confirmed_at=?,confirm_hash=NULL,confirm_expires_at=NULL,updated_at=?
        WHERE confirm_hash=? AND status='pending' AND confirm_expires_at>=?");
    $now=gmdate('Y-m-d\TH:i:s\Z');
    $q->execute([$now,$now,$hash,$now]);
    return $q->rowCount()===1;
}
function wg_newsletter_unsubscribe(PDO $db, array $config, string $token): bool {
    if (!preg_match('/^[a-f0-9]{64}$/D',$token)) return false;
    wg_newsletter_schema($db);
    $hash=wg_newsletter_hash($config,'unsubscribe',$token);
    $now=gmdate('Y-m-d\TH:i:s\Z');
    $q=$db->prepare("UPDATE newsletter_subscribers SET status='unsubscribed',
        payload='',confirmed_at=NULL,confirm_hash=NULL,confirm_expires_at=NULL,
        unsubscribed_at=?,updated_at=? WHERE unsubscribe_hash=? AND status='active'");
    $q->execute([$now,$now,$hash]);
    return $q->rowCount()===1;
}
function wg_newsletter_active(PDO $db, array $config): array {
    wg_newsletter_schema($db);
    $rows=$db->query("SELECT payload,consent_version,consent_source,confirmed_at
        FROM newsletter_subscribers WHERE status='active' ORDER BY confirmed_at DESC LIMIT 5000")->fetchAll();
    $out=[];
    foreach ($rows as $r) {
        $data=wg_decrypt($r['payload'],$config);
        $out[]=[
            'email'=>$data['email'],
            'confirmedAt'=>$r['confirmed_at'],
            'consentVersion'=>$r['consent_version'],
            'source'=>$r['consent_source'],
            'unsubscribeUrl'=>'https://wattgoedkoper.nl/nieuwsbrief/#afmelden='.$data['unsubscribeToken'],
        ];
    }
    return $out;
}

<?php
declare(strict_types=1);
/**
 * Optional Hostinger mailbox connector. Never expose or log credentials.
 * Plain-text inbox only; attachments and remote HTML are not loaded.
 */
function wg_mail_settings(array $config): ?array {
    $path = $config['private_dir'] . '/mail-config.php';
    if (!is_file($path) || !is_readable($path)) { return null; }
    $mail = require $path;
    if (!is_array($mail) || ($mail['username'] ?? '') !== 'info@wattgoedkoper.nl'
        || !is_string($mail['password'] ?? null) || $mail['password'] === '') { return null; }
    return $mail;
}
function wg_mail_ready(array $config): array {
    $mail = wg_mail_settings($config);
    return ['configured'=>$mail !== null,'imapAvailable'=>function_exists('imap_open'),
        'address'=>'info@wattgoedkoper.nl','sendAvailable'=>$mail !== null && extension_loaded('openssl')];
}
function wg_mail_open(array $config) {
    $mail = wg_mail_settings($config);
    if (!$mail) { wg_fail(503,'MAIL_SETUP_REQUIRED','De mailbox is nog niet veilig ingesteld.'); }
    if (!function_exists('imap_open')) { wg_fail(503,'MAIL_EXTENSION_MISSING','Schakel de PHP IMAP-extensie in via Hostinger PHP Configuration.'); }
    if (function_exists('imap_timeout')) { imap_timeout(IMAP_OPENTIMEOUT, 8); imap_timeout(IMAP_READTIMEOUT, 10); }
    $stream = @imap_open('{imap.hostinger.com:993/imap/ssl}INBOX',$mail['username'],$mail['password'],OP_READONLY,1);
    if ($stream === false) { wg_fail(503,'MAIL_UNAVAILABLE','De beveiligde IMAP-verbinding is niet beschikbaar.'); }
    return $stream;
}
function wg_mail_decode_header(string $raw): string {
    if (function_exists('iconv_mime_decode')) {
        $decoded = @iconv_mime_decode($raw,ICONV_MIME_DECODE_CONTINUE_ON_ERROR,'UTF-8');
        if (is_string($decoded)) { return trim($decoded); }
    }
    return trim($raw);
}
function wg_mail_list(array $config): array {
    $stream = wg_mail_open($config);
    try {
        $n = imap_num_msg($stream);
        $items = [];
        for ($i=$n; $i>max(0,$n-40); $i--) {
            $uid = imap_uid($stream,$i);
            if (!$uid) { continue; }
            $rows = imap_fetch_overview($stream,(string)$uid,FT_UID);
            $m = $rows[0] ?? null;
            if (!$m) { continue; }
            $items[]=['uid'=>(int)$uid,
                'from'=>wg_mail_decode_header((string)($m->from??'')),
                'subject'=>wg_mail_decode_header((string)($m->subject??'(geen onderwerp)')),
                'date'=>(string)($m->date??''),'unread'=>!isset($m->seen)||!$m->seen];
        }
        return $items;
    } finally { imap_close($stream); }
}
function wg_mail_part($stream, int $uid, $part, string $section = ''): string {
    if (isset($part->parts) && is_array($part->parts)) {
        foreach ($part->parts as $i=>$child) {
            if (($child->disposition??'') === 'ATTACHMENT') { continue; }
            $segment=$section===''?(string)($i+1):$section.'.'.($i+1);
            $plain=wg_mail_part($stream,$uid,$child,$segment);
            if ($plain !== '') { return $plain; }
        }
        return '';
    }
    if (($part->type??-1)!==0 || strtoupper((string)($part->subtype??''))!=='PLAIN') { return ''; }
    $text=$section===''?@imap_body($stream,$uid,FT_UID|FT_PEEK):@imap_fetchbody($stream,$uid,$section,FT_UID|FT_PEEK);
    if (!is_string($text)) { return ''; }
    $encoding=(int)($part->encoding??0);
    if ($encoding===3) { $text=(string)base64_decode($text,true); }
    if ($encoding===4) { $text=quoted_printable_decode($text); }
    $charset='UTF-8';
    foreach (($part->parameters??[]) as $p) {
        if (strcasecmp((string)($p->attribute??''),'charset')===0) {$charset=(string)$p->value;break;}
    }
    if (strcasecmp($charset,'UTF-8')!==0 && function_exists('iconv')) {
        $converted=@iconv($charset,'UTF-8//IGNORE',$text);
        if (is_string($converted)) { $text=$converted; }
    }
    return function_exists('mb_substr') ? mb_substr($text,0,24000,'UTF-8') : substr($text,0,24000);
}
function wg_mail_read(array $config, int $uid): array {
    if ($uid<1) { wg_fail(422,'VALIDATION','Ongeldige berichtcode.'); }
    $stream=wg_mail_open($config);
    try {
        $num=imap_msgno($stream,$uid);
        if (!$num) { wg_fail(404,'NOT_FOUND','Bericht bestaat niet in Postvak IN.'); }
        $rows=imap_fetch_overview($stream,(string)$uid,FT_UID);
        $m=$rows[0]??null;
        if (!$m) { wg_fail(404,'NOT_FOUND','Bericht is niet gevonden.'); }
        $structure=imap_fetchstructure($stream,$uid,FT_UID);
        $text=$structure?wg_mail_part($stream,$uid,$structure):'';
        if ($text==='') { $text='Geen leesbare platte-tekstversie. Open dit bericht in Hostinger Webmail om de HTML-versie of bijlagen te bekijken.'; }
        return ['uid'=>$uid,'from'=>wg_mail_decode_header((string)($m->from??'')),
            'subject'=>wg_mail_decode_header((string)($m->subject??'')),
            'date'=>(string)($m->date??''),'body'=>$text];
    } finally { imap_close($stream); }
}
function wg_smtp_expect($stream, array $expected): string {
    $reply='';
    do {
        $line=fgets($stream,1024);
        if ($line===false) { throw new RuntimeException('SMTP transport failed'); }
        $reply=$line;
    } while (isset($line[3]) && $line[3]==='-');
    if (!in_array((int)substr($reply,0,3),$expected,true)) { throw new RuntimeException('SMTP rejected command'); }
    return $reply;
}
function wg_smtp_cmd($stream,string $line,array $expected): void {
    if (fwrite($stream,$line."\r\n")===false) { throw new RuntimeException('SMTP transport failed'); }
    wg_smtp_expect($stream,$expected);
}
function wg_mail_send(array $config,string $recipient,string $subject,string $body,?string $html=null): void {
    $mail=wg_mail_settings($config);
    if (!$mail) { wg_fail(503,'MAIL_SETUP_REQUIRED','De mailbox is nog niet ingesteld.'); }
    if (!filter_var($recipient,FILTER_VALIDATE_EMAIL) || strlen($recipient)>254 || preg_match('/[<>\\x00-\\x20\\x7F]/',$recipient)) {
        wg_fail(422,'VALIDATION','Vul één geldig e-mailadres in.');
    }
    if ($subject==='' || strlen($subject)>220 || preg_match('/[\r\n\x00-\x1F\x7F]/',$subject)) {
        wg_fail(422,'VALIDATION','Controleer het onderwerp.');
    }
    if (trim($body)==='' || strlen($body)>15000) { wg_fail(422,'VALIDATION','Controleer de berichttekst.'); }
    if ($html!==null && (trim($html)==='' || strlen($html)>30000)) { wg_fail(422,'VALIDATION','Controleer het e-mailrapport.'); }
    $context=stream_context_create(['ssl'=>[
        'verify_peer'=>true,'verify_peer_name'=>true,'peer_name'=>'smtp.hostinger.com',
        'allow_self_signed'=>false,'SNI_enabled'=>true
    ]]);
    $socket=@stream_socket_client('ssl://smtp.hostinger.com:465',$errno,$errstr,12,STREAM_CLIENT_CONNECT,$context);
    if (!$socket) { wg_fail(503,'MAIL_UNAVAILABLE','SMTP is momenteel niet bereikbaar.'); }
    stream_set_timeout($socket,12);
    try {
        wg_smtp_expect($socket,[220]);
        wg_smtp_cmd($socket,'EHLO wattgoedkoper.nl',[250]);
        wg_smtp_cmd($socket,'AUTH LOGIN',[334]);
        wg_smtp_cmd($socket,base64_encode($mail['username']),[334]);
        wg_smtp_cmd($socket,base64_encode($mail['password']),[235]);
        wg_smtp_cmd($socket,'MAIL FROM:<'.$mail['username'].'>',[250]);
        wg_smtp_cmd($socket,'RCPT TO:<'.$recipient.'>',[250,251]);
        wg_smtp_cmd($socket,'DATA',[354]);
        $boundary='wg-report-'.bin2hex(random_bytes(12));
        $headers=[
            'Date: '.gmdate('D, d M Y H:i:s').' +0000',
            'From: WattGoedkoper <info@wattgoedkoper.nl>',
            'To: <'.$recipient.'>',
            'Subject: =?UTF-8?B?'.base64_encode($subject).'?=',
            'Message-ID: <'.bin2hex(random_bytes(12)).'@wattgoedkoper.nl>',
            'MIME-Version: 1.0'
        ];
        if ($html===null) {
            $headers[]='Content-Type: text/plain; charset=UTF-8';
            $headers[]='Content-Transfer-Encoding: base64';
            $mime=chunk_split(base64_encode($body),76,"\r\n");
        } else {
            $headers[]='Content-Type: multipart/alternative; boundary="'.$boundary.'"';
            $mime='--'.$boundary."\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
                .chunk_split(base64_encode($body),76,"\r\n")
                ."\r\n--".$boundary."\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
                .chunk_split(base64_encode($html),76,"\r\n")
                ."\r\n--".$boundary."--\r\n";
        }
        $data=implode("\r\n",$headers)."\r\n\r\n".$mime."\r\n.\r\n";
        for($offset=0,$len=strlen($data);$offset<$len;){
            $written=fwrite($socket,substr($data,$offset));
            if($written===false||$written===0){throw new RuntimeException('SMTP transport interrupted');}
            $offset+=$written;
        }
        wg_smtp_expect($socket,[250]);
        // A successful 250 after DATA is final acceptance; QUIT errors must not suggest retrying.
        @fwrite($socket,"QUIT\r\n");
    } catch(Throwable $e) {
        wg_fail(503,'MAIL_SEND_FAILED','Verzending is niet bevestigd. Controleer de mailbox en probeer niet blind opnieuw.');
    } finally { fclose($socket); }
}

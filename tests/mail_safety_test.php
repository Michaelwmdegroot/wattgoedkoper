<?php
declare(strict_types=1);
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/mail.php';
function expect(bool $condition,string $message): void { if(!$condition) { throw new RuntimeException($message); } }
function denied(callable $f,int $status): void {
    try { $f(); } catch(WgHttpError $e) { expect($e->status===$status,'Unexpected HTTP status'); return; }
    throw new RuntimeException('Unsafe mail request unexpectedly accepted');
}
$dir=sys_get_temp_dir().'/wattgoedkoper-mail-test-'.bin2hex(random_bytes(5));
mkdir($dir,0700);
$config=['private_dir'=>$dir];
try {
    $ready=wg_mail_ready($config);
    expect(!$ready['configured'],'Mailbox must fail closed without private secrets');
    denied(fn()=>wg_mail_list($config),503);
    $fake="<?php return ".var_export(['username'=>'info@zonlio.nl','password'=>'test'],true).";";
    file_put_contents($dir.'/mail-config.php',$fake);
    expect(!wg_mail_ready($config)['configured'],'Other projects must not be used as mailbox identity');
    file_put_contents($dir.'/mail-config.php',"<?php return ".var_export(['username'=>'info@wattgoedkoper.nl','password'=>'test-secret'],true).";");
    expect(wg_mail_ready($config)['configured'],'Correct private identity should be available');
    denied(fn()=>wg_mail_send($config,"customer\r\nBcc:evil@example.test","Subject","body"),422);
    denied(fn()=>wg_mail_send($config,"valid@example.test","bad\r\nBcc:evil","body"),422);
    denied(fn()=>wg_mail_send($config,"valid@example.test","Subject","   "),422);
    $stream=fopen('php://temp','w+');
    fwrite($stream,"250-first line\r\n250 second line\r\n");rewind($stream);
    expect(str_starts_with(wg_smtp_expect($stream,[250]),'250'),'Must consume SMTP multiline response');
    fclose($stream);
    echo "MAIL SAFETY: 8 checks passed\n";
} finally {
    @unlink($dir.'/mail-config.php');@rmdir($dir);
}

<?php
declare(strict_types=1);
/** Report-only configuration preflight. Synthetic fixtures; never opens SMTP or NIVO. */
function preflightCheck(bool $ok, string $message): void {
    global $checks;
    if (!$ok) throw new RuntimeException('Report preflight: '.$message);
    $checks++;
}
function runReportPreflight(string $private): array {
    $pipes=[];
    $env=array_replace((array)getenv(),['WG_PRIVATE_DIR'=>$private]);
    $proc=proc_open([PHP_BINARY,dirname(__DIR__).'/scripts/report-preflight.php'],
        [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,dirname(__DIR__),$env);
    if(!is_resource($proc))throw new RuntimeException('Cannot run preflight CLI');
    fclose($pipes[0]);
    $stdout=stream_get_contents($pipes[1]);fclose($pipes[1]);
    $stderr=stream_get_contents($pipes[2]);fclose($pipes[2]);
    return [proc_close($proc),json_decode($stdout,true,10,JSON_THROW_ON_ERROR),$stdout,$stderr];
}
$checks=0;
$private=sys_get_temp_dir().'/wg-report-preflight-'.bin2hex(random_bytes(7));
preflightCheck(mkdir($private,0700),'private fixture exists');
$config=[
    'origin'=>'http://localhost',
    'admin_username'=>'ci_admin',
    'admin_password_hash'=>password_hash('synthetic-only-password',PASSWORD_DEFAULT),
    'encryption_key'=>base64_encode(random_bytes(32)),
    'hmac_key'=>bin2hex(random_bytes(32)),
    'retention_days'=>90,
    'report_mail_enabled'=>false
];
try{
    [$code,$data,$raw]=runReportPreflight($private);
    preflightCheck($code===1 && !$data['configured'] && !$data['reportEnabled'],'no config fails closed');
    file_put_contents($private.'/config.php','<?php return '.var_export($config,true).';');
    chmod($private.'/config.php',0600);
    [$code,$data]=runReportPreflight($private);
    preflightCheck($code===0 && $data['configured']===true && !$data['reportRequested']
        && !$data['reportEnabled'],'default disabled');
    $config['report_mail_enabled']=true;
    file_put_contents($private.'/config.php','<?php return '.var_export($config,true).';');
    [$code,$data]=runReportPreflight($private);
    preflightCheck($code===0 && $data['reportRequested']===true
        && !$data['mailConfigPresent'] && !$data['reportEnabled'],'enabled flag still needs mail config');
    file_put_contents($private.'/mail-config.php',"<?php return ".var_export([
        'username'=>'info@wattgoedkoper.nl','password'=>'ci-placeholder-no-network'],true).";");
    chmod($private.'/mail-config.php',0600);
    [$code,$data,$raw,$err]=runReportPreflight($private);
    preflightCheck($code===0 && $data['mailConfigPresent']===true
        && $data['smtpLibraryReady']===true && $data['reportEnabled']===true,
        'only correct private mail config plus flag passes local readiness');
    preflightCheck($data['liveReceiptVerified']===false,'preflight never invents inbox proof');
    preflightCheck($err==='' && !str_contains($raw,'ci-placeholder')
        && !str_contains($raw,$config['hmac_key']) && !str_contains($raw,$config['encryption_key']),
        'no secret or PHP config leaked in output');
    preflightCheck(!is_file($private.'/wattgoedkoper.sqlite'),'no database created or mutated');
    echo "REPORT PREFLIGHT: $checks offline checks passed\n";
}finally{
    @unlink($private.'/mail-config.php');@unlink($private.'/config.php');@rmdir($private);
}

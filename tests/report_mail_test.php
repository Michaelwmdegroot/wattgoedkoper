<?php
declare(strict_types=1);
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/mail.php';
require dirname(__DIR__).'/lib/report.php';

function verify(bool $truth,string $message): void {
    if (!$truth) throw new RuntimeException($message);
}
function blocked(callable $action,int $status,string $code=''): void {
    try { $action(); }
    catch (WgHttpError $e) {
        verify($e->status===$status,'Unexpected HTTP status for '.$code);
        if ($code!=='') verify($e->errorCode===$code,'Unexpected error code: '.$e->errorCode);
        return;
    }
    throw new RuntimeException('Unsafe request was unexpectedly accepted');
}
$checks=0;
function ok(bool $truth,string $message): void {
    global $checks;
    verify($truth,$message);$checks++;
}
$dir=sys_get_temp_dir().'/wattgoedkoper-report-'.bin2hex(random_bytes(6));
mkdir($dir,0700);
$config=[
    'private_dir'=>$dir,
    'hmac_key'=>str_repeat('local-test-only-key-0123456789',3),
    'report_mail_enabled'=>false,
];
$report=[
    'modelVersion'=>'2026.11.14-v1',
    'year'=>2027,
    'homeType'=>'terraced',
    'selectedIds'=>['solar','battery'],
    'savingsLow'=>100.0,'savingsHigh'=>140.0,
    'investmentLow'=>7500.0,'investmentHigh'=>10500.0,
    'baselineCost'=>2500.0,'plannedCost'=>2380.0,
    'electricityUse'=>3500.0,'gasUse'=>900.0,'budgetOverBy'=>1500.0
];
$base=['email'=>'consument@example.test','idempotencyKey'=>'abc123abc123abc123abc123','website'=>'','report'=>$report];
try {
    ok(!wg_report_enabled($config),'Report feature is disabled without explicit opt-in');
    file_put_contents($dir.'/mail-config.php',"<?php return ".var_export(['username'=>'info@wattgoedkoper.nl','password'=>'test-no-smtp'],true).";");
    ok(!wg_report_enabled($config),'Mailbox alone cannot activate public report sending');
    $config['report_mail_enabled']=true;
    ok(wg_report_enabled($config),'Explicit flag plus expected mailbox passes availability gate');
    $validated=wg_report_validate($base);
    ok($validated['email']==='consument@example.test' && count($validated['report']['selectedIds'])===2,'Valid report snapshot sanitized');
    ok(!array_key_exists('unknown',$validated),'No arbitrary report fields are retained');
} catch (Throwable $e) { @unlink($dir.'/mail-config.php'); @rmdir($dir); throw $e; }
try {
    blocked(fn()=>wg_report_validate(array_replace($base,['email'=>"a@example.test\r\nBcc:bad"])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['email'=>'a@b.test,c@d.test'])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['report'=>array_replace($report,['selectedIds'=>['solar','<img>']])])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['report'=>array_replace($report,['savingsLow'=>200.0])])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['report'=>array_replace($report,['investmentHigh'=>-1])])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['report'=>array_replace($report,['year'=>2028])])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['report'=>array_replace($report,['homeType'=>'<script>'])])),422);
    $checks++;
    blocked(fn()=>wg_report_validate(array_replace($base,['idempotencyKey'=>'short'])),422);
    $checks++;
    $mail=wg_report_content($validated);
    ok(str_contains($mail['text'],'NIVO Groep Holland') && str_contains($mail['text'],'geen toestemming'),
        'Plain-text report has NIVO voluntary advice and explicit consent separation');
    ok(str_contains($mail['html'],'multipart')===false && str_contains($mail['html'],'Jouw maatregelen') &&
        str_contains($mail['html'],'https://wattgoedkoper.nl/#advies'), 'Safe HTML report has a working advice URL');
    ok(!str_contains($mail['text'],$base['email']) && !str_contains($mail['html'],$base['email']),
        'Mail body does not expose address or add a tracking pixel');
    if (extension_loaded('pdo_sqlite')) {
        $db=new PDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
        $db->exec('CREATE TABLE rate_limits (bucket TEXT PRIMARY KEY,window_start INTEGER NOT NULL,hits INTEGER NOT NULL)');
        $_SERVER['REMOTE_ADDR']='127.0.0.1';
        $first=wg_report_reserve($db,$config,$validated);
        ok($first['state']==='send','First request reserves exactly one delivery');
        blocked(fn()=>wg_report_reserve($db,$config,$validated),409,'REPORT_STATUS_UNCERTAIN');
        $checks++;
        wg_report_finish($db,$first['id'],true);
        $replayed=wg_report_reserve($db,$config,$validated);
        ok($replayed['state']==='replayed','Accepted delivery is idempotent');
        blocked(fn()=>wg_report_reserve($db,$config,wg_report_validate(array_replace($base,['email'=>'another@example.test']))),409,'IDEMPOTENCY_CONFLICT');
        $checks++;
        $rows=$db->query('SELECT bucket FROM rate_limits')->fetchAll(PDO::FETCH_COLUMN);
        ok(count($rows)>0 && !str_contains(implode('', $rows), 'consument') &&
           !str_contains(implode('', $rows),'127.0.0.1'), 'No recipient or raw IP stored in abuse counters');
    }
    echo "REPORT SAFETY: ".$checks." checks passed\n";
} finally {
    @unlink($dir.'/mail-config.php');@rmdir($dir);
}

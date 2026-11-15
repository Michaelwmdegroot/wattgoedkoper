<?php
declare(strict_types=1);
/**
 * CLI-only, SELECT-only production observation. No setup, cron invocation,
 * SMTP operation, schema mutation or personal records. Output may be shared
 * with an authorized operator without disclosing payloads or credentials.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/mail.php';
require dirname(__DIR__) . '/lib/delivery.php';
require dirname(__DIR__) . '/lib/operations.php';
try {
    $config=wg_config();
    if (!$config || ($config['database']['driver'] ?? null)!=='mysql') {
        throw new RuntimeException('Private MySQL-configuratie niet beschikbaar.');
    }
    $settings=$config['database'];
    // Intentionally avoid wg_db(): its additive CREATE TABLE IF NOT EXISTS
    // statements would violate this command's strict read-only contract.
    $db=new PDO('mysql:host='.$settings['host'].';dbname='.$settings['name'].';charset=utf8mb4',
        $settings['user'],$settings['password'],[
            PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES=>false,
        ]);
    $ops=wg_ops_status($db,$config);
    $out=[
        'ok'=>true,
        'observedAt'=>gmdate('Y-m-d\TH:i:s\Z'),
        'cron'=>[
            'status'=>$ops['cron']['status'],
            'monitorEnabled'=>$ops['cron']['monitorEnabled'],
            'lastSuccessAt'=>$ops['cron']['lastSuccessAt'],
            'previousSuccessAt'=>$ops['cron']['previousSuccessAt'],
            'observedDistinctRuns'=>$ops['cron']['observedDistinctRuns'],
            'ageSeconds'=>$ops['cron']['ageSeconds'],
            'maxAgeSeconds'=>$ops['cron']['maxAgeSeconds'],
            'lastErrorCode'=>$ops['cron']['lastErrorCode']
        ],
        'transportConfigured'=>$ops['transportConfigured'],
        'delivery'=>$ops['delivery'],
        'editorialStatus'=>$ops['editorial']['status'],
        'backupStatus'=>$ops['backup']['status'],
        'warnings'=>$ops['warnings']
    ];
    echo json_encode($out,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n";
} catch (Throwable) {
    // Never disclose PDO error messages, SQL queries, DB names or credentials.
    fwrite(STDERR,"Operationele inspectie mislukt; controleer de private Hostinger-instellingen.\n");
    exit(1);
}

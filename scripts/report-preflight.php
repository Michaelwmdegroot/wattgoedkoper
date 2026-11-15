<?php
declare(strict_types=1);
/**
 * CLI-only read-only report-mail preflight. No SMTP, database writes or leads.
 * Returns configuration availability booleans; never credentials or recipients.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/mail.php';
require dirname(__DIR__) . '/lib/report.php';
$config = wg_config();
if (!$config) {
    fwrite(STDOUT, json_encode(['ok'=>false,'configured'=>false,'reportRequested'=>false,
        'mailConfigPresent'=>false,'smtpLibraryReady'=>false,'reportEnabled'=>false,
        'liveReceiptVerified'=>false], JSON_THROW_ON_ERROR) . "\n");
    exit(1);
}
$mail = wg_mail_ready($config);
$enabled = wg_report_enabled($config);
fwrite(STDOUT, json_encode([
    'ok'=>true,
    'configured'=>true,
    'reportRequested'=>($config['report_mail_enabled'] ?? false) === true,
    'mailConfigPresent'=>$mail['configured'] === true,
    'smtpLibraryReady'=>$mail['sendAvailable'] === true,
    'reportEnabled'=>$enabled,
    // No API can prove real inbox arrival with only an offline configuration check.
    'liveReceiptVerified'=>false
], JSON_THROW_ON_ERROR) . "\n");

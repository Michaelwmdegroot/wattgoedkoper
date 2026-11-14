<?php
declare(strict_types=1);

/** WattGoedkoper backend. Personal data stays encrypted outside the document root. */
const WG_CONSENT_VERSION = '2026-11-v2';
const WG_CONSENT_TEXT = 'Ik wil dat NIVO Groep Holland contact met mij opneemt over mijn energieplan. NIVO mag hiervoor mijn contactgegevens, meegestuurde energie-informatie en berekende indicatie gebruiken. Ik heb de privacyverklaring gelezen. Ik kan mijn verzoek intrekken.';

final class WgHttpError extends RuntimeException {
    public function __construct(public int $status, public string $errorCode, string $message) { parent::__construct($message); }
}
function wg_fail(int $status, string $code, string $message): never { throw new WgHttpError($status, $code, $message); }
function wg_json(array $value, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}
function wg_headers(): void {
    header('Cache-Control: no-store, private, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    header('Referrer-Policy: no-referrer');
}
function wg_private_dir(): string {
    return rtrim((string)(getenv('WG_PRIVATE_DIR') ?: dirname(__DIR__, 2) . '/wattgoedkoper-private'), '/');
}
function wg_config(): ?array {
    $dir = realpath(wg_private_dir());
    $root = realpath(dirname(__DIR__));
    if (!$dir || !$root || $dir === $root || str_starts_with($dir, $root . DIRECTORY_SEPARATOR)) { return null; }
    $path = $dir . '/config.php';
    if (!is_file($path) || !is_readable($path) || !is_writable($dir) || (is_file($dir . '/wattgoedkoper.sqlite') && !is_writable($dir . '/wattgoedkoper.sqlite'))) { return null; }
    $config = require $path;
    if (!is_array($config) || !extension_loaded('openssl')) { return null; }
    if (($config['database']['driver'] ?? 'sqlite') !== 'mysql' && !extension_loaded('pdo_sqlite')) { return null; }
    foreach (['origin','admin_username','admin_password_hash','encryption_key','hmac_key'] as $key) {
        if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') { return null; }
    }
    if (strlen((string)base64_decode($config['encryption_key'], true)) !== 32 || strlen($config['hmac_key']) < 32) { return null; }
    $origin = parse_url($config['origin']);
    if (!$origin || !isset($origin['scheme'], $origin['host']) || isset($origin['query']) || isset($origin['fragment']) || !in_array($origin['scheme'], ['https','http'], true)) { return null; }
    if ($origin['scheme'] !== 'https' && !in_array($origin['host'], ['localhost','127.0.0.1','::1'], true)) { return null; }
    // Existing SQLite installations remain valid; MySQL is an explicit, private opt-in.
    if (isset($config['database'])) {
        $dbSettings=$config['database'];
        if (!is_array($dbSettings) || ($dbSettings['driver'] ?? '') !== 'mysql'
            || !extension_loaded('pdo_mysql')
            || !in_array(($dbSettings['host'] ?? ''),['localhost','127.0.0.1'],true)) { return null; }
        foreach (['name','user','password'] as $field) {
            if (!isset($dbSettings[$field]) || !is_string($dbSettings[$field]) || $dbSettings[$field]==='') { return null; }
        }
        if (!preg_match('/^[A-Za-z0-9_]{1,64}$/D', $dbSettings['name'])
            || !preg_match('/^[A-Za-z0-9_]{1,64}$/D', $dbSettings['user'])) { return null; }
    }
    $config['private_dir'] = $dir;
    $config['retention_days'] = max(1, min(365, (int)($config['retention_days'] ?? 90)));
    return $config;
}
function wg_require_config(?array $config): array {
    if (!$config) { wg_fail(503, 'SETUP_REQUIRED', 'De adviesaanvragen worden nog ingericht. Je kunt de energiescan wel gratis gebruiken.'); }
    return $config;
}
function wg_is_mysql(PDO $db): bool {
    return $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
}
function wg_db(array $config): PDO {
    umask(0077);
    if (($config['database']['driver'] ?? 'sqlite') === 'mysql') {
        $settings = $config['database'];
        if (!in_array(($settings['host'] ?? ''),['localhost','127.0.0.1'],true) || !extension_loaded('pdo_mysql')) {
            throw new RuntimeException('MySQL not configured');
        }
        $options = [
            PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES=>false
        ];
        if (defined('PDO::MYSQL_ATTR_FOUND_ROWS')) {
            $options[constant('PDO::MYSQL_ATTR_FOUND_ROWS')] = true;
        }
        $db = new PDO(
            'mysql:host='.$settings['host'].';dbname='.$settings['name'].';charset=utf8mb4',
            $settings['user'], $settings['password'], $options
        );
        $db->exec("CREATE TABLE IF NOT EXISTS leads (
            id VARCHAR(32) NOT NULL PRIMARY KEY, idempotency_hash CHAR(64) NOT NULL UNIQUE,
            request_hash CHAR(64) NOT NULL, created_at CHAR(20) NOT NULL,
            updated_at CHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
            partner VARCHAR(20) NOT NULL, payload LONGTEXT NOT NULL,
            consent_version VARCHAR(40) NOT NULL,
            INDEX leads_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $db->exec("CREATE TABLE IF NOT EXISTS daily_events (
            `day` CHAR(10) NOT NULL, `event` VARCHAR(40) NOT NULL,
            `count` INT NOT NULL DEFAULT 0,
            PRIMARY KEY (`day`,`event`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $db->exec("CREATE TABLE IF NOT EXISTS rate_limits (
            bucket CHAR(64) NOT NULL PRIMARY KEY,
            window_start BIGINT NOT NULL, hits INT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $db->exec("CREATE TABLE IF NOT EXISTS metadata (
            `key` VARCHAR(64) NOT NULL PRIMARY KEY, `value` TEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        return $db;
    }
    $db = new PDO('sqlite:' . $config['private_dir'] . '/wattgoedkoper.sqlite', null, null, [
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC
    ]);
    $db->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;');
    $db->exec("CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, idempotency_hash TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, status TEXT NOT NULL,
        partner TEXT NOT NULL, payload TEXT NOT NULL, consent_version TEXT NOT NULL
    ); CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at);
    CREATE TABLE IF NOT EXISTS daily_events (`day` TEXT NOT NULL, `event` TEXT NOT NULL, `count` INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(`day`,`event`));
    CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, window_start INTEGER NOT NULL, hits INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (`key` TEXT PRIMARY KEY, `value` TEXT NOT NULL);");
    return $db;
}
function wg_session(array $config): void {
    if (session_status() === PHP_SESSION_ACTIVE) { return; }
    umask(0077);
    $path = $config['private_dir'] . '/sessions';
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) { throw new RuntimeException('Session storage unavailable'); }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '28800');
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor', '100');
    session_save_path($path);
    session_name('wg_session');
    session_set_cookie_params(['lifetime'=>0, 'path'=>'/', 'secure'=>str_starts_with($config['origin'], 'https://'), 'httponly'=>true, 'samesite'=>'Strict']);
    session_start();
    if (!isset($_SESSION['csrf'])) { $_SESSION['csrf'] = bin2hex(random_bytes(32)); $_SESSION['created_at'] = time(); }
}
function wg_auth(array $config): void {
    wg_session($config);
    $now = time();
    if (empty($_SESSION['admin']) || $now - (int)($_SESSION['auth_at'] ?? 0) > 28800 || $now - (int)($_SESSION['last_activity'] ?? 0) > 1800) {
        unset($_SESSION['admin'], $_SESSION['auth_at'], $_SESSION['last_activity']);
        wg_fail(401, 'AUTH_REQUIRED', 'Log in om het dashboard te openen.');
    }
    $_SESSION['last_activity'] = $now;
}
function wg_method(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) { header('Allow: ' . $method); wg_fail(405, 'METHOD_NOT_ALLOWED', 'Deze actie ondersteunt deze methode niet.'); }
}
function wg_input(array $config, bool $csrf = true): array {
    wg_method('POST');
    $origin = rtrim((string)($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
    if (!hash_equals(rtrim($config['origin'], '/'), $origin)) { wg_fail(403, 'ORIGIN_DENIED', 'Vernieuw de pagina en probeer opnieuw.'); }
    $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($type !== 'application/json') { wg_fail(415, 'JSON_REQUIRED', 'Verstuur de gegevens als JSON.'); }
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) { wg_fail(413, 'TOO_LARGE', 'De aanvraag bevat te veel gegevens.'); }
    wg_session($config);
    if ($csrf && !hash_equals((string)$_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) { wg_fail(403, 'CSRF_INVALID', 'Je sessie is verlopen. Vernieuw de pagina.'); }
    $raw = file_get_contents('php://input', false, null, 0, 16385);
    if ($raw === false || strlen($raw) > 16384) { wg_fail(413, 'TOO_LARGE', 'De aanvraag bevat te veel gegevens.'); }
    try { $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); } catch (JsonException) { wg_fail(400, 'INVALID_JSON', 'De aanvraag kon niet worden gelezen.'); }
    if (!is_array($data) || array_is_list($data) && $data !== []) { wg_fail(400, 'INVALID_JSON', 'Verstuur een object met velden.'); }
    return $data;
}
function wg_text(mixed $value, string $label, int $max, bool $required = false): string {
    if (!is_string($value) || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) { wg_fail(422, 'VALIDATION', $label . ' heeft een ongeldige waarde.'); }
    $value = trim($value);
    if (($required && $value === '') || strlen($value) > $max) { wg_fail(422, 'VALIDATION', 'Controleer het veld ' . $label . '.'); }
    return $value;
}
function wg_rate(PDO $db, array $config, string $scope, int $limit, int $seconds): void {
    // No raw IP, forwarded-IP header, user agent or browser fingerprint is persisted.
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $window = intdiv(time(), $seconds) * $seconds;
    $bucket = hash_hmac('sha256', $scope . '|' . $ip . '|' . $window, $config['hmac_key']);
    $query=wg_is_mysql($db)
        ? 'INSERT INTO rate_limits(bucket,window_start,hits) VALUES(?,?,1) ON DUPLICATE KEY UPDATE hits=hits+1'
        : 'INSERT INTO rate_limits(bucket,window_start,hits) VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1';
    $q = $db->prepare($query);
    $q->execute([$bucket, $window]);
    $q = $db->prepare('SELECT hits FROM rate_limits WHERE bucket=?'); $q->execute([$bucket]);
    if ((int)$q->fetchColumn() > $limit) { header('Retry-After: ' . ($seconds - (time() - $window))); wg_fail(429, 'RATE_LIMIT', 'Er zijn veel verzoeken. Probeer het later opnieuw.'); }
}
function wg_encrypt(array $data, array $config): string {
    $nonce = random_bytes(12); $tag = '';
    $encrypted = openssl_encrypt(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), 'aes-256-gcm', base64_decode($config['encryption_key'], true), OPENSSL_RAW_DATA, $nonce, $tag, 'WattGoedkoper-v1');
    if ($encrypted === false) { throw new RuntimeException('Encryption unavailable'); }
    return base64_encode($nonce . $tag . $encrypted);
}
function wg_decrypt(string $payload, array $config): array {
    $raw = base64_decode($payload, true);
    if ($raw === false || strlen($raw) < 29) { throw new RuntimeException('Encrypted payload invalid'); }
    $plain = openssl_decrypt(substr($raw,28), 'aes-256-gcm', base64_decode($config['encryption_key'], true), OPENSSL_RAW_DATA, substr($raw,0,12), substr($raw,12,16), 'WattGoedkoper-v1');
    if ($plain === false) { throw new RuntimeException('Payload authentication failed'); }
    return json_decode($plain, true, 32, JSON_THROW_ON_ERROR);
}
function wg_event(PDO $db, string $event): void {
    $query=wg_is_mysql($db)
        ? 'INSERT INTO daily_events(`day`,`event`,`count`) VALUES(?,?,1) ON DUPLICATE KEY UPDATE `count`=`count`+1'
        : 'INSERT INTO daily_events(`day`,`event`,`count`) VALUES(?,?,1) ON CONFLICT(`day`,`event`) DO UPDATE SET `count`=`count`+1';
    $q = $db->prepare($query);
    $q->execute([gmdate('Y-m-d'), $event]);
}
function wg_housekeeping(PDO $db, array $config, bool $force = false): array {
    $last = $db->query("SELECT `value` FROM metadata WHERE `key`='last_purge'")->fetchColumn();
    if (!$force && $last && time() - (int)$last < 86400) { return ['leads'=>0]; }
    $q = $db->prepare('DELETE FROM leads WHERE created_at < ?');
    $q->execute([gmdate('Y-m-d\TH:i:s\Z', time() - $config['retention_days'] * 86400)]); $count = $q->rowCount();
    $q = $db->prepare('DELETE FROM rate_limits WHERE window_start < ?'); $q->execute([time() - 172800]);
    $q = $db->prepare('DELETE FROM daily_events WHERE `day` < ?'); $q->execute([gmdate('Y-m-d', time() - 400 * 86400)]);
    $query=wg_is_mysql($db)
        ? "INSERT INTO metadata(`key`,`value`) VALUES('last_purge',?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)"
        : "INSERT INTO metadata(`key`,`value`) VALUES('last_purge',?) ON CONFLICT(`key`) DO UPDATE SET `value`=excluded.`value`";
    $q = $db->prepare($query); $q->execute([(string)time()]);
    return ['leads'=>$count];
}
function wg_validate_lead(array $data): array {
    if (($data['consent'] ?? false) !== true || ($data['consentVersion'] ?? '') !== WG_CONSENT_VERSION) { wg_fail(422, 'CONSENT_REQUIRED', 'Geef expliciet toestemming voor de gekozen adviesaanvraag.'); }
    $key = wg_text($data['idempotencyKey'] ?? '', 'aanvraagcode', 80, true);
    if (!preg_match('/^[A-Za-z0-9_-]{16,80}$/D', $key)) { wg_fail(422, 'VALIDATION', 'De aanvraagcode is ongeldig. Vernieuw de pagina.'); }
    $name = wg_text($data['name'] ?? '', 'naam', 120, true);
    $email = strtolower(wg_text($data['email'] ?? '', 'e-mail', 254));
    $phone = wg_text($data['phone'] ?? '', 'telefoonnummer', 30);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) { wg_fail(422, 'VALIDATION', 'Vul een geldig e-mailadres in.'); }
    if ($phone !== '' && (!preg_match('/^\+?[0-9 ()\-]{8,30}$/D', $phone) || strlen(preg_replace('/[^0-9]/', '', $phone)) < 8 || strlen(preg_replace('/[^0-9]/', '', $phone)) > 15)) { wg_fail(422, 'VALIDATION', 'Vul een geldig telefoonnummer in.'); }
    if ($email === '' && $phone === '') { wg_fail(422, 'VALIDATION', 'Vul je e-mailadres of telefoonnummer in.'); }
    $postcode = strtoupper(str_replace(' ', '', wg_text($data['postcode'] ?? '', 'postcode', 7)));
    if ($postcode !== '' && !preg_match('/^[1-9][0-9]{3}[A-Z]{2}$/D', $postcode)) { wg_fail(422, 'VALIDATION', 'Vul een Nederlandse postcode in, bijvoorbeeld 2311AB.'); }
    // New advice leads have exactly one recipient. Historical partner values are never altered.
    if (isset($data['partner']) && $data['partner'] !== 'nivo') {
        wg_fail(422, 'VALIDATION', 'Nieuwe adviesaanvragen worden alleen door NIVO Groep Holland opgevolgd.');
    }
    $partner = 'nivo';
    $interests = $data['interests'] ?? [];
    if (!is_array($interests) || !array_is_list($interests) || count($interests) > 6) { wg_fail(422, 'VALIDATION', 'Controleer je adviesonderwerpen.'); }
    foreach ($interests as $interest) { if (!in_array($interest, ['solar','battery','heatpump','insulation','contract','planning'], true)) { wg_fail(422, 'VALIDATION', 'Kies een geldig adviesonderwerp.'); } }
    $inputs = $data['inputs'] ?? [];
    if (!is_array($inputs) || (array_is_list($inputs) && $inputs !== []) || count($inputs) > 80) { wg_fail(422, 'VALIDATION', 'De energiescan heeft ongeldige invoer.'); }
    // The browser's calculations are consumer estimates, never a signed quote.
    $allowed = ['homeType','ownership','people','buildPeriod','area','insulation','daytime','usageKnown','electricityUse','gasUse','hasGas','inputMode','gridImport','gridExport','hasSolar','panels','pvProduction','roofAvailable','roofOrientation','roofShade','hasBattery','batteryCapacity','hasHeatPump','hasEv','contractType','electricityPrice','gasPrice','feedInPrice','feedInCost','feedInCostMode','feedInAnnualCost','budget','goal','year','solarInvestment','batteryInvestment','alternativeElectricityPrice','alternativeGasPrice','alternativeFeedInPrice','alternativeFeedInCost','alternativeFixedDifference','insulationInvestment','heatPumpInvestment','alternativeFeedInCostMode','alternativeFeedInAnnualCost'];
    $clean = [];
    foreach ($inputs as $field=>$value) {
        if (!in_array($field, $allowed, true)) { continue; }
        if (is_string($value)) { $clean[$field] = wg_text($value, 'energiescan', 80); }
        elseif (is_bool($value) || $value === null) { $clean[$field] = $value; }
        elseif ((is_int($value) || is_float($value)) && is_finite((float)$value) && abs((float)$value) <= 1000000) { $clean[$field] = $value; }
        else { wg_fail(422, 'VALIDATION', 'De energiescan bevat een ongeldige waarde.'); }
    }
    ksort($clean);
    $summaryInput = $data['summary'] ?? [];
    if (!is_array($summaryInput)) { wg_fail(422, 'VALIDATION', 'De samenvatting is ongeldig.'); }
    $summary = ['modelVersion'=>wg_text($summaryInput['modelVersion'] ?? '', 'modelversie', 60)];
    foreach (['year','annualSavingsLow','annualSavingsHigh','investmentLow','investmentHigh','baselineAnnualCost','plannedAnnualCost'] as $field) {
        $value = $summaryInput[$field] ?? null;
        if ($value !== null && (!is_numeric($value) || !is_finite((float)$value) || abs((float)$value) > 1000000)) { wg_fail(422, 'VALIDATION', 'De samenvatting is ongeldig.'); }
        $summary[$field] = $value === null ? null : (float)$value;
    }
    if ($summary['investmentLow'] !== null && $summary['investmentLow'] < 0 ||
        $summary['investmentHigh'] !== null && $summary['investmentHigh'] < 0) {
        wg_fail(422, 'VALIDATION', 'De investering is ongeldig.');
    }
    $selected=$summaryInput['selectedIds']??[];
    if (!is_array($selected) || !array_is_list($selected) || count($selected)>5) {
        wg_fail(422, 'VALIDATION', 'De maatregelen zijn ongeldig.');
    }
    foreach ($selected as $id) {
        if (!is_string($id) || !in_array($id,['smart-use','solar','battery','insulation','heatpump'],true)) {
            wg_fail(422, 'VALIDATION', 'De maatregelen zijn ongeldig.');
        }
    }
    $summary['selectedIds']=array_values(array_unique($selected));
    return ['idempotencyKey'=>$key, 'name'=>$name, 'email'=>$email, 'phone'=>$phone, 'postcode'=>$postcode, 'partner'=>$partner, 'interests'=>array_values(array_unique($interests)), 'inputs'=>$clean, 'summary'=>$summary, 'note'=>wg_text($data['note'] ?? '', 'toelichting', 1500), 'consent'=>true, 'consentVersion'=>WG_CONSENT_VERSION, 'consentText'=>WG_CONSENT_TEXT, 'analyticsConsent'=>($data['analyticsConsent'] ?? false) === true];
}
function wg_lead_public(array $row, array $config): array {
    $data = wg_decrypt($row['payload'], $config);
    return ['id'=>$row['id'], 'createdAt'=>$row['created_at'], 'updatedAt'=>$row['updated_at'], 'status'=>$row['status'], 'partner'=>$row['partner'], 'data'=>$data];
}
function wg_csv_cell(mixed $value): string {
    $s = (string)$value;
    // Protect CSV viewers against formula execution, including leading whitespace.
    return preg_match('/^[\s]*[=+@\-]/u', $s) ? "'" . $s : $s;
}

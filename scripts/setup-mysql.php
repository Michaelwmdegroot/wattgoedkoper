<?php
declare(strict_types=1);
// One-time Hostinger MySQL setup. Credentials are only read from the interactive terminal.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__).'/lib/bootstrap.php';

function wg_setup_exit(string $message): never { fwrite(STDERR,$message."\n");exit(1); }
function wg_setup_prompt(string $label,bool $secret=false): string {
    fwrite(STDERR,$label.': ');
    if ($secret) { system('stty -echo'); }
    try {
        $value=fgets(STDIN);
    } finally {
        if ($secret) { system('stty echo');fwrite(STDERR,"\n"); }
    }
    if ($value===false) { wg_setup_exit('Invoer ontbreekt. Er is niets gewijzigd.'); }
    return rtrim($value,"\r\n");
}
if (!function_exists('stream_isatty') || !stream_isatty(STDIN)) {
    wg_setup_exit('Start dit script in een interactieve SSH-terminal, niet vanuit een niet-interactieve deploy of cron.');
}
if (!extension_loaded('pdo_mysql') || !extension_loaded('openssl')) {
    wg_setup_exit('De PHP-extensies pdo_mysql en openssl zijn vereist. Controleer de Hostinger PHP-configuratie.');
}
$options=getopt('',['origin:','username:','private-dir:']);
$origin=rtrim((string)($options['origin']??''),'/');
$username=(string)($options['username']??'');
$u=parse_url($origin);
if (!$u || ($u['scheme']??'')!=='https' || ($u['host']??'')!=='wattgoedkoper.nl'
    || isset($u['path']) && $u['path']!=='/' || isset($u['query']) || isset($u['fragment']) || isset($u['user']) || isset($u['pass'])) {
    wg_setup_exit('Gebruik exact --origin=https://wattgoedkoper.nl; de database is alleen voor deze website.');
}
if (!preg_match('/^[A-Za-z0-9_.@-]{3,100}$/D',$username)) {
    wg_setup_exit('Gebruik --username=JOUW_BEHEERNAAM (3–100 veilige tekens).');
}
$root=realpath(dirname(__DIR__));
$private=(string)($options['private-dir']??wg_private_dir());
if (!str_starts_with($private,'/')) { wg_setup_exit('De privémappad moet absoluut zijn.'); }
umask(0077);
if (!is_dir($private) && !mkdir($private,0700,true) && !is_dir($private)) {
    wg_setup_exit('Kan de beveiligde map niet maken.');
}
$private=realpath($private);
if (!$private || !$root || $private===$root || str_starts_with($private,$root.DIRECTORY_SEPARATOR)) {
    wg_setup_exit('De privémappen moeten buiten de documentroot staan.');
}
if (is_file($private.'/config.php')) {
    wg_setup_exit('Er bestaat al een serverconfiguratie. Er is niets overschreven. Controleer eerst de huidige opslag.');
}
fwrite(STDERR,"WattGoedkoper MySQL-installatie. Gebruik uitsluitend de NIEUWE database onder wattgoedkoper.nl.\n");
$dbname=wg_setup_prompt('MySQL databasenaam (kopieer uit Hostinger)');
$dbuser=wg_setup_prompt('MySQL gebruikersnaam (kopieer uit Hostinger)');
if (!preg_match('/^[A-Za-z0-9_]{1,64}$/D',$dbname) || !preg_match('/^[A-Za-z0-9_]{1,64}$/D',$dbuser)) {
    wg_setup_exit('De database- of gebruikersnaam is ongeldig. Er is niets opgeslagen.');
}
$dbpassword=wg_setup_prompt('MySQL wachtwoord (niet in GitHub of chat plaatsen)',true);
if ($dbpassword==='' || strlen($dbpassword)>500) { wg_setup_exit('Ongeldig MySQL-wachtwoord.'); }
$adminpassword=wg_setup_prompt('Nieuw beheerwachtwoord (minimaal 14 tekens)',true);
if (strlen($adminpassword)<14 || strlen($adminpassword)>200) {
    wg_setup_exit('Beheerwachtwoord moet 14–200 tekens bevatten.');
}
$config=[
    'origin'=>$origin, 'admin_username'=>$username,
    'admin_password_hash'=>password_hash($adminpassword,PASSWORD_DEFAULT),
    'encryption_key'=>base64_encode(random_bytes(32)),
    'hmac_key'=>bin2hex(random_bytes(32)), 'retention_days'=>90,
    'database'=>['driver'=>'mysql','host'=>'localhost','name'=>$dbname,'user'=>$dbuser,'password'=>$dbpassword]
];
$dbpassword='';$adminpassword='';
$config['private_dir']=$private;
try {
    $pdo=new PDO('mysql:host=localhost;dbname='.$dbname.';charset=utf8mb4',
        $dbuser,$config['database']['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_TIMEOUT=>8]);
    $existing=$pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    if (count($existing)!==0) {
        wg_setup_exit('Deze database bevat al tabellen. Dit script start alleen met een lege, aparte WattGoedkoper-database.');
    }
    $pdo=null;
    $db=wg_db($config);wg_housekeeping($db,$config,true);$db=null;
} catch (Throwable $ignored) {
    wg_setup_exit('Verbinding of schema-aanmaak mislukt. Controleer de MySQL-instellingen in Hostinger. Er is geen configuratiebestand geschreven.');
}
unset($config['private_dir']);
$contents="<?php\n// PRIVÉ: nooit in documentroot, versiebeheer of back-ups zonder versleuteling plaatsen.\nreturn ".var_export($config,true).";\n";
$handle=@fopen($private.'/config.php','x');
if (!$handle) { wg_setup_exit('Kan de beveiligde configuratie niet aanmaken.'); }
if (fwrite($handle,$contents)!==strlen($contents)) {
    fclose($handle);@unlink($private.'/config.php');
    wg_setup_exit('Kon configuratie niet volledig wegschrijven. Verander niets totdat dit is onderzocht.');
}
fclose($handle);
chmod($private.'/config.php',0600);
fwrite(STDOUT,"MySQL-schema en beheerconfiguratie ingericht. Open /api/index.php?action=health en controleer configured:true.\n");
fwrite(STDOUT,"Open daarna /admin/ en log in met de gekozen beheerdersnaam en het beheerwachtwoord.\n");
if($private!==wg_private_dir()){fwrite(STDOUT,"Stel WG_PRIVATE_DIR in op het privémappad voor alle PHP-webverzoeken en cron.\n");}

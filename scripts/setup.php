<?php
declare(strict_types=1);
if(PHP_SAPI !== 'cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/lib/bootstrap.php';
$options=getopt('', ['origin:','username:','private-dir:']);
$origin=rtrim((string)($options['origin']??''),'/');$username=(string)($options['username']??'');
if($origin===''||$username===''){
    fwrite(STDERR,"Gebruik: php scripts/setup.php --origin=https://wattgoedkoper.nl --username=beheer [--private-dir=/absoluut/privepad]\nHet wachtwoord wordt via standaardinvoer gelezen; zet het nooit in een commandoregel of Git.\n");exit(1);
}
$parts=parse_url($origin);
if(!$parts||!isset($parts['scheme'],$parts['host'])||isset($parts['query'])||isset($parts['fragment'])||isset($parts['user'])||isset($parts['pass'])||(!empty($parts['path'])&&$parts['path']!=='/')||($parts['scheme']!=='https'&&!($parts['scheme']==='http'&&in_array($parts['host'],['localhost','127.0.0.1','::1'],true)))){
    fwrite(STDERR,"Gebruik een HTTPS-origin zonder pad. HTTP is alleen voor localhost toegestaan.\n");exit(1);
}
if(!preg_match('/^[A-Za-z0-9_.@-]{3,100}$/D',$username)){fwrite(STDERR,"Kies een gebruikersnaam van 3–100 letters, cijfers, punt, streepje, @ of underscore.\n");exit(1);}
if(!extension_loaded('pdo_sqlite')||!extension_loaded('openssl')){fwrite(STDERR,"PHP-extensies pdo_sqlite en openssl zijn vereist.\n");exit(1);}
$private=(string)($options['private-dir']??wg_private_dir());
if(!str_starts_with($private,'/')){fwrite(STDERR,"Het privémappad moet absoluut zijn.\n");exit(1);}
umask(0077);
if(!is_dir($private)&&!mkdir($private,0700,true)&&!is_dir($private)){fwrite(STDERR,"De privémappen konden niet worden gemaakt.\n");exit(1);}
$private=realpath($private);$root=realpath(dirname(__DIR__));
if($private===$root||str_starts_with($private,$root.DIRECTORY_SEPARATOR)){fwrite(STDERR,"De privémappen moeten BUITEN de website/documentroot staan.\n");exit(1);}
if(is_file($private.'/config.php')){fwrite(STDERR,"Er bestaat al configuratie. Deze wordt niet overschreven.\n");exit(1);}
fwrite(STDERR,"Beheerwachtwoord (minimaal 14 tekens, maximaal 200): ");
$tty=function_exists('stream_isatty')&&stream_isatty(STDIN);
if($tty){system('stty -echo');}
try{$password=rtrim((string)fgets(STDIN),"\r\n");}finally{if($tty){system('stty echo');fwrite(STDERR,"\n");}}
if(strlen($password)<14||strlen($password)>200){fwrite(STDERR,"Wachtwoordlengte is ongeldig. Er is niets opgeslagen.\n");exit(1);}
$config=['origin'=>$origin,'admin_username'=>$username,'admin_password_hash'=>password_hash($password,PASSWORD_DEFAULT),'encryption_key'=>base64_encode(random_bytes(32)),'hmac_key'=>bin2hex(random_bytes(32)),'retention_days'=>90];
$password='';
$handle=fopen($private.'/config.php','x');
if(!$handle){fwrite(STDERR,"Configuratie kon niet veilig worden aangemaakt.\n");exit(1);}
fwrite($handle,"<?php\n// PRIVATE: never copy this file into the web root or Git.\nreturn ".var_export($config,true).";\n");fclose($handle);chmod($private.'/config.php',0600);
$config['private_dir']=$private;
try{$db=wg_db($config);wg_housekeeping($db,$config,true);}catch(Throwable){fwrite(STDERR,"Configuratie is opgeslagen; database kon niet worden geopend. Controleer maprechten en PHP-extensies.\n");exit(1);}
fwrite(STDOUT,"Configuratie en database aangemaakt buiten de website. Beheer opent op /admin/. Wachtwoord en sleutels zijn niet afgedrukt.\n");
if($private!==wg_private_dir()){fwrite(STDOUT,"Stel WG_PRIVATE_DIR in op het opgegeven privémappad voor de PHP-runtime en onderhoudstaak.\n");}

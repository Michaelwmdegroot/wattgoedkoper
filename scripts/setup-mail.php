<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__).'/lib/bootstrap.php';
$config=wg_config();
if (!$config) { fwrite(STDERR,"Richt eerst het beveiligde dashboard in met scripts/setup.php.\n");exit(1); }
$path=$config['private_dir'].'/mail-config.php';
if (is_file($path)) { fwrite(STDERR,"Er bestaat al een mailconfiguratie. Er is niets gewijzigd.\n");exit(1); }
fwrite(STDERR,"Wachtwoord voor info@wattgoedkoper.nl (alleen hier, niet in Git/chat): ");
$tty=function_exists('stream_isatty')&&stream_isatty(STDIN);
if($tty) { system('stty -echo'); }
try { $password=rtrim((string)fgets(STDIN),"\r\n"); }
finally { if($tty) { system('stty echo');fwrite(STDERR,"\n"); } }
if ($password==='' || strlen($password)>500) { fwrite(STDERR,"Ongeldig wachtwoord; niets opgeslagen.\n");exit(1); }
umask(0077);
$h=@fopen($path,'x');
if (!$h) { fwrite(STDERR,"De veilige mailconfiguratie kon niet worden geschreven.\n");exit(1); }
$contents="<?php\n// PRIVÉ: nooit in de webroot of Git plaatsen.\nreturn ".var_export(['username'=>'info@wattgoedkoper.nl','password'=>$password],true).";\n";
$password='';
if (fwrite($h,$contents)!==strlen($contents)) { fclose($h);@unlink($path);fwrite(STDERR,"Schrijven mislukt.\n");exit(1); }
fclose($h);chmod($path,0600);
fwrite(STDOUT,"Mailgegevens buiten de webroot opgeslagen. Controleer /admin/ > Inbox. Alleen expliciet verzonden e-mails worden verstuurd.\n");

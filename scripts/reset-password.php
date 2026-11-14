<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/lib/bootstrap.php';
$config=wg_config();if(!$config){fwrite(STDERR,"Configuratie ontbreekt.\n");exit(1);}
fwrite(STDERR,"Nieuw beheerwachtwoord (14–200 tekens): ");$tty=function_exists('stream_isatty')&&stream_isatty(STDIN);if($tty){system('stty -echo');}
try{$password=rtrim((string)fgets(STDIN),"\r\n");}finally{if($tty){system('stty echo');fwrite(STDERR,"\n");}}
if(strlen($password)<14||strlen($password)>200){fwrite(STDERR,"Wachtwoordlengte is ongeldig.\n");exit(1);}
$config['admin_password_hash']=password_hash($password,PASSWORD_DEFAULT);$password='';$dir=$config['private_dir'];unset($config['private_dir']);
umask(0077);$tmp=$dir.'/config-'.bin2hex(random_bytes(6)).'.tmp';
if(file_put_contents($tmp,"<?php\n// PRIVATE: never copy this file into the web root or Git.\nreturn ".var_export($config,true).";\n",LOCK_EX)===false||!rename($tmp,$dir.'/config.php')){fwrite(STDERR,"Configuratie kon niet worden vervangen.\n");exit(1);}
chmod($dir.'/config.php',0600);
// Invalidate every existing session on password reset.
foreach(glob($dir.'/sessions/sess_*')?:[] as $file){if(is_file($file)){unlink($file);}}
fwrite(STDOUT,"Wachtwoord gewijzigd en bestaande sessies beëindigd.\n");

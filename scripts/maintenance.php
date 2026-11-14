<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/lib/bootstrap.php';
$config=wg_config();if(!$config){fwrite(STDERR,"Configuratie ontbreekt.\n");exit(1);}
try{$db=wg_db($config);$result=wg_housekeeping($db,$config,true);$db->exec('PRAGMA wal_checkpoint(TRUNCATE)');fwrite(STDOUT,"Bewaartermijn uitgevoerd. Verwijderde aanvragen: ".$result['leads'].".\n");}catch(Throwable){fwrite(STDERR,"Onderhoud mislukt. Controleer de private configuratie.\n");exit(1);}

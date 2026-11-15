<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/lib/bootstrap.php';
require dirname(__DIR__).'/lib/delivery.php';
$config=wg_config();
if(!$config){fwrite(STDERR,"NIVO-worker: private configuratie ontbreekt.\n");exit(1);}
try {
    // No network call without an explicitly enabled and allowlisted NIVO endpoint.
    $db=wg_db($config);
    $result=wg_delivery_process($db,$config,10);
    if($result['disabled']){
        fwrite(STDOUT,"NIVO-aflevering uitgeschakeld. Aanvragen blijven veilig in de wachtrij.\n");
        exit(0);
    }
    fwrite(STDOUT,"NIVO-worker: pogingen ".$result['attempted']
        .", bevestigd ".$result['acknowledged']
        .", opnieuw gepland ".$result['pending']
        .", fouten ".$result['failed'].".\n");
} catch(Throwable) {
    fwrite(STDERR,"NIVO-worker: verwerking mislukt. Controleer beheerstatus en private configuratie.\n");
    exit(1);
}

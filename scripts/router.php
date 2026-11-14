<?php
declare(strict_types=1);
// Development-only router. Production uses the root .htaccess.
$root=dirname(__DIR__);$path=rawurldecode((string)(parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)??'/'));
if(preg_match('~(?:^|/)\.|^/(?:lib|scripts|tests|docs)(?:/|$)|^/(?:AGENTS\.md|README\.md|package(?:-lock)?\.json)~i',$path)||str_contains($path,"\0")||str_contains($path,'..')){http_response_code(404);exit('Not found');}
if($path==='/api'||$path==='/api/') {require $root.'/api/index.php';return true;}
if($path==='/admin'||$path==='/admin/'){readfile($root.'/admin/index.html');return true;}
if($path==='/'){readfile($root.'/index.html');return true;}
$file=realpath($root.$path);if($file&&str_starts_with($file,$root.DIRECTORY_SEPARATOR)){
  if(is_dir($file)&&is_file($file.'/index.html')){header('Content-Type: text/html; charset=utf-8');readfile($file.'/index.html');return true;}
  if(is_file($file)){return false;}
}
http_response_code(404);echo 'Niet gevonden';return true;

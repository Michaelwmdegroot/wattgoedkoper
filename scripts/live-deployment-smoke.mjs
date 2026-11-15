#!/usr/bin/env node
/**
 * Read-only Hostinger deployment smoke: compares public live assets and backend
 * fingerprint with THIS checkout. Never logs, sends or fetches personal data.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const FILES=['api/index.php','lib/bootstrap.php','lib/delivery.php','lib/operations.php','lib/mail.php','lib/report.php'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function localFingerprint(){
  const hashes=[];
  for(const file of FILES)hashes.push(sha(await readFile(resolve(ROOT,file))));
  return sha(hashes.join('\n'));
}
async function resultPath(){
  const folder=resolve(ROOT,'visual-review-output');
  await mkdir(folder,{recursive:true});
  return resolve(folder,'live-deployment-smoke.json');
}
async function liveCheck(origin,expected){
  const records=[];
  const stamp=process.env.GITHUB_SHA?.slice(0,12)||'manual';
  function endpoint(path){
    const url=new URL(path,origin);
    url.searchParams.set('wg_probe',stamp);
    return url.href;
  }
  async function request(path){
    const response=await fetch(endpoint(path),{
      method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),
      headers:{'Cache-Control':'no-cache','User-Agent':'WattGoedkoper-deploy-smoke/1.0'}
    });
    return response;
  }
  async function check(label,path,expectedStatus,verify=async()=>{}){
    const response=await request(path);
    if(!expectedStatus.includes(response.status))throw new Error(label+': HTTP '+response.status+', verwacht '+expectedStatus.join('/'));
    await verify(response);
    records.push({check:label,status:'pass',http:response.status});
  }
  for(const [path,label] of [
    ['/','homepage'],['/privacy.html','privacy'],['/admin/','admin-login'],
    ['/kennis/','knowledge-hub'],['/kennis/isolatie-of-hybride-warmtepomp/','knowledge-new'],
    ['/sitemap.xml','sitemap'],['/robots.txt','robots']
  ]){
    await check(label,path,[200]);
  }
  await check('static-front-end','/assets/app.mjs',[200],async response=>{
    const live=sha(Buffer.from(await response.arrayBuffer()));
    const expectedFile=sha(await readFile(resolve(ROOT,'assets/app.mjs')));
    if(live!==expectedFile)throw new Error('Frontend hash differs from current main; stale build or cache');
  });
  await check('api-and-backend','/api/index.php?action=health',[200],async response=>{
    const cc=response.headers.get('cache-control')||'';
    if(!cc.includes('no-store'))throw new Error('API missing no-store');
    if((response.headers.get('x-content-type-options')||'').toLowerCase()!=='nosniff')throw new Error('API missing nosniff');
    const health=await response.json();
    if(health.ok!==true||health.configured!==true||health.databaseReady!==true)
      throw new Error('Backend not configured or database unavailable');
    if(health.releaseFingerprint!==expected)
      throw new Error('Backend fingerprint differs from current main; Hostinger backend release not proven');
    if(typeof health.version!=='string')throw new Error('Backend lacks version field');
  });
  for(const path of ['/lib/bootstrap.php','/scripts/operations.php','/docs/NIVO-DELIVERY-CONTRACT-V1.md','/.git/config',
    '/wg-denied-test.wgbk','/wg-denied-test.cnf']){
    await check('private-denied '+path,path,[403,404]);
  }
  const redirects=await request('http://www.wattgoedkoper.nl/').catch(()=>null);
  // Some CDN stacks refuse plain HTTP tests. Canonical checks remain a
  // distinct signal, not an excuse to weaken HTTPS checks above.
  if(redirects){records.push({check:'optional-www-check',status:redirects.status>=300&&redirects.status<400?'pass':'review',http:redirects.status});}
  return records;
}
async function run(){
  const expected=await localFingerprint();
  if(process.argv.includes('--self-test')){
    if(!/^[a-f0-9]{64}$/.test(expected))throw new Error('Invalid offline fingerprint');
    console.log('Offline fingerprint format: OK');
    return;
  }
  const origin=process.env.WG_LIVE_ORIGIN||'https://wattgoedkoper.nl';
  const parsed=new URL(origin);
  if(parsed.protocol!=='https:'||parsed.hostname!=='wattgoedkoper.nl'||parsed.port||parsed.pathname!=='/')
    throw new Error('Only canonical WattGoedkoper HTTPS origin is allowed');
  const report={timeUtc:new Date().toISOString(),origin,releaseFingerprint:expected,status:'unverified',attempts:0,checks:[]};
  const output=await resultPath();
  try{
    for(let attempt=1;attempt<=6;attempt++){
      report.attempts=attempt;
      try{
        report.checks=await liveCheck(origin,expected);
        report.status='pass';break;
      }catch(error){
        report.status='failed';
        // Never print remote response bodies, tokens, or personal information.
        report.failure=String(error?.message||'Live check unavailable').slice(0,220);
        if(attempt<6)await new Promise(resolve=>setTimeout(resolve,15000));
      }
    }
  }finally{
    await writeFile(output,JSON.stringify(report,null,2)+'\n');
  }
  if(report.status!=='pass')throw new Error('Hostinger smoke failed: '+report.failure);
  console.log('Live Hostinger frontend/backend parity, health and private guards: '+report.checks.length+' checks passed');
}
run().catch(error=>{console.error(String(error.message||error));process.exitCode=1;});

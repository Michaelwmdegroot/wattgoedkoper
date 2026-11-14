/* Real-browser review for the module app and its generated offline counterpart.
 * This script runs only in development/CI. It never submits an advice request.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {pathToFileURL}=require('node:url');

const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'visual-review-output');
const report={startedAt:new Date().toISOString(),browser:'Chromium / Playwright 1.56.1',checks:[],cases:[],errors:[],screenshots:[]};
const MIME={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.json':'application/json'};
let browser,server,base;
async function record(name,fn){try{await fn();report.checks.push({name,status:'pass'});}catch(error){report.checks.push({name,status:'fail',message:error.message});throw error;}}
async function imagesReady(page){
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all([...document.images].map(async image=>{image.loading='eager';try{await image.decode();}catch{}}));
 });
}
async function capture(page,name,fullPage=true){
 await imagesReady(page);
 await page.screenshot({path:path.join(OUT,name+'.png'),fullPage,animations:'disabled',timeout:25000});
 report.screenshots.push(name+'.png');
}
async function pageHealth(page,name){
 await record(name+' / no horizontal document overflow',async()=>{
  const dimensions=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert.ok(dimensions.document<=dimensions.width+1,JSON.stringify(dimensions));
 });
 await record(name+' / every loaded image has pixels',async()=>{
  await imagesReady(page);
  const broken=await page.evaluate(()=>[...document.images].filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src.slice(0,160)));
  assert.deepEqual(broken,[]);
 });
}
async function openHome(page,url){
 await page.goto(url,{waitUntil:'load'});
 await page.waitForSelector('.photo-scene');
 await imagesReady(page);
}
async function interactionGeometry(page,label){
 if(page.viewportSize().width<=620){
  await record(label+' / mobile result is a compact bottom bar',async()=>{
   const box=await page.locator('#mobile-result').evaluate(el=>{
    const rect=el.getBoundingClientRect();
    return {top:rect.top,bottom:rect.bottom,height:rect.height,viewport:innerHeight,position:getComputedStyle(el).position};
   });
   assert.ok(box.height>0&&box.height<100,JSON.stringify(box));
   assert.ok(Math.abs(box.bottom-box.viewport)<=1&&box.top>=box.viewport-100,JSON.stringify(box));
   assert.equal(box.position,'fixed',JSON.stringify(box));
  });
 }
 for(const id of ['solar','insulation','battery','heatpump']){
  await record(label+' / '+id+' hotspot is not covered',async()=>{
   const hotspot=page.locator('[data-house-action="'+id+'"]');
   await hotspot.scrollIntoViewIfNeeded();
   const hit=await hotspot.evaluate(el=>{
    const rect=el.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const target=document.elementFromPoint(x,y);
    return {reachable:!!target&&(el===target||el.contains(target)),x,y,width:rect.width,height:rect.height,cover:target?.outerHTML.slice(0,220)};
   });
   assert.ok(hit.width>0&&hit.height>0&&hit.reachable,JSON.stringify(hit));
  });
 }
 await page.evaluate(()=>scrollTo(0,0));
}
async function clickUpgrade(page,id){await page.locator(`#upgrade-dock button[data-upgrade="${id}"]`).click();}
async function pressed(page,id,value){assert.equal(await page.locator(`#upgrade-dock button[data-upgrade="${id}"]`).getAttribute('aria-pressed'),String(value));}
async function equipment(page,id,present){assert.equal(await page.locator(`[data-equipment="${id}"]`).evaluate(el=>el.classList.contains('is-visible')),present);}
async function closeDialog(page){if(await page.locator('#tool-dialog').evaluate(el=>el.open))await page.locator('#dialog-close').click();}
async function scenario(page,label){
 await record(label+' / panels and battery add/remove',async()=>{
  await clickUpgrade(page,'solar');await pressed(page,'solar',true);await equipment(page,'solar',true);
  const solar=await page.locator('[data-saving]').getAttribute('data-saving');
  await clickUpgrade(page,'battery');await pressed(page,'battery',true);await equipment(page,'battery',true);
  await clickUpgrade(page,'battery');await pressed(page,'battery',false);await equipment(page,'battery',false);
  assert.equal(await page.locator('[data-saving]').getAttribute('data-saving'),solar);
 });
 await record(label+' / current view separates selected upgrades',async()=>{
  await page.locator('[data-view="current"]').click();await equipment(page,'solar',false);
  assert.equal(await page.locator('[data-house-action="solar"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('[data-house-action="solar"]').getAttribute('aria-label'),/verwijderen/);
  await page.locator('[data-view="plan"]').click();await equipment(page,'solar',true);
 });
 await record(label+' / native keyboard hotspot controls',async()=>{
  await page.locator('[data-house-action="solar"]').focus();await page.keyboard.press('Enter');await pressed(page,'solar',false);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.houseAction),'solar');
  await page.keyboard.press('Space');await pressed(page,'solar',true);
 });
 await record(label+' / house type, details and household controls',async()=>{
  await page.locator('[data-field="homeType"][data-value="detached"]').click();
  assert.equal(await page.locator('.photo-scene').getAttribute('data-home-type'),'detached');
  await equipment(page,'solar',true);
  await page.locator('#home-more>summary').click();
  await page.locator('[data-toggle="hasEv"]').click();
  assert.equal(await page.locator('#home-more').evaluate(el=>el.open),true);
  assert.equal(await page.locator('[data-toggle="hasEv"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-step="1"]').click();
  assert.equal((await page.locator('.people-count').innerText()).trim(),'4');
  await page.locator('[data-dialog="house"]').click();await page.locator('#input-area').fill('142');
  await page.locator('#settings-form button[type="submit"]').click();
  assert.match(await page.locator('[data-dialog="house"]').innerText(),/142 m²/);
  assert.equal(await page.locator('#home-more').evaluate(el=>el.open),true);
  await page.locator('#home-more>summary').click();
 });
 await record(label+' / illustrative day-night keeps yearly calculation stable',async()=>{
  const saving=await page.locator('[data-saving]').getAttribute('data-saving');
  await page.locator('#day-control').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('.photo-scene').evaluate(el=>el.classList.contains('is-evening')),true);
  assert.equal(await page.locator('[data-saving]').getAttribute('data-saving'),saving);
  await page.keyboard.press('End');
  assert.equal(await page.locator('.photo-scene').evaluate(el=>el.classList.contains('is-evening')),false);
  assert.equal(await page.locator('[data-saving]').getAttribute('data-saving'),saving);
 });
 await record(label+' / tabs support arrow/Home keyboard navigation',async()=>{
  await page.locator('#tab-home').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-energy').getAttribute('aria-selected'),'true');
  await page.keyboard.press('End');assert.equal(await page.locator('#tab-budget').getAttribute('aria-selected'),'true');
  await page.keyboard.press('Home');assert.equal(await page.locator('#tab-home').getAttribute('aria-selected'),'true');
 });
 await clickUpgrade(page,'smart-use');
 await page.evaluate(()=>scrollTo(0,0));
 await capture(page,label+'-plan');
 await page.locator('#open-plan').click();
 await capture(page,label+'-plan-dialog',false);
 await record(label+' / plan save/reset/restore',async()=>{
  await page.locator('[data-save]').click();await closeDialog(page);
  await page.locator('#reset-home').click();await pressed(page,'solar',false);
  await page.locator('[data-restore]').click();await pressed(page,'solar',true);await pressed(page,'smart-use',true);
  assert.equal(await page.locator('.photo-scene').getAttribute('data-home-type'),'detached');
  assert.equal((await page.locator('.people-count').innerText()).trim(),'4');
 });
 await pageHealth(page,label+' after interactions');
}
async function sceneVariants(page){
 // Existing equipment remains meaningful for all five dwelling types,
 // including an apartment, without bypassing upgrade eligibility rules.
 await page.locator('#tab-home').click();
 if(!await page.locator('#home-more').evaluate(el=>el.open))await page.locator('#home-more>summary').click();
 for(const field of ['hasSolar','hasHeatPump','hasBattery']){
  const toggle=page.locator('[data-toggle="'+field+'"]');
  if(await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();
 }
 await page.locator('#home-more>summary').click();
 for(const type of ['terraced','corner','semi','detached','apartment']){
  await page.locator('[data-field="homeType"][data-value="'+type+'"]').click();
  await imagesReady(page);
  const name='house-'+type+'-equipment.png';
  await page.locator('.house-scene').screenshot({path:path.join(OUT,name),animations:'disabled'});
  report.screenshots.push(name);
  await record('house '+type+' / base and all equipment layers loaded and visible',async()=>{
   const layers=await page.locator('.photo-scene img').evaluateAll(images=>images.map(img=>({
    name:img.dataset.equipment||'base',loaded:img.complete&&img.naturalWidth>0,
    opacity:Number(getComputedStyle(img).opacity),mask:getComputedStyle(img).maskImage
   })));
   assert.equal(layers.length,4);
   assert.ok(layers.every(layer=>layer.loaded&&layer.opacity===1),JSON.stringify(layers));
   assert.ok(layers.filter(layer=>layer.name!=='base').every(layer=>layer.mask!=='none'),JSON.stringify(layers));
  });
  await interactionGeometry(page,'house '+type);
 }
}
async function runCase(name,viewport,task,{standalone=false}={}){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(12000);
 const pageErrors=[],consoleErrors=[],network=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 page.on('request',request=>{if(/^https?:/.test(request.url()))network.push(request.url());});
 const entry={name,viewport,status:'running',pageErrors,consoleErrors};report.cases.push(entry);
 try{
  await task(page);
  await record(name+' / no JavaScript exceptions',async()=>assert.deepEqual(pageErrors,[]));
  await record(name+' / no browser console errors',async()=>assert.deepEqual(consoleErrors,[]));
  if(standalone)await record(name+' / standalone makes no network requests',async()=>assert.deepEqual(network,[]));
  entry.status='pass';
 }catch(error){
  entry.status='fail';entry.failure=error.message;report.errors.push({case:name,message:error.message,stack:error.stack});
  try{await capture(page,name+'-failure',false);}catch(captureError){entry.captureError=captureError.message;}
 }finally{await context.close();await fs.writeFile(path.join(OUT,'checks.json'),JSON.stringify(report,null,2)+'\n');}
}
async function tabletWarnings(page){
 await openHome(page,base);await capture(page,'tablet-top',false);await capture(page,'tablet-initial');
 await interactionGeometry(page,'tablet initial');await pageHealth(page,'tablet initial');
 await page.locator('#home-more>summary').click();await page.locator('[data-toggle="hasSolar"]').click();
 await page.locator('[data-field="year"][data-value="2026"]').click();
 await page.locator('#tab-energy').click();await page.locator('[data-dialog="tariffs"]').click();
 await page.locator('#input-feedInCostMode').selectOption('per-kwh');
 await page.locator('#input-feedInCost').fill('0');await page.locator('#settings-form button[type="submit"]').click();
 await page.locator('#tab-budget').click();await page.locator('#control-budget').focus();await page.keyboard.press('Home');
 await clickUpgrade(page,'battery');
 await page.locator('.result-warnings').scrollIntoViewIfNeeded();await capture(page,'tablet-two-warnings',false);
 await record('tablet / negative and over-budget warnings remain separate',async()=>{
  const warnings=page.locator('#live-results .result-warning');assert.equal(await warnings.count(),2);
  const first=await warnings.nth(0).boundingBox(),second=await warnings.nth(1).boundingBox();
  assert.ok(first&&second);assert.ok(second.y>=first.y+first.height-1,JSON.stringify({first,second}));
 });
 await pageHealth(page,'tablet warnings');
}
async function desktopArticles(page){
 await openHome(page,base);await page.locator('.story-card').first().click();
 await page.waitForURL('**/kennis/zonnepanelen/');await capture(page,'knowledge-solar');await pageHealth(page,'knowledge solar');
 await page.goto(base+'rekenmodel.html');await capture(page,'rekenmodel');await pageHealth(page,'rekenmodel');
 await record('editorial / contents link resolves',async()=>{
  const link=page.locator('.article-contents a').nth(1);const href=await link.getAttribute('href');
  await link.click();assert.equal(await page.locator('[id="'+href.slice(1)+'"]').count(),1);
 });
}
async function standaloneArticles(page,label="standalone"){
 await page.locator('a[href="/rekenmodel.html"]:visible').first().click();
 await page.waitForSelector('.preview-article[open]');await capture(page,label+'-rekenmodel',false);
 await record('standalone / article modal and contents links work',async()=>{
  assert.equal(await page.locator('.preview-article h1').count(),1);
  const link=page.locator('.preview-article .article-contents a').nth(1);const href=await link.getAttribute('href');
  await link.click();assert.equal(await page.locator('.preview-article [id="'+href.slice(1)+'"]').count(),1);
  const dim=await page.locator('.preview-article').evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));
  assert.ok(dim.scroll<=dim.width+1,JSON.stringify(dim));
 });
 await page.locator('.preview-back').click();
 await page.locator('.story-card').first().click();await page.waitForSelector('.preview-article[open]');
 assert.match(await page.locator('.preview-article h1').innerText(),/Zonnepanelen/);
 await imagesReady(page);await page.locator('.preview-back').click();
}
(async()=>{
 await fs.mkdir(OUT,{recursive:true});
 server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');let filename=decodeURIComponent(url.pathname);
   if(filename.endsWith('/'))filename+='index.html';
   const target=path.resolve(ROOT,'.'+filename);
   if(!target.startsWith(ROOT+path.sep)||target.endsWith('.php')){res.writeHead(403);res.end();return;}
   const bytes=await fs.readFile(target);res.writeHead(200,{'Content-Type':MIME[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 base=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({headless:true});
 await runCase('desktop-module',{width:1440,height:1000},async page=>{
  await openHome(page,base);await capture(page,'desktop-top',false);await capture(page,'desktop-initial');
  await interactionGeometry(page,'desktop initial');await pageHealth(page,'desktop initial');
  await scenario(page,'desktop');await sceneVariants(page);
 });
 await runCase('tablet-module',{width:900,height:1000},tabletWarnings);
 await runCase('mobile-module',{width:390,height:844},async page=>{
  await openHome(page,base);await capture(page,'mobile-top',false);await capture(page,'mobile-fullpage');
  await interactionGeometry(page,'mobile initial');await pageHealth(page,'mobile initial');
  await scenario(page,'mobile');
  await page.locator('#maatregelen').scrollIntoViewIfNeeded();await capture(page,'mobile-upgrades',false);
 });
 await runCase('small-mobile-module',{width:320,height:812},async page=>{
  await openHome(page,base);await capture(page,'small-mobile-top',false);await capture(page,'small-mobile-fullpage');
  await interactionGeometry(page,'small mobile initial');await pageHealth(page,'small mobile initial');
  await clickUpgrade(page,'solar');await clickUpgrade(page,'battery');await pageHealth(page,'small mobile plan');
 });
 await runCase('desktop-editorial',{width:1440,height:1000},desktopArticles);
 await runCase('mobile-editorial',{width:390,height:844},async page=>{
  await page.goto(base+'kennis/thuisbatterij/');await capture(page,'mobile-knowledge',false);await pageHealth(page,'mobile knowledge');
  await page.goto(base+'rekenmodel.html');await capture(page,'mobile-rekenmodel',false);await pageHealth(page,'mobile rekenmodel');
 });
 const file=pathToFileURL(path.join(ROOT,'preview/wattgoedkoper-preview.html')).href;
 await runCase('desktop-standalone',{width:1440,height:1000},async page=>{
  await openHome(page,file);await capture(page,'standalone-top',false);await capture(page,'standalone-initial');
  await interactionGeometry(page,'standalone initial');await pageHealth(page,'standalone initial');
  await scenario(page,'standalone');await standaloneArticles(page);
 },{standalone:true});
 await runCase('mobile-standalone',{width:390,height:844},async page=>{
  await openHome(page,file);await capture(page,'mobile-standalone',false);
  await interactionGeometry(page,'mobile standalone');await pageHealth(page,'mobile standalone');
  await clickUpgrade(page,'solar');await clickUpgrade(page,'battery');await equipment(page,'battery',true);
  await standaloneArticles(page,'mobile-standalone');
 },{standalone:true});
})().catch(error=>{report.errors.push({case:'runner',message:error.message,stack:error.stack});process.exitCode=1;}).finally(async()=>{
 report.finishedAt=new Date().toISOString();
 report.summary={passed:report.checks.filter(x=>x.status==='pass').length,failed:report.checks.filter(x=>x.status==='fail').length,casesPassed:report.cases.filter(x=>x.status==='pass').length,casesFailed:report.cases.filter(x=>x.status==='fail').length,screenshots:report.screenshots.length};
 if(report.errors.length)process.exitCode=1;
 await fs.mkdir(OUT,{recursive:true});await fs.writeFile(path.join(OUT,'checks.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({summary:report.summary,errors:report.errors.map(({case:name,message})=>({case:name,message}))},null,2));
 if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
});

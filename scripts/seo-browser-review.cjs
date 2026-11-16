/* Real public static journeys: content -> explanation -> opt-in Plan Studio.
   Uses only generated fixtures. No real lead, API, email or analytics write. */
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'visual-review-output');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.json':'application/json','.ico':'image/x-icon'};
let browser,server;
const report={checks:[],screenshots:[],errors:[]};
async function check(name,work){try{await work();report.checks.push({name,status:'pass'});}catch(e){report.checks.push({name,status:'fail',message:e.message});throw e;}}
async function screenshot(page,name){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}))});await page.screenshot({path:path.join(OUT,name+'.png'),animations:'disabled',fullPage:true});report.screenshots.push(name+'.png')}
async function open(page,base,url){await page.goto(base+url,{waitUntil:'load'});await page.locator('#article-title').waitFor();}
function serverStart(){return new Promise(resolve=>{
 server=http.createServer(async(req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400).end();return}
  let p;try{p=decodeURIComponent(url.pathname)}catch{res.writeHead(400).end();return}
  if(p.includes('..')||/^\/(?:api|admin|docs|lib|scripts|tests|preview)\b/.test(p)){res.writeHead(404).end();return}
  p=p==='/'?'/index.html':p.endsWith('/')?p+'index.html':p;
  const filename=path.resolve(ROOT,'.'+p);
  if(!filename.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
  try{const bytes=await fs.readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(bytes)}
  catch{res.writeHead(404).end('Not found')}
 });server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port));
})}
(async()=>{
 await fs.mkdir(OUT,{recursive:true});
 const base=await serverStart();browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1366,height:768},{width:390,height:844},{width:320,height:700}]){
   const page=await browser.newPage({viewport,deviceScaleFactor:1});
   const name=String(viewport.width);
   for(const route of ['/kennis/','/kennis/zonnepanelen/zelfverbruik/','/kennis/thuisbatterij/wanneer-zinvol/','/kennis/zonnepanelen-met-thuisbatterij/','/kennis/isolatie-of-hybride-warmtepomp/','/kennis/hybride-warmtepomp/geschiktheid/','/kennis/energiecontract/met-zonnepanelen/']){
    await open(page,base,route);
    await check(name+' '+route+' content and width',async()=>{
       assert.ok((await page.locator('#article-title').innerText()).length>8);
       const d=await page.evaluate(()=>({document:document.documentElement.scrollWidth,width:window.innerWidth}));
       assert.ok(d.document<=d.width+2,JSON.stringify({route,...d}));
    });
    if(route==='/kennis/')await screenshot(page,'seo-hub-'+name);
    if(route==='/kennis/isolatie-of-hybride-warmtepomp/')await screenshot(page,'seo-isolatie-eerst-'+name);
    if(route==='/kennis/hybride-warmtepomp/geschiktheid/')await screenshot(page,'seo-hybride-geschikt-'+name);
    if(route==='/kennis/energiecontract/met-zonnepanelen/')await screenshot(page,'seo-contract-zonnepanelen-'+name);
    if(route==='/kennis/zonnepanelen-met-thuisbatterij/'){
      await page.locator('.example-result').first().waitFor();
      await check(name+' comparison recalculation',async()=>{
        assert.equal(await page.locator('.example-result').count(),3);
        const baseline=await page.locator('[data-example-context]').innerText();
        await page.locator('[data-example-year]').selectOption('2026');
        await page.locator('[data-example-panels]').evaluate(input=>{input.value='14';input.dispatchEvent(new Event('input',{bubbles:true}));});
        assert.equal(await page.locator('[data-example-panel-label]').innerText(),'14');
        assert.notEqual(await page.locator('[data-example-context]').innerText(),baseline);
      });
      await screenshot(page,'seo-compare-'+name);
    }
   }
   await open(page,base,'/kennis/hybride-warmtepomp/geschiktheid/');
   await page.locator('.article-body .guide-primary-action').click();
   await check(name+' hybrid context entry is explanatory only',async()=>{
     await page.locator('#tool-dialog[open]').waitFor();
     assert.equal(await page.locator('#upgrade-dock [data-upgrade="heatpump"]').getAttribute('aria-pressed'),'false');
   });
   await open(page,base,'/kennis/zonnepanelen/');
   await page.locator('.article-body .guide-primary-action').click();
   await check(name+' content entry explains without selecting',async()=>{
     await page.locator('#tool-dialog[open]').waitFor();
     assert.equal(await page.locator('#upgrade-dock [data-upgrade="solar"]').getAttribute('aria-pressed'),'false');
     assert.ok((await page.locator('#dialog-content').innerText()).includes('Je gebruikt een deel direct'));
   });
   await screenshot(page,'seo-solar-entry-'+name);
   // A report email links to /#advies; this must work both after a hash
   // change in an existing tab and when opened on another device.
   await page.goto(base+'/#verken-energieplan',{waitUntil:'load'});
   await page.locator('#tool-dialog[open]').waitFor();
   await page.evaluate(()=>{location.hash='#advies';});
   await check(name+' report CTA opens opt-in on fragment change',async()=>{
     await page.locator('#advice-form').waitFor();
     assert.equal(await page.locator('#advice-form input[name="consent"]').isChecked(),false);
     assert.ok((await page.locator('#tool-dialog .dialog-intro').innerText()).includes('niet automatisch'));
   });
   await screenshot(page,'seo-report-advice-'+name);
   await page.goto(base+'/#advies',{waitUntil:'load'});
   await check(name+' report CTA opens opt-in on fresh navigation',async()=>{
     await page.locator('#advice-form').waitFor();
     assert.equal(await page.locator('#advice-form input[name="consent"]').isChecked(),false);
   });
   await page.close();
 }
 // Fully synthetic accepted report: exact consumer transition without an email,
 // lead, analytics event, or any write to production.
 for(const viewport of [{width:1366,height:768},{width:390,height:844},{width:320,height:700}]){
   const page=await browser.newPage({viewport});
   const actions=[];
   await page.route('**/api/index.php?action=*',async route=>{
     const action=new URL(route.request().url()).searchParams.get('action');
     actions.push(action);
     if(action==='session')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,configured:true,csrf:'synthetic-csrf',createdAt:0,reportMailEnabled:true})});
     if(action==='report_email')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,accepted:true,replayed:false})});
     throw Error('Unexpected route during report-only QA: '+action);
   });
   await page.goto(base+'/',{waitUntil:'load'});
   await page.locator('#open-plan').click();
   await page.locator('#report-email').fill('persoon@example.test');
   await page.locator('#report-send').click();
   await page.locator('#report-success').waitFor();
   await check(viewport.width+' accepted report replaces input and submit',async()=>{
     assert.equal(await page.locator('#report-email').count(),0);
     assert.equal(await page.locator('#report-send').count(),0);
     assert.match(await page.locator('#report-success').innerText(),/Je rapport is verstuurd/);
     assert.equal(actions.filter(x=>x==='report_email').length,1);
     assert.ok(!actions.some(x=>['leads','events'].includes(x)));
   });
   await screenshot(page,'seo-report-success-'+viewport.width);
   await page.locator('#dialog-close').click();
   await page.locator('#open-plan').click();
   await check(viewport.width+' reopening keeps sent status without new mail',async()=>{
     await page.locator('#report-success').waitFor();
     assert.equal(actions.filter(x=>x==='report_email').length,1);
   });
   await page.locator('[data-report-reset]').click();
   await check(viewport.width+' changing address is explicit',async()=>{
     await page.locator('#report-email').waitFor();
     assert.equal(actions.filter(x=>x==='report_email').length,1);
   });
   await page.close();
 }
 // A standalone offline preview must also show working interactive editorial content.
 const offline=await browser.newPage({viewport:{width:1366,height:768}});
 const outbound=[];
 offline.on('request',request=>{if(!request.url().startsWith('file:')&&!request.url().startsWith('data:'))outbound.push(request.url());});
 await offline.goto(pathToFileURL(path.join(ROOT,'preview/wattgoedkoper-preview.html')).href,{waitUntil:'load'});
 await offline.locator('.header-nav a[href="/kennis/"]').click();
 await offline.locator('.preview-article[open]').waitFor();
 await offline.locator('.preview-article a[href="/kennis/zonnepanelen-met-thuisbatterij/"]').first().click();
 await offline.locator('.preview-article .example-result').first().waitFor();
 await check('offline preview recalculates without any external requests',async()=>{
   assert.equal(await offline.locator('.preview-article .example-result').count(),3);
   await offline.locator('.preview-article [data-example-year]').selectOption('2026');
   assert.ok((await offline.locator('.preview-article [data-example-context]').innerText()).includes('2026'));
   assert.deepEqual(outbound,[]);
 });
 await screenshot(offline,'seo-offline-preview');
 await offline.close();
 const privacy=await browser.newPage();
 await privacy.goto(base+'/#verken-zonnepanelen%00');
 await check('unknown fragment has no effect',async()=>{
   assert.equal(await privacy.locator('#tool-dialog[open]').count(),0);
   assert.equal(await privacy.locator('#upgrade-dock [data-upgrade="solar"]').getAttribute('aria-pressed'),'false');
 });
 await privacy.close();
 console.log('SEO browser review passed: '+report.checks.length+' checks, '+report.screenshots.length+' screenshots');
})().catch(e=>{report.errors.push(String(e));console.error(e);process.exitCode=1}).finally(async()=>{
 await fs.mkdir(OUT,{recursive:true});await fs.writeFile(path.join(OUT,'seo-browser-report.json'),JSON.stringify(report,null,2));
 await browser?.close();await new Promise(resolve=>server?.close(resolve)??resolve());
});

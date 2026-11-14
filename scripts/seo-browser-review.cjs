/* Real public static journeys: content -> explanation -> opt-in Plan Studio.
   Uses only generated fixtures. No real lead, API, email or analytics write. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'visual-review-output');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff':'font/woff','.json':'application/json','.ico':'image/x-icon'};
let browser,server;
const report={checks:[],screenshots:[],errors:[]};
async function check(name,work){try{await work();report.checks.push({name,status:'pass'});}catch(e){report.checks.push({name,status:'fail',message:e.message});throw e;}}
async function screenshot(page,name){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))});await page.screenshot({path:path.join(OUT,name+'.png'),animations:'disabled',fullPage:true});report.screenshots.push(name+'.png')}
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
   for(const route of ['/kennis/','/kennis/zonnepanelen/zelfverbruik/','/kennis/thuisbatterij/wanneer-zinvol/','/kennis/zonnepanelen-met-thuisbatterij/']){
    await open(page,base,route);
    await check(name+' '+route+' content and width',async()=>{
       assert.ok((await page.locator('#article-title').innerText()).length>8);
       const d=await page.evaluate(()=>({document:document.documentElement.scrollWidth,width:window.innerWidth}));
       assert.ok(d.document<=d.width+2,JSON.stringify({route,...d}));
    });
    if(route==='/kennis/')await screenshot(page,'seo-hub-'+name);
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
   await open(page,base,'/kennis/zonnepanelen/');
   await page.locator('.article-body .guide-primary-action').click();
   await check(name+' content entry explains without selecting',async()=>{
     await page.locator('#tool-dialog[open]').waitFor();
     assert.equal(await page.locator('#upgrade-dock [data-upgrade="solar"]').getAttribute('aria-pressed'),'false');
     assert.ok((await page.locator('#dialog-content').innerText()).includes('Je gebruikt een deel direct'));
   });
   await screenshot(page,'seo-solar-entry-'+name);
   await page.close();
 }
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

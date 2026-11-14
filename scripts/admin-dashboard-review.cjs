/* Dashboard 2.0 review. Ephemeral in-memory API fixtures; no real leads, mail or network transfers. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..'),out=path.join(root,'visual-review-output');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff':'font/woff','.xml':'application/xml','.txt':'text/plain'};
const lead={
  id:'WG-ABCDEF123456',createdAt:'2026-11-14T12:00:00Z',updatedAt:'2026-11-14T12:00:00Z',status:'new',partner:'nivo',delivery:{status:'pending',attempts:0,nextAttemptAt:'2026-11-14T12:00:00Z',reference:null,errorCode:null},
  data:{name:'Voorbeeld Gebruiker',email:'voorbeeld@example.test',phone:'',postcode:'2311AB',
    interests:['battery'],summary:{year:2027,modelVersion:'test-model',annualSavingsLow:100,annualSavingsHigh:250},
    inputs:{electricityUse:3500},consentVersion:'2026-11-v2',consentText:'Synthetische toestemming voor NIVO Groep Holland',acceptedAt:'2026-11-14T12:00:00Z'}
};
const stats={ok:true,leadCount:1,retentionDays:90,conversion:null,events:[],
  totals:{page_view:0,scan_start:1,scan_complete:1,advice_open:1,lead_accepted:0},
  statuses:[{status:'new',count:1}],partners:[{partner:'nivo',count:1}],overdueNew:0,delivery:{pending:1,processing:0,acknowledged:0,failed:0},deliveryConfigured:false};
let server,browser;
const report={screenshots:[],checks:[],errors:[]};
function check(name,condition){assert.ok(condition,name);report.checks.push(name);}
function localServer(){return new Promise(resolve=>{
  server=http.createServer(async(req,res)=>{
    let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400).end();return;}
    if(pathname.includes('..')||!(/^(\/admin\/|\/assets\/|\/sitemap\.xml$|\/robots\.txt$)/.test(pathname))){res.writeHead(404).end();return;}
    const filename=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
    if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    try{const bytes=await fs.readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes)}
    catch{res.writeHead(404).end();}
  });
  server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port));
});}
async function screenshot(page,name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled',fullPage:true});report.screenshots.push(name+'.png');}
function responseFor(action){
  if(action==='session')return {ok:true,configured:true,csrf:'synthetic-token',authenticated:true,reportMailEnabled:false};
  if(action==='health')return {ok:true,configured:true,databaseReady:true};
  if(action==='admin_stats')return stats;
  if(action==='admin_leads')return {ok:true,leads:[lead],total:1,offset:0,limit:50};
  if(action==='admin_mail_status')return {ok:true,configured:false,imapAvailable:false,sendAvailable:false};
  if(action==='admin_mail_list')return {ok:true,messages:[]};
  return {ok:false,error:{message:'No synthetic response for '+action}};
}
async function mockApi(page){
  await page.route('**/api/index.php?action=*',async route=>{
    const action=new URL(route.request().url()).searchParams.get('action');
    const data=responseFor(action);
    await route.fulfill({status:data.ok?200:503,contentType:'application/json',body:JSON.stringify(data)});
  });
}
(async()=>{
  await fs.mkdir(out,{recursive:true});
  const base=await localServer();browser=await chromium.launch({headless:true});
  for(const vp of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]){
    const page=await browser.newPage({viewport:vp,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await mockApi(page);await page.goto(base+'/admin/');
    await page.locator('#dashboard').waitFor({state:'visible'});
    await page.locator('#stats-grid .stat-card').first().waitFor();
    const nav=await page.locator('[data-admin-tab]').allTextContents();
    check(vp.width+' four navigation views',nav.length===4&&nav.join(' ').includes('Tools'));
    check(vp.width+' dashboard privacy',!(await page.locator('#stats-grid').innerText()).includes('100%'));
    check(vp.width+' default overview',await page.locator('#overview-api-state').isVisible());
    check(vp.width+' delivery queue pending is not falsely acknowledged',
      (await page.locator('#overview-delivery-state').innerText()).includes('in wachtrij') &&
      (await page.locator('#stats-grid').innerText()).includes('0'));
    await screenshot(page,'wg2-overview-'+vp.width);
    await page.locator('[data-admin-tab="aanvragen"]').click();
    await page.locator('#lead-table button').first().waitFor();
    check(vp.width+' lead details available',await page.locator('#lead-table').innerText().then(t=>t.includes('Voorbeeld Gebruiker')));
    check(vp.width+' shows outbox separate from contact status',
      (await page.locator('#lead-table').innerText()).includes('In wachtrij'));
    await page.locator('#lead-search').fill('geen-match');
    check(vp.width+' page search clearly scoped',(await page.locator('#lead-search-note').innerText()).includes('geladen aanvragen'));
    check(vp.width+' page search hides nonmatches',(await page.locator('#lead-table').innerText()).includes('Geen matches'));
    await page.locator('#lead-search').fill('');
    await screenshot(page,'wg2-aanvragen-'+vp.width);
    await page.locator('[data-admin-tab="seo"]').click();
    await page.waitForFunction(()=>document.querySelector('#seo-sitemap').textContent.includes('HTTP'));
    check(vp.width+' GSC unknown shown',(await page.locator('#seo').innerText()).includes('Niet verbonden'));
    await screenshot(page,'wg2-seo-'+vp.width);
    await page.locator('[data-admin-tab="tools"]').click();
    await page.locator('#tools-api').filter({hasText:'Database bereikbaar'}).waitFor();
    check(vp.width+' no unverified delivery promise',(await page.locator('#tools-delivery').innerText()).includes('Transport uitgeschakeld'));
    check(vp.width+' stored delivery states are correctly reconciled',(await page.locator('#tools-delivery').innerText()).includes('1 wachtend'));
    await screenshot(page,'wg2-tools-'+vp.width);
    const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
    check(vp.width+' no horizontal viewport overflow',widths.document<=widths.viewport+2);
    check(vp.width+' no uncaught JS errors',errors.length===0);
    await page.close();
  }
  const unauth=await browser.newPage();
  await unauth.route('**/api/index.php?action=*',async route=>{
    const action=new URL(route.request().url()).searchParams.get('action');
    const data=action==='session'?{ok:true,configured:true,csrf:'synthetic',authenticated:false}:responseFor(action);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await unauth.goto(base+'/admin/');
  check('no authenticated session hides all dashboard data',await unauth.locator('#login-section').isVisible()&&await unauth.locator('#dashboard').isHidden());
  await unauth.close();
  console.log('Dashboard 2.0: '+report.checks.length+' browser checks, '+report.screenshots.length+' screenshots');
})().catch(e=>{report.errors.push(String(e));console.error(e.stack);process.exitCode=1;}).finally(async()=>{
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'dashboard-v2-report.json'),JSON.stringify(report,null,2));
  await browser?.close();await new Promise(resolve=>server?.close(resolve)??resolve());
});

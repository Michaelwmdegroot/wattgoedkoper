/* WattGoedkoper 0.5 browser acceptance. All dashboard fixtures are synthetic. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'visual-review-output');
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.webp':'image/webp','.svg':'image/svg+xml'};
const results=[];
async function measure(page,selectors){
  return page.evaluate(selectors=>selectors.map(selector=>{
    const e=document.querySelector(selector),r=e?.getBoundingClientRect();
    return {selector,found:!!r,top:r?.top,bottom:r?.bottom,width:r?.width,height:r?.height,left:r?.left,right:r?.right,scrollTop:e?.scrollTop};
  }),selectors);
}
function visible(items,height,width,label){
  for(const item of items){
    assert.ok(item.found&&item.height>0&&item.top>=-1&&item.bottom<=height+1&&item.left>=-1&&item.right<=width+1,
      label+': '+JSON.stringify(item));
  }
}
async function screenshot(page,name){
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});
}
const demo={
  id:'WG-SYNTHETIC',status:'new',partner:'nivo',createdAt:'2026-11-14T13:00:00Z',updatedAt:'2026-11-14T13:00:00Z',
  data:{name:'Demo Klant',email:'demo@example.test',phone:'0612345678',postcode:'2311AB',
    note:'Ik wil zonnepanelen en een thuisbatterij vergelijken.',interests:['solar','battery'],
    consentText:'Ik wil dat NIVO Groep Holland contact met mij opneemt over mijn energieplan.',
    consentVersion:'2026-11-v2',acceptedAt:'2026-11-14T13:00:00Z',analyticsConsent:false,
    inputs:{homeType:'terraced',electricityUse:3500,gasUse:900,year:2027,hasSolar:false},
    summary:{modelVersion:'2026.11.14-v1',year:2027,annualSavingsLow:280,annualSavingsHigh:540,
      investmentLow:6000,investmentHigh:9000,selectedIds:['solar','battery']}}
};
(async()=>{
  await fs.mkdir(out,{recursive:true});
  const server=http.createServer(async(req,res)=>{
    try{
      let url=new URL(req.url,'http://localhost').pathname;
      if(url.endsWith('/'))url+='index.html';
      const name=path.resolve(root,'.'+decodeURIComponent(url));
      if(!name.startsWith(root+path.sep)||name.endsWith('.php'))throw Error('unavailable');
      const data=await fs.readFile(name);
      res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream'});
      res.end(data);
    }catch{res.writeHead(404);res.end('Not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true});
  try{
    for(const [width,height] of [[1366,768],[1440,900],[390,844],[320,568]]){
      const label=width+'x'+height,desktop=width>=768;
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base);
      await page.locator('#open-plan').click();
      const elements=await measure(page,['.plan-metric-highlight','.plan-metric:not(.plan-metric-highlight)',
        '.plan-compare','.plan-measure-card','.plan-notices','#report-email','#report-send']);
      visible(desktop?elements:elements.slice(-2),height,width,label+' plan');
      assert.ok(await page.locator('#dialog-content').evaluate(e=>e.scrollLeft===0),'Plan must have no horizontal overflow');
      if(desktop) assert.equal(await page.locator('#dialog-content').evaluate(e=>e.scrollTop),0,'desktop plan needs scrolling');
      assert.equal(await page.locator('[name=partner]').count(),0);
      await screenshot(page,'v05-'+label+'-plan');
      await page.locator('[data-dialog="advice"]').last().click();
      assert.equal(await page.locator('[name=partner]').count(),0);
      assert.equal(await page.locator('#advice-form [name=consent]').isChecked(),false);
      assert.match(await page.locator('#advice-form').innerText(),/NIVO Groep Holland/);
      if(desktop)await screenshot(page,'v05-'+label+'-advice');
      await page.keyboard.press('Escape');
      assert.ok(!await page.locator('#tool-dialog').evaluate(e=>e.open));
      assert.deepEqual(errors,[]);
      results.push({case:'plan '+label,status:'passed'});
      await page.close();
    }
    for(const [width,height] of [[1366,768],[1440,900]]){
      const label=width+'x'+height;
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/api/index.php?action=*',async route=>{
        const action=new URL(route.request().url()).searchParams.get('action');
        const data=action==='session'?{ok:true,csrf:'synthetic',configured:true,authenticated:true}:
          action==='admin_stats'?{ok:true,totals:{page_view:0,scan_start:0,scan_complete:0,advice_open:0,lead_accepted:0},
            leadCount:1,events:[],statuses:[{status:'new',count:1}],partners:[{partner:'nivo',count:1}],retentionDays:90,overdueNew:0,conversion:null}:
          action==='admin_leads'?{ok:true,leads:[demo],total:1,offset:0,limit:50}:
          action==='admin_mail_status'?{ok:true,configured:false,sendAvailable:false,imapAvailable:false}:
          action==='admin_status'?{ok:true}:{ok:false,error:{message:'mock response not defined'}};
        await route.fulfill({status:data.ok?200:503,contentType:'application/json',body:JSON.stringify(data)});
      });
      await page.goto(base+'admin/');
      await page.locator('[data-admin-tab="aanvragen"]').click();
      await page.locator('#lead-table button').first().click();
      const elems=await measure(page,['.detail-v05-header','.detail-v05-columns','.detail-v05-actions',
        '#detail-status','#lead-dialog .dialog-close','#lead-detail .detail-v05-metric']);
      visible(elems,height,width,label+' admin');
      assert.equal(await page.locator('.detail-v05-extra[open]').count(),0);
      await screenshot(page,'v05-'+label+'-admin');
      await page.locator('.detail-v05-extra summary').first().click();
      assert.match(await page.locator('.detail-v05-extra-body').first().innerText(),/Stroomverbruik/);
      await page.keyboard.press('Escape');
      assert.ok(!await page.locator('#lead-dialog').evaluate(e=>e.open));
      assert.deepEqual(errors,[]);
      results.push({case:'admin '+label,status:'passed'});
      await page.close();
    }
    // Standalone preview has no network access, including report-only form.
    const preview=await browser.newPage({viewport:{width:390,height:844}});
    let attempted=0;preview.on('request',r=>{if(/^https?:/.test(r.url()))attempted++});
    await preview.goto(pathToFileURL(path.join(root,'preview/wattgoedkoper-preview.html')).href);
    await preview.locator('#open-plan').click();
    await preview.locator('#report-email').fill('demo@example.test');
    await preview.locator('#report-send').click();
    await preview.locator('#report-status').filter({hasText:/offline preview/i}).waitFor({timeout:5000});
    assert.equal(attempted,0);
    results.push({case:'offline mail-only guard',status:'passed'});
    await preview.close();
  } finally {
    await fs.writeFile(path.join(out,'v05-results.json'),JSON.stringify(results,null,2));
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error.stack);process.exitCode=1});

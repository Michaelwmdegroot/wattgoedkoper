/* WattGoedkoper v0.6: first-screen home cockpit browser acceptance.
 * All interaction data is synthetic; no leads, mail or server configuration.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'visual-review-output');
const TYPES={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.woff':'font/woff','.webp':'image/webp','.svg':'image/svg+xml'};
const results={checks:[],screenshots:[],failures:[]};
async function check(label,fn){
  try{await fn();results.checks.push({label,status:'pass'});}
  catch(error){results.checks.push({label,status:'fail',message:error.message});throw error;}
}
async function imageReady(page){
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(async img=>{try{await img.decode();}catch{}}));
  });
}
async function capture(page,id){
  await imageReady(page);
  await page.screenshot({path:path.join(OUT,'cockpit-'+id+'.png'),animations:'disabled',timeout:30000});
  results.screenshots.push('cockpit-'+id+'.png');
}
async function geometry(page){
  return await page.evaluate(()=>{
    const names=['.app-header','.app-intro','.control-panel','.scene-stage','.results-panel',
      '.results-panel .result-button','.upgrade-heading','.upgrade-section','#upgrade-dock'];
    names.push(...Array.from({length:5},(_,i)=>'#upgrade-dock .upgrade-card:nth-child('+(i+1)+')'));
    const geom=selector=>{
      const e=document.querySelector(selector);if(!e)return {selector,missing:true};
      const r=e.getBoundingClientRect();
      let clipTop=0,clipBottom=innerHeight,clipLeft=0,clipRight=innerWidth;
      for(let p=e.parentElement;p;p=p.parentElement){
        const s=getComputedStyle(p),q=p.getBoundingClientRect();
        if(['hidden','scroll','auto','clip'].includes(s.overflowY)){
          clipTop=Math.max(clipTop,q.top);clipBottom=Math.min(clipBottom,q.bottom);
        }
        if(['hidden','scroll','auto','clip'].includes(s.overflowX)){
          clipLeft=Math.max(clipLeft,q.left);clipRight=Math.min(clipRight,q.right);
        }
      }
      const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {selector,x:r.x,y:r.y,top:r.top,bottom:r.bottom,left:r.left,right:r.right,
        width:r.width,height:r.height,clipTop,clipBottom,clipLeft,clipRight,
        hit:!!t&&(t===e||e.contains(t))};
    };
    return {viewport:[innerWidth,innerHeight],scrollY:scrollY,
      docWidth:document.documentElement.scrollWidth,items:names.map(geom)};
  });
}
function fullyVisible(g,{checkHit=false}={}){
  const [,height]=g.viewport, width=g.viewport[0];
  for(const it of g.items){
    assert.ok(!it.missing&&it.height>0,JSON.stringify({it,viewport:g.viewport}));
    assert.ok(it.top>=-1&&it.bottom<=height+1&&it.left>=-1&&it.right<=width+1,
      'Offscreen: '+JSON.stringify({it,viewport:g.viewport}));
    assert.ok(it.top>=it.clipTop-2&&it.bottom<=it.clipBottom+2&&
      it.left>=it.clipLeft-2&&it.right<=it.clipRight+2,
      'Ancestor clips '+it.selector+': '+JSON.stringify(it));
    if(checkHit&&it.selector.includes('.upgrade-card'))assert.ok(it.hit,
      'Upgrade obscured: '+JSON.stringify(it));
  }
}
(async()=>{
  await fs.mkdir(OUT,{recursive:true});
  const server=http.createServer(async(req,res)=>{
    try{
      let filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(filename.endsWith('/'))filename+='index.html';
      const full=path.resolve(ROOT,'.'+filename);
      if(!full.startsWith(ROOT+path.sep)||full.endsWith('.php'))throw Error('Not found');
      const bytes=await fs.readFile(full);
      res.writeHead(200,{'Content-Type':TYPES[path.extname(full)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(bytes);
    }catch{res.writeHead(404);res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base='http://127.0.0.1:'+server.address().port+'/';
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const [width,height] of [[1101,768],[1280,720],[1280,800],[1366,768],[1440,768],[1440,900],[1536,824]]){
      const tag=width+'x'+height;
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
      const exceptions=[];page.on('pageerror',error=>exceptions.push(error.message));
      try{
        await page.goto(base,{waitUntil:'load'});
        await page.locator('.photo-scene').waitFor();
        await imageReady(page);
        await check(tag+' / all five measures and panels fit first viewport',async()=>{
          const g=await geometry(page);fullyVisible(g);
          assert.equal(g.scrollY,0);
          assert.ok(g.docWidth<=width+1,JSON.stringify(g));
        });
        await check(tag+' / five separate upgrade controls can be reached',async()=>{
          assert.equal(await page.locator('#upgrade-dock .upgrade-card').count(),5);
          for(const id of ['smart-use','insulation','solar','heatpump','battery']){
            const btn=page.locator('#upgrade-dock button[data-upgrade="'+id+'"]');
            assert.equal(await btn.count(),1);
            assert.ok(await btn.isVisible(),id);
            const rect=await btn.boundingBox();
            assert.ok(rect&&rect.y>=0&&rect.y+rect.height<=height+1,id+': '+JSON.stringify(rect));
          }
        });
        await capture(page,tag+'-initial');
        await check(tag+' / solar then battery update the live plan without scrolling',async()=>{
          await page.locator('#upgrade-dock button[data-upgrade="solar"]').click();
          assert.equal(await page.locator('#upgrade-dock button[data-upgrade="solar"]').getAttribute('aria-pressed'),'true');
          await page.locator('#upgrade-dock button[data-upgrade="battery"]').click();
          assert.equal(await page.locator('#upgrade-dock button[data-upgrade="battery"]').getAttribute('aria-pressed'),'true');
          const g=await geometry(page);fullyVisible(g);
          assert.equal(g.scrollY,0,'Clicking a first-fold upgrade scrolled the document');
          assert.ok(await page.locator('.results-panel .result-button').isVisible());
        });
        await capture(page,tag+'-solar-battery');
        await check(tag+' / ESC and reduced motion do not alter usable homepage',async()=>{
          assert.deepEqual(exceptions,[]);
          assert.ok(await page.locator('.house-hotspot-solar').isVisible());
          assert.ok(await page.locator('.house-hotspot-battery').isVisible());
        });
      }catch(error){
        results.failures.push({case:tag,message:error.message});
        try{await capture(page,tag+'-failure');}catch{}
      }finally{await page.close();}
    }
    // Existing responsive tablet and mobile composition must not acquire horizontal overflow.
    for(const [width,height] of [[900,1000],[390,844],[320,568]]){
      const tag=width+'x'+height,page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      try{
        await page.goto(base,{waitUntil:'load'});
        await page.locator('.photo-scene').waitFor();
        await check(tag+' / responsive homepage keeps original controls',async()=>{
          const data=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth}));
          assert.ok(data.doc<=data.width+1,JSON.stringify(data));
          assert.equal(await page.locator('#upgrade-dock .upgrade-card').count(),5);
          assert.ok(await page.locator('#open-plan').count()===1);
        });
      }catch(error){results.failures.push({case:tag,message:error.message});}
      finally{await page.close();}
    }
  }finally{
    await fs.writeFile(path.join(OUT,'cockpit-checks.json'),JSON.stringify(results,null,2)+'\n');
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
  console.log(JSON.stringify({passed:results.checks.filter(x=>x.status==='pass').length,
    failed:results.checks.filter(x=>x.status==='fail').length,
    screenshots:results.screenshots.length,
    failures:results.failures},null,2));
  if(results.failures.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});

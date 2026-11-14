/* Brand/hero release acceptance — actual Chromium, no real users, mail or leads. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'visual-review-output');
const metrics={checks:[],screenshots:[],errors:[]};
async function verify(label,task){try{await task();metrics.checks.push({label,status:'pass'});}catch(error){metrics.checks.push({label,status:'fail',message:error.message});throw error;}}
function within(a,b,margin=3){return a.right<=b.left+margin||b.right<=a.left+margin;}
async function waitForVisuals(page){
  return page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(async img=>{
      img.loading='eager';
      try{await img.decode()}catch{}
    }));
    return [...document.images].filter(img=>!img.complete||img.naturalWidth===0)
      .map(img=>img.getAttribute('src')?.slice(0,100));
  });
}
async function shot(page,name){
  const broken=await waitForVisuals(page);
  assert.deepEqual(broken,[],name+' has broken or unfinished imagery');
  await page.screenshot({path:path.join(OUT,'brand-'+name+'.png'),animations:'disabled'});
  metrics.screenshots.push('brand-'+name+'.png');
}
async function viewport(page){
  return page.evaluate(()=>{
    const selectors=['.brand-lockup','.intro-copy','.intro-path','.intro-actions',
      '.control-panel','.scene-stage','.results-panel','.results-panel .result-button',
      ...[1,2,3,4,5].map(i=>'.upgrade-card:nth-child('+i+')')];
    const items=selectors.map(selector=>{
      const el=document.querySelector(selector),r=el?.getBoundingClientRect(),style=el?getComputedStyle(el):null;
      return {selector,display:style?.display,x:r?.x,y:r?.y,top:r?.top,
        bottom:r?.bottom,left:r?.left,right:r?.right,width:r?.width,height:r?.height};
    });
    return {height:innerHeight,width:innerWidth,scrollY,docWidth:document.documentElement.scrollWidth,items};
  });
}
const rect=(v,k)=>v.items.find(x=>x.selector===k);
function visible(r,w,h,name){
  assert.ok(r&&r.display!=='none'&&r.height>0&&r.width>0,
    name+' missing: '+JSON.stringify(r));
  assert.ok(r.top>=-2&&r.bottom<=h+2&&r.left>=-2&&r.right<=w+2,
    name+' clipped/offscreen: '+JSON.stringify(r));
}
async function testPng(name,width,height){
  const file=await fs.readFile(path.join(ROOT,name));
  assert.equal(file.toString('hex',0,8),'89504e470d0a1a0a',name+' not PNG');
  assert.equal(file.readUInt32BE(16),width,name+' width');
  assert.equal(file.readUInt32BE(20),height,name+' height');
}
(async()=>{
  await fs.mkdir(OUT,{recursive:true});
  for(const [p,w,h] of [
    ['apple-touch-icon.png',180,180],['assets/icon-192.png',192,192],
    ['assets/icon-512.png',512,512],['assets/favicon-16.png',16,16],
    ['assets/favicon-32.png',32,32],['assets/favicon-48.png',48,48],
    ['assets/og-wattgoedkoper.png',1200,630]]){
    await verify(p+' correct dimensions',()=>testPng(p,w,h));
  }
  await verify('favicon.ico exists and contains 3 sizes',async()=>{
    const bytes=await fs.readFile(path.join(ROOT,'favicon.ico'));
    assert.equal(bytes.readUInt16LE(2),1);
    assert.equal(bytes.readUInt16LE(4),3);
  });
  const html=await fs.readFile(path.join(ROOT,'preview/wattgoedkoper-preview.html'),'utf8');
  await verify('offline preview includes brand stylesheet and no public manifest references',async()=>{
    assert.match(html,/brand-refresh.css|intro-path-step/);
    assert.doesNotMatch(html,/<link[^>]*href="\/site\.webmanifest"/);
    assert.doesNotMatch(html,/<link[^>]*href="\/favicon\.ico"/);
  });
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    for(const [width,height] of [[1101,768],[1280,720],[1366,768],[1440,900],[1536,824]]){
      const name=width+'x'+height;
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
      const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
      try{
        await page.setContent(html,{waitUntil:'load'});
        await page.locator('.photo-scene').waitFor();
        await verify(name+' / house and upgrade photography decoded',async()=>{
          const broken=await waitForVisuals(page);
          assert.deepEqual(broken,[],'Broken images or assets');
          const image=page.locator('.scene-base').first();
          assert.ok(await image.evaluate(img=>img.complete&&img.naturalWidth>0),
            'Hero house image has no pixels');
        });
        await verify(name+' / aligned brand, guidance and cockpit fit',async()=>{
          const g=await viewport(page);assert.equal(g.scrollY,0);
          assert.ok(g.docWidth<=g.width+1,'horizontal overflow');
          for(const key of ['.brand-lockup','.intro-copy','.intro-path','.intro-actions',
             '.control-panel','.scene-stage','.results-panel',
             '.results-panel .result-button',...Array.from({length:5},(_,i)=>'.upgrade-card:nth-child('+(i+1)+')')]){
            visible(rect(g,key),width,height,key);
          }
          assert.ok(within(rect(g,'.intro-copy'),rect(g,'.intro-path')),
            'Headline and action guide overlap');
          assert.ok(within(rect(g,'.intro-path'),rect(g,'.intro-actions')),
            'Guide and status overlap');
        });
        await verify(name+' / image is loaded and navigation has three real buttons',async()=>{
          const img=page.locator('.wordmark .brand-lockup');
          assert.ok(await img.evaluate(e=>e.complete&&e.naturalWidth>0));
          assert.equal(await page.locator('#intro-path button[data-quick]').count(),3);
        });
        await shot(page,name+'-initial');
        await verify(name+' / quick house and measures focus do not scroll',async()=>{
          await page.locator('#intro-path [data-quick="house"]').click();
          assert.equal(await page.evaluate(()=>document.activeElement.id),'tab-home');
          await page.locator('#intro-path [data-quick="measures"]').click();
          const focused=await page.evaluate(()=>document.activeElement.getAttribute('data-upgrade'));
          assert.equal(focused,'solar');
          assert.equal(await page.evaluate(()=>scrollY),0);
        });
        await verify(name+' / quick plan opens existing real Plan Studio',async()=>{
          await page.locator('#intro-path [data-quick="plan"]').click();
          assert.ok(await page.locator('#tool-dialog').evaluate(e=>e.open));
          assert.equal(await page.locator('#plan-studio-live').count(),1);
          await page.keyboard.press('Escape');
          assert.ok(!await page.locator('#tool-dialog').evaluate(e=>e.open));
        });
        await verify(name+' / all five measures still usable first screen',async()=>{
          for(const id of ['solar','battery']){
            await page.locator('#upgrade-dock button[data-upgrade="'+id+'"]').click();
            assert.equal(await page.locator('#upgrade-dock button[data-upgrade="'+id+'"]').getAttribute('aria-pressed'),'true');
          }
          const g=await viewport(page);assert.equal(g.scrollY,0);
          for(let i=1;i<=5;i++)visible(rect(g,'.upgrade-card:nth-child('+i+')'),width,height,'upgrade '+i);
          assert.deepEqual(errors,[]);
          assert.deepEqual(network,[]);
        });
        await shot(page,name+'-solar-battery');
      }catch(error){metrics.errors.push({case:name,error:error.message});
        try{await shot(page,name+'-failure')}catch{}
      }finally{await page.close();}
    }
    for(const [width,height] of [[900,1000],[390,844],[320,568]]){
      const name=width+'x'+height,page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      try{
        await page.setContent(html,{waitUntil:'load'});
        await page.locator('.photo-scene').waitFor();
        await verify(name+' / responsive logo and no horizontal overflow',async()=>{
          const m=await viewport(page);
          assert.ok(m.docWidth<=width+1,JSON.stringify(m));
          visible(rect(m,'.brand-lockup'),width,height,'brand logo');
          assert.equal(await page.locator('#intro-path').isVisible(),false);
          assert.equal(await page.locator('#upgrade-dock button[data-upgrade]').count(),5);
        });
        await shot(page,name+'-mobile');
      }catch(error){metrics.errors.push({case:name,error:error.message});}
      finally{await page.close();}
    }
  }finally{
    await browser.close();
    await fs.writeFile(path.join(OUT,'brand-checks.json'),JSON.stringify(metrics,null,2));
  }
  console.log(JSON.stringify({checks:metrics.checks.length,passed:metrics.checks.filter(x=>x.status==='pass').length,
    errors:metrics.errors,screenshots:metrics.screenshots.length},null,2));
  if(metrics.errors.length||metrics.checks.some(x=>x.status==='fail'))process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

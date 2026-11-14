/* Real Chromium acceptance of Plan Studio, including clipping not just viewport bounds.
 * Loads the generated self-contained preview; no live server, accounts, PII or SMTP.
 */
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'visual-review-output');
const result={checks:[],screenshots:[],errors:[]};let browser;
async function check(name,fn){try{await fn();result.checks.push({name,status:'pass'});}catch(e){result.checks.push({name,status:'fail',message:e.message});throw e;}}
async function shot(page,name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});result.screenshots.push(name+'.png');}
async function fits(page,selector,{clipping=true}={}){
 const box=await page.locator(selector).evaluate((el,clipping)=>{
  const r=el.getBoundingClientRect();let top=0,bottom=innerHeight,left=0,right=innerWidth;
  if(clipping){for(let p=el.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),q=p.getBoundingClientRect();
   if(['auto','hidden','scroll','clip'].includes(s.overflowY)){top=Math.max(top,q.top);bottom=Math.min(bottom,q.bottom);}
   if(['auto','hidden','scroll','clip'].includes(s.overflowX)){left=Math.max(left,q.left);right=Math.min(right,q.right);}
  }}
  const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  return {selector:el.className,top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,visibleTop:top,visibleBottom:bottom,visibleLeft:left,visibleRight:right,hit:!!hit&&(el===hit||el.contains(hit))};
 },clipping);
 assert.ok(box.height>0&&box.top>=box.visibleTop-2&&box.bottom<=box.visibleBottom+2&&box.left>=box.visibleLeft-2&&box.right<=box.visibleRight+2,JSON.stringify(box));
 if(['#report-send','#report-email'].includes(selector))assert.ok(box.hit,'Primary action is covered');
 return box;
}
const action=(page,name,value)=>page.locator(`[data-plan-action="${name}"][data-plan-value="${value}"]`).first();
async function tab(page,value){await page.locator(`[role=tab][data-plan-value="${value}"]`).click();}
async function open(page,html){await page.setContent(html,{waitUntil:'load'});await page.locator('#open-plan').click();await page.evaluate(()=>document.fonts.ready);}
async function overviewFits(page,label){
 await check(label+' / essential content genuinely fits, including clipping ancestors',async()=>{
  for(const s of ['.ps-primary-metric','.ps-range','.ps-investment','.ps-comparison','.ps-energy','.ps-selected','.ps-notices','#report-send','#report-email'])await fits(page,s);
  assert.equal(await page.locator('#ps-panel').evaluate(e=>e.scrollTop),0);
  assert.ok(await page.locator('#ps-panel').evaluate(e=>e.scrollHeight<=e.clientHeight+2));
 });
}
(async()=>{
 await fs.mkdir(out,{recursive:true});const html=await fs.readFile(path.join(root,'preview/wattgoedkoper-preview.html'),'utf8');
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
 for(const [width,height] of [[1366,768],[1440,900],[1280,800],[900,1000],[390,844],[320,568],[640,400]]){
  const label=width+'x'+height,page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  try{
   await open(page,html);
   if(width>800)await overviewFits(page,label+' empty');
   else await check(label+' / footer field and primary action stay reachable',async()=>{await fits(page,'#report-email');await fits(page,'#report-send');});
   await check(label+' / no horizontal overflow',async()=>{assert.ok(await page.locator('#tool-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));});
   await tab(page,'measures');
   for(const id of ['smart-use','insulation','solar','heatpump','battery'])await action(page,'toggle',id).click();
   await check(label+' / five toggles work without leaving the plan',async()=>{assert.equal(await page.locator('.ps-toggle[aria-pressed=true]').count(),5);assert.equal(await page.locator('#tool-dialog').evaluate(e=>e.open),true);});
   await action(page,'toggle','solar').click();
   await check(label+' / prerequisite removal also removes unsupported battery',async()=>{assert.equal(await action(page,'toggle','battery').getAttribute('aria-pressed'),'false');assert.equal(await action(page,'toggle','battery').isDisabled(),true);});
   await action(page,'undo','').click();
   const annual=await page.locator('.ps-savings').innerText();
   await action(page,'period','month').click();
   await check(label+' / monthly estimate explicitly labelled and changes the headline',async()=>{assert.notEqual(await page.locator('.ps-savings').innerText(),annual);assert.match(await page.locator('.ps-hero').innerText(),/Jaarsimulatie ÷ 12/);});
   await action(page,'period','year').click();
   await action(page,'reference','').click();
   await action(page,'toggle','battery').click();
   await check(label+' / frozen variant visibly compares a changed bundle',async()=>{assert.equal(await page.locator('.ps-hero-reference').count(),1);assert.match(await page.locator('.ps-hero-reference').innerText(),/minder besparing\/jaar/);});
   if(width===1440)await shot(page,'studio-measures-1440');
   await action(page,'undo','').click();
   await check(label+' / undo restores the selected bundle',async()=>assert.equal(await action(page,'toggle','battery').getAttribute('aria-pressed'),'true'));
   await action(page,'clear-reference','').click();
   await tab(page,'overview');
   if(width>800)await overviewFits(page,label+' five measures');
   await shot(page,'studio-plan-'+label);
   await action(page,'chart','energy').click();
   await check(label+' / separate net-import comparison uses kWh',async()=>{assert.match(await page.locator('.ps-chart').getAttribute('aria-label'),/Netafname.*kWh/);});
   await action(page,'year','2026').click();
   await check(label+' / changing rekenjaar updates the actual model',async()=>{assert.equal(await action(page,'year','2026').getAttribute('aria-pressed'),'true');assert.notEqual(await page.locator('.ps-savings').innerText(),annual);});
   await tab(page,'evidence');
   await check(label+' / evidence preserves flows, assumptions, and editable input routes',async()=>{assert.match(await page.locator('.ps-evidence-view').innerText(),/Teruglevering/);await page.locator('.ps-disclosure summary').click();assert.match(await page.locator('.ps-disclosure').innerText(),/statistisch betrouwbaarheidsinterval/);});
   if(width===1440)await shot(page,'studio-evidence-1440');
   await action(page,'dialog','tariffs').click();
   await page.locator('#input-electricityPrice').fill('0.31');
   await page.locator('#settings-form button[type=submit]').click();
   await check(label+' / editing assumptions returns to the plan, not the homepage',async()=>{assert.ok(await page.locator('#plan-studio-live').isVisible());assert.equal(await page.locator('#tool-dialog').evaluate(e=>e.open),true);});
   await page.locator('#ps-tab-overview').focus();await page.keyboard.press('ArrowRight');
   await check(label+' / tabs implement arrow keys and restore focus',async()=>{assert.equal(await page.locator('#ps-tab-measures').getAttribute('aria-selected'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'ps-tab-measures');});
   await page.keyboard.press('Home');
   await check(label+' / Home returns to the overview',async()=>assert.equal(await page.locator('#ps-tab-overview').getAttribute('aria-selected'),'true'));
   await page.locator('#report-email').fill('demo@example.test');
   await action(page,'chart','cost').click();
   await check(label+' / calculations preserve an unsent email draft in the form only',async()=>assert.equal(await page.locator('#report-email').inputValue(),'demo@example.test'));
   await page.locator('.ps-advice').focus();await page.keyboard.press('Tab');
   await check(label+' / keyboard focus stays inside the native modal',async()=>assert.ok(await page.locator('#tool-dialog').evaluate(e=>e.contains(document.activeElement))));
   await page.locator('#report-send').click();
   await check(label+' / mail-only stays offline and does not imply advice consent',async()=>{assert.match(await page.locator('#report-status').innerText(),/offline preview/i);assert.equal(await page.locator('[name=consent]').count(),0);assert.deepEqual(network,[]);});
   if(width===390){await page.setViewportSize({width:390,height:500});await check('mobile keyboard-height / CTA stays visible',async()=>{await fits(page,'#report-send');await fits(page,'#report-email');});}
   await page.keyboard.press('Escape');
   await check(label+' / Escape closes and returns focus to opener',async()=>{assert.equal(await page.locator('#tool-dialog').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'open-plan');});
   await check(label+' / no JavaScript exceptions',async()=>assert.deepEqual(errors,[]));
  }catch(e){result.errors.push({case:label,message:e.message});await shot(page,'studio-failure-'+label);}
  await page.close();
 }
 // Adverse financial case and prerequisite removal, exclusively through public controls.
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
 try{
  await page.setContent(html);await page.locator('#home-more>summary').click();await page.locator('[data-toggle=hasSolar]').click();
  await page.locator('[data-field=year][data-value="2026"]').click();await page.locator('#tab-energy').click();await page.locator('[data-dialog=tariffs]').click();
  await page.locator('#input-feedInCostMode').selectOption('per-kwh');await page.locator('#input-feedInCost').fill('0');await page.locator('#settings-form button[type=submit]').click();
  await page.locator('#tab-budget').click();await page.locator('#control-budget').focus();await page.keyboard.press('Home');await page.locator('#upgrade-dock [data-upgrade=battery]').click();
  await page.locator('#open-plan').click();
  await check('negative savings and over-budget / both warnings are visible',async()=>{assert.match(await page.locator('.ps-notices').innerText(),/verlaagt.*niet/);assert.match(await page.locator('.ps-notices').innerText(),/boven je budget/);await fits(page,'.ps-notices');});
  await overviewFits(page,'adverse case');await shot(page,'studio-negative-1366');
 }catch(e){result.errors.push({case:'adverse',message:e.message});}
 await page.close();
})().catch(e=>result.errors.push({case:'runner',message:e.stack})).finally(async()=>{
 result.summary={passed:result.checks.filter(c=>c.status==='pass').length,failed:result.checks.filter(c=>c.status==='fail').length,screenshots:result.screenshots.length};
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'plan-studio-checks.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({summary:result.summary,errors:result.errors},null,2));
 if(browser)await browser.close();if(result.errors.length)process.exitCode=1;
});

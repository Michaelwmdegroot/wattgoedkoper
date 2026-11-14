/* Build static favicon / touch icon / social artwork from the approved local SVG.
 * No network, image-generation APIs or credentials. Intended for a one-time
 * isolated feature-branch asset build. Requires Playwright Chromium in CI.
 */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const svg64=async name=>Buffer.from(await fs.readFile(path.join(ROOT,'assets',name))).toString('base64');
function pngToIco(items){
  const count=items.length,head=Buffer.alloc(6+count*16);
  head.writeUInt16LE(0,0);head.writeUInt16LE(1,2);head.writeUInt16LE(count,4);
  let offset=head.length;
  items.forEach(({size,png},i)=>{
    const p=6+i*16;head.writeUInt8(size===256?0:size,p);
    head.writeUInt8(size===256?0:size,p+1);
    head.writeUInt8(0,p+2);head.writeUInt8(0,p+3);
    head.writeUInt16LE(1,p+4);head.writeUInt16LE(32,p+6);
    head.writeUInt32LE(png.length,p+8);head.writeUInt32LE(offset,p+12);
    offset+=png.length;
  });
  return Buffer.concat([head,...items.map(i=>i.png)]);
}
(async()=>{
  const mark=await svg64('brand-mark.svg');
  const logo=await svg64('brand-logo.svg');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const iconPngs=[];
  try{
    for(const size of [16,32,48,180,192,512]){
      const badge=size>=180;
      const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
      const bg=badge?'#fffefa':'transparent';
      const width=badge?'87%':'100%';
      await page.setContent('<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:'+bg+'}body{display:grid;place-items:center}img{display:block;width:'+width+';height:'+width+';object-fit:contain}</style></head><body><img src="data:image/svg+xml;base64,'+mark+'" alt=""></body></html>',{waitUntil:'load'});
      await page.locator('img').evaluate(img=>img.decode());
      const png=await page.screenshot({omitBackground:!badge,animations:'disabled'});
      iconPngs.push({size,png});
      const filename=size===180?'apple-touch-icon.png':size===192||size===512?'assets/icon-'+size+'.png':size===32?'assets/favicon-32.png':size===16?'assets/favicon-16.png':'assets/favicon-48.png';
      await fs.mkdir(path.dirname(path.join(ROOT,filename)),{recursive:true});
      await fs.writeFile(path.join(ROOT,filename),png);
      await page.close();
    }
    const ico=pngToIco(iconPngs.filter(x=>[16,32,48].includes(x.size)));
    await fs.writeFile(path.join(ROOT,'favicon.ico'),ico);

    // High-resolution native social share card.
    const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    const html='<!doctype html><html lang="nl"><head><style>'
      +'html,body{margin:0;width:1200px;height:630px;background:#fbfaf6;font-family:Arial,Helvetica,sans-serif;color:#082e41}'
      +'body{box-sizing:border-box;padding:65px 86px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}'
      +'.logo{width:560px;height:110px;object-fit:contain;object-position:left}'
      +'.label{font-size:18px;letter-spacing:.2em;color:#6b8477;font-weight:800}'
      +'h1{font:normal 82px/.96 Georgia,serif;margin:16px 0 19px;letter-spacing:-3.5px}'
      +'.line{width:285px;height:9px;background:#ffd235;border-radius:15px;transform:rotate(-1deg)}'
      +'p{font-size:26px;color:#63756e;margin:25px 0 0}'
      +'.corner{position:absolute;right:-190px;bottom:-235px;width:560px;height:560px;border:90px solid #eaf0dc;border-radius:50%;opacity:.9}'
      +'</style></head><body><div class="corner"></div><img class="logo" src="data:image/svg+xml;base64,'+logo+'" alt="">'
      +'<div><div class="label">JOUW PERSOONLIJKE ENERGIEPLAN</div><h1>Maak je huis<br>watt slimmer.</h1><div class="line"></div>'
      +'<p>Speel. Vergelijk. Bespaar.</p></div></body></html>';
    await page.setContent(html,{waitUntil:'load'});
    await page.locator('.logo').evaluate(img=>img.decode());
    await fs.writeFile(path.join(ROOT,'assets','og-wattgoedkoper.png'),await page.screenshot({animations:'disabled'}));
    await page.close();
  }finally{await browser.close();}
  console.log('Generated favicon.ico, PNG favicons, Apple touch icon, app icons and social artwork.');
})().catch(error=>{console.error(error);process.exitCode=1;});

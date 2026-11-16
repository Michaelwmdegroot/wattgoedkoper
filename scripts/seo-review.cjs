/* Offline SEO integrity audit of the deployable static tree; no crawler/network. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),meta=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/seo-cluster-v08.json'),'utf8'));
const legacy=Object.keys(meta.editorialDates).filter(x=>x!=='index.html');
const all=[...legacy,...meta.pages.map(p=>p.path)],dateMap={...meta.editorialDates,...Object.fromEntries(meta.pages.map(p=>[p.path,p.lastmod]))};
const seen=new Set(),titles=new Set(),descriptions=new Set(),checks=[];
let links=0,contextLinks=0,images=0;
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const fail=(n,m)=>{throw Error(n+': '+m)};
const url=p=>'https://wattgoedkoper.nl/'+p.replace(/index\.html$/,'');
const pathOf=url=>{
 const p=decodeURIComponent(url.pathname);
 if(p==='/'||p==='')return 'index.html';
 return p.endsWith('/')?p.slice(1)+'index.html':p.slice(1);
};
for(const p of all){
 assert.ok(fs.existsSync(path.join(ROOT,p)),p+' missing from deploy tree');
 const html=read(p),where=p;
 const expected=url(p);
 const match=(re,label)=>{const m=html.match(re);if(!m)fail(where,'missing '+label);return m[1]};
 const title=match(/<title>([^<]+)<\/title>/,'title');
 const desc=match(/<meta name="description" content="([^"]+)"/,'description');
 const canonical=match(/<link rel="canonical" href="([^"]+)"/,'canonical');
 assert.equal(canonical,expected,where+' canonical');
 assert.ok(title.length>20&&title.length<110,where+' title');
 assert.ok(desc.length>65&&desc.length<220,where+' description');
 assert.ok(!titles.has(title),where+' duplicate title');titles.add(title);
 assert.ok(!descriptions.has(desc),where+' duplicate description');descriptions.add(desc);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,where+' exactly one h1');
 assert.equal((html.match(/<link rel="canonical"/g)||[]).length,1,where+' exactly one canonical');
 assert.ok(html.includes('/assets/guide-cluster.css'),where+' design stylesheet');
 assert.ok(html.includes('Kennis &amp; inspiratie'),where+' knowledge navigation');
 assert.ok(!html.includes('Thuisbatterij Team'),where+' outdated partner');
 const json=match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/,'JSON-LD');
 const graph=JSON.parse(json)['@graph'];
 assert.equal(graph.find(x=>x['@type']==='WebPage')?.url,canonical,where+' WebPage URL');
 assert.ok(graph.some(x=>x['@type']==='BreadcrumbList'),where+' breadcrumbs schema');
 assert.equal(graph.find(x=>x['@type']==='WebPage')?.dateModified,dateMap[p],where+' editorial date');
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size,where+' duplicate HTML ids');
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
   const href=match[1];
   if(/^(mailto:|tel:|data:)/.test(href))continue;
   if(/^https?:\/\//.test(href)){if(href.startsWith('https://wattgoedkoper.nl')){ /* same-site absolute link below */ } else continue;}
   const target=new URL(href,canonical);
   if(target.origin!=='https://wattgoedkoper.nl')continue;
   const targetFile=pathOf(target);
   if(!fs.existsSync(path.join(ROOT,targetFile)))fail(where,'broken local URL: '+href+' -> '+targetFile);
   if(target.pathname.startsWith('/assets/'))images++;
   links++;
   if(/^#verken-[a-z-]+$/.test(target.hash))contextLinks++;
   if(target.pathname===new URL(canonical).pathname&&target.hash&&target.hash.startsWith('#')&&!target.hash.startsWith('#verken-')){
     const id=decodeURIComponent(target.hash.slice(1));
     if(!ids.includes(id))fail(where,'broken in-page anchor '+href);
   }
 }
 seen.add(canonical);checks.push(p);
}
assert.ok(contextLinks>=6,'missing relevant context entry links');
const home=read('index.html');assert.ok(home.includes('href="/kennis/"'),'knowledge hub link from homepage');
const privacy=read('privacy.html'),method=read('rekenmodel.html');
for(const [page,html] of [['privacy',privacy],['method',method],['homepage',home]]) {
  assert.ok(html.includes('NIVO Groep Holland B.V.'),page+' identifies actual NIVO initiator');
}
assert.ok(privacy.includes('95227768')&&privacy.includes('Lireweg 52'), 'privacy identifies registered company');
assert.ok(privacy.includes('info@wattgoedkoper.nl')&&privacy.includes('info@nivogroepholland.nl'), 'privacy has both direct and group contact');
assert.ok(!privacy.includes('De juridische verwerkingsverantwoordelijke moet'), 'privacy no unresolved legal placeholder');
const map=read('sitemap.xml');
const sitemaps=[...map.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)].map(x=>({url:x[1],lastmod:x[2]}));
assert.equal(sitemaps.length,all.length+1,'sitemap routes count');
assert.equal(new Set(sitemaps.map(x=>x.url)).size,sitemaps.length,'no duplicate sitemap URLs');
for(const p of ['index.html',...all]){
 const hit=sitemaps.find(x=>x.url===url(p));assert.ok(hit,'sitemap omitted '+p);
 assert.equal(hit.lastmod,dateMap[p],'sitemap date for '+p);
}
assert.ok(!map.includes('/admin/')&&!map.includes('/preview/'),'no private sitemap routes');
const demo=read('kennis/zonnepanelen-met-thuisbatterij/index.html');
assert.ok(demo.includes('data-energy-example')&&demo.includes('guide-comparison.mjs'),'live example exists');
console.log(JSON.stringify({status:'pass',routes:all.length+1,checkedPages:checks.length,internalLinks:links,contextEntries:contextLinks,imageReferences:images},null,2));

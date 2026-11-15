import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {resolveContextEntry} from '../assets/context-entry.mjs';

// Specific editorial regression tests supplement the global offline SEO audit.
const root=resolve(import.meta.dirname,'..');
const pages=[
 {slug:'kennis/isolatie-of-hybride-warmtepomp/index.html',fragment:'#verken-isolatie',
   official:'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/isolatiemaatregelen'},
 {slug:'kennis/hybride-warmtepomp/geschiktheid/index.html',fragment:'#verken-warmtepomp',
   official:'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/warmtepomp'},
 {slug:'kennis/energiecontract/met-zonnepanelen/index.html',fragment:'#verken-energieplan',
   official:'https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen'}
];
const cluster=JSON.parse(readFileSync(resolve(root,'docs/seo-cluster-v08.json'),'utf8'));
test('every published guide has a matching version-controlled source and grounded references',()=>{
  for(const {slug,official} of pages){
    const html=readFileSync(resolve(root,slug),'utf8');
    const authored=cluster.pages.find(p=>p.path===slug);
    assert.ok(authored,slug+' missing from generator');
    assert.equal(authored.lastmod,'2026-11-15');
    assert.ok(authored.body.includes(official),slug+' missing official source');
    assert.ok(html.includes(official),slug+' source link missing from generated page');
    assert.ok(html.includes('https://wattgoedkoper.nl/'+slug.replace('index.html','')));
    assert.ok(!html.includes('name="email"')&&!html.includes('type="submit"'),slug+' must not be a leadwall');
    assert.ok(!html.includes('Thuisbatterij Team'),slug+' obsolete recipient');
    assert.ok(html.includes('content="article"'),slug+' article metadata required');
  }
});
test('all three guide CTAs only use known, non-identifying context fragments',()=>{
  for(const {slug,fragment} of pages){
    const p=cluster.pages.find(row=>row.path===slug);
    assert.equal(p.cta,fragment);
    assert.ok(resolveContextEntry(fragment),slug+' unknown route');
    const html=readFileSync(resolve(root,slug),'utf8');
    assert.ok(html.includes('href="/'+fragment+'"'));
  }
});
test('editorial hubs link to all new questions and sitemap dates are not build timestamps',()=>{
  const knowledge=readFileSync(resolve(root,'kennis/index.html'),'utf8');
  const sitemap=readFileSync(resolve(root,'sitemap.xml'),'utf8');
  for(const {slug} of pages){
    assert.ok(knowledge.includes('href="/'+slug.replace('index.html','')+'"'),slug+' not discoverable from hub');
    assert.ok(sitemap.includes('<loc>https://wattgoedkoper.nl/'+slug.replace('index.html','')+'</loc><lastmod>2026-11-15</lastmod>'));
  }
  assert.equal(cluster.checkedOn,'2026-11-15');
});
test('energy contract article clearly discloses simplified dynamic model',()=>{
  const html=readFileSync(resolve(root,'kennis/energiecontract/met-zonnepanelen/index.html'),'utf8');
  assert.match(html, /geen realtime energiecontractvergelijker/);
  assert.match(html, /gemiddeld tarief/);
  assert.match(html, /kwartier- of uurreeks/);
});

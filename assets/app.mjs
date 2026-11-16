import { DEFAULT_INPUT, formatEuro, MODEL_VERSION, SOURCES } from './model.mjs';
import { simulateHome, UPGRADES } from './playground-model.mjs';
import { renderHouseScene } from './house-scene.mjs';
import { renderPlanDashboard, renderPlanWorkspace, renderReportDelivery, renderReportSuccess } from './plan-ui.mjs';
import { resolveContextEntry } from './context-entry.mjs';

// A house to experiment with. Detailed inputs are optional; results never need contact details.
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const money = value => formatEuro(Number(value) || 0);
const number = value => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(Number(value) || 0);
const precise = value => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(Number(value) || 0);
const decimal = (value, digits = 2) => new Intl.NumberFormat('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const range = (low, high) => Math.round(low) === Math.round(high) ? money(low) : `${money(low)} – ${money(high)}`;
const kwh = value => `${number(value)} kWh`;
const pct = value => `${Math.round(value || 0)}%`;
const STORE_HOME = 'wattgoedkoper-huis-v2';
const STORE_ANALYTICS = 'wattgoedkoper-analytics-v1';
const HOME_TYPES = [['terraced','Rijwoning'],['corner','Hoekhuis'],['semi','2-onder-1-kap'],['detached','Vrijstaand'],['apartment','Appartement']];
const UPGRADE_ART = {solar:'/assets/images/solar-card.webp',battery:'/assets/images/battery-card.webp',heatpump:'/assets/images/heatpump-card.webp',insulation:'/assets/images/insulation-card.webp','smart-use':'/assets/images/smart-use-card.webp'};
const PERIODS = [['before1945','Vóór 1945'],['1945-1974','1945 – 1974'],['1975-1991','1975 – 1991'],['1992-2005','1992 – 2005'],['after2005','Na 2005']];
const state = { input:{...DEFAULT_INPUT}, selectedIds:[], tab:'home', view:'current', daylight:65, personalized:false, tariffsEdited:false, report:null, scene:null, history:[], dialog:null, dialogReturn:null, analytics:false, session:null, sessionPromise:null, leadFingerprint:null, leadKey:null, reportFingerprint:null, reportKey:null, reportSent:null, started:false };
try { state.analytics = localStorage.getItem(STORE_ANALYTICS) === 'yes'; } catch {}
const ICONS = {
  solar:'<path d="M6 8h12l3 11H3L6 8Z"/><path d="M5 13h14M9 8 8 19m7-11 1 11M9 22h6M12 19v3M12 1v3M4 3l2 2m14-2-2 2"/>',
  battery:'<rect x="6" y="4" width="12" height="17" rx="3"/><path d="M10 2h4m-1 6-4 5h5l-3 5"/>',
  insulation:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7M1 14v5m22-5v5M6 4l2-2m8 0 2 2"/>',
  heatpump:'<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="11" cy="12" r="4"/><path d="m11 8 2 4-2 4-2-4Zm6 1h1m-1 3h1m-1 3h1M6 19v2m12-2v2"/>',
  'smart-use':'<path d="m13 2-8 12h6l-1 8 9-13h-7l1-7Z"/>',
  person:'<circle cx="12" cy="6" r="3"/><path d="M7 21v-7a5 5 0 0 1 10 0v7M12 15v6"/>',
  home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
  ev:'<path d="m5 8 2-4h10l2 4M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7H3v-7Zm2 7v3m14-3v3M6 12h2m8 0h2"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  undo:'<path d="M4 5v6h6M4 11a8 8 0 1 1 2 8"/>',
};
function icon(name) { return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.home}</svg>`; }
function miniHouse(type) {
  const second=['terraced','semi'].includes(type)?'<path d="m20 14 10-8 10 8v20H20Z" fill="#dae1dc"/><path d="m18 14 12-10 12 10"/>':'';
  return `<svg class="mini-house" viewBox="0 0 52 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${type==='apartment'?'<path d="M13 4h27v31H13Z" fill="#e0e8df"/><path d="M18 10h4v4h-4zm11 0h4v4h-4zM18 19h4v4h-4zm11 0h4v4h-4zM24 28h6v7"/>':`${second}<path d="m7 17 13-11 13 11v18H7Z" fill="#e7e5d7"/><path d="m5 17 15-13 15 13M12 20h5v6h-5zm10 5h6v10M11 35h23"/>${type==='corner'?'<path d="m33 17 9 4v14h-9" fill="#ccd8cf"/>':''}`}</svg>`;
}
function toast(message) { const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.hidden=true,5200); }
function showError(el,message) { if(el){el.textContent=message;el.hidden=false;} }
function snapshot() { return {input:{...state.input},selectedIds:[...state.selectedIds],personalized:state.personalized,tariffsEdited:state.tariffsEdited,view:state.view}; }
function remember() { state.history.push(snapshot());if(state.history.length>25)state.history.shift(); }
function labelFor(id) { return UPGRADES.find(u=>u.id===id)?.label||id; }
function choices(field,options,className='chip-row') { return `<div class="${className}">${options.map(([value,label])=>`<button type="button" class="choice-chip" data-field="${field}" data-value="${escape(value)}" aria-pressed="${String(state.input[field])===String(value)}">${escape(label)}</button>`).join('')}</div>`; }
function fieldLabel(label,note='') { return `<div class="control-label">${escape(label)}${note?`<span class="label-note">${escape(note)}</span>`:''}</div>`; }
function slider(field,label,min,max,step,unit='') {
  const value=state.input[field],display=unit==='€'?money(value):`${step<1?precise(value):number(value)} ${unit}`;
  return `<div class="range-control"><div><label for="control-${field}">${escape(label)}</label><output for="control-${field}" data-output="${field}" data-unit="${unit}">${display}</output></div><input id="control-${field}" type="range" min="${min}" max="${Math.max(max,value)}" step="${step}" value="${value}" data-range="${field}" aria-valuetext="${escape(display)}"><div class="range-labels"><span>${unit==='€'?money(min):number(min)}</span><span>${unit==='€'?money(Math.max(max,value)):`${number(Math.max(max,value))} ${unit}`}</span></div></div>`;
}
function equipment(field,label,symbol) { return `<button type="button" class="equipment-toggle" data-toggle="${field}" aria-pressed="${state.input[field]}"><span class="equipment-icon">${icon(symbol)}</span><span class="equipment-name">${label}</span><span class="toggle-track" aria-hidden="true"></span></button>`; }
function savedHomeExists() { try{return Boolean(localStorage.getItem(STORE_HOME));}catch{return false;} }

function renderControls() {
  const input=state.input;
  const moreOpen=Boolean($('#home-more')?.open);
  $$('#tool-tabs [data-tab]').forEach(button=>{const active=button.dataset.tab===state.tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  $('#home-controls').setAttribute('aria-labelledby',`tab-${state.tab}`);
  if(state.tab==='home') {
    $('#home-controls').innerHTML=`
      <section class="control-section">${fieldLabel('Dit lijkt op mijn huis')}<div class="home-type-grid" role="group" aria-label="Type woning">${HOME_TYPES.map(([id,name])=>`<button type="button" class="home-type-option" data-field="homeType" data-value="${id}" aria-pressed="${input.homeType===id}">${miniHouse(id)}<span>${name}</span></button>`).join('')}</div></section>
      <section class="control-section">${fieldLabel('Wie wonen er?','personen')}<div class="people-control"><button class="stepper-button" data-step="-1" aria-label="Eén bewoner minder" ${input.people<=1?'disabled':''}>−</button><span class="people-icons" aria-hidden="true">${Array.from({length:Math.min(input.people,5)},()=>icon('person')).join('')}${input.people>5?`<small>+${input.people-5}</small>`:''}</span><output class="people-count" aria-label="Aantal bewoners">${input.people}</output><button class="stepper-button" data-step="1" aria-label="Eén bewoner meer" ${input.people>=15?'disabled':''}>+</button></div></section>
      <section class="control-section">${fieldLabel('De woning is…')}${choices('ownership',[['owner','van mij'],['tenant','gehuurd']],'ownership-switch')}</section>
      <details class="control-more" id="home-more" ${moreOpen?'open':''}><summary>Isolatie &amp; installaties <span aria-hidden="true">+</span></summary><div class="control-more-body"><section class="control-section">${fieldLabel('Hoe goed blijft de warmte binnen?')}${choices('insulation',[['poor','Kan beter'],['average','Redelijk'],['good','Goed']])}</section>
      <section class="control-section">${fieldLabel('Heb je dit al?','huidige situatie')}<div class="equipment-list">${equipment('hasSolar','Zonnepanelen','solar')}${equipment('hasBattery','Thuisbatterij','battery')}${equipment('hasHeatPump','Warmtepomp','heatpump')}${equipment('hasEv','Elektrische auto','ev')}</div></section>
      <button class="control-link" data-dialog="house">${input.area} m² · ${PERIODS.find(p=>p[0]===input.buildPeriod)?.[1]} <span aria-hidden="true">↗</span></button>
      </div></details>${input.ownership==='tenant'||input.homeType==='apartment'?'<p class="control-note">Voor installaties is overleg met je verhuurder of VvE nodig. Slim verbruiken kun je alvast proberen.</p>':''}
      ${savedHomeExists()?'<button class="control-link saved-home-link" data-restore>Open mijn bewaarde huis ↗</button>':''}`;
  } else if(state.tab==='energy') {
    const flow=state.report.baseline.flow;
    $('#home-controls').innerHTML=`
      <section class="control-section">${fieldLabel(input.usageKnown?'Jouw jaarcijfers':'Je vertrekpunt',input.usageKnown?'ingevuld':'geschat')}<div class="energy-estimate"><div class="estimate-pair"><span>Stroom</span><strong>${kwh(flow.electricityUse)}</strong></div><div class="estimate-pair"><span>Gas</span><strong>${number(flow.gasUse)} m³</strong></div>${input.hasSolar?`<div class="estimate-pair"><span>Zon op je dak</span><strong>${kwh(flow.pvProduction)}</strong></div>`:''}</div><button class="control-link" data-dialog="usage">${input.usageKnown?'Pas mijn jaarcijfers aan':'Ik weet mijn echte verbruik'} ↗</button><p class="control-note">${input.usageKnown?'Alle cijfers gelden voor dezelfde periode van één jaar.':'Een eerste schatting op basis van je huis en bewoners.'}</p></section>
      <section class="control-section">${fieldLabel('Overdag is er…')}${choices('daytime',[['away','weinig iemand'],['mixed','soms iemand'],['home','vaak iemand']])}</section>
      <section class="control-section">${fieldLabel('Gebruikt je huis nog gas?')}${choices('hasGas',[[true,'Ja'],[false,'Nee']])}</section>
      <section class="control-section">${fieldLabel('Je energietarieven',state.tariffsEdited?'aangepast':'voorbeeld')}<div class="tariff-pills"><span><strong>€ ${decimal(input.electricityPrice,3)}</strong> / kWh</span>${input.hasGas?`<span><strong>€ ${decimal(input.gasPrice)}</strong> / m³</span>`:''}</div><button class="control-link" data-dialog="tariffs">Mijn eigen tarieven invullen ↗</button><button class="control-link" data-dialog="contract">Speel met een ander contract ↗</button></section>
      ${input.hasSolar||state.selectedIds.includes('solar')?`<section class="control-section">${slider('panels',input.hasSolar?'Aantal bestaande panelen':'Panelen in je plan',1,30,1,'stuks')}${!input.hasSolar?`<p class="control-note">Rekenprijs van de set: <strong data-solar-price>${money(input.solarInvestment)}</strong>. De voorbeeldprijs groeit mee met het aantal panelen.</p>`:'<p class="control-note">Je ingevulde jaaropwek blijft leidend.</p>'}<button class="control-link" data-dialog="solar">Richting, schaduw & opbrengst ↗</button></section>`:''}
      ${state.selectedIds.includes('battery')?`<section class="control-section">${slider('batteryCapacity','Stroom bewaren',1,20,.5,'kWh')}<p class="control-note">De prijs is een aparte aanname: ${money(input.batteryInvestment)}.</p><button class="control-link" data-dialog="battery">Capaciteit en prijs verfijnen ↗</button></section>`:''}
      <p class="control-note">De jaarkosten zijn variabel: zonder netbeheer, vaste leveringskosten en belastingvermindering.</p>`;
  } else {
    $('#home-controls').innerHTML=`
      <section class="control-section">${slider('budget','Wat wil je investeren?',0,30000,500,'€')}<p class="control-note">Een speelruimte, geen verplichting. Je kunt elke combinatie blijven proberen.</p><button class="control-link" data-dialog="budget">Precies bedrag instellen ↗</button></section>
      <section class="control-section">${fieldLabel('Wat vind je het belangrijkst?')}${choices('goal',[['bill','Lagere rekening'],['self-use','Meer eigen stroom'],['comfort','Comfort']])}</section>
      <section class="control-section"><div class="mini-label">HULP BIJ JE EERSTE KEUZE</div><h3 class="control-heading">Een zetje in de goede richting?</h3><p class="control-note">We stellen een kansrijke combinatie voor binnen je budget. Daarna speel jij verder.</p><button class="button button-yellow" data-recommend>Kies een startplan ${icon('smart-use')}</button></section>
      <section class="control-section">${fieldLabel('Investering van je plan')}<strong class="investment-value">${range(state.report.investmentLow,state.report.investmentHigh)}</strong><p class="control-note">Indicatieve installatieprijzen, vóór eventuele subsidie. Pas ze aan als je al een offerte hebt.</p><button class="control-link" data-dialog="investments">Mijn eigen prijzen gebruiken ↗</button></section>`;
  }
}

function costBar(label,amount,width,extra='') { return `<div class="cost-row ${extra}"><div><span>${label}</span><strong>${money(amount)}</strong></div><div class="cost-meter"><span style="width:${Math.max(2,Math.min(100,width))}%"></span></div></div>`; }
function renderResults() {
  const r=state.report,hasPlan=r.selectedIds.length>0,baseline=r.baseline.bill.total,after=r.scenario.bill.total,maxCost=Math.max(1,Math.abs(baseline),Math.abs(after));
  $('#live-results').innerHTML=`
    <div class="result-eyebrow">${hasPlan?(r.savings>=0?'Je bespaart naar schatting':'Je kosten nemen toe met'):'Wat kan jouw huis besparen?'}</div>
    <div class="saving-value ${r.savings<0?'is-negative':''} ${hasPlan?'':'saving-word'}" data-saving="${r.savings}">${hasPlan?money(Math.abs(r.savings)):'Wat als…'}</div>
    <div class="saving-period">${hasPlan?'<span class="saving-unit">per jaar</span> met jouw combinatie':'jij je eerste upgrade probeert?'}</div>
    ${hasPlan?`<p class="saving-range">Bandbreedte besparing <strong>${range(r.savingsLow,r.savingsHigh)}</strong></p>`:'<p class="result-context">Probeer een upgrade op je huis.</p>'}
    <div class="cost-comparison">${costBar('Nu · per jaar',baseline,Math.abs(baseline)/maxCost*100)}${costBar('Met je plan',after,Math.abs(after)/maxCost*100,'after')}</div>
    <div class="self-use-values"><span>Stroom uit eigen opwek</span><strong>${pct(r.baseline.selfSufficiency)} <span aria-hidden="true">→</span> ${pct(r.scenario.selfSufficiency)}</strong></div>
    <div class="self-use-meter" role="img" aria-label="${pct(r.scenario.selfSufficiency)} van je stroomverbruik uit eigen opwek in dit plan"><span style="width:${Math.min(100,r.scenario.selfSufficiency)}%"></span></div>
    <div class="result-investment"><span class="result-eyebrow">Eenmalige investering</span><strong class="investment-value">${hasPlan?range(r.investmentLow,r.investmentHigh):'Nog niets gekozen'}</strong></div>
    <div class="result-warnings">${r.budget.exceeded?`<p class="result-warning">Tot ${money(r.budget.overBy)} boven je budget. Je kunt je plan blijven vergelijken.</p>`:''}
    ${hasPlan&&r.savings<=0?'<p class="result-warning">Deze combinatie verlaagt je jaarkosten niet. Probeer een andere keuze of pas je tarieven aan.</p>':''}</div>
    <button class="button button-ink result-button" data-dialog="plan">${hasPlan?'Bekijk mijn energieplan':'Bekijk mijn vertrekpunt'} ${icon('arrow')}</button>
    <div class="year-switch" role="group" aria-label="Rekenjaar"><span>Rekenjaar</span><button data-field="year" data-value="2026" aria-pressed="${r.year===2026}">2026</button><button data-field="year" data-value="2027" aria-pressed="${r.year===2027}">2027</button></div>
    <p class="result-footnote">${state.personalized?'Jouw instellingen':'Voorbeeldhuis'} · ${state.input.usageKnown?'jaarverbruik ingevuld':'verbruik geschat'}. Tarieven ${state.tariffsEdited?'aangepast':'zijn voorbeelden'}. Variabele kosten, exclusief vaste kosten.</p>`;
  $('#mobile-result').innerHTML=`<div class="mobile-result-copy"><strong>${hasPlan?`${money(r.savings)} / jaar`:'Probeer een upgrade'}</strong><span>${hasPlan?'geschatte besparing van je plan':'en ontdek direct het verschil'}</span></div><button class="button button-ink" data-dialog="plan">Mijn plan ${icon('arrow')}</button>`;
}
function renderUpgrades() {
  $('#upgrade-dock').innerHTML=state.report.available.map(u=>{
    const blocked=!u.eligible&&!u.selected;
    const value=u.existing?'Al in je huis':blocked?(u.id==='battery'&&!state.input.hasSolar?'Eerst zon op je dak':'Bekijk wat nodig is'):u.selected?'Toegevoegd aan je plan':`${u.marginalSavings>=0?'+':'−'} ${money(Math.abs(u.marginalSavings))} / jaar`;
    const descriptions={'smart-use':'slimmer met energie omgaat?',solar:'je eigen stroom opwekt?',battery:'zonnestroom bewaart?',insulation:'de warmte binnenhoudt?',heatpump:'met minder gas verwarmt?'};
    return `<article class="upgrade-card${u.selected?' is-selected':''}${blocked?' is-disabled':''}" draggable="${!blocked}" data-drag-upgrade="${u.id}"><img class="upgrade-art" src="${UPGRADE_ART[u.id]}" alt="" width="960" height="640" decoding="async"><button class="upgrade-toggle" type="button" data-upgrade="${u.id}" aria-pressed="${u.selected}" aria-label="${escape(u.label)}${u.selected?' uit je plan halen':' proberen'}"><span class="upgrade-icon">${icon(u.id)}</span><span class="upgrade-state" aria-hidden="true">${u.selected?'✓':u.existing?'✓':'+'}</span><strong class="upgrade-name">${escape(u.label)}</strong><span class="upgrade-description">${descriptions[u.id]}</span><span class="upgrade-value">${value}</span></button><button class="upgrade-info" data-upgrade-info="${u.id}" aria-label="Uitleg en instellingen voor ${escape(u.label)}"><span aria-hidden="true">↗</span></button></article>`;
  }).join('');
}
function renderSummary() {
  const r=state.report;
  $('#plan-summary').innerHTML=`<div class="plan-strip"><div class="plan-strip-copy"><span class="mini-label">${r.selectedIds.length?'DIT HEB JE BIJ ELKAAR GESPEELD':'KLEIN BEGINNEN MAG'}</span><h2>${r.selectedIds.length?'Jouw huis, met een plan.':'Benieuwd waar je kunt beginnen?'}</h2><div class="plan-chips">${r.selectedIds.length?r.selectedIds.map(id=>`<button class="plan-chip" data-upgrade="${id}" aria-label="${escape(labelFor(id))} verwijderen">${icon(id)}${escape(labelFor(id))}<span aria-hidden="true">×</span></button>`).join(''):'<p>Kies zelf iets, of laat ons een eerste combinatie voorstellen.</p>'}</div></div><div class="plan-strip-actions"><button class="button button-yellow" data-recommend>${r.selectedIds.length?'Stel een startplan voor':'Laat een slim startplan zien'} ${icon('smart-use')}</button><button class="text-button" data-undo ${state.history.length?'':'disabled'}>${icon('undo')} Eén stap terug</button></div></div>`;
}
function updateScene() {
  $('#scene-stage').dataset.night=String(state.daylight<35);
  const options={input:state.input,selectedIds:state.selectedIds,view:state.view,daylight:state.daylight,flows:state.view==='plan'?state.report.scenario.flow:state.report.baseline.flow,onAction:onHouseAction};
  if(!state.scene)state.scene=renderHouseScene($('#house-scene'),options);else state.scene.update(options);
  $$('.view-switch [data-view]').forEach(button=>{const active=button.dataset.view===state.view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('#scene-caption').textContent=state.view==='current'?'Jouw huis. Vol mogelijkheden.':state.selectedIds.length?'Eén plan. Jouw huis. Meer mogelijkheden.':'Een huis vol mogelijkheden.';
  $('#scene-hint').textContent=state.view==='current'&&state.selectedIds.length?'Kies ‘Met je plan’ om je upgrades te zien.':'Tik op je huis of probeer hieronder een upgrade.';
  $('#home-state-label').innerHTML=`<span class="example-dot" aria-hidden="true"></span>${state.personalized?'Jouw energiehuis · alles blijft aanpasbaar':'Voorbeeldhuis · pas aan naar jouw situatie'}`;
  $('#day-label').textContent=state.daylight<25?'Avond':state.daylight<50?'Ochtend':state.daylight<80?'Overdag':'Volop zon';
}
function focusToken() {
  const active=document.activeElement;if(!active||active===document.body)return null;
  if(active.id)return ['id',active.id];
  for(const attr of ['data-upgrade','data-upgrade-info','data-step','data-toggle','data-field','data-undo','data-recommend','data-dialog'])if(active.hasAttribute(attr))return [attr,active.getAttribute(attr),active.getAttribute('data-value')];
  return null;
}
function restoreFocus(token) {
  if(!token||document.activeElement!==document.body)return;
  const element=token[0]==='id'?document.getElementById(token[1]):$$(`[${token[0]}]`).find(el=>el.getAttribute(token[0])===token[1]&&(!token[2]||el.getAttribute('data-value')===token[2]));element?.focus({preventScroll:true});
}
function refresh({controls=true}={}) {
  const focus=focusToken();state.report=simulateHome(state.input,state.selectedIds);state.input={...state.report.input};state.selectedIds=[...state.report.selectedIds];
  if(controls)renderControls();renderResults();renderUpgrades();renderSummary();updateScene();restoreFocus(focus);
}
function startInteraction() {if(!state.started){state.started=true;track('scan_start');}}
function changeInput(key,value,{controls=true,record=true}={}) {
  const next={...state.input,[key]:value};if((key==='hasSolar'||key==='usageKnown')&&!value)next.inputMode='total';
  if(key==='panels'&&!next.hasSolar)next.solarInvestment=Math.min(200000,Math.max(100,Math.round(state.input.solarInvestment*value/state.input.panels)));
  const previous=[...state.selectedIds];
  try{simulateHome(next,state.selectedIds);if(record)remember();state.input=next;state.personalized=true;startInteraction();refresh({controls});const removed=previous.filter(id=>!state.selectedIds.includes(id));if(removed.length)toast(`${removed.map(labelFor).join(' en ')} past niet meer bij deze instellingen en is uit je plan gehaald.`);}catch(error){toast(error.message);}
}
function toggleUpgrade(id) {
  const u=state.report.available.find(item=>item.id===id);if(!u)return;if(!u.selected&&!u.eligible){openUpgrade(id);return;}
  remember();startInteraction();const wasSelected=state.selectedIds.includes(id);state.selectedIds=wasSelected?state.selectedIds.filter(item=>item!==id):[...state.selectedIds,id];state.view='plan';const before=state.report.savings,previous=[...state.selectedIds];refresh();
  const removed=previous.filter(item=>!state.selectedIds.includes(item)),difference=state.report.savings-before;
  toast(`${labelFor(id)} ${wasSelected?'weggehaald':'toegevoegd'}.${removed.length?` ${removed.map(labelFor).join(' en ')} ook verwijderd: de combinatie past niet meer.`:` Je plan bespaart nu ${money(Math.abs(difference))} ${difference>=0?'meer':'minder'} per jaar.`}`);
}
function onHouseAction(id) {if(id==='home')openHouseDetails();else toggleUpgrade(id);}
function recommend() {remember();startInteraction();state.selectedIds=[...state.report.recommendedIds];state.view='plan';refresh();toast(state.selectedIds.length?'Een startplan binnen je budget. Probeer gerust andere combinaties.':'Er is binnen deze instellingen geen geschikte combinatie. Je kunt zelf blijven vergelijken.');}
function undo() {const previous=state.history.pop();if(!previous)return;Object.assign(state,previous);refresh();toast('Je vorige keuze is teruggezet.');}

// Only the optional detail panels use conventional inputs.
function openDialog(kind,title,body,kicker='MAAK HET PERSOONLIJK') {
  const dialog=$('#tool-dialog');if(!dialog.open)state.dialogReturn=document.activeElement;
  dialog.classList.toggle('plan-dialog',kind==='plan');dialog.classList.toggle('advice-dialog',kind==='advice');
  state.dialog=kind;$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;$('#dialog-content').innerHTML=body;
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('#dialog-title').tabIndex=-1;$('#dialog-title').focus({preventScroll:true});
}
function closeDialog() {if(planReturnFromSettings){planReturnFromSettings=false;openPlan();return;}$('#tool-dialog').close();state.dialog=null;(state.dialogReturn?.isConnected?state.dialogReturn:$('#open-plan'))?.focus({preventScroll:true});}
function numeric(name,label,{unit='',min=0,max=100000,step='any',help='',value=state.input[name]}={}) {
  return `<div class="field"><label for="input-${name}">${escape(label)}</label><div class="input-unit"><input id="input-${name}" name="${name}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${escape(value)}" required${help?` aria-describedby="help-${name}"`:''}>${unit?`<span>${escape(unit)}</span>`:''}</div>${help?`<small class="field-help" id="help-${name}">${escape(help)}</small>`:''}</div>`;
}
function select(name,label,options,help='',value=state.input[name]) {
  return `<div class="field"><label for="input-${name}">${escape(label)}</label><select id="input-${name}" name="${name}">${options.map(([id,text])=>`<option value="${escape(id)}" ${String(value)===String(id)?'selected':''}>${escape(text)}</option>`).join('')}</select>${help?`<small class="field-help">${escape(help)}</small>`:''}</div>`;
}
function formShell(body,label='Bekijk het effect',extra='') {return `<form id="settings-form">${body}<div class="form-error" id="settings-error" role="alert" hidden></div><div class="dialog-actions"><button class="button button-yellow" type="submit">${label} ${icon('arrow')}</button>${extra}<button class="text-button" type="button" data-close>Terug naar mijn huis</button></div></form>`;}
function bindSettings(transform=next=>next,after=()=>closeDialog()) {
  $('#settings-form').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const next={...state.input};
    for(const [key,value] of new FormData(form).entries()){if(!(key in DEFAULT_INPUT))continue;next[key]=typeof DEFAULT_INPUT[key]==='boolean'?value==='true':typeof DEFAULT_INPUT[key]==='number'?(String(value).trim()===''?NaN:Number(value)):value;}
    try{const input=transform(next);simulateHome(input,state.selectedIds);remember();state.input=input;state.personalized=true;startInteraction();refresh();after();toast('Je huis en je resultaat zijn aangepast.');}catch(error){showError($('#settings-error'),error.message);}
  });
}
function openHouseDetails() {
  openDialog('house','Een huis is meer dan een dak.',`<p class="dialog-intro">Met de grootte en bouwperiode sluit de verbruiksschatting beter aan op jouw woning.</p>${formShell(`<div class="dialog-grid">${numeric('area','Woonoppervlak',{unit:'m²',min:15,max:1500,step:1})}${select('buildPeriod','Gebouwd in',PERIODS)}</div><p class="dialog-note">Dit verandert de verbruiksschatting. Heb je je eigen jaarcijfers ingevuld, dan blijven die leidend.</p>`)}`);bindSettings();
}
function openUsage(mode=state.input.inputMode,draft=null) {
  const input=draft||state.input,flow=state.report.baseline.flow;
  openDialog('usage','Jouw cijfers maken het persoonlijk.',`<p class="dialog-intro">Gebruik je jaarafrekening en, bij zonnepanelen, je omvormer-app. De berekening gebeurt op dit apparaat.</p>${formShell(`
    ${state.input.hasSolar?`<div class="field"><span class="control-label">Welke cijfers heb je?</span><div class="segmented-control"><button type="button" data-usage-mode="total" aria-pressed="${mode==='total'}">Totaal verbruik</button><button type="button" data-usage-mode="meter" aria-pressed="${mode==='meter'}">Afname & teruglevering</button></div></div>`:''}
    <input type="hidden" name="inputMode" value="${state.input.hasSolar?mode:'total'}"><div class="dialog-grid">
    ${state.input.hasSolar&&mode==='meter'?numeric('gridImport','Afgenomen van het net',{unit:'kWh',value:input.gridImport,help:'Het afnametelwerk vóór salderen.'})+numeric('gridExport','Teruggeleverd aan het net',{unit:'kWh',value:input.gridExport,help:'Dezelfde periode van één jaar.'}):numeric('electricityUse','Totaal stroomverbruik',{unit:'kWh',value:input.usageKnown?input.electricityUse:flow.electricityUse,help:state.input.hasSolar?'Netafname plus de zonnestroom die je zelf gebruikte.':'Je volledige stroomverbruik in één jaar.'})}
    ${state.input.hasSolar?numeric('pvProduction','Opgewekt met zonnepanelen',{unit:'kWh',value:input.pvProduction,help:'Alle opwek uit je omvormer, niet alleen teruglevering.'}):''}
    ${state.input.hasGas?numeric('gasUse','Gasverbruik',{unit:'m³',max:20000,value:input.usageKnown?input.gasUse:flow.gasUse}):''}</div>
    ${state.input.hasSolar?'<p class="dialog-note">Met afname, opwek én teruglevering kunnen we je eigen gebruik afleiden. Je totale stroomverbruik is meestal hoger dan de netafname.</p>':''}`,'Gebruik mijn cijfers','<button class="text-button" type="button" data-use-estimate>Gebruik de schatting</button>')}`);bindSettings(next=>({...next,usageKnown:true}));
}
function tariffFields(alternative=false) {
  const name=suffix=>alternative?'alternative'+suffix[0].toUpperCase()+suffix.slice(1):suffix;
  return `<div class="dialog-grid">${numeric(name('electricityPrice'),'Stroomtarief',{unit:'€/kWh',max:2,step:.001,help:'Inclusief energiebelasting en btw.'})}${state.input.hasGas?numeric(name('gasPrice'),'Gastarief',{unit:'€/m³',max:10,step:.001,help:'Inclusief energiebelasting en btw.'}):''}${numeric(name('feedInPrice'),'Terugleververgoeding',{unit:'€/kWh',max:2,step:.001})}${select(name('feedInCostMode'),'Terugleverkosten',[['per-kwh','Per teruggeleverde kWh'],['annual','Vast bedrag per jaar']])}${numeric(name('feedInCost'),'Kosten per teruggeleverde kWh',{unit:'€/kWh',max:2,step:.001,help:'Alleen bij de keuze per kWh.'})}${numeric(name('feedInAnnualCost'),'Jaarbedrag terugleverkosten',{unit:'€/jaar',max:10000,help:'Alleen bij de keuze vast jaarbedrag.'})}</div>`;
}
function openTariffs() {
  openDialog('tariffs','Wat betaal je voor energie?',`<p class="dialog-intro">We beginnen met voorbeeldtarieven. Neem hieronder de bedragen uit jouw contract over.</p>${formShell(`${select('contractType','Je contract',[['fixed','Vast'],['variable','Variabel'],['dynamic','Dynamisch (jaargemiddelde)']])}${tariffFields()}<p class="dialog-note">Bij dynamische tarieven geeft een jaargemiddelde alleen een grove indicatie. Uurprijzen en handelsopbrengsten worden niet gesimuleerd.</p>`)}`);bindSettings(next=>next,()=>{state.tariffsEdited=true;refresh();closeDialog();});
}
function openContract() {
  const c=state.report.contracts;
  openDialog('contract','Wat als je contract verandert?',`<p class="dialog-intro">Vergelijk je huidige tarieven met een eigen alternatief. Dit zijn rekenscenario’s, geen aanbiedingen van energieleveranciers.</p><div class="detail-stat-grid"><div class="detail-stat"><span>Verschil op je huidige verbruik</span><strong>${money(Math.abs(c.savings))}</strong><small>${c.savings>=0?'lagere':'hogere'} kosten per jaar</small></div></div>${formShell(`${tariffFields(true)}${numeric('alternativeFixedDifference','Verschil in vaste kosten',{unit:'€/jaar',min:-10000,max:10000,help:'Alternatief min huidig. Vul −20 in als het alternatief € 20 goedkoper is.'})}<p class="dialog-note">Dit contractverschil staat los van je upgrades en wordt niet bij de planbesparing opgeteld. Bonussen, opzegvergoedingen en uurprijzen zijn niet meegenomen.</p>`,'Vergelijk deze tarieven')}`,'EEN ANDER CONTRACT');bindSettings(next=>next,()=>openContract());
}
function openSolar() {
  openDialog('solar','Wat kan er op jouw dak?',`<p class="dialog-intro">Je dakrichting en schaduw bepalen mede de verwachte opwek. De animatie is een illustratie van jouw keuzes.</p>${formShell(`<div class="dialog-grid">${numeric('panels','Aantal panelen',{unit:'stuks',min:1,max:100,step:1})}${select('roofAvailable','Is er bruikbare dakruimte?',[[true,'Ja'],[false,'Nee / nog onzeker']])}${select('roofOrientation','Richting van het dak',[['south','Zuid'],['eastwest','Oost-west'],['east','Oost'],['west','West'],['north','Noord']])}${select('roofShade','Hoeveel schaduw?',[['none','Weinig / geen'],['partial','Een deel van de dag'],['heavy','Veel schaduw']])}${state.input.hasSolar?numeric('pvProduction','Je bestaande jaaropwek',{unit:'kWh',help:'Je jaaropwek blijft leidend, ook als je het aantal panelen aanpast.'}):''}</div><p class="dialog-note">Nieuwe panelen: we rekenen met 435 Wp per paneel en een opbrengst die meebeweegt met richting en schaduw. De huidige rekenprijs per paneel blijft gelijk als je het aantal verandert. Een echte offerte kun je invullen bij ‘Mijn eigen prijzen’. Bestaande panelen: je ingevulde jaaropwek blijft leidend.</p>`)}`);bindSettings(next=>({...next,solarInvestment:!next.hasSolar?Math.min(200000,Math.max(100,Math.round(state.input.solarInvestment*next.panels/state.input.panels))):next.solarInvestment}));
}
function openBudget() {openDialog('budget','Jouw speelruimte.',formShell(numeric('budget','Maximale investering',{unit:'€',min:0,max:200000,step:100,help:'Handmatig gekozen upgrades blijven staan, ook boven dit budget.'})));bindSettings();}
function openInvestments() {
  openDialog('investments','Reken met jouw prijzen.',`<p class="dialog-intro">Heb je al een offerte? Vervang de voorbeeldprijs door je totale prijs inclusief installatie en btw, vóór subsidie.</p>${formShell(`<div class="dialog-grid">${numeric('solarInvestment','Zonnepanelen',{unit:'€',min:100,max:200000})}${numeric('batteryInvestment','Thuisbatterij',{unit:'€',min:100,max:200000})}${numeric('insulationInvestment','Isolatie',{unit:'€',min:100,max:200000})}${numeric('heatPumpInvestment','Hybride warmtepomp',{unit:'€',min:100,max:200000})}</div><p class="dialog-note">We blijven een bandbreedte tonen rond de prijs. Subsidie is niet afgetrokken: recht en bedrag hangen af van de maatregel en actuele voorwaarden.</p>`)}`);bindSettings();
}
function openUpgrade(id) {
  const u=state.report.available.find(item=>item.id===id);if(!u)return;
  const details={
    'smart-use':['Kleine veranderingen tellen mee.','Een lager basisverbruik en, als je panelen hebt, vaker stroom gebruiken wanneer de zon schijnt. Denk aan een vaatwasser die draait als je thuis bent en de zon schijnt.'],
    insulation:['Warmte die blijft, hoef je niet opnieuw te maken.','We schatten een besparing op gas voor ruimteverwarming. De werkelijke winst hangt af van de delen van je woning die je isoleert. Een woningopname maakt dit concreter.'],
    solar:['Een dak dat meedoet.','Je gebruikt een deel direct en levert de rest terug. Kijk ook naar 2027: dezelfde panelen geven een ander financieel resultaat zodra salderen stopt.'],
    heatpump:['Minder gas. Wel extra stroom.','Dit scenario gaat over een hybride warmtepomp. De ketel blijft voor pieken en warm water. We rekenen extra stroom mee; geschiktheid vraagt controle van woning en afgiftesysteem.'],
    battery:['Je zonnestroom, op een ander moment.','Een batterij kan het gebruik van eigen zonnestroom verhogen. Dat betekent niet automatisch een goede investering. We rekenen opslagverlies mee en nemen geen inkomsten uit handel of onbalans aan.'],
  }[id];
  const comboSolar=id==='battery'&&!state.input.hasSolar&&!state.selectedIds.includes('solar')&&state.report.available.some(a=>a.id==='solar'&&a.eligible);
  const comboHeat=id==='heatpump'&&state.input.insulation==='poor'&&!state.selectedIds.includes('insulation')&&state.report.available.some(a=>a.id==='insulation'&&a.eligible);
  const settings=id==='solar'?'solar':id==='battery'?'battery':null;
  openDialog(`upgrade-${id}`,details[0],`<p class="dialog-intro">${details[1]}</p><div class="detail-stat-grid"><div class="detail-stat"><span>${u.selected?'Bijdrage binnen je huidige plan':'Extra besparing bij toevoegen'}</span><strong>${u.eligible||u.selected?range(u.marginalSavingsLow,u.marginalSavingsHigh):'Eerst je situatie bekijken'}</strong><small>${u.eligible||u.selected?'per jaar, in deze combinatie':escape(u.reason)}</small></div><div class="detail-stat"><span>Investering</span><strong>${range(u.investmentLow,u.investmentHigh)}</strong><small>indicatief, vóór subsidie</small></div></div>${u.reason?`<p class="info-box">${escape(u.reason)}</p>`:''}<div class="dialog-actions">${u.eligible||u.selected?`<button class="button button-yellow" data-dialog-toggle="${id}">${u.selected?'Haal uit mijn plan':'Probeer op mijn huis'} ${icon('arrow')}</button>`:''}${comboSolar?'<button class="button button-yellow" data-combo="solar,battery">Probeer zonnepanelen + batterij ↗</button>':''}${comboHeat?'<button class="button button-yellow" data-combo="insulation,heatpump">Probeer isolatie + warmtepomp ↗</button>':''}${settings?`<button class="button button-ghost" data-dialog="${settings}">Pas de instellingen aan</button>`:''}<button class="text-button" data-dialog="investments">Pas de prijs aan ↗</button></div><p class="dialog-note">Je totale plan wordt als één combinatie doorgerekend. Zo tellen overlappende besparingen niet dubbel mee.</p>`,labelFor(id).toUpperCase());
}
function openBattery() {
  openDialog('battery','Hoeveel stroom wil je bewaren?',`<p class="dialog-intro">Groter is niet vanzelf beter. Probeer een andere capaciteit en kijk hoeveel extra stroom je nog zelf kunt gebruiken.</p>${formShell(`${numeric('batteryCapacity','Bruikbare batterijcapaciteit',{unit:'kWh',min:1,max:100,step:.5})}${numeric('batteryInvestment','Totale aanschaf en installatie',{unit:'€',min:100,max:200000})}<p class="dialog-note">Deze jaarsimulatie hanteert 90% opslagrendement en maximaal circa 180 equivalente cycli in het centrale scenario. Met uurdata kan de afstemming nauwkeuriger.</p>`)}`);bindSettings();
}
const planUI={tab:'overview',period:'year',chart:'cost',reference:null,inspected:null};
function planOptions(){return {r:state.report,personalized:state.personalized,tariffsEdited:state.tariffsEdited,ui:{...planUI,canUndo:state.history.length>0}};}
function planBody(){return renderPlanDashboard(planOptions());}
function reportSnapshot() {
  const r=state.report;
  return {modelVersion:MODEL_VERSION,year:r.year,homeType:state.input.homeType,
    selectedIds:[...r.selectedIds],savingsLow:r.savingsLow,savingsHigh:r.savingsHigh,
    investmentLow:r.investmentLow,investmentHigh:r.investmentHigh,
    baselineCost:r.baseline.bill.total,plannedCost:r.scenario.bill.total,
    electricityUse:r.baseline.flow.electricityUse,gasUse:r.baseline.flow.gasUse,
    budgetOverBy:r.budget.exceeded?Math.max(0,r.budget.overBy):0};
}
function reportPlanKey(){return JSON.stringify(reportSnapshot());}
function displayReportSuccess(email){
  const el=$('#report-email-form');
  const options={newsletterEnabled:state.session?.newsletterOptInEnabled===true,newsletterSubscribed:state.reportSent?.newsletterSubscribed===true};
  if(el)el.outerHTML=renderReportSuccess(email,options);
  $('#report-success')?.focus({preventScroll:true});
}
function updatePlanWorkspace(focusAction=null,focusValue=''){
  if(state.dialog!=='plan')return;
  const panel=$('#ps-panel'),scroll=panel?.scrollTop||0;
  $('#plan-studio-live').innerHTML=renderPlanWorkspace(planOptions());
  const next=$('#ps-panel');if(next)next.scrollTop=['tab','inspect'].includes(focusAction)?0:scroll;
  if(focusAction){
    const button=$$('[data-plan-action]').find(el=>el.dataset.planAction===focusAction&&el.dataset.planValue===String(focusValue));
    button?.focus({preventScroll:true});
  }
  $('#plan-live-announcement').textContent=`Plan bijgewerkt. Besparing ${money(state.report.savings)} per jaar. Investering ${range(state.report.investmentLow,state.report.investmentHigh)}.`;
  if(state.reportSent && state.reportSent.reportKey!==reportPlanKey()) {
    state.reportSent=null;
    const receipt=$('#report-success');if(receipt)receipt.outerHTML=renderReportDelivery();
  }
}
let planReturnFromSettings=false;
$('#tool-dialog').addEventListener('click',event=>{
  const target=event.target.closest('[data-plan-action]');if(!target)return;
  const action=target.dataset.planAction,value=target.dataset.planValue;
  if(action==='tab'){planUI.tab=value;planUI.inspected=null;}
  else if(action==='period')planUI.period=value;
  else if(action==='chart')planUI.chart=value;
  else if(action==='year')changeInput('year',Number(value));
  else if(action==='toggle')toggleUpgrade(value);
  else if(action==='recommend')recommend();
  else if(action==='undo')undo();
  else if(action==='inspect'){planUI.tab='measures';planUI.inspected=planUI.inspected===value?null:value;}
  else if(action==='reference'){const r=state.report;planUI.reference={year:r.year,savings:r.savings,investmentLow:r.investmentLow,investmentHigh:r.investmentHigh};}
  else if(action==='clear-reference')planUI.reference=null;
  else if(action==='dialog'){planReturnFromSettings=true;DIALOGS[value]?.();return;}
  updatePlanWorkspace(action==='inspect'?'inspect':action,value);
});
$('#tool-dialog').addEventListener('keydown',event=>{
  if(event.key==='Tab'){
    const dialog=event.currentTarget;
    const items=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')]
      .filter(el=>el.tabIndex>=0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
    const first=items[0],last=items.at(-1),active=document.activeElement;
    if(items.length&&(!items.includes(active)||(event.shiftKey&&active===first)||(!event.shiftKey&&active===last))){
      event.preventDefault();(event.shiftKey?last:first).focus();
    }
    return;
  }
  const tab=event.target.closest('[role="tab"][data-plan-action="tab"]');
  if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const ids=['overview','measures','evidence'];let i=ids.indexOf(tab.dataset.planValue);
  i=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;
  planUI.tab=ids[i];updatePlanWorkspace('tab',planUI.tab);
});

function openPlan() {
  openDialog('plan','Jouw huis. Een slimmer plan.',planBody(),'JOUW PERSOONLIJKE ENERGIEPLAN');
  if(state.reportSent?.reportKey===reportPlanKey()){
    const el=$('#report-email-form');
    if(el)el.outerHTML=renderReportSuccess(state.reportSent.email,{newsletterEnabled:state.session?.newsletterOptInEnabled===true,newsletterSubscribed:state.reportSent.newsletterSubscribed===true});
    return;
  }
  track('scan_complete');
  if(document.querySelector('.preview-ribbon')){$('#report-status').textContent='Offline preview · geen e-mailverzending. Je plan blijft volledig bruikbaar.';return;} // offline demo never uses backend
  ensureSession().then(session=>{
    if(state.dialog!=='plan'||session.reportMailEnabled)return;
    const button=$('#report-send'),status=$('#report-status');
    if(button)button.disabled=true;
    const email=$('#report-email');if(email){email.disabled=true;email.placeholder='Rapportmail wordt ingericht';}
    if(status)status.textContent='Rapportmail wordt ingericht. Je kunt je plan wel gratis bekijken en je huis bewaren.';
  }).catch(()=>{
    if(state.dialog!=='plan')return;
    const button=$('#report-send'),status=$('#report-status');
    if(button)button.disabled=true;
    const email=$('#report-email');if(email){email.disabled=true;email.placeholder='Rapportmail wordt ingericht';}
    if(status)status.textContent='Rapportmail is op dit moment niet beschikbaar. De berekening blijft gratis.';
  });
}
function saveHome() {try{localStorage.setItem(STORE_HOME,JSON.stringify({...snapshot(),savedAt:new Date().toISOString()}));toast('Je huis en plan zijn op dit apparaat bewaard. Contactgegevens worden niet bewaard.');renderControls();}catch{toast('Bewaren is niet mogelijk in deze browser. Je kunt de berekening wel blijven bekijken.');}}
function restoreHome() {
  try{const saved=JSON.parse(localStorage.getItem(STORE_HOME));if(!saved?.input||!Array.isArray(saved.selectedIds))throw new Error();const r=simulateHome(saved.input,saved.selectedIds);remember();state.input=r.input;state.selectedIds=r.selectedIds;state.personalized=Boolean(saved.personalized);state.tariffsEdited=Boolean(saved.tariffsEdited);state.view='plan';refresh();toast('Je bewaarde huis is terug.');}catch{toast('Het bewaarde huis kon niet worden geopend. Je huidige huis blijft staan.');}
}
function openPrivacy() {
  openDialog('privacy','Jouw gegevens blijven van jou.',`<p class="dialog-intro">Spelen en rekenen gebeurt in je browser. Je woninggegevens gaan alleen mee als je zelf een adviesaanvraag doet. Bij een rapportmail worden enkel de beperkte plansamenvatting en je e-mailadres verzonden voor bezorging.</p><label class="checkbox-line"><input id="analytics-consent" type="checkbox" ${state.analytics?'checked':''}><span>Ik help WattGoedkoper verbeteren met anonieme tellingen van gebruik. Dit is optioneel; mijn woning- en contactgegevens worden niet in deze tellingen opgenomen.</span></label><div class="dialog-actions"><button class="button button-yellow" data-save-privacy>Bewaar mijn voorkeur</button><button class="button button-ghost" data-delete-home>Verwijder bewaard huis</button></div><p class="dialog-note">Een huis bewaren gebeurt alleen als je daar zelf voor kiest. <a href="/privacy.html">Lees de privacyverklaring.</a></p>`,'JIJ HOUDT DE REGIE');
}

function openAdvice() {
  const isReportEntryWithoutPlan = location.hash === '#advies' && !state.personalized && state.selectedIds.length === 0;
  const html=[
    isReportEntryWithoutPlan
      ? '<p class="dialog-intro">Kom je vanuit je gemailde energieplan? Dat rapport wordt op dit apparaat niet automatisch geladen of meegestuurd. Vermeld in je toelichting de maatregelen of bedragen die je wilt bespreken. NIVO neemt alleen contact op na je toestemming hieronder.</p>'
      : '<p class="dialog-intro">Wil je dat er iemand met je meedenkt? Laat een contactmogelijkheid achter. Je huidige energieplan gaat mee.</p>',
    '<form id="advice-form" class="advice-compact">',
      '<div class="dialog-grid">',
        '<div class="field"><label for="lead-name">Je naam</label><input id="lead-name" name="name" autocomplete="name" maxlength="100" required></div>',
        '<div class="field"><label for="lead-postcode">Postcode <small>(optioneel)</small></label><input id="lead-postcode" name="postcode" autocomplete="postal-code" maxlength="7" pattern="[1-9][0-9]{3} ?[A-Za-z]{2}" placeholder="1234 AB"></div>',
        '<div class="field"><label for="lead-email">E-mailadres</label><input id="lead-email" name="email" type="email" autocomplete="email" maxlength="254"></div>',
        '<div class="field"><label for="lead-phone">Telefoonnummer</label><input id="lead-phone" name="phone" type="tel" autocomplete="tel" maxlength="30"><small class="field-help">E-mail of telefoon is voldoende.</small></div>',
      '</div>',
      '<div class="field"><label for="lead-note">Wat wil je bespreken? <small>(optioneel)</small></label>',
        '<textarea id="lead-note" name="note" rows="2" maxlength="800" placeholder="Bijvoorbeeld zonnepanelen of het stroomverbruik"></textarea></div>',
      '<div class="honeypot" aria-hidden="true"><label>Laat leeg<input name="website" tabindex="-1" autocomplete="off"></label></div>',
      '<label class="checkbox-line"><input type="checkbox" name="consent" required><span>',
        'Ik wil dat <strong>NIVO Groep Holland</strong> contact met mij opneemt over mijn energieplan. ',
        'NIVO mag hiervoor mijn contactgegevens, meegestuurde energie-informatie en berekende indicatie gebruiken. ',
        'Ik heb de <a href="/privacy.html" target="_blank" rel="noopener">privacyverklaring</a> gelezen. ',
        'Ik kan mijn verzoek intrekken.</span></label>',
      '<div id="advice-error" class="form-error" role="alert" hidden></div>',
      '<div class="dialog-actions"><button type="submit" class="button button-yellow" id="lead-submit">Bespreek mijn energieplan ' + icon('arrow') + '</button>',
        '<button type="button" class="text-button" data-dialog="plan">Terug naar mijn plan</button></div>',
      '<p class="dialog-note">Dit is een aparte, vrijwillige adviesaanvraag. Een rapportmail alleen geeft geen toestemming voor contact.</p>',
    '</form>'
  ].join('');
  openDialog('advice','Een vraag over je energieplan?',html,'PERSOONLIJK ADVIES, ALLEEN ALS JIJ DAT WILT');
  $('#advice-form').addEventListener('submit',submitLead);
  track('advice_open');
  ensureSession().catch(error=>{if(state.dialog==='advice')showError($('#advice-error'),error.message);});
}
async function ensureSession() {
  if(state.session)return state.session;if(state.sessionPromise)return state.sessionPromise;
  state.sessionPromise=(async()=>{
    let response;try{response=await fetch('/api/index.php?action=session',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});}catch{throw new Error('Aanvragen zijn nu niet beschikbaar. Je kunt je energiehuis wel gewoon gebruiken.');}
    let data;try{data=await response.json();}catch{throw new Error('Adviesaanvragen zijn nog niet beschikbaar. Je energiehuis blijft volledig werken.');}
    if(!response.ok||!data.ok||!data.configured||!data.csrf)throw new Error('Adviesaanvragen zijn nog niet beschikbaar. Je kunt je plan wel bewaren.');state.session={csrf:data.csrf,createdAt:data.createdAt,reportMailEnabled:data.reportMailEnabled===true,newsletterOptInEnabled:data.newsletterOptInEnabled===true};return state.session;
  })().finally(()=>{state.sessionPromise=null;});return state.sessionPromise;
}
async function apiPost(action,body) {
  const session=await ensureSession();let response;
  try{response=await fetch(`/api/index.php?action=${encodeURIComponent(action)}`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrf,Accept:'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});}catch{throw new Error(action==='report_email'?'De verbinding is onderbroken. De rapportmail kan een onzekere verzendstatus hebben; controleer eerst je inbox.':'De verbinding is onderbroken. Je aanvraag is nog niet bevestigd. Probeer opnieuw; dezelfde aanvraag wordt niet dubbel opgeslagen.');}
  let data;try{data=await response.json();}catch{throw new Error(action==='report_email'?'De mailserver heeft de verzending niet bevestigd. Controleer je inbox voordat je opnieuw probeert.':'Je aanvraag is niet bevestigd. Probeer het later opnieuw.');}
  if(!response.ok||!data.ok){if(response.status===403)state.session=null;throw new Error(data.error?.code==='SETUP_REQUIRED'?'Aanvragen zijn nog niet beschikbaar. Bewaar je plan op je apparaat.':data.error?.message||'Je aanvraag is niet bevestigd. Controleer je gegevens en probeer opnieuw.');}return data;
}
async function submitReport(event) {
  event.preventDefault();
  // Listener is delegated from the dialog: use the actual submitting form.
  const form=event.target;
  if(!form.reportValidity())return;
  const email=String(new FormData(form).get('email')||'').trim().toLowerCase();
  const status=$('#report-status'),button=$('#report-send');
  if(!email||!form.reportValidity())return;
  if(document.querySelector('.preview-ribbon')){
    showError(status,'Dit is een offline preview. Er worden geen e-mails verstuurd.');
    status.classList.add('is-error');return;
  }
  const report=reportSnapshot();
  const fingerprint=JSON.stringify({email,report});
  if(state.reportFingerprint!==fingerprint){
    state.reportFingerprint=fingerprint;state.reportKey=crypto.randomUUID();
  }
  const payload={email,report,idempotencyKey:state.reportKey,website:''};
  button.disabled=true;button.textContent='Rapport verzenden…';
  status.textContent='We controleren je verzoek…';status.classList.remove('is-error','is-success');
  try{
    const result=await apiPost('report_email',payload);
    if(!result.accepted)throw new Error('De verzendstatus kon niet worden bevestigd.');
    state.reportSent={email,reportKey:JSON.stringify(report)};
    displayReportSuccess(email);
  }catch(error){
    status.textContent=error.message;status.classList.add('is-error');
  }finally{
    if($('#report-send')){button.disabled=false;button.innerHTML='Mail mijn energieplan '+icon('arrow');}
  }
}

async function requestNewsletterOptIn() {
  if(!state.reportSent || state.reportSent.newsletterSubscribed || state.session?.newsletterOptInEnabled!==true)return;
  const button=$('#newsletter-join');if(!button)return;
  button.disabled=true;button.textContent='Bevestiging aanvragen…';
  try{
    const answer=await apiPost('newsletter_subscribe',{email:state.reportSent.email,consent:true,consentVersion:'2026-11-newsletter-v2-single',website:''});
    if(answer.subscribed!==true)throw new Error('Je aanmelding is nog niet bevestigd door de server.');
    state.reportSent.newsletterSubscribed=true;
    const success=$('#report-success');
    if(success)success.outerHTML=renderReportSuccess(state.reportSent.email,{newsletterEnabled:true,newsletterSubscribed:true});
    toast('Je bent aangemeld voor energietips. Afmelden kan via iedere e-mail.');
  }catch(error){
    button.disabled=false;button.textContent='Ja, meld mij aan ↗';
    let notice=$('#newsletter-error');
    if(!notice){notice=document.createElement('small');notice.id='newsletter-error';notice.setAttribute('role','alert');button.after(notice);}
    notice.textContent=error.message;
  }
}
async function submitLead(event) {
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const data=new FormData(form),email=String(data.get('email')||'').trim(),phone=String(data.get('phone')||'').trim(),errorElement=$('#advice-error');
  if(!email&&!phone){showError(errorElement,'Vul een e-mailadres of telefoonnummer in, zodat de adviseur je kan bereiken.');$('#lead-email').focus();return;}
  if(phone&&(!/^[+\d\s().-]+$/.test(phone)||phone.replace(/\D/g,'').length<8||phone.replace(/\D/g,'').length>15)){showError(errorElement,'Controleer je telefoonnummer. Gebruik 8 tot 15 cijfers.');$('#lead-phone').focus();return;}
  const r=state.report;
  const payload={name:String(data.get('name')||'').trim(),email,phone,postcode:String(data.get('postcode')||'').trim().toUpperCase(),partner:'nivo',interests:[...new Set(r.selectedIds.filter(id=>['solar','battery','heatpump','insulation'].includes(id)).concat('planning'))],consent:data.get('consent')==='on',consentVersion:'2026-11-v2',analyticsConsent:state.analytics,website:String(data.get('website')||''),inputs:{...state.input},summary:{modelVersion:MODEL_VERSION,year:r.year,annualSavingsLow:r.savingsLow,annualSavingsHigh:r.savingsHigh,investmentLow:r.investmentLow,investmentHigh:r.investmentHigh,baselineAnnualCost:r.baseline.bill.total,plannedAnnualCost:r.scenario.bill.total,selectedIds:[...r.selectedIds]},note:`${!state.personalized && r.selectedIds.length===0 ? 'Let op: ongewijzigd voorbeeldhuis. Geen persoonlijke woninginstellingen geladen; vraag bij opvolging naar het eigen rapport of werkelijke cijfers.' : 'Gekozen in het energiehuis: '+r.selectedIds.map(labelFor).join(', ')+'.'}\n${String(data.get('note')||'').trim()}`.slice(0,1000)};
  const fingerprint=JSON.stringify(payload);if(fingerprint!==state.leadFingerprint){state.leadFingerprint=fingerprint;state.leadKey=crypto.randomUUID();}payload.idempotencyKey=state.leadKey;const button=$('#lead-submit');button.disabled=true;button.textContent='Je aanvraag wordt opgeslagen…';errorElement.hidden=true;
  try{const receipt=await apiPost('leads',payload);if(!receipt.id)throw new Error('Je aanvraag is niet bevestigd. Probeer opnieuw.');if(state.dialog==='advice')openDialog('receipt','Je plan is goed ontvangen.',`<p class="dialog-intro">Je aanvraag is opgeslagen voor NIVO Groep Holland en staat klaar voor opvolging.</p><p>Ontvangstnummer: <code>${escape(receipt.id)}</code></p><button class="button button-yellow" data-dialog="plan">Terug naar mijn energieplan ↗</button>`,'AANVRAAG OPGESLAGEN');}catch(error){if(state.dialog==='advice'){showError(errorElement,error.message);button.disabled=false;button.innerHTML=`Bespreek mijn plan ${icon('arrow')}`;}}
}
async function track(event) {if(!state.analytics)return;try{await apiPost('events',{event,consent:true});}catch{/* Measurement never blocks the energy house. */}}

const DIALOGS={house:openHouseDetails,usage:openUsage,tariffs:openTariffs,contract:openContract,solar:openSolar,battery:openBattery,budget:openBudget,investments:openInvestments,plan:openPlan,privacy:openPrivacy,advice:openAdvice};
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.tab){state.tab=button.dataset.tab;renderControls();}
  else if(button.hasAttribute('data-field')){const key=button.dataset.field,raw=button.dataset.value,value=typeof DEFAULT_INPUT[key]==='boolean'?raw==='true':typeof DEFAULT_INPUT[key]==='number'?Number(raw):raw;changeInput(key,value);}
  else if(button.dataset.toggle)changeInput(button.dataset.toggle,!state.input[button.dataset.toggle]);
  else if(button.dataset.step)changeInput('people',Math.max(1,Math.min(15,state.input.people+Number(button.dataset.step))));
  else if(button.dataset.view){state.view=button.dataset.view;updateScene();}
  else if(button.dataset.upgrade)toggleUpgrade(button.dataset.upgrade);
  else if(button.dataset.upgradeInfo)openUpgrade(button.dataset.upgradeInfo);
  else if(button.dataset.dialogToggle){const id=button.dataset.dialogToggle;closeDialog();toggleUpgrade(id);}
  else if(button.dataset.combo){remember();state.selectedIds=[...new Set([...state.selectedIds,...button.dataset.combo.split(',')])];state.view='plan';startInteraction();closeDialog();refresh();toast('Je combinatie staat op het huis. Bekijk wat er verandert.');}
  else if(button.dataset.dialog)DIALOGS[button.dataset.dialog]?.();
  else if(button.hasAttribute('data-recommend'))recommend();
  else if(button.hasAttribute('data-undo'))undo();
  else if(button.hasAttribute('data-close'))closeDialog();
  else if(button.dataset.usageMode){const draft={...state.input};for(const [key,value] of new FormData($('#settings-form')).entries())if(key in DEFAULT_INPUT&&value!=='')draft[key]=typeof DEFAULT_INPUT[key]==='number'?Number(value):value;draft.usageKnown=true;openUsage(button.dataset.usageMode,draft);}
  else if(button.hasAttribute('data-use-estimate')){changeInput('usageKnown',false);closeDialog();toast('Je huis rekent weer met de verbruiksschatting.');}
  else if(button.hasAttribute('data-save'))saveHome();
  else if(button.hasAttribute('data-restore'))restoreHome();
  else if(button.hasAttribute('data-report-reset')){state.reportSent=null;const receipt=$('#report-success');if(receipt)receipt.outerHTML=renderReportDelivery();$('#report-email')?.focus();}
  else if(button.id==='newsletter-join')requestNewsletterOptIn();
  else if(button.hasAttribute('data-delete-home')){try{localStorage.removeItem(STORE_HOME);localStorage.removeItem('wattgoedkoper-scan-v1');renderControls();toast('Het bewaarde huis is van dit apparaat verwijderd.');}catch{toast('Opslag is niet toegankelijk in deze browser.');}}
  else if(button.hasAttribute('data-save-privacy')){const previous=state.analytics;state.analytics=$('#analytics-consent').checked;try{localStorage.setItem(STORE_ANALYTICS,state.analytics?'yes':'no');}catch{}closeDialog();toast(state.analytics?'Gebruiksstatistieken staan aan.':'Gebruiksstatistieken staan uit.');if(state.analytics&&!previous)track('page_view');}
  else if(button.hasAttribute('data-print')){openPlan();$$('.plan-assumptions').forEach(item=>item.open=true);window.print();}
});
// Lightweight first-screen shortcuts focus real controls without side effects.
$('#intro-path')?.addEventListener('click',event=>{
  const target=event.target.closest('[data-quick]');
  if(!target)return;
  if(target.dataset.quick==='house'){
    $('#tab-home').click();
    $('#tab-home').focus({preventScroll:true});
  }else if(target.dataset.quick==='measures'){
    $('#upgrade-dock button[data-upgrade="solar"]')?.focus({preventScroll:true});
  }else if(target.dataset.quick==='plan'){
    $('#open-plan').click();
  }
});
$('#open-plan').addEventListener('click',openPlan);
$('#tool-dialog').addEventListener('submit',event=>{if(event.target.id==='report-email-form')submitReport(event);});
$('#privacy-settings').addEventListener('click',openPrivacy);
$('#dialog-close').addEventListener('click',closeDialog);
$('#tool-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
$('#tool-dialog').addEventListener('click',event=>{if(event.target===$('#tool-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();}});
$('#reset-home').addEventListener('click',()=>{remember();state.input={...DEFAULT_INPUT};state.selectedIds=[];state.personalized=false;state.tariffsEdited=false;state.view='current';state.daylight=65;$('#day-control').value='65';refresh();toast('Terug naar het voorbeeldhuis. Je kunt deze stap nog ongedaan maken.');});
$('#day-control').addEventListener('input',event=>{state.daylight=Number(event.target.value);updateScene();});
$('#home-controls').addEventListener('input',event=>{const target=event.target;if(!target.matches('[data-range]'))return;const key=target.dataset.range,output=$(`[data-output="${key}"]`),unit=output?.dataset.unit||'',display=unit==='€'?money(target.value):`${Number(target.step)<1?precise(target.value):number(target.value)} ${unit}`;if(output)output.textContent=display;target.setAttribute('aria-valuetext',display);if(!target.dataset.dragStarted){remember();target.dataset.dragStarted='yes';}changeInput(key,Number(target.value),{controls:false,record:false});if(key==='panels'&&$('[data-solar-price]'))$('[data-solar-price]').textContent=money(state.input.solarInvestment);});
$('#home-controls').addEventListener('change',event=>{if(event.target.matches('[data-range]'))delete event.target.dataset.dragStarted;});
$('#tool-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=$$('[data-tab]',$('#tool-tabs'));let index=tabs.findIndex(tab=>tab.dataset.tab===state.tab);index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;state.tab=tabs[index].dataset.tab;renderControls();tabs[index].focus();});
$('#upgrade-dock').addEventListener('dragstart',event=>{const card=event.target.closest('[data-drag-upgrade]');if(!card||card.getAttribute('draggable')!=='true')return;event.dataTransfer.setData('text/plain',card.dataset.dragUpgrade);event.dataTransfer.effectAllowed='copy';$('#scene-stage').classList.add('is-drop-ready');});
$('#upgrade-dock').addEventListener('dragend',()=>$('#scene-stage').classList.remove('is-drop-ready','is-drag-over'));
$('#scene-stage').addEventListener('dragover',event=>{if(!$('#scene-stage').classList.contains('is-drop-ready'))return;event.preventDefault();event.dataTransfer.dropEffect='copy';$('#scene-stage').classList.add('is-drag-over');});
$('#scene-stage').addEventListener('dragleave',event=>{if(!$('#scene-stage').contains(event.relatedTarget))$('#scene-stage').classList.remove('is-drag-over');});
$('#scene-stage').addEventListener('drop',event=>{event.preventDefault();$('#scene-stage').classList.remove('is-drop-ready','is-drag-over');const id=event.dataTransfer.getData('text/plain');if(UPGRADES.some(u=>u.id===id)){if(state.selectedIds.includes(id)){toast('Deze upgrade staat al in je plan. Klik erop om hem weg te halen.');return;}toggleUpgrade(id);}});
refresh();
if(state.analytics)track('page_view');
// A knowledge page may open a relevant explanation, but may never change choices.
function showContentEntry(){
  if(location.hash==='#advies'){openAdvice();return;}
  const entry=resolveContextEntry(location.hash);
  if(!entry)return;
  if(entry.kind==='upgrade')openUpgrade(entry.id);
  else if(entry.kind==='plan')openPlan();
}
window.addEventListener('hashchange',showContentEntry);
window.addEventListener('wg:content-entry',event=>{
  const entry=resolveContextEntry(event.detail);
  if(entry?.kind==='upgrade')openUpgrade(entry.id);
  else if(entry?.kind==='plan')openPlan();
});
showContentEntry();

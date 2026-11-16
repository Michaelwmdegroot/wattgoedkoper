/**
 * Plan Studio: inspectable views over the unchanged annual simulation.
 * No chart invents data, no marginal effects are added, no contact data is stored.
 */
const ART = {
  solar:'/assets/images/solar-card.webp',battery:'/assets/images/battery-card.webp',
  insulation:'/assets/images/insulation-card.webp',heatpump:'/assets/images/heatpump-card.webp',
  'smart-use':'/assets/images/smart-use-card.webp',
};
const HOUSES = {
  terraced:['Rijwoning','/assets/images/hero-terraced-base.webp'],
  corner:['Hoekwoning','/assets/images/hero-corner-base.webp'],
  semi:['Twee-onder-een-kap','/assets/images/hero-semi-base.webp'],
  detached:['Vrijstaand','/assets/images/hero-detached-base.webp'],
  apartment:['Appartement','/assets/images/hero-apartment-base.webp'],
};
const LABELS = {'smart-use':'Slim verbruik',solar:'Zonnepanelen',battery:'Thuisbatterij',insulation:'Isolatie',heatpump:'Warmtepomp'};
const ESC = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro = n => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const num = n => new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(n);
const interval = (a,b) => Math.round(a)===Math.round(b)?euro(a):`${euro(a)} – ${euro(b)}`;
const percent = n => num(n)+'%';
const btn = (action,value,label,extra='') => `<button type="button" data-plan-action="${action}" data-plan-value="${ESC(value)}" ${extra}>${label}</button>`;
const arrow = '<span aria-hidden="true">↗</span>';

/** Shared signed scale, including a truthful zero line and negative annual costs. */
export function comparisonScale(values) {
  const min=Math.min(0,...values), max=Math.max(0,...values), span=max-min||1;
  return {zero:min===0?0:-min/span*100, bars:values.map(value=>({left:(Math.min(0,value)-min)/span*100,width:Math.abs(value)/span*100,negative:value<0}))};
}
export function planInsights(r) {
  const b=r.baseline.flow,p=r.scenario.flow;
  return {
    gridChange:b.gridImport-p.gridImport,
    gasChange:b.gasUse-p.gasUse,
    ownChange:r.scenario.selfSufficiency-r.baseline.selfSufficiency,
    costPercent:r.baseline.bill.total>0?r.savings/r.baseline.bill.total*100:null,
    ownKwh:p.selfUse+(p.batteryDelivered||0),
    warnings:[
      ...(!r.selectedIds.length?['Nog geen maatregelen gekozen. Stel zelf een plan samen of probeer een startplan.']:[]),
      ...(r.savings<=0&&r.selectedIds.length?['Dit plan verlaagt je variabele jaarkosten niet. Meer eigen stroom is niet automatisch voordeliger.']:[]),
      ...(r.budget.exceeded?[`De hoge investeringsschatting ligt ${euro(r.budget.overBy)} boven je budget.`]:[]),
    ],
  };
}
function sectionTitle(kicker,title,action='') {
  return `<div class="ps-section-title"><div><span class="ps-eyebrow">${kicker}</span><h3>${title}</h3></div>${action}</div>`;
}
function segment(action,values,current,label) {
  return `<div class="ps-segment" role="group" aria-label="${label}">${values.map(([value,text])=>btn(action,value,text,`aria-pressed="${String(current)===String(value)}"`)).join('')}</div>`;
}
function financialHero(r,ui,personalized) {
  const [home,image]=HOUSES[r.input.homeType]||HOUSES.terraced;
  const divisor=ui.period==='month'?12:1, period=ui.period==='month'?'gemiddeld per maand':'per jaar';
  const noPlan=!r.selectedIds.length, negative=r.savings<0;
  const share=planInsights(r).costPercent;
  return `<aside class="ps-hero ${ui.reference?'has-reference':''}" aria-label="Financieel overzicht">
    <div class="ps-house"><img src="${image}" width="505" height="337" alt="Illustratie van een ${home.toLowerCase()}" decoding="async"><div class="ps-house-caption"><span>${personalized?'Jouw':'Voorbeeld'} ${ESC(home.toLowerCase())}</span><span>${num(r.input.area)} m² · ${r.input.people} pers.</span></div></div>
    <div class="ps-hero-body">
      <div class="ps-hero-label"><span>JOUW MOGELIJKE BESPARING</span>${segment('period',[['year','Jaar'],['month','Maand']],ui.period,'Bedragen per jaar of maand')}</div>
      <div class="plan-metric-highlight ps-primary-metric"><strong class="ps-savings ${negative?'ps-negative':''}">${euro(r.savings/divisor)}</strong><span>${period}${share!==null&&r.savings>0?` <b>${num(share)}% lager</b>`:''}</span></div>
      <div class="ps-range"><span>Indicatieve bandbreedte</span><strong>${interval(r.savingsLow/divisor,r.savingsHigh/divisor)}</strong></div>
      <p class="ps-hero-footnote">${ui.period==='month'?'Jaarsimulatie ÷ 12, geen maandprognose.':'Variabele energiekosten, geen volledige rekening.'}</p>
      ${ui.reference?`<div class="ps-hero-reference"><div><span>Variant ${ui.reference.year} · ${euro(ui.reference.savings)}/jaar</span>${btn('clear-reference','','×','aria-label="Verwijder vastgezette variant"')}</div><strong>${euro(Math.abs(r.savings-ui.reference.savings))} ${r.savings>=ui.reference.savings?'meer':'minder'} besparing/jaar</strong><small>Investering variant: ${interval(ui.reference.investmentLow,ui.reference.investmentHigh)}</small></div>`:''}
      <div class="plan-metric ps-investment"><span>Eenmalige investering</span><strong>${interval(r.investmentLow,r.investmentHigh)}</strong><small>Incl. installatie · vóór subsidie</small></div>
      <div class="ps-budget"><div><span>Jouw budget</span>${btn('dialog','budget',`${euro(r.budget.amount)} ↗`,'aria-label="Pas investeringsbudget aan"')}</div><div class="ps-budget-track" aria-hidden="true"><span class="${r.budget.exceeded?'over':''}" style="width:${Math.min(100,r.budget.amount>0?r.investmentHigh/r.budget.amount*100:noPlan?0:100)}%"></span></div><small>${r.budget.exceeded?'Boven budget · keuzes blijven staan':noPlan?'Je kiest zelf wat past':'Hoge investeringsschatting binnen budget'}</small></div>
    </div>
  </aside>`;
}
function chart(r,ui) {
  const energy=ui.chart==='energy', d=ui.period==='month'&&!energy?12:1;
  const a=(energy?r.baseline.flow.gridImport:r.baseline.bill.total)/d;
  const b=(energy?r.scenario.flow.gridImport:r.scenario.bill.total)/d;
  const scale=comparisonScale([a,b]),value=n=>energy?`${num(n)} kWh`:euro(n);
  const rows=[['Zoals het nu is',a,'before'],['Met jouw plan',b,'after']].map(([label,n,kind],i)=>`<div class="ps-chart-row"><div><span><i class="ps-dot ${kind}"></i>${label}</span><strong>${value(n)}</strong></div><div class="ps-chart-track"><span class="ps-chart-zero" style="left:${scale.zero}%"></span><span class="ps-chart-fill ${kind}" style="left:${scale.bars[i].left}%;width:${scale.bars[i].width}%"></span></div></div>`).join('');
  const diff=a-b;
  const insight=energy?`${num(Math.abs(diff))} kWh ${diff>=0?'minder':'meer'} stroom van het net`:`${euro(Math.abs(diff))} ${diff>=0?'lagere':'hogere'} variabele kosten`;
  return `<section class="plan-compare ps-comparison" aria-label="Vergelijking huidige situatie en jouw plan">
    ${sectionTitle('01 / HET VERSCHIL',energy?'Minder stroom inkopen?':'Wat verandert er voor jou?',segment('chart',[['cost','Kosten'],['energy','Stroom']],ui.chart,'Grafiek tonen'))}
    <div class="ps-chart" role="img" aria-label="${energy?'Netafname per jaar':'Variabele kosten'}: nu ${value(a)}, met plan ${value(b)}. De balken gebruiken dezelfde schaal.">${rows}</div>
    <div class="ps-chart-conclusion"><strong>${insight}</strong><span>${energy?'per jaar':ui.period==='month'?'gemiddeld per maand':'per jaar'}</span></div>
    <p class="ps-chart-note">${energy?'Ingekochte stroom ≠ totaal stroomverbruik.':'Centrale schatting · dezelfde schaal · stroom en gas samen.'}</p>
  </section>`;
}
function energyCard(r) {
  const i=planInsights(r),own=r.scenario.selfSufficiency;
  const gas=`${num(Math.abs(i.gasChange))} m³ ${i.gasChange>=0?'minder':'meer'}`;
  return `<section class="ps-energy" aria-label="Eigen stroom en gas"><div class="ps-energy-ring" style="--share:${own}%" role="img" aria-label="${percent(own)} van je stroomverbruik uit eigen opwek"><div><strong>${percent(own)}</strong><span>eigen stroom</span></div></div><div class="ps-energy-copy"><strong>Jouw eigen stroom.</strong><span>${percent(r.baseline.selfSufficiency)} nu <b aria-hidden="true">→</b> ${percent(own)} met je plan</span><p>Aandeel van je stroomverbruik uit eigen opwek, incl. batterij.</p></div><div class="ps-gas-change"><span>Gas per jaar</span><strong>${gas}</strong></div></section>`;
}
function chosenMeasures(r) {
  const chosen=r.available.filter(x=>x.selected);
  return `<section class="plan-measure-card ps-selected" aria-label="Gekozen maatregelen">
    ${sectionTitle('02 / JOUW COMBINATIE',chosen.length?`${chosen.length} ${chosen.length===1?'stap':'stappen'} naar jouw energiehuis`:'Wat past bij jouw huis?',btn('tab','measures',`Pas je plan aan ${arrow}`,'class="ps-text-action"'))}
    ${chosen.length?`<div class="ps-mini-measures">${chosen.map(u=>btn('inspect',u.id,`<img src="${ART[u.id]}" alt="" width="90" height="60"><span>${LABELS[u.id]}</span><i aria-hidden="true">✓</i>`,`class="ps-mini-measure" aria-label="Bekijk effect van ${LABELS[u.id]}"`)).join('')}</div>`:
      `<div class="ps-empty-plan"><div><strong>Een goed plan begint met proberen.</strong><p>Er is nog niets geselecteerd. Je ziet je huidige situatie, geen verzonnen besparing.</p></div>${btn('recommend','',`Probeer een startplan ${arrow}`,'class="ps-yellow-action"')}</div>`}
    <p class="ps-mini-note">Eén combinatie, opnieuw doorgerekend. Losse besparingen worden niet opgeteld.</p>
  </section>`;
}
function measures(r,ui) {
  const active=r.available.find(x=>x.id===ui.inspected);
  return `<section class="ps-measures-view">
    ${sectionTitle('PROBEER. VERGELIJK. KIES.','Jij stelt je plan samen.',btn('undo','','↶ Eén stap terug',`class="ps-text-action" ${ui.canUndo?'':'disabled'}`))}
    <p class="ps-view-intro">Zet een maatregel aan of uit. Je hele plan wordt direct opnieuw berekend.</p>
    <div class="ps-measure-list">${r.available.map(u=>{
      const usable=u.eligible||u.selected;
      const value=usable?`${u.marginalSavings>=0?'+':'−'} ${euro(Math.abs(u.marginalSavings))}/jaar`:u.existing?'Al aanwezig':'Eerst afstemmen';
      return `<article class="ps-measure ${u.selected?'selected':''}"><img src="${ART[u.id]}" width="66" height="48" alt=""><div class="ps-measure-title"><strong>${LABELS[u.id]}</strong><span>${u.investmentHigh?interval(u.investmentLow,u.investmentHigh):'Geen extra investering'}</span></div><span class="ps-marginal ${u.marginalSavings<0?'negative':''}">${value}</span>${btn('inspect',u.id,'i',`class="ps-info" aria-label="Uitleg bij ${LABELS[u.id]}" aria-expanded="${ui.inspected===u.id}"`)}${btn('toggle',u.id,`<span></span>`,`class="ps-toggle" aria-pressed="${u.selected}" aria-label="${LABELS[u.id]} ${u.selected?'uit':'aan'}zetten" ${usable?'':`disabled title="${ESC(u.reason)}"`}`)}</article>`;
    }).join('')}</div>
    <div class="ps-impact-note">${active?`<strong>${LABELS[active.id]} in jouw combinatie</strong><p>${ESC(active.reason)} ${active.eligible?`Het getoonde bedrag is het effect van ${active.selected?'weghalen':'toevoegen'} in deze combinatie, niet een losse opbrengst.`:''} ${active.affectedIds.length>1?`Deze wijziging beïnvloedt ook ${active.affectedIds.filter(x=>x!==active.id).map(x=>LABELS[x]).join(' en ')}.`:''}</p>${['solar','battery'].includes(active.id)?btn('dialog',active.id,active.id==='solar'?'Paneelaantal en dak aanpassen ↗':'Batterijcapaciteit aanpassen ↗','class="ps-text-action"'):''}`:'<p>De bedragen tonen het extra effect in jouw combinatie. Tel ze niet op; overlap en afhankelijkheden zijn al verwerkt.</p>'}</div>
  </section>`;
}
function evidence(r,ui,tariffsEdited) {
  const rows=[['Stroomverbruik','electricityUse','kWh'],['Afname stroomnet','gridImport','kWh'],['Zonnestroom opgewekt','pvProduction','kWh'],['Teruglevering','gridExport','kWh'],['Gasverbruik','gasUse','m³']];
  return `<section class="ps-evidence-view">
    ${sectionTitle('GEEN BLACK BOX','Dit zit achter jouw plan.')}
    <div class="ps-evidence-flags"><span>${r.input.usageKnown?'✓ Verbruik ingevuld':'! Verbruik geschat'}</span><span>${tariffsEdited?'✓ Tarieven aangepast':'! Voorbeeldtarieven'}</span><span>Rekenjaar ${r.year}</span></div>
    <div class="ps-evidence-controls">${btn('dialog','usage','Pas verbruik aan ↗','class="ps-text-action"')}${btn('dialog','tariffs','Pas tarieven aan ↗','class="ps-text-action"')}${btn('dialog','investments','Eigen offerteprijzen ↗','class="ps-text-action"')}</div>
    <div class="ps-evidence-table"><table><caption>Jouw situatie en je plan · per jaar</caption><thead><tr><th scope="col">Energie</th><th scope="col">Nu</th><th scope="col">Met plan</th></tr></thead><tbody>${rows.map(([title,key,unit])=>`<tr><th scope="row">${title}</th><td>${num(r.baseline.flow[key])} ${unit}</td><td>${num(r.scenario.flow[key])} ${unit}</td></tr>`).join('')}<tr class="ps-table-total"><th scope="row">Variabele kosten</th><td>${euro(r.baseline.bill.total)}</td><td>${euro(r.scenario.bill.total)}</td></tr></tbody></table></div>
    <details class="plan-assumptions ps-disclosure"><summary>Aannames en beperkingen <span aria-hidden="true">↓</span></summary><p>De bandbreedte varieert de werking van maatregelen bij dezelfde tarieven. Het is geen statistisch betrouwbaarheidsinterval. Model ${ESC(r.modelVersion)}; geen offerte, meetrapport of gegarandeerd rendement.</p><ul>${r.warnings.map(t=>`<li>${ESC(t)}</li>`).join('')}</ul><dl>${r.assumptions.map(a=>`<div><dt>${ESC(a.label)}</dt><dd>${ESC(a.value)}</dd></div>`).join('')}</dl><a href="/rekenmodel.html">Rekenmethode en bronnen ↗</a></details>
  </section>`;
}
export function renderPlanWorkspace({r,ui={},personalized=false,tariffsEdited=false}) {
  const view={tab:'overview',period:'year',chart:'cost',reference:null,canUndo:false,...ui};
  const i=planInsights(r),warnings=i.warnings;
  const tabs=[['overview','Overzicht'],['measures','Maatregelen'],['evidence','Onderbouwing']];
  const content=view.tab==='measures'?measures(r,view):view.tab==='evidence'?evidence(r,view,tariffsEdited):`<div class="ps-overview-top">${chart(r,view)}${energyCard(r)}</div>${chosenMeasures(r)}`;
  return `<div class="ps-toolbar"><div class="ps-context"><span class="ps-status-dot"></span><span>${personalized?'Jouw energiehuis':'Voorbeeldwoning'} · ${r.input.usageKnown?'verbruik ingevuld':'verbruik geschat'}</span></div><div class="ps-year"><span>Rekenjaar</span>${segment('year',[[2026,'2026'],[2027,'2027']],r.year,'Rekenjaar')}</div></div>
    <div class="ps-workspace">${financialHero(r,view,personalized)}<section class="ps-main"><div class="ps-navigation"><div class="ps-tabs" role="tablist" aria-label="Energieplan werkvlakken">${tabs.map(([id,text])=>btn('tab',id,text,`role="tab" id="ps-tab-${id}" aria-selected="${view.tab===id}" tabindex="${view.tab===id?0:-1}" aria-controls="ps-panel"`)).join('')}</div>${btn('reference','',`◫ <span>${view.reference?'Variant vastgezet':'Vergelijk variant'}</span>`,`class="ps-pin" aria-label="Zet deze variant vast om wijzigingen te vergelijken" aria-pressed="${!!view.reference}"`)}</div><div id="ps-panel" role="tabpanel" aria-labelledby="ps-tab-${view.tab}" tabindex="0" class="ps-panel ${view.tab==='overview'?'ps-overview':''}">${content}</div></section></div>
    <div class="plan-notices ps-notices" aria-live="polite">${warnings.length?`<span class="ps-warning-mark" aria-hidden="true">!</span><p>${warnings.map(ESC).join(' ')}</p>`:`<span aria-hidden="true">ⓘ</span><p>${!r.input.usageKnown||!tariffsEdited?'Verbruik en/of tarieven zijn deels voorbeelden. Maak ze persoonlijk voor een betere indicatie.':'Indicatief plan op basis van jouw invoer. Geschiktheid en werkelijke kosten vragen een controle.'}</p>`}${btn('tab','evidence','Bekijk uitgangspunten ↗','class="ps-notice-link"')}</div>`;
}
// A confirmed SMTP send is a completed action. Do not leave an active email
// field/button that invites accidental duplicate sends.
const deliveryActions = '<div><button type="button" data-save class="ps-text-action">Bewaar op apparaat</button><button type="button" data-dialog="advice" class="ps-advice">Vraag vrijblijvend advies ↗</button></div>';

export function renderReportDelivery() {
  return `<form id="report-email-form" class="ps-delivery"><div class="ps-delivery-copy"><span class="ps-envelope" aria-hidden="true">✉</span><div><strong>Jouw plan. In je inbox.</strong><span>Rustig nalezen, zonder adviesverplichting.</span></div></div><div class="ps-delivery-fields"><label class="sr-only" for="report-email">E-mailadres voor je energieplan</label><input id="report-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="jouw@email.nl" aria-describedby="report-status" required><button id="report-send" type="submit" class="button button-yellow">Mail mijn energieplan <span aria-hidden="true">→</span></button></div><div class="ps-delivery-meta"><span id="report-status" role="status">Alleen rapportbezorging. Geen marketing of automatische opvolging.</span>${deliveryActions}</div></form>`;
}
export function renderReportSuccess(email, {newsletterEnabled=false,newsletterPending=false}={}) {
  const parts=String(email).split('@');
  const local=parts[0]||'';
  const address=parts.length===2 ? `${local.slice(0,Math.min(2,local.length))}•••@${parts[1]}` : 'jouw adres';
  return `<section id="report-success" class="ps-delivery ps-delivery-success" tabindex="-1" role="status" aria-live="polite"><div class="ps-delivery-copy"><span class="ps-sent-check" aria-hidden="true">✓</span><div><strong>Je rapport is verstuurd.</strong><span>Je kunt het rustig nalezen in je inbox.</span></div></div><div class="ps-sent-info"><span>Verzending bevestigd naar</span><strong>${ESC(address)}</strong><small>Geen bericht? Kijk ook in je spammap.</small>${newsletterEnabled?`<div class="ps-newsletter-prompt"><small>Ook ongeveer maandelijks bespaartips en af en toe aanbiedingen van NIVO Groep Holland ontvangen, per e-mail van WattGoedkoper? Gratis afmelden. <a href="/privacy.html" target="_blank" rel="noopener">Privacy</a></small>${newsletterPending?'<strong class="ps-newsletter-pending" role="status">Nog niet aangemeld? Controleer je inbox voor de bevestigingsmail.</strong>':'<button type="button" id="newsletter-join" class="ps-newsletter-join">Ja, stuur mij deze e-mails ↗</button>'}</div>`:''}</div><div class="ps-delivery-meta"><span>Dit is alleen rapportbezorging, geen NIVO-adviesaanvraag of marketingtoestemming.</span><div><button type="button" data-report-reset class="ps-text-action">Ander adres</button><button type="button" data-save class="ps-text-action">Bewaar op apparaat</button><button type="button" data-dialog="advice" class="ps-advice">Vraag vrijblijvend advies ↗</button></div></div></section>`;
}
export function renderPlanDashboard(options) {
  return `<div class="plan-dashboard plan-studio"><div id="plan-studio-live">${renderPlanWorkspace(options)}</div>
    ${renderReportDelivery()}
    <div id="plan-live-announcement" class="sr-only" role="status" aria-live="polite"></div></div>`;
}

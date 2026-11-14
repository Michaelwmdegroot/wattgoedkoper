const $ = (s, root = document) => root.querySelector(s);
const apiBase = '/api/index.php?action=';
const state = {csrf:null, leads:[], total:0, offset:0, status:'', current:null};
const statusNames = {new:'Nieuw',contacted:'Benaderd',qualified:'In gesprek',closed:'Afgerond'};
const partners = {nivo:'NIVO Groep Holland',tbt:'Thuisbatterij Team',either:'NIVO + Thuisbatterij Team'};
const interests = {solar:'Zonnepanelen',battery:'Thuisbatterij',heatpump:'Warmtepomp',insulation:'Isolatie',contract:'Energiecontract',planning:'Energieplan'};
const inputNames = {homeType:'Woningtype',ownership:'Eigendom',people:'Personen',buildPeriod:'Bouwperiode',area:'Oppervlakte (m²)',insulation:'Isolatie',daytime:'Aanwezig overdag',usageKnown:'Verbruik bekend',electricityUse:'Stroomverbruik (kWh/jaar)',gasUse:'Gasverbruik (m³/jaar)',hasGas:'Gasaansluiting',inputMode:'Soort invoer',gridImport:'Netafname (kWh)',gridExport:'Teruglevering (kWh)',hasSolar:'Zonnepanelen',panels:'Aantal panelen',pvProduction:'Zonnestroom (kWh)',roofAvailable:'Dak beschikbaar',roofOrientation:'Dakrichting',roofShade:'Schaduw',hasBattery:'Batterij aanwezig',batteryCapacity:'Batterijcapaciteit (kWh)',hasHeatPump:'Warmtepomp aanwezig',hasEv:'Elektrische auto',contractType:'Contract',electricityPrice:'Stroomprijs (€/kWh)',gasPrice:'Gasprijs (€/m³)',feedInPrice:'Terugleververgoeding (€/kWh)',feedInCost:'Terugleverkosten (€/kWh)',feedInCostMode:'Berekening terugleverkosten',feedInAnnualCost:'Jaarlijkse terugleverkosten',budget:'Budget (€)',goal:'Hoofddoel',year:'Rekenjaar',solarInvestment:'Investering zonnepanelen (€)',batteryInvestment:'Investering batterij (€)',alternativeElectricityPrice:'Alternatieve stroomprijs',alternativeGasPrice:'Alternatieve gasprijs',alternativeFeedInPrice:'Alternatieve terugleververgoeding',alternativeFeedInCost:'Alternatieve terugleverkosten',alternativeFixedDifference:'Verschil vaste kosten (€)',insulationInvestment:'Investering isolatie (€)',heatPumpInvestment:'Investering warmtepomp (€)',alternativeFeedInCostMode:'Berekening alternatieve terugleverkosten',alternativeFeedInAnnualCost:'Alternatieve jaarlijkse terugleverkosten'};
function el(tag, cls, text) { const node=document.createElement(tag); if(cls)node.className=cls; if(text!==undefined)node.textContent=String(text); return node; }
function message(text, success=false) { const box=$('#message'); box.textContent=text;box.classList.toggle('success',success);box.hidden=!text; }
function count(value) { return new Intl.NumberFormat('nl-NL').format(value || 0); }
function date(value) { return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'}).format(new Date(value)); }
async function api(action, body) {
  const response=await fetch(apiBase+action,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':state.csrf||''},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>({ok:false,error:{message:'De server gaf geen geldig antwoord.'}}));
  if(!response.ok||!data.ok) { const error=new Error(data.error?.message||'Dit verzoek is niet gelukt.'); error.status=response.status;error.code=data.error?.code;if(response.status===401&&action!=='admin_login')showLogin();throw error; }
  return data;
}
function showLogin() { $('#dashboard').hidden=true;$('#login-section').hidden=false;$('#logout').hidden=true; }
function showDashboard() { $('#dashboard').hidden=false;$('#login-section').hidden=true;$('#logout').hidden=false; }
async function session() { const data=await api('session');state.csrf=data.csrf;return data; }
function statCard(label, value, note) { const card=el('div','stat-card');card.append(el('div','stat-label',label),el('div','stat-value',value),el('div','stat-note',note));return card; }
function renderStats(data) {
  const t=data.totals;
  $('#stats-grid').replaceChildren(statCard('Gestarte scans',count(t.scan_start),'Met meettoestemming'),statCard('Voltooide scans',count(t.scan_complete),'Met meettoestemming'),statCard('Adviesaanvragen',count(data.leadCount),'Alle ontvangen aanvragen'),statCard('Scan → aanvraag',data.conversion===null?'—':data.conversion.toLocaleString('nl-NL')+'%','Alleen met meettoestemming'));
  $('#funnel').replaceChildren(...[['scan_start','Scans gestart'],['scan_complete','Plannen bekeken'],['advice_open','Adviesformulier geopend'],['lead_accepted','Aanvragen opgeslagen']].map(([key,label])=>{const step=el('div','funnel-step');step.append(el('strong','',count(t[key])),el('span','',label));return step;}));
  $('#retention').textContent=`Aanvragen worden na ${data.retentionDays} dagen verwijderd. Exporteer alleen wat je nodig hebt en bewaar exports veilig. De grafiek telt gebeurtenissen, geen unieke bezoekers.`;
}
function renderLeads(data) {
  state.leads=data.leads;state.total=data.total;$('#lead-count').textContent=count(data.total);
  const body=$('#lead-table');body.replaceChildren();
  if(!data.leads.length) { const row=el('tr');const cell=el('td','empty',state.status?'Er zijn geen aanvragen met deze status.':'Nog geen aanvragen. Nieuwe adviesaanvragen verschijnen hier zodra iemand het formulier verstuurt.');cell.colSpan=6;row.append(cell);body.append(row); }
  for(const lead of data.leads) {
    const row=el('tr');const person=el('td');person.append(el('strong','',lead.data.name),el('small','',lead.data.email||lead.data.phone));
    const interest=el('td');interest.append(el('span','tag',lead.data.interests.map(x=>interests[x]||x).join(', ')||'Energieplan'));
    const partner=el('td','',partners[lead.partner]||lead.partner);const received=el('td','',date(lead.createdAt));const status=el('td');status.append(el('span','tag '+lead.status,statusNames[lead.status]));
    const open=el('td');const button=el('button','text-button','Bekijk →');button.type='button';button.setAttribute('aria-label','Bekijk aanvraag van '+lead.data.name);button.addEventListener('click',()=>showDetail(lead));open.append(button);row.append(person,interest,partner,received,status,open);body.append(row);
  }
  $('#previous').disabled=state.offset===0;$('#next').disabled=state.offset+50>=state.total;
  $('#page-label').textContent=state.total?`${state.offset+1}–${Math.min(state.offset+50,state.total)} van ${state.total}`:'0 aanvragen';
}
async function refresh() {
  const [stats,leads]=await Promise.all([api('admin_stats'),api(`admin_leads&status=${encodeURIComponent(state.status)}&offset=${state.offset}`)]);
  renderStats(stats);renderLeads(leads);
}
function detailField(label,value) { const item=el('div');item.append(el('dt','',label),el('dd','',value||'Niet ingevuld'));return item; }
function showDetail(lead) {
  state.current=lead;const root=$('#lead-detail');root.replaceChildren();const d=lead.data;
  const header=el('div','detail-header');header.append(el('span','eyebrow',lead.id));const title=el('h2','',d.name);title.id='detail-title';header.append(title,el('p','',`Ontvangen op ${date(lead.createdAt)} · ${partners[lead.partner]}`));root.append(header);
  const fields=el('dl','detail-grid');fields.append(detailField('E-mailadres',d.email),detailField('Telefoonnummer',d.phone),detailField('Postcode',d.postcode),detailField('Interesse',d.interests.map(x=>interests[x]||x).join(', ')));root.append(fields);
  if(d.note){const note=el('section','detail-section');note.append(el('h3','','Toelichting'),el('p','',d.note));root.append(note);}
  const scan=el('section','detail-section');scan.append(el('h3','','Meegestuurde energiescan'),el('p','small','Deze invoer en berekening komen uit de browser. Controleer de gegevens met de klant; dit is een indicatie en geen offerte of geverifieerde meting.'));
  const inputList=el('div','input-list');for(const [key,value] of Object.entries(d.inputs||{})){const item=el('div');item.append(el('span','',inputNames[key]||key),document.createTextNode(value===true?'Ja':value===false?'Nee':value===null?'Onbekend':String(value)));inputList.append(item);}scan.append(inputList);
  if(d.summary?.modelVersion)scan.append(el('p','small',`Model ${d.summary.modelVersion} · rekenjaar ${d.summary.year||'onbekend'} · door bezoeker meegestuurde besparingsindicatie € ${d.summary.annualSavingsLow??'—'} tot € ${d.summary.annualSavingsHigh??'—'} per jaar.`));root.append(scan);
  const consent=el('section','detail-section');consent.append(el('h3','','Toestemming'),el('p','',d.consentText),el('p','small',`Versie ${d.consentVersion} · geregistreerd ${date(d.acceptedAt)} · geselecteerde partner: ${partners[lead.partner]}. Statistieken: ${d.analyticsConsent?'toegestaan':'niet toegestaan'}.`));root.append(consent);
  const actions=el('div','detail-actions');const label=el('label','','Status');label.htmlFor='detail-status';const select=el('select');select.id='detail-status';for(const [key,value] of Object.entries(statusNames)){const option=el('option','',value);option.value=key;option.selected=key===lead.status;select.append(option);}
  const save=el('button','outline-button','Opslaan');save.type='button';save.addEventListener('click',async()=>{save.disabled=true;try{await api('admin_status',{id:lead.id,status:select.value});$('#lead-dialog').close();message('Status bijgewerkt.',true);await refresh();}catch(error){message(error.message);}finally{save.disabled=false;}});
  const remove=el('button','text-button danger','Aanvraag verwijderen');remove.type='button';remove.addEventListener('click',()=>{remove.disabled=true;const confirm=el('div','confirm-delete');confirm.append(el('p','','Deze aanvraag en contactgegevens worden definitief verwijderd. Dit kan niet ongedaan worden gemaakt.'));const yes=el('button','outline-button','Definitief verwijderen');yes.addEventListener('click',async()=>{yes.disabled=true;try{await api('admin_delete',{id:lead.id});$('#lead-dialog').close();message('Aanvraag verwijderd.',true);await refresh();}catch(error){message(error.message);yes.disabled=false;}});const no=el('button','text-button','Annuleren');no.addEventListener('click',()=>{confirm.remove();remove.disabled=false;});confirm.append(yes,document.createTextNode(' '),no);root.append(confirm);});actions.append(label,select,save,remove);root.append(actions);
  $('#lead-dialog').showModal();
}
$('#login-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('button',event.currentTarget);button.disabled=true;message('');try{if(!state.csrf)await session();const data=await api('admin_login',{username:$('#username').value,password:$('#password').value});state.csrf=data.csrf;$('#password').value='';showDashboard();await refresh();}catch(error){message(error.message);}finally{button.disabled=false;}});
$('#logout').addEventListener('click',async()=>{try{await api('admin_logout',{});showLogin();await session();message('Je bent uitgelogd.',true);}catch(error){message(error.message);}});
$('#refresh').addEventListener('click',()=>refresh().catch(error=>message(error.message)));
$('#status-filter').addEventListener('change',event=>{state.status=event.target.value;state.offset=0;refresh().catch(error=>message(error.message));});
$('#previous').addEventListener('click',()=>{state.offset=Math.max(0,state.offset-50);refresh().catch(error=>message(error.message));});
$('#next').addEventListener('click',()=>{state.offset+=50;refresh().catch(error=>message(error.message));});
$('#export').addEventListener('click',async()=>{const button=$('#export');button.disabled=true;try{const response=await fetch(apiBase+'admin_export',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:'{}'});if(!response.ok){const data=await response.json();throw new Error(data.error?.message||'Exporteren is niet gelukt.');}const blob=await response.blob();const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='wattgoedkoper-aanvragen-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Export gedownload. De CSV bevat persoonsgegevens; bewaar hem veilig.',true);}catch(error){message(error.message);}finally{button.disabled=false;}});
for(const a of document.querySelectorAll('nav a[href^="#"]'))a.addEventListener('click',()=>{document.querySelectorAll('nav a').forEach(item=>item.classList.remove('active'));a.classList.add('active');});
try{const initial=await session();if(!initial.configured){message('De beveiligde serverinstallatie is nog niet voltooid. Het dashboard blijft gesloten totdat de beheerder de private configuratie heeft ingesteld.');$('#login-form button').disabled=true;}else if(initial.authenticated){showDashboard();await refresh();}}catch(error){message(error.message);}

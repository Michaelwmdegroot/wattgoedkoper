const $ = (s, root = document) => root.querySelector(s);
const apiBase = '/api/index.php?action=';
const state = {csrf:null, leads:[], total:0, offset:0, status:'', search:'', current:null};
const statusNames = {new:'Nieuw',contacted:'Benaderd',qualified:'In gesprek',closed:'Afgerond'};
const deliveryNames = {pending:'In wachtrij',processing:'Aflevering bezig',acknowledged:'Bevestigd',failed:'Afleverfout'};
function deliveryName(delivery) { return delivery?.status?(deliveryNames[delivery.status]||'Onbekend'):'Historisch / onbekend'; }
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
function showDashboard() { $('#dashboard').hidden=false;$('#login-section').hidden=true;$('#logout').hidden=false;selectView(location.hash.slice(1)); }
async function session() { const data=await api('session');state.csrf=data.csrf;return data; }

const adminViews=['overzicht','aanvragen','seo','tools'];
function selectView(requested){
  const view=requested==='inbox'?'tools':adminViews.includes(requested)?requested:'overzicht';
  document.querySelectorAll('[data-admin-view]').forEach(node=>{node.hidden=node.dataset.adminView!==view;});
  document.querySelectorAll('[data-admin-tab]').forEach(link=>{
    const active=link.dataset.adminTab===view;
    link.classList.toggle('active',active);
    if(active)link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  if(view==='seo')void loadSeoChecks();
  if(view==='tools'||view==='overzicht')void loadToolStatus();
}
async function loadSeoChecks(){
  for(const [path,id] of [['/sitemap.xml','seo-sitemap'],['/robots.txt','seo-robots']]){
    const node=$('#'+id);node.textContent='Controleren…';
    try{
      const response=await fetch(path,{credentials:'omit',cache:'no-store'});
      node.textContent=response.ok?'Bereikbaar · HTTP '+response.status:'Niet bereikbaar · HTTP '+response.status;
    }catch{node.textContent='Niet bereikbaar of niet controleerbaar';}
  }
}
async function loadToolStatus(){
  try{
    const health=await api('health');
    const healthy=health.configured===true&&health.databaseReady===true;
    $('#tools-api').textContent=healthy?'Database bereikbaar · API gereed':'API bereikbaar · database niet bevestigd';
    $('#overview-api-state').textContent=healthy?'API & database bereikbaar':'Database niet bevestigd';
  }catch{
    $('#tools-api').textContent='Niet bereikbaar of niet controleerbaar';
    $('#overview-api-state').textContent='Controle mislukt';
  }
  try{
    const sess=await api('session');
    $('#tools-report').textContent=sess.reportMailEnabled===true?'Ingeschakeld · inboxbezorging niet bewezen':'Uitgeschakeld';
  }catch{$('#tools-report').textContent='Niet te controleren';}
  try{
    const mail=await api('admin_mail_status');
    $('#tools-mail').textContent=mail.configured===true?'Geconfigureerd · bezorging niet geverifieerd':'Niet geconfigureerd';
  }catch{$('#tools-mail').textContent='Niet te controleren';}
}
function statCard(label, value, note) { const card=el('div','stat-card');card.append(el('div','stat-label',label),el('div','stat-value',value),el('div','stat-note',note));return card; }

const mailState={connected:false};
function renderOperationalStats(data) {
  const statusCounts=Object.fromEntries((data.statuses||[]).map(s=>[s.status,Number(s.count)]));
  const total=Object.values(statusCounts).reduce((a,b)=>a+b,0);
  const pipeline=$('#pipeline');pipeline.replaceChildren();
  for(const [id,label] of Object.entries(statusNames)){
    const n=statusCounts[id]||0,row=el('div','pipeline-row');
    const heading=el('div','pipeline-heading');heading.append(el('span','',label),el('strong','',count(n)));
    const track=el('div','pipeline-track'),fill=el('span','pipeline-fill');
    fill.style.width=total?((n/total)*100).toFixed(1)+'%':'0%';track.append(fill);row.append(heading,track);pipeline.append(row);
  }
  const partnersRoot=$('#partner-breakdown');partnersRoot.replaceChildren();
  const partnerCounts=Object.fromEntries((data.partners||[]).map(p=>[p.partner,Number(p.count)]));
  for(const [id,label] of Object.entries(partners)){
    const row=el('div','partner-row');row.append(el('span','',label),el('strong','',count(partnerCounts[id]||0)));partnersRoot.append(row);
  }
  $('#overdue').textContent=count(data.overdueNew||0);
  const byDate=new Map((data.events||[]).filter(e=>e.event==='scan_complete').map(e=>[e.day,Number(e.count)]));
  const days=Array.from({length:14},(_,i)=>{
    const key=new Date(Date.now()-(13-i)*86400000).toISOString().slice(0,10);
    return {key,count:byDate.get(key)||0};
  });
  const chart=$('#activity-chart');chart.replaceChildren();
  const peak=Math.max(1,...days.map(d=>d.count));
  for(const day of days){
    const group=el('div','activity-column'),bar=el('div','activity-column-bar'),label=el('small','',day.key.slice(8));
    bar.style.height=day.count?Math.max(5,Math.round(day.count/peak*100))+'%':'2px';
    bar.title=day.key+': '+count(day.count)+' voltooide scans';
    group.setAttribute('aria-label',bar.title);
    group.append(el('span','activity-count',day.count?count(day.count):''),bar,label);chart.append(group);
  }
  chart.setAttribute('aria-label',days.map(d=>d.key+': '+d.count).join('; '));
}

function renderStats(data) {
  const t=data.totals;
  const newLeads=(data.statuses||[]).find(item=>item.status==='new')?.count||0;
  $('#stats-grid').replaceChildren(
    statCard('Adviesaanvragen · 30 dagen',count(data.leadCount),'Servergeaccepteerd, ongeacht meettoestemming'),
    statCard('Nieuwe aanvragen',count(newLeads),'Nog nieuw · volledige bewaartermijn'),
    statCard('Voltooide scans · 30 dagen',count(t.scan_complete),'Opt-in gebeurtenissen, geen personen'),
    statCard('Technisch afgeleverd',data.delivery?count(data.delivery.acknowledged):'—',
      data.delivery?'Met geldig technisch ontvangstbewijs':'NIVO-outbox nog niet aangesloten'));
  const d=data.delivery;
  if(d&&typeof d==='object'){
    const waiting=Number(d.pending||0)+Number(d.processing||0);
    const failed=Number(d.failed||0),ack=Number(d.acknowledged||0);
    $('#overview-delivery-state').textContent=failed?count(failed)+' afleverfout'+(failed===1?'':'en'):
      data.deliveryConfigured===true?count(ack)+' bevestigd · '+count(waiting)+' in wachtrij':count(waiting)+' in wachtrij · uit';
    $('#tools-delivery').textContent=
      (data.deliveryConfigured===true?'Transport geconfigureerd':'Transport uitgeschakeld')+
      ' · '+count(waiting)+' wachtend · '+count(ack)+' bevestigd · '+count(failed)+' fout';
    $('#delivery-summary').textContent=count(waiting)+' in wachtrij · '+count(ack)+' technisch bevestigd · '+count(failed)+' fout. Alleen bevestigde ontvangsten tellen als afgeleverd.';
  }else{
    $('#overview-delivery-state').textContent='Nog geen afleverstatus beschikbaar';
    $('#tools-delivery').textContent='Outbox niet beschikbaar; NIVO-ontvangst niet bewezen';
    $('#delivery-summary').textContent='Technische afleverstatus is nog niet beschikbaar op deze backendversie.';
  }
  $('#funnel').replaceChildren(...[['scan_start','Scans gestart'],['scan_complete','Plannen bekeken'],['advice_open','Adviesformulier geopend'],['lead_accepted','Aanvragen opgeslagen']].map(([key,label])=>{const step=el('div','funnel-step');step.append(el('strong','',count(t[key])),el('span','',label));return step;}));
  $('#retention').textContent=`Aanvragen worden na ${data.retentionDays} dagen verwijderd. Exporteer alleen wat je nodig hebt en bewaar exports veilig. De grafiek telt gebeurtenissen, geen unieke bezoekers.`;
  renderOperationalStats(data);
}
function renderLeads(data) {
  state.leads=data.leads;state.total=data.total;$('#lead-count').textContent=count(data.total);
  const body=$('#lead-table');body.replaceChildren();
  const search=state.search.trim().toLocaleLowerCase('nl-NL');
  const visible=search?data.leads.filter(lead=>[lead.id,lead.data.name,lead.data.email,lead.data.phone,lead.data.postcode].some(value=>String(value||'').toLocaleLowerCase('nl-NL').includes(search))):data.leads;
  $('#lead-search-note').textContent=search?`${visible.length} van ${data.leads.length} geladen aanvragen op deze pagina gevonden. Andere pagina's zijn niet doorzocht.`:'Zoeken filtert alleen de maximaal 50 geladen aanvragen op deze pagina.';
  if(!visible.length) { const row=el('tr');const cell=el('td','empty',search?'Geen matches op deze pagina.':state.status?'Er zijn geen aanvragen met deze status.':'Nog geen aanvragen. Nieuwe adviesaanvragen verschijnen hier zodra iemand het formulier verstuurt.');cell.colSpan=7;row.append(cell);body.append(row); }
  for(const lead of visible) {
    const row=el('tr');const person=el('td');person.append(el('strong','',lead.data.name),el('small','',lead.data.email||lead.data.phone));
    const interest=el('td');interest.append(el('span','tag',lead.data.interests.map(x=>interests[x]||x).join(', ')||'Energieplan'));
    const partner=el('td','',partners[lead.partner]||lead.partner);const received=el('td','',date(lead.createdAt));const status=el('td');status.append(el('span','tag '+lead.status,statusNames[lead.status]));
    const delivery=el('td');
    delivery.append(el('span','tag wg2-delivery-status '+(lead.delivery?.status||'legacy'),deliveryName(lead.delivery)));
    const open=el('td');const button=el('button','text-button','Bekijk →');button.type='button';button.setAttribute('aria-label','Bekijk aanvraag van '+lead.data.name);button.addEventListener('click',()=>showDetail(lead));open.append(button);row.append(person,interest,partner,received,status,delivery,open);body.append(row);
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
  state.current=lead;state.detailReturn=document.activeElement;
  const root=$('#lead-detail');root.replaceChildren();root.className='detail-v05';
  const d=lead.data,summary=d.summary||{},selected=Array.isArray(summary.selectedIds)?summary.selectedIds:[];
  const money=value=>Number.isFinite(Number(value))&&value!==null?
    new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)):'Niet beschikbaar';
  const savings=summary.annualSavingsLow!=null&&summary.annualSavingsHigh!=null?
    money(summary.annualSavingsLow)+' – '+money(summary.annualSavingsHigh):'Niet meegestuurd';
  const investment=summary.investmentLow!=null&&summary.investmentHigh!=null?
    money(summary.investmentLow)+' – '+money(summary.investmentHigh):'Niet meegestuurd';
  const header=el('header','detail-v05-header');
  const identity=el('div');identity.append(el('span','eyebrow','ADVIESAANVRAAG · '+lead.id));
  const title=el('h2','',d.name);title.id='detail-title';
  identity.append(title,el('p','',date(lead.createdAt)+' · '+(partners[lead.partner]||lead.partner)));
  const badge=el('span','tag '+lead.status,statusNames[lead.status]||lead.status);
  header.append(identity,badge);root.append(header);
  const columns=el('div','detail-v05-columns');
  const contact=el('section','detail-v05-card');
  contact.append(el('span','eyebrow','01 / CONTACT'),el('h3','','Klant en vraag'));
  const fields=el('dl','detail-v05-fields');
  fields.append(detailField('E-mailadres',d.email),detailField('Telefoonnummer',d.phone),
    detailField('Postcode',d.postcode),detailField('Interesse',(d.interests||[]).map(x=>interests[x]||x).join(', ')));
  contact.append(fields);
  contact.append(el('span','detail-v05-subtitle','Toelichting'));
  contact.append(el('p','detail-v05-note',d.note||'Geen toelichting ontvangen.'));
  const overview=el('section','detail-v05-card detail-v05-plan');
  overview.append(el('span','eyebrow','02 / ENERGIEPLAN'),el('h3','','De belangrijkste cijfers'));
  const metrics=el('div','detail-v05-metrics');
  const savingsCard=el('div','detail-v05-metric');
  savingsCard.append(el('span','','Besparingsindicatie per jaar'),el('strong','',savings));
  const investmentCard=el('div','detail-v05-metric');
  investmentCard.append(el('span','','Indicatieve investering'),el('strong','',investment));
  metrics.append(savingsCard,investmentCard);overview.append(metrics);
  const year=summary.year==null?'Niet meegestuurd':String(summary.year);
  overview.append(el('p','detail-v05-year','Rekenjaar '+year+' · door bezoeker ingestuurde indicaties, geen offerte'));
  const chips=el('div','detail-v05-chips');
  for(const id of selected){chips.append(el('span','tag',interests[id]||({'smart-use':'Slimmer gebruik','solar':'Zonnepanelen','battery':'Thuisbatterij','insulation':'Isolatie','heatpump':'Warmtepomp'}[id])||id));}
  if(!selected.length)chips.append(el('span','small','Maatregelen ontbreken in de oude scan of er zijn geen nieuwe gekozen.'));
  overview.append(el('span','detail-v05-subtitle','Geselecteerde maatregelen'),chips);
  columns.append(contact,overview);root.append(columns);
  const extras=el('div','detail-v05-extras');
  const scan=el('details','detail-v05-extra');
  scan.append(el('summary','','Volledige meegestuurde energiescan'));
  const scanBody=el('div','detail-v05-extra-body');
  scanBody.append(el('p','small','Door bezoeker ingevoerd en berekend. Controleer met de klant; dit is geen geverifieerde meting.'));
  const inputList=el('div','input-list');
  for(const [key,value] of Object.entries(d.inputs||{})){
    const item=el('div');item.append(el('span','',inputNames[key]||key),
      document.createTextNode(value===true?'Ja':value===false?'Nee':value===null?'Onbekend':String(value)));
    inputList.append(item);
  }
  scanBody.append(inputList);
  scanBody.append(el('p','small','Rekenmodel '+(summary.modelVersion||'onbekend')+' · rekenjaar '+year));
  scan.append(scanBody);
  const consent=el('details','detail-v05-extra');
  consent.append(el('summary','','Toestemming en auditbewijs'));
  const consentBody=el('div','detail-v05-extra-body');
  consentBody.append(el('p','',d.consentText||'Historische consenttekst ontbreekt.'));
  consentBody.append(el('p','small','Versie '+(d.consentVersion||'onbekend')+' · '+
    (d.acceptedAt?date(d.acceptedAt):'tijdstip onbekend')+' · gekozen partner: '+
    (partners[lead.partner]||lead.partner)+' · statistieken: '+(d.analyticsConsent?'toegestaan':'niet toegestaan')));
  if(d.note)consentBody.append(el('p','small','Volledige toelichting: '+d.note));
  consent.append(consentBody);
  extras.append(scan,consent);root.append(extras);
  if(lead.delivery){
    const deliveryCard=el('section','wg2-delivery-detail');
    deliveryCard.append(el('strong','','NIVO-aflevering: '+deliveryName(lead.delivery)));
    const note=lead.delivery.status==='acknowledged'?
      'Ontvangstbewijs: '+(lead.delivery.reference||'Niet beschikbaar'):
      'Pogingen: '+count(lead.delivery.attempts)+' · Laatste foutcode: '+(lead.delivery.errorCode||'geen');
    deliveryCard.append(el('span','',note));
    root.append(deliveryCard);
  }
  const actions=el('footer','detail-v05-actions');
  const emailClient=el('button','outline-button','Mail klant ↗');
  emailClient.type='button';emailClient.disabled=!d.email;
  emailClient.addEventListener('click',()=>{
    $('#lead-dialog').close();selectView('tools');location.hash='#tools';openComposer({to:d.email,subject:'Jouw energieplan bij WattGoedkoper'});
    // The mail workbench is part of Tools & status.
  });
  const statusLabel=el('label','','Status');statusLabel.htmlFor='detail-status';
  const select=el('select');select.id='detail-status';
  for(const [key,value] of Object.entries(statusNames)){
    const option=el('option','',value);option.value=key;option.selected=key===lead.status;select.append(option);
  }
  const save=el('button','outline-button','Status opslaan');save.type='button';
  save.addEventListener('click',async()=>{
    save.disabled=true;
    try{await api('admin_status',{id:lead.id,status:select.value});$('#lead-dialog').close();
      message('Status bijgewerkt.',true);await refresh();}
    catch(error){message(error.message);}finally{save.disabled=false;}
  });
  if(lead.delivery?.status==='failed'){
    const retry=el('button','outline-button','Aflevering opnieuw proberen');
    retry.type='button';
    retry.addEventListener('click',async()=>{
      retry.disabled=true;
      try{
        await api('admin_delivery_retry',{id:lead.id});
        $('#lead-dialog').close();
        await refresh();
        message('Mislukte levering opnieuw ingepland. Dit bevestigt nog geen ontvangst.',true);
      }catch(error){message(error.message);retry.disabled=false;}
    });
    actions.append(retry);
  }
  const remove=el('button','text-button danger','Verwijderen');
  remove.type='button';
  remove.addEventListener('click',()=>{
    remove.disabled=true;const confirm=el('div','confirm-delete');
    confirm.append(el('p','','Deze aanvraag en contactgegevens definitief verwijderen? Dit kan niet ongedaan worden gemaakt.'));
    const yes=el('button','outline-button','Definitief verwijderen');yes.type='button';
    yes.addEventListener('click',async()=>{
      yes.disabled=true;
      try{await api('admin_delete',{id:lead.id});$('#lead-dialog').close();
        message('Aanvraag verwijderd.',true);await refresh();}
      catch(error){message(error.message);yes.disabled=false;}
    });
    const no=el('button','text-button','Annuleren');no.type='button';
    no.addEventListener('click',()=>{confirm.remove();remove.disabled=false;remove.focus();});
    confirm.append(yes,no);root.append(confirm);yes.focus();
  });
  actions.append(emailClient,statusLabel,select,save,remove);root.append(actions);
  $('#lead-dialog').classList.add('lead-dialog-v05');
  $('#lead-dialog').showModal();
}
$('#lead-dialog').addEventListener('close',()=>{
  if(state.detailReturn?.isConnected)state.detailReturn.focus({preventScroll:true});
});

function mailStatus(text,isError=false){
  const root=$('#mail-status');root.textContent=text;root.classList.toggle('mail-error',isError);
}
function emailAddress(value){
  const wrapped=String(value||'').match(/<([^<>]+)>/);
  return wrapped?wrapped[1]:String(value||'').trim();
}
function openComposer(prefill={}){
  $('#mail-reader').hidden=true;$('#mail-form').hidden=false;
  $('#mail-to').value=prefill.to||'';
  $('#mail-subject').value=prefill.subject||'';
  $('#mail-body').value=prefill.body||'';
  $('#mail-to').focus();
}
function closeComposer(){
  $('#mail-form').hidden=true;$('#mail-reader').hidden=false;
}
function renderMailList(messages){
  const root=$('#mail-list');root.replaceChildren();
  if(!messages.length){root.append(el('div','mail-placeholder','Geen berichten in Postvak IN.'));return;}
  for(const m of messages){
    const button=el('button','mail-message'+(m.unread?' unread':''));button.type='button';
    const from=el('strong','',m.from||'Onbekende afzender');
    const title=el('span','',m.subject||'(geen onderwerp)');
    const meta=el('small','',m.date||'');
    button.append(from,title,meta);button.addEventListener('click',()=>readMail(m.uid));
    root.append(button);
  }
}
async function readMail(uid){
  const reader=$('#mail-reader');closeComposer();reader.replaceChildren(el('p','small','Bericht laden…'));
  try{
    const {message:m}=await api('admin_mail_read&uid='+encodeURIComponent(uid));
    reader.replaceChildren(el('span','eyebrow','BERICHT UIT POSTVAK IN'),el('h3','',m.subject||'(geen onderwerp)'),
      el('p','mail-meta','Van: '+m.from+' · '+(m.date||'')),el('pre','mail-body-text',m.body||''));
    const reply=el('button','outline-button','Beantwoorden ↗');reply.type='button';
    reply.addEventListener('click',()=>openComposer({to:emailAddress(m.from),subject:/^re:/i.test(m.subject)?m.subject:'Re: '+(m.subject||'Jouw bericht')}));
    reader.append(reply);
  }catch(error){reader.replaceChildren(el('p','mail-error',error.message));}
}
async function loadMailbox(){
  mailStatus('Mailboxstatus controleren…');
  try{
    const status=await api('admin_mail_status');
    mailState.connected=Boolean(status.configured&&status.sendAvailable);
    $('#mail-compose').disabled=!mailState.connected;
    if(!status.configured){
      mailStatus('Nog niet gekoppeld. Een beheerder richt info@wattgoedkoper.nl veilig in via de server-CLI. Er zijn geen wachtwoorden in de website opgeslagen.');
      $('#mail-list').replaceChildren(el('div','mail-placeholder','Mailbox niet ingesteld. Je energieplan en adviesaanvragen blijven gewoon beschikbaar.'));
      return;
    }
    if(!status.imapAvailable){
      mailStatus('Uitgaande mail is ingesteld, maar de PHP IMAP-extensie ontbreekt. Schakel deze in bij Hostinger → PHP Configuration.',true);return;
    }
    mailStatus('Beveiligd verbonden met info@wattgoedkoper.nl · handmatige verzending');
    const data=await api('admin_mail_list');
    renderMailList(data.messages||[]);
  }catch(error){mailStatus(error.message,true);$('#mail-list').replaceChildren(el('div','mail-placeholder','Postvak IN is tijdelijk niet beschikbaar.'));}
}
$('#mail-refresh').addEventListener('click',loadMailbox);
$('#mail-compose').addEventListener('click',()=>openComposer());
$('#mail-cancel').addEventListener('click',closeComposer);
$('#mail-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const to=$('#mail-to').value.trim(),subject=$('#mail-subject').value.trim(),body=$('#mail-body').value;
  if(!window.confirm('Dit bericht echt versturen vanaf info@wattgoedkoper.nl naar '+to+'?'))return;
  const button=$('#mail-send');button.disabled=true;
  try{
    await api('admin_mail_send',{to,subject,body});
    message('De mailserver heeft je bericht geaccepteerd.',true);
    closeComposer();$('#mail-form').reset();
  }catch(error){message(error.message);}finally{button.disabled=false;}
});

$('#login-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('button',event.currentTarget);button.disabled=true;message('');try{if(!state.csrf)await session();const data=await api('admin_login',{username:$('#username').value,password:$('#password').value});state.csrf=data.csrf;$('#password').value='';showDashboard();await refresh();await loadMailbox();}catch(error){message(error.message);}finally{button.disabled=false;}});
$('#logout').addEventListener('click',async()=>{try{await api('admin_logout',{});showLogin();await session();message('Je bent uitgelogd.',true);}catch(error){message(error.message);}});
$('#refresh').addEventListener('click',()=>refresh().catch(error=>message(error.message)));
$('#status-filter').addEventListener('change',event=>{state.status=event.target.value;state.offset=0;refresh().catch(error=>message(error.message));});
$('#lead-search').addEventListener('input',event=>{state.search=event.target.value;renderLeads({leads:state.leads,total:state.total});});
$('#seo-check').addEventListener('click',()=>loadSeoChecks());
$('#tools-check').addEventListener('click',()=>loadToolStatus());
$('#previous').addEventListener('click',()=>{state.offset=Math.max(0,state.offset-50);refresh().catch(error=>message(error.message));});
$('#next').addEventListener('click',()=>{state.offset+=50;refresh().catch(error=>message(error.message));});
$('#export').addEventListener('click',async()=>{const button=$('#export');button.disabled=true;try{const response=await fetch(apiBase+'admin_export',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:'{}'});if(!response.ok){const data=await response.json();throw new Error(data.error?.message||'Exporteren is niet gelukt.');}const blob=await response.blob();const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='wattgoedkoper-aanvragen-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Export gedownload. De CSV bevat persoonsgegevens; bewaar hem veilig.',true);}catch(error){message(error.message);}finally{button.disabled=false;}});
for(const a of document.querySelectorAll('[data-admin-tab]'))a.addEventListener('click',()=>selectView(a.dataset.adminTab));
window.addEventListener('hashchange',()=>selectView(location.hash.slice(1)));
try{const initial=await session();if(!initial.configured){message('De beveiligde serverinstallatie is nog niet voltooid. Het dashboard blijft gesloten totdat de beheerder de private configuratie heeft ingesteld.');$('#login-form button').disabled=true;}else if(initial.authenticated){showDashboard();await refresh();await loadMailbox();}}catch(error){message(error.message);}

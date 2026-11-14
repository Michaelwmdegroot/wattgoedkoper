/**
 * WattGoedkoper deterministic annual scenario engine.
 * Facts, policy and assumptions are deliberately separate. See /rekenmodel.html.
 * Monetary values are illustrative, editable inputs, never a supplier offer.
 */
export const MODEL_VERSION = '2026.11.14-v1';
export const SOURCES = Object.freeze([
  {id:'salderen',title:'Rijksoverheid · einde salderen',name:'Rijksoverheid',url:'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling',checked:'2026-11-14'},
  {id:'acm',title:'ACM ConsuWijzer · salderen en terugleveren',name:'ACM ConsuWijzer',url:'https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen',checked:'2026-11-14'},
  {id:'solar',title:'Milieu Centraal · zonnepanelen',name:'Milieu Centraal',url:'https://www.milieucentraal.nl/energie-besparen/zonnepanelen/kosten-en-opbrengst-zonnepanelen/',checked:'2026-11-14'},
  {id:'self-use',title:'Milieu Centraal · eigen zonnestroom',name:'Milieu Centraal',url:'https://www.milieucentraal.nl/energie-besparen/zonnepanelen/verbruik-zelf-meer-zonnestroom/',checked:'2026-11-14'},
  {id:'battery',title:'Milieu Centraal · thuisbatterij',name:'Milieu Centraal',url:'https://www.milieucentraal.nl/energie-besparen/zonnepanelen/thuisbatterij-zonne-energie-opslaan/',checked:'2026-11-14'},
  {id:'heatpump',title:'Milieu Centraal · hybride warmtepomp',name:'Milieu Centraal',url:'https://www.milieucentraal.nl/energie-besparen/duurzaam-verwarmen-en-koelen/hybride-warmtepomp/',checked:'2026-11-14'},
  {id:'isde',title:'RVO · ISDE voorwaarden',name:'RVO',url:'https://www.rvo.nl/subsidies-financiering/ISDE',checked:'2026-11-14'},
  {id:'isde-2027',title:'RVO · voorgenomen wijzigingen 2027',name:'RVO',url:'https://www.rvo.nl/subsidies-financiering/isde/isde-wat-wijzigt-er-2027',checked:'2026-11-14'},
]);

export const DEFAULT_INPUT = Object.freeze({
  homeType:'terraced', ownership:'owner', people:3, buildPeriod:'1975-1991', area:110,
  insulation:'average', daytime:'mixed', usageKnown:false, electricityUse:3500, gasUse:1100,
  hasGas:true, inputMode:'total', gridImport:3000, gridExport:2400,
  hasSolar:false, panels:10, pvProduction:3500, roofAvailable:true,
  roofOrientation:'south', roofShade:'none', hasBattery:false, batteryCapacity:5,
  hasHeatPump:false, hasEv:false, contractType:'fixed', electricityPrice:0.28,
  gasPrice:1.25, feedInPrice:0.055, feedInCost:0.08, feedInCostMode:'per-kwh',
  feedInAnnualCost:240, budget:8000, goal:'bill', year:2027,
  solarInvestment:4800, batteryInvestment:4500, insulationInvestment:3000, heatPumpInvestment:7200,
  alternativeElectricityPrice:0.25, alternativeGasPrice:1.20, alternativeFeedInPrice:0.055,
  alternativeFeedInCost:0.06, alternativeFeedInCostMode:'per-kwh', alternativeFeedInAnnualCost:240, alternativeFixedDifference:0,
});
const ENUMS = {
  homeType:['apartment','terraced','corner','semi','detached'], ownership:['owner','tenant'],
  buildPeriod:['before1945','1945-1974','1975-1991','1992-2005','after2005'],
  insulation:['poor','average','good'], daytime:['away','mixed','home'], inputMode:['total','meter'],
  roofOrientation:['south','eastwest','east','west','north'], roofShade:['none','partial','heavy'],
  contractType:['fixed','variable','dynamic'], feedInCostMode:['per-kwh','annual'], alternativeFeedInCostMode:['per-kwh','annual'], goal:['bill','self-use','comfort'],
};
const RANGES = {
  people:[1,15],area:[15,1500],electricityUse:[0,100000],gasUse:[0,20000],gridImport:[0,100000],
  gridExport:[0,100000],panels:[1,100],pvProduction:[0,100000],batteryCapacity:[1,100],
  electricityPrice:[0,2],gasPrice:[0,10],feedInPrice:[0,2],feedInCost:[0,2],feedInAnnualCost:[0,10000],
  budget:[0,200000],solarInvestment:[100,200000],batteryInvestment:[100,200000],
  insulationInvestment:[100,200000],heatPumpInvestment:[100,200000],
  alternativeElectricityPrice:[0,2],alternativeGasPrice:[0,10],alternativeFeedInPrice:[0,2],
  alternativeFeedInCost:[0,2],alternativeFeedInAnnualCost:[0,10000],alternativeFixedDifference:[-10000,10000],year:[2026,2027],
};
const NL_NAMES={people:'aantal bewoners',area:'woonoppervlak',electricityUse:'stroomverbruik',gasUse:'gasverbruik',gridImport:'netafname',gridExport:'teruglevering',pvProduction:'opwek',panels:'aantal panelen',budget:'budget',electricityPrice:'stroomtarief',gasPrice:'gastarief',feedInPrice:'terugleververgoeding',feedInCost:'terugleverkosten'};
export function formatEuro(n, digits=0) {return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number.isFinite(n)?n:0);}
const round=(n,dp=2)=>Math.round((n+Number.EPSILON)*10**dp)/10**dp;
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const round50=n=>Math.round(n/50)*50;
export function normalizeInput(raw={}) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('Controleer je invoer.');
  const input={...DEFAULT_INPUT};
  for (const key of Object.keys(DEFAULT_INPUT)) {
    if (raw[key]!==undefined) input[key]=raw[key];
    const v=input[key];
    if (key in RANGES) {
      if (typeof v==='boolean' || v===null || typeof v==='object' || (typeof v==='string' && v.trim()==='')) throw new Error(`Vul een geldig ${NL_NAMES[key]||key} in.`);
      const n=Number(v);
      const [min,max]=RANGES[key];
      if (!Number.isFinite(n)||n<min||n>max) throw new Error(`Controleer ${NL_NAMES[key]||key}: kies een waarde tussen ${min} en ${max}.`);
      if (['people','panels','year'].includes(key)&&!Number.isInteger(n)) throw new Error(`Gebruik een heel getal voor ${NL_NAMES[key]||key}.`);
      input[key]=n;
    } else if (key in ENUMS) {
      if (!ENUMS[key].includes(v)) throw new Error(`Controleer de keuze voor ${key}.`);
    } else if (typeof DEFAULT_INPUT[key]==='boolean' && typeof v!=='boolean') throw new Error(`Controleer de keuze voor ${key}.`);
  }
  if (input.inputMode==='meter' && !input.hasSolar) throw new Error('Kies totaalverbruik als je geen zonnepanelen hebt.');
  if (input.inputMode==='meter' && input.gridExport>input.pvProduction) throw new Error('Teruglevering kan niet hoger zijn dan je totale opwek. Controleer of beide cijfers over hetzelfde jaar gaan.');
  return input;
}

const DIRECT_RATIO={away:.25,mixed:.30,home:.40};
const ORIENTATION={south:1,eastwest:.9,east:.85,west:.85,north:.65};
const SHADE={none:1,partial:.85,heavy:.65};
export function estimateSolar(input) {return input.panels*.435*875*ORIENTATION[input.roofOrientation]*SHADE[input.roofShade];}
function balances(demand,gas,pv,direct){
  const self=clamp(direct,0,Math.min(demand,pv));
  return {electricityUse:demand,gasUse:gas,pvProduction:pv,selfUse:self,gridImport:Math.max(0,demand-self),gridExport:Math.max(0,pv-self),batteryDelivered:0,batteryLoss:0};
}
export function deriveHousehold(raw) {
  const input=normalizeInput(raw);
  const homeFactor={apartment:.65,terraced:1,corner:1.12,semi:1.25,detached:1.45}[input.homeType];
  const periodFactor={before1945:1.2,'1945-1974':1.15,'1975-1991':1,'1992-2005':.85,after2005:.65}[input.buildPeriod];
  const insulationFactor={poor:1.25,average:1,good:.65}[input.insulation];
  let demand=input.usageKnown?input.electricityUse:round50((1000+input.people*600)*(input.homeType==='apartment'?.9:1)+(input.hasEv?2200:0)+(input.hasHeatPump?2500:0));
  const estimateGas=round50(input.area*7.5*homeFactor*periodFactor*insulationFactor+100+input.people*40);
  let gas=input.hasGas?(input.usageKnown?input.gasUse:estimateGas*(input.hasHeatPump?.5:1)):0;
  const pv=input.hasSolar?input.pvProduction:0;
  let direct=Math.min(demand,pv*DIRECT_RATIO[input.daytime]);
  if (input.inputMode==='meter') {
    direct=pv-input.gridExport;
    demand=input.gridImport+direct;
  }
  const flow=balances(demand,gas,pv,direct);
  flow.estimated=!input.usageKnown || (input.hasSolar&&input.inputMode!=='meter');
  return flow;
}

/** Annual cash cost only; excludes network costs, standing charges and tax credit. */
export function calculateBill(flow,raw,year=raw.year||2027) {
  const input=normalizeInput(raw);
  if (![2026,2027].includes(Number(year))) throw new Error('Kies rekenjaar 2026 of 2027.');
  for(const key of ['gridImport','gridExport','pvProduction','selfUse','gasUse']) {
    if(!Number.isFinite(flow[key])||flow[key]<-1e-8) throw new Error('Ongeldige energiebalans.');
  }
  const I=Math.max(0,flow.gridImport),E=Math.max(0,flow.gridExport);
  const exportFees=E>1e-8?(input.feedInCostMode==='annual'?input.feedInAnnualCost:E*input.feedInCost):0;
  const electricity=Number(year)===2026?
    Math.max(I-E,0)*input.electricityPrice-Math.max(E-I,0)*input.feedInPrice+exportFees:
    I*input.electricityPrice-E*input.feedInPrice+exportFees;
  const gas=flow.gasUse*input.gasPrice;
  return {electricity:round(electricity),gas:round(gas),total:round(electricity+gas),selfUsePercent:flow.pvProduction?round((flow.selfUse+(flow.batteryDelivered||0))/flow.pvProduction*100,1):0,exportFees:round(exportFees)};
}

/** One common scenario transform prevents overlapping savings from being added. */
export function applyMeasures(base,input,ids=[],variation='central') {
  const selected=new Set(ids);
  const factor={low:.65,central:1,high:1.25}[variation]??1;
  let demand=base.electricityUse,gas=base.gasUse,pv=base.pvProduction;
  let heatingGas=gas*.8; // hot water/cooking remain unaffected
  let addedHeatPumpDemand=0;
  if (selected.has('smart-use')) demand*=1-.03*factor;
  if (selected.has('insulation')) {
    const reduction={poor:.2,average:.1,good:0}[input.insulation]*factor;
    const saved=heatingGas*reduction;
    gas-=saved;heatingGas-=saved;
  }
  if (selected.has('heatpump')) {
    const saved=heatingGas*clamp(.6*factor,0,.75);
    gas-=saved;
    const scop={low:3,central:3.5,high:4}[variation]||3.5;
    addedHeatPumpDemand=saved*8.8/scop;
    demand+=addedHeatPumpDemand;
  }
  if (selected.has('solar')) pv=estimateSolar(input)*({low:.85,central:1,high:1.10}[variation]||1);
  let direct;
  if (selected.has('solar')) direct=Math.min(demand,pv*DIRECT_RATIO[input.daytime]);
  else direct=base.selfUse*Math.min(1,base.electricityUse?((demand-addedHeatPumpDemand)/base.electricityUse):1);
  if (selected.has('smart-use')&&!input.hasBattery) direct+=pv*(input.hasEv?.1:.05)*factor;
  // Extra winter heating does not automatically consume summer solar production.
  // Additional heatpump electricity is purchased from grid: conservative annual model.
  direct=Math.min(direct,demand,pv);
  const result=balances(demand,gas,pv,direct);
  if (selected.has('battery')&&pv>0) {
    const eta=.90;
    const cycles=180*factor;
    const cap=.60; // usable self-consumption ceiling in this screening model
    const delivered=Math.max(0,Math.min(result.gridImport,result.gridExport*eta,input.batteryCapacity*cycles,cap*pv-direct));
    const charged=delivered/eta;
    result.gridImport-=delivered;result.gridExport-=charged;
    result.batteryDelivered=delivered;result.batteryLoss=charged-delivered;
  }
  return result;
}

function amountRange(savings,low,high){return {savings:round(savings),savingsLow:round(Math.min(low,high,savings)),savingsHigh:round(Math.max(low,high,savings))};}
function investment(input,id){
  const key={solar:'solarInvestment',battery:'batteryInvestment',insulation:'insulationInvestment',heatpump:'heatPumpInvestment'}[id];
  if (!key) return {investmentLow:0,investmentHigh:0};
  return {investmentLow:round(input[key]*(id==='insulation'?.7:.85)),investmentHigh:round(input[key]*(id==='insulation'?1.4:1.15))};
}
const DEFINITIONS=[
  {id:'smart-use',title:'Begin met slim verbruiken',subtitle:'Kleine aanpassingen, direct inzicht',category:'Gedrag',icon:'spark',priority:1},
  {id:'insulation',title:'Houd de warmte binnen',subtitle:'Isolatie vóór een grote installatie',category:'Isolatie',icon:'home',priority:2},
  {id:'solar',title:'Wek je eigen stroom op',subtitle:'Zonnepanelen passend bij je verbruik',category:'Zonnepanelen',icon:'sun',priority:3},
  {id:'heatpump',title:'Verwarm met minder gas',subtitle:'Een hybride warmtepomp onderzoeken',category:'Warmtepomp',icon:'heat',priority:4},
  {id:'battery',title:'Bewaar stroom voor later',subtitle:'Een thuisbatterij kritisch doorgerekend',category:'Thuisbatterij',icon:'battery',priority:5},
];

export function calculatePlan(raw={}) {
  const input=normalizeInput(raw), household=deriveHousehold(input),year=input.year;
  const current=calculateBill(household,input,year);
  const year2026=calculateBill(household,input,2026),year2027=calculateBill(household,input,2027);
  const canAlter=input.ownership==='owner'&&input.homeType!=='apartment';
  const warnings=[];
  if (household.estimated) warnings.push('Een deel van je verbruik of eigen zonnestroom is geschat. Vul je jaarcijfers in om je plan te verfijnen.');
  warnings.push('Tarieven en investeringen zijn bewerkbare rekenvoorbeelden. Dit zijn geen live aanbiedingen of garanties.');
  if(input.contractType==='dynamic') warnings.push('Bij een dynamisch contract is dit een grof jaargemiddelde. Een betrouwbare prijssturing- of batterijberekening vereist uur- of kwartierdata.');
  if(input.hasBattery) warnings.push('Je hebt al een batterij. Zonder afzonderlijke laad- en ontlaaddata zijn verliezen en extra besparingen niet betrouwbaar te bepalen; we adviseren geen tweede batterij.');
  if(input.ownership==='tenant') warnings.push('Stem bouwkundige maatregelen en installaties eerst af met je verhuurder. Die investeringen staan niet in jouw persoonlijke budgetplan.');
  if(input.homeType==='apartment') warnings.push('Bij een appartement zijn dak, gevel en buitenunit vaak een VvE-besluit. Daarom nemen we nieuwe installaties niet automatisch op in je budgetplan.');
  if(input.feedInCostMode==='annual') warnings.push('De ingevulde jaarlijkse terugleverkosten blijven gelijk zolang je nog teruglevert. Schaalgrenzen moet je met je leverancier controleren.');
  warnings.push('2026 en 2027 zijn twee volledige rekenjaren bij dezelfde tarieven. Het 2026-resultaat is geen voordeel dat je vanaf vandaag nog een heel jaar kunt behalen.');
  const measures=DEFINITIONS.map(def=>{
    let status='consider',selectable=false,reason='',details=[];
    if (def.id==='smart-use') {
      selectable=true;status='recommended';reason=household.pvProduction>0?'Plan apparaten op zonnige momenten en verminder onnodig verbruik.':'Kijk eerst naar onnodig stroomverbruik en instellingen van apparaten.';
      details=['Rekenaanname: 3% minder stroom door kleine maatregelen. Geen investering meegerekend.',household.pvProduction>0?`Extra direct eigen gebruik: ${input.hasBattery?0:input.hasEv?10:5} procentpunt van de opwek, voor zover je stroomvraag dit toelaat.`:'Bij een dynamisch contract kan plannen helpen; handelswinst rekenen we niet mee.'];
    }
    if (def.id==='insulation') {
      selectable=canAlter&&input.hasGas&&!input.hasHeatPump&&household.gasUse>0&&input.insulation!=='good';
      status=input.insulation==='good'?'already':selectable?'recommended':'consider';
      reason=input.insulation==='good'?'Je geeft aan dat je woning al goed is geïsoleerd.':'Laat dak, vloer, glas en kieren bekijken. De beste maatregel hangt af van wat er al zit.';
      details=['Indicatieve maatregel, geen complete isolatieofferte. Oppervlakte en isolatiewaarde zijn nog niet ingemeten.',`Model: ${input.insulation==='poor'?20:input.insulation==='average'?10:0}% minder verwarmingsgas; 80% van je gas is in het model ruimteverwarming.`, 'Geen subsidie vooraf afgetrokken. Controleer voorwaarden en actuele bedragen bij RVO.'];
    }
    if (def.id==='solar') {
      selectable=canAlter&&!input.hasSolar&&input.roofAvailable;
      status=input.hasSolar?'already':selectable?'recommended':'consider';
      reason=input.hasSolar?'Je eigen opwek is al onderdeel van je huidige situatie.':!input.roofAvailable?'Geen eigen geschikt dak opgegeven; eerst dakmogelijkheden of toestemming onderzoeken.':`Een voorbeeldset van ${input.panels} panelen. Dakruimte, schaduw, constructie en aansluiting moeten nog worden gecontroleerd.`;
      details=[`Modelopbrengst ${Math.round(estimateSolar(input)).toLocaleString('nl-NL')} kWh per jaar voor ${input.panels} panelen van 435 Wp, met factoren voor ligging en schaduw.`, 'Er is geen postcode- of dakscan uitgevoerd. Het gekozen aantal is geen geoptimaliseerd legplan.', 'Investering is een rekenbedrag inclusief installatie; laat een offerte maken.'];
    }
    if (def.id==='heatpump') {
      selectable=canAlter&&input.hasGas&&!input.hasHeatPump&&household.gasUse>250;
      status=input.hasHeatPump?'already':selectable?'consider':'not-now';
      reason=input.hasHeatPump?'Je bestaande warmtepomp zit al in het opgegeven of geschatte verbruik.':!input.hasGas?'Je hebt geen gasverbruik opgegeven. Dit hybride scenario is daarom niet van toepassing.':'Verken een hybride warmtepomp na een controle van isolatie, radiatoren, ruimte en geluid.';
      details=['Model: 60% minder verwarmingsgas; tapwater en koken blijven op gas.', 'Extra stroom: bespaarde m³ × 8,8 kWh nuttige warmte / SCOP 3,5. Geen extra winterzon verondersteld.', 'Investering vóór subsidie. Subsidie en technische geschiktheid zijn niet vastgesteld.'];
    }
    if (def.id==='battery') {
      selectable=canAlter&&input.hasSolar&&!input.hasBattery;
      status=input.hasBattery?'already':'not-now';
      reason=input.hasBattery?'Een batterij is al aanwezig. Eerst je werkelijke laadprofiel beoordelen.':!input.hasSolar?'Zonder zonnepanelen levert dit eigenverbruiksmodel geen voordeel op. Handel vraagt een aparte analyse.':'Vergelijk de extra besparing eerst met de investering en levensduur. Een batterij is niet voor ieder huishouden rendabel.';
      details=[`Model: ${input.batteryCapacity} kWh bruikbare capaciteit, maximaal 180 cycli per jaar, 90% retourrendement en maximaal 60% nuttig eigen gebruik van opwek.`, 'Laadverliezen, gemiste terugleververgoeding en terugleverkosten zijn meegenomen. Handelsinkomsten staan op € 0.', 'Geen ISDE-batterijsubsidie meegerekend. Noodstroom, abonnementen, vervanging en degradatie zijn niet in het bedrag opgenomen; controleer deze apart.'];
    }
    // An unavailable or existing measure does not claim fresh incremental savings.
    const active=selectable;
    const scenario=applyMeasures(household,input,active?[def.id]:[]);
    const central=current.total-calculateBill(scenario,input,year).total;
    const low=current.total-calculateBill(applyMeasures(household,input,active?[def.id]:[],'low'),input,year).total;
    const high=current.total-calculateBill(applyMeasures(household,input,active?[def.id]:[],'high'),input,year).total;
    const costs=investment(input,def.id);
    const payback=active&&central>0&&costs.investmentHigh>0?round((costs.investmentLow+costs.investmentHigh)/2/central,1):null;
    if (active && central<=0) {status='not-now';reason='Met je ingevulde tarieven levert dit scenario nu geen jaarlijkse kostenbesparing op.';}
    if (def.id==='battery'&&selectable&&central>0) {
      status=payback!==null&&payback<=10?'consider':'not-now';
      reason=payback!==null&&payback>10?`De eenvoudige terugverdientijd komt op circa ${payback.toLocaleString('nl-NL')} jaar. Dat maakt dit geen logische eerste stap op kosten alleen.`:'Dit scenario kan interessant zijn. Controleer eerst een heel jaar kwartierdata, garantie, abonnement en een concrete offerte.';
    }
    if (def.id==='solar'&&selectable&&payback!==null&&payback>25) {status='not-now';reason='Bij deze aannames is de terugverdientijd langer dan 25 jaar. Onderzoek een kleinere set, andere ligging of een ander contract.';}
    return {...def,...amountRange(central,low,high),...costs,payback,status,selectable,reason,details,summary:reason};
  });

  // Evaluate the small set of eligible combinations against the upper investment.
  // This is a screening shortlist, not an optimisation of all products in the market.
  const eligible=measures.filter(m=>m.selectable&&m.status!=='not-now'&&m.status!=='already'&&m.savings>0&&m.id!=='battery');
  let selectedIds=[],investmentLow=0,investmentHigh=0,bestScore=-Infinity;
  for(let mask=0;mask<2**eligible.length;mask++) {
    const choice=eligible.filter((_,i)=>mask&(1<<i));
    const high=choice.reduce((n,m)=>n+m.investmentHigh,0);
    if(high>input.budget) continue;
    const ids=choice.map(m=>m.id);
    const candidateFlow=applyMeasures(household,input,ids);
    const candidateBill=calculateBill(candidateFlow,input,year);
    const saving=current.total-candidateBill.total;
    if(saving<0) continue;
    // Comfort prioritises lower heat demand; own-energy prioritises useful self-use.
    // Neither objective can select a scenario that increases annual variable costs.
    const benefit=input.goal==='comfort'?(household.gasUse-candidateFlow.gasUse)*.5:input.goal==='self-use'?(candidateFlow.selfUse-household.selfUse)*.10:0;
    const score=saving+benefit-high*.00001;
    if(score>bestScore) {
      bestScore=score;selectedIds=ids;investmentHigh=high;
      investmentLow=choice.reduce((n,m)=>n+m.investmentLow,0);
    }
  }
  const finalFlow=applyMeasures(household,input,selectedIds);
  const after=calculateBill(finalFlow,input,year);
  const centerSavings=current.total-after.total;
  const lowSavings=current.total-calculateBill(applyMeasures(household,input,selectedIds,'low'),input,year).total;
  const highSavings=current.total-calculateBill(applyMeasures(household,input,selectedIds,'high'),input,year).total;
  const range=amountRange(centerSavings,lowSavings,highSavings);

  const altInput={...input,electricityPrice:input.alternativeElectricityPrice,gasPrice:input.alternativeGasPrice,feedInPrice:input.alternativeFeedInPrice,feedInCost:input.alternativeFeedInCost,feedInCostMode:input.alternativeFeedInCostMode,feedInAnnualCost:input.alternativeFeedInAnnualCost};
  const altBill=calculateBill(household,altInput,year);
  const alternativeCost=round(altBill.total+input.alternativeFixedDifference);
  const contracts={
    savings:round(current.total-alternativeCost),currentCost:current.total,alternativeCost,
    recommendation:current.total>alternativeCost?'Het ingevulde alternatief is in dit rekenscenario voordeliger.':'Het ingevulde alternatief is bij deze aannames niet voordeliger.',
    explanation:'Dit vergelijkt uitsluitend jouw ingevoerde tarieven, geen live leveranciersaanbod. Vaste kostenverschillen vul je apart in. Jaarlijkse terugleverkosten vul je voor elk contract apart in; schalen, welkomstkorting, opzegvergoeding en toekomstige prijswijzigingen zijn niet berekend. Contractvoordeel is niet bij je maatregelenplan opgeteld.',
  };
  const assumptions=[
    {label:'Rekenversie en broncontrole',value:`${MODEL_VERSION} · 14 november 2026`},
    {label:'Soort uitkomst',value:'Jaarlijkse variabele energiekosten. Exclusief netbeheer, vaste leveringskosten en belastingvermindering.'},
    {label:'Betekenis van de bandbreedte',value:'Een lager en hoger maatregel-effect bij dezelfde tarieven; geen statistisch betrouwbaarheidsinterval of voorspelling van energieprijzen.'},
    {label:'Verbruik',value:household.estimated?'Deels modelinschatting uit je woning en huishouden; geen gemeten vergelijkingsgemiddelde.':'Door jou ingevulde jaarcijfers; niet geverifieerd met je leverancier.'},
    {label:'Stroom en gas',value:`${formatEuro(input.electricityPrice,3)}/kWh en ${formatEuro(input.gasPrice,3)}/m³, inclusief belastingen en btw.`},
    {label:'Terugleveren',value:`Bruto vergoeding ${formatEuro(input.feedInPrice,3)}/kWh; kosten ${input.feedInCostMode==='annual'?formatEuro(input.feedInAnnualCost)+'/jaar':formatEuro(input.feedInCost,3)+'/kWh'}.`,sourceId:'acm'},
    {label:'Zelfgebruik zonnestroom',value:input.inputMode==='meter'?(input.hasBattery?'Afgeleid uit opwek minus teruglevering: gebruik in huis inclusief opslag en verliezen, niet uitgesplitst.':'Afgeleid uit opwek minus teruglevering.'):`${Math.round(DIRECT_RATIO[input.daytime]*100)}% van opwek als profielaanname, begrensd door je verbruik.`,sourceId:'self-use'},
    {label:'2027 en verder',value:'Vanaf 1 januari 2027 geen saldering. De minimumvergoeding tot 2030 ziet op het kale tarief; we leiden deze niet af uit je all-in prijs.',sourceId:'salderen'},
    {label:'Subsidies',value:'Geen subsidie in de investering afgetrokken. ISDE-voorwaarden en meldcodes apart controleren. De 2027-wijzigingen zijn bij broncontrole nog voorgenomen.',sourceId:'isde-2027'},
    {label:'Investeringen',value:'Voorbeeldbedragen, geen offerte. De getoonde terugverdientijd is eenvoudig: investering / eerstejaarsbesparing; zonder financiering, onderhoud, degradatie of vervanging.'},
    {label:'Combinaties',value:'Je plan is opnieuw doorgerekend als één scenario. Losse kaartjes en contractvoordeel mag je niet bij elkaar optellen.'},
  ];
  const nextSteps=[household.estimated?'Leg je jaarafrekening en eventuele opwekgegevens erbij om de schattingen te vervangen.':'Controleer of verbruik, opwek en teruglevering hetzelfde volledige jaar betreffen.',
    'Vergelijk je energiecontract op totale kosten: tarieven, vaste kosten, terugleverkosten en voorwaarden.',
    canAlter?'Laat de technische haalbaarheid en offerte van je gekozen maatregelen controleren.':'Bespreek installaties eerst met de verhuurder of VvE.',
    'Wil je hulp? Kies zelf of NIVO Groep Holland of Thuisbatterij Team je mag benaderen.'];
  return {
    modelVersion:MODEL_VERSION,year,input,household,current,
    comparison:{year2026,year2027,difference:round(year2027.total-year2026.total)},
    plan:{...range,investmentLow:round(investmentLow),investmentHigh:round(investmentHigh),selectedIds,after},
    measures,contracts,energy:{solar:household.pvProduction,direct:household.selfUse,exported:household.gridExport,imported:household.gridImport,demand:household.electricityUse},
    assumptions,warnings,nextSteps,
  };
}

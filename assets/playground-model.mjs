/**
 * Interactive scenario adapter. It uses the same annual energy model as the
 * detailed report, but lets the visitor choose a bundle instead of accepting an
 * automatically selected plan. Manual choices may exceed the budget or lose
 * money; neither outcome is hidden or silently turned into a recommendation.
 */
import {
  MODEL_VERSION, SOURCES, normalizeInput, deriveHousehold,
  calculateBill, applyMeasures, calculatePlan,
} from './model.mjs';

export const UPGRADES = Object.freeze([
  Object.freeze({id:'smart-use',label:'Slim verbruiken',description:'Geef je apparaten een slimmer ritme.',icon:'spark'}),
  Object.freeze({id:'insulation',label:'Isoleren',description:'Houd meer warmte in je huis.',icon:'home'}),
  Object.freeze({id:'solar',label:'Zonnepanelen',description:'Laat je dak voor je werken.',icon:'sun'}),
  Object.freeze({id:'heatpump',label:'Warmtepomp',description:'Probeer verwarmen met minder gas.',icon:'heat'}),
  Object.freeze({id:'battery',label:'Thuisbatterij',description:'Bewaar zonnestroom voor later.',icon:'battery'}),
]);

const IDS = UPGRADES.map(upgrade => upgrade.id);
const round = (value, digits=2) => Math.round((value + Number.EPSILON) * 10**digits) / 10**digits;
const percentage = (part, whole) => whole > 0 ? round(Math.min(100, Math.max(0, part / whole * 100)), 1) : 0;
const financialRange = values => ({low:round(Math.min(...values)),high:round(Math.max(...values))});

function costOf(input, id) {
  const key = {
    solar:'solarInvestment', battery:'batteryInvestment',
    insulation:'insulationInvestment', heatpump:'heatPumpInvestment',
  }[id];
  if (!key) return {investment:0,investmentLow:0,investmentHigh:0};
  return {
    investment:input[key],
    investmentLow:round(input[key] * (id === 'insulation' ? .7 : .85)),
    investmentHigh:round(input[key] * (id === 'insulation' ? 1.4 : 1.15)),
  };
}

function eligibility(input, base, id, selected) {
  if (id === 'smart-use') return {eligible:true,existing:false,code:'available',reason:'Probeer minder sluipverbruik en gebruik apparaten op een gunstig moment.'};

  const existing = (id === 'solar' && input.hasSolar)
    || (id === 'battery' && input.hasBattery)
    || (id === 'heatpump' && input.hasHeatPump)
    || (id === 'insulation' && input.insulation === 'good');
  if (existing) return {eligible:false,existing:true,code:'already-present',reason:{
    solar:'Je bestaande zonnepanelen zitten al in je huidige situatie.',
    battery:'Je bestaande batterij zit al in je huidige situatie. Een tweede batterij rekenen we niet door.',
    heatpump:'Je bestaande warmtepomp zit al in je huidige situatie.',
    insulation:'Je huis is al goed geïsoleerd. Een extra isolatiepakket rekenen we hier niet door.',
  }[id]};

  if (input.ownership === 'tenant') return {eligible:false,existing:false,code:'permission-required',reason:'Bespreek deze aanpassing eerst met je verhuurder.'};
  if (input.homeType === 'apartment') return {eligible:false,existing:false,code:'permission-required',reason:'Voor deze aanpassing is eerst afstemming met je VvE nodig.'};

  if (id === 'solar' && !input.roofAvailable) return {eligible:false,existing:false,code:'roof-required',reason:'Geef eerst aan of je een geschikt eigen dak hebt.'};
  if (id === 'battery' && !(input.hasSolar || selected.has('solar'))) return {eligible:false,existing:false,code:'solar-required',reason:'Leg eerst zonnepanelen op je huis. Dit model rekent met opslag van eigen zonnestroom.'};
  if (id === 'insulation') {
    if (!input.hasGas || base.gasUse <= 0) return {eligible:false,existing:false,code:'gas-required',reason:'Dit isolatiescenario berekent bespaard gas. Voor jouw verwarming is een aparte analyse nodig.'};
    if (input.hasHeatPump) return {eligible:false,existing:false,code:'heat-profile-required',reason:'Met je bestaande warmtepomp vraagt isolatie een aparte berekening van de warmtevraag.'};
  }
  if (id === 'heatpump') {
    if (!input.hasGas || base.gasUse <= 250) return {eligible:false,existing:false,code:'gas-required',reason:'Dit hybride scenario past bij een woning met meer dan 250 m³ gasverbruik per jaar.'};
    if (input.insulation === 'poor' && !selected.has('insulation')) return {eligible:false,existing:false,code:'insulation-required',reason:'Begin bij dit matig geïsoleerde huis met isoleren. Daarna kun je de warmtepomp toevoegen.'};
  }
  return {eligible:true,existing:false,code:'available',reason:{
    solar:'Probeer een set zonnepanelen; dak en aansluiting moeten nog worden gecontroleerd.',
    insulation:'Probeer een indicatief isolatiepakket voor de verwarmingsvraag van je huis.',
    heatpump:'Probeer een hybride warmtepomp. Geschiktheid, geluid en afgiftesysteem vragen nog een controle.',
    battery:'Bekijk wat opslag toevoegt aan je eigen zonnestroom en wat die investering kost.',
  }[id]};
}

/** Resolve prerequisites in the same stable order as the visual upgrade dock. */
function resolveSelection(input, base, requested) {
  const requestedSet = new Set(requested);
  const selected = new Set();
  const blocked = [];
  for (const id of IDS) {
    if (!requestedSet.has(id)) continue;
    const status = eligibility(input, base, id, selected);
    if (status.eligible) selected.add(id);
    else blocked.push({id,code:status.code,reason:status.reason});
  }
  for (const id of requestedSet) {
    if (!IDS.includes(id)) blocked.push({id,code:'unknown-upgrade',reason:'Deze verbetering bestaat niet in dit rekenmodel.'});
  }
  return {selectedIds:[...selected],blocked};
}

function energySnapshot(flow, bill) {
  const usefulOwn = flow.selfUse + (flow.batteryDelivered || 0);
  return {
    flow,
    bill,
    selfSufficiency:percentage(usefulOwn, flow.electricityUse),
    selfUsePercent:percentage(usefulOwn, flow.pvProduction),
  };
}

function scenarioFor(base, input, ids, variation='central') {
  const flow = applyMeasures(base, input, ids, variation);
  return energySnapshot(flow, calculateBill(flow, input, input.year));
}

/**
 * All money values are annual euros, except investments (one-off euros).
 * baseline/scenario each expose {flow,bill,selfSufficiency,selfUsePercent}.
 * Savings ranges vary measure effects at fixed input tariffs. They are not a
 * statistical confidence interval. Percentage values use 0..100, not 0..1.
 * available[].marginalSavings is the effect of toggling that upgrade in the
 * current bundle. For a selected prerequisite it can include dependent steps;
 * affectedIds explicitly records those changes. Never sum marginal figures.
 */
export function simulateHome(rawInput={}, requestedIds=[]) {
  if (!Array.isArray(requestedIds) || requestedIds.some(id => typeof id !== 'string')) {
    throw new TypeError('Kies verbeteringen uit de beschikbare opties.');
  }
  const input = normalizeInput(rawInput);
  const base = deriveHousehold(input);
  const originalPlan = calculatePlan(input);
  const requested = [...new Set(requestedIds)];
  const {selectedIds,blocked} = resolveSelection(input, base, requested);
  const selected = new Set(selectedIds);
  const baseline = energySnapshot(base, calculateBill(base, input, input.year));
  const variations = Object.fromEntries(['low','central','high'].map(variation => [variation,scenarioFor(base,input,selectedIds,variation)]));
  const scenario = variations.central;
  const savings = round(baseline.bill.total - scenario.bill.total);
  const savingsRange = financialRange(Object.values(variations).map(value => baseline.bill.total - value.bill.total));
  const investmentTotals = selectedIds.reduce((sum,id) => {
    const costs = costOf(input,id);
    for (const key of Object.keys(sum)) sum[key] += costs[key];
    return sum;
  }, {investment:0,investmentLow:0,investmentHigh:0});
  for (const key of Object.keys(investmentTotals)) investmentTotals[key] = round(investmentTotals[key]);

  const available = UPGRADES.map(upgrade => {
    const status = eligibility(input,base,upgrade.id,selected);
    const isSelected = selected.has(upgrade.id);
    const toggledRequest = isSelected ? selectedIds.filter(id => id !== upgrade.id) : [...selectedIds,upgrade.id];
    const toggled = status.eligible ? resolveSelection(input,base,toggledRequest).selectedIds : selectedIds;
    const affectedIds = IDS.filter(id => selected.has(id) !== toggled.includes(id));
    const effects = status.eligible ? ['low','central','high'].map(variation => {
      const cost = scenarioFor(base,input,toggled,variation).bill.total;
      return isSelected ? cost - variations[variation].bill.total : variations[variation].bill.total - cost;
    }) : null;
    const effectRange = effects ? financialRange(effects) : null;
    return {
      ...upgrade,...status,selected:isSelected,...costOf(input,upgrade.id),
      details:originalPlan.measures.find(measure => measure.id === upgrade.id)?.details || [],
      marginalSavings:effects ? round(effects[1]) : null,
      marginalSavingsLow:effectRange?.low ?? null,
      marginalSavingsHigh:effectRange?.high ?? null,
      affectedIds,
    };
  });

  const recommendedIds = resolveSelection(input,base,originalPlan.plan.selectedIds).selectedIds;
  const warnings = [...originalPlan.warnings];
  const exceeded = investmentTotals.investmentHigh > input.budget;
  if (exceeded) warnings.push('Je gekozen plan komt met de hoge investeringsschatting boven je budget uit. Je keuzes blijven staan, zodat je het verschil kunt bekijken.');
  if (savings < 0) warnings.push('Bij deze aannames zijn je jaarlijkse variabele energiekosten met dit plan hoger. Meer eigen stroom betekent niet automatisch lagere kosten.');
  if (selected.has('battery')) warnings.push('De batterijberekening gaat over het opslaan van eigen zonnestroom. Handelsopbrengsten, abonnementen, onderhoud, vervanging en degradatie zijn niet meegerekend.');

  return {
    modelVersion:MODEL_VERSION,year:input.year,input,
    requestedIds:requested,selectedIds,blocked,available,
    baseline,scenario,
    savings,savingsLow:savingsRange.low,savingsHigh:savingsRange.high,
    ...investmentTotals,
    payback:investmentTotals.investment > 0 && savings > 0 ? round(investmentTotals.investment / savings,1) : null,
    budget:{amount:input.budget,exceeded,overBy:round(Math.max(0,investmentTotals.investmentHigh-input.budget)),remaining:round(input.budget-investmentTotals.investmentHigh)},
    recommendedIds,
    assumptions:originalPlan.assumptions,
    warnings,
    contracts:originalPlan.contracts,
    comparison:originalPlan.comparison,
    sources:SOURCES,
  };
}

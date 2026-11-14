import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_INPUT,applyMeasures,calculateBill,deriveHousehold} from '../assets/model.mjs';
import {UPGRADES,simulateHome} from '../assets/playground-model.mjs';

const input = overrides => ({...DEFAULT_INPUT,usageKnown:true,...overrides});
const close = (actual,expected,message='') => assert.ok(Math.abs(actual-expected)<.02,`${message}: expected ${expected}, got ${actual}`);
const upgrade = (result,id) => result.available.find(item=>item.id===id);

test('an untouched house has no invented saving or investment',()=>{
  const result=simulateHome();
  assert.deepEqual(result.selectedIds,[]);
  assert.equal(result.savings,0);
  assert.equal(result.savingsLow,0);
  assert.equal(result.savingsHigh,0);
  assert.equal(result.investment,0);
  assert.deepEqual(result.baseline.flow,result.scenario.flow && {...result.scenario.flow,estimated:result.baseline.flow.estimated});
  assert.equal(result.baseline.bill.total,result.scenario.bill.total);
  assert.equal(result.payback,null);
  assert.equal(UPGRADES.length,5);
});

test('new panels and a battery work as one deliberate combination',()=>{
  const raw=input({hasSolar:false,hasGas:false,electricityUse:3500});
  const solar=simulateHome(raw,['solar']);
  const both=simulateHome(raw,['battery','solar']);
  assert.deepEqual(both.selectedIds,['solar','battery']);
  assert.equal(upgrade(both,'battery').eligible,true);
  assert.ok(both.scenario.flow.batteryDelivered>0);
  assert.ok(both.scenario.flow.gridImport<solar.scenario.flow.gridImport);
  assert.ok(both.scenario.flow.gridExport<solar.scenario.flow.gridExport);
  assert.ok(both.scenario.flow.batteryLoss>0);
  close(both.savings,both.baseline.bill.total-both.scenario.bill.total);
  close(both.scenario.flow.pvProduction+both.scenario.flow.gridImport,
    both.scenario.flow.electricityUse+both.scenario.flow.gridExport+both.scenario.flow.batteryLoss);
});

test('removing new panels also removes an unsupported storage scenario',()=>{
  const result=simulateHome(input({hasSolar:false}),['battery']);
  assert.deepEqual(result.selectedIds,[]);
  assert.equal(result.blocked[0].code,'solar-required');
  assert.equal(result.investment,0);
  assert.equal(upgrade(result,'battery').marginalSavings,null);
});

test('manual selections remain visible when the budget is too small',()=>{
  const result=simulateHome(input({budget:0}),['solar','battery']);
  assert.deepEqual(result.selectedIds,['solar','battery']);
  assert.equal(result.budget.exceeded,true);
  assert.equal(result.budget.amount,0);
  assert.equal(result.budget.overBy,result.investmentHigh);
  assert.equal(result.budget.remaining,-result.investmentHigh);
  assert.ok(!result.recommendedIds.includes('solar'));
});

test('manual battery losses in a saldering year are not clipped to a saving',()=>{
  const result=simulateHome(input({year:2026,hasSolar:true,pvProduction:3500,electricityUse:3500,feedInCost:0,feedInCostMode:'per-kwh'}),['battery']);
  assert.deepEqual(result.selectedIds,['battery']);
  assert.ok(result.savings<0);
  assert.ok(result.savingsLow<=result.savings);
  assert.ok(result.savingsHigh>=result.savings);
  assert.equal(result.payback,null);
  assert.ok(upgrade(result,'battery').marginalSavings<0);
});

test('tenant and apartment installations require permission while smart use stays available',()=>{
  for(const override of [{ownership:'tenant'},{homeType:'apartment'}]){
    const result=simulateHome(input({...override,hasSolar:true,insulation:'poor'}),UPGRADES.map(item=>item.id));
    assert.deepEqual(result.selectedIds,['smart-use']);
    assert.equal(upgrade(result,'solar').existing,true);
    for(const id of ['insulation','heatpump','battery']) assert.equal(upgrade(result,id).code,'permission-required');
  }
});

test('existing installations cannot earn duplicate investment or saving',()=>{
  const result=simulateHome(input({hasSolar:true,hasBattery:true,hasHeatPump:true,insulation:'good'}),['solar','battery','heatpump','insulation']);
  assert.deepEqual(result.selectedIds,[]);
  assert.equal(result.investment,0);
  assert.equal(result.savings,0);
  for(const id of ['solar','battery','heatpump','insulation']){
    assert.equal(upgrade(result,id).existing,true);
    assert.equal(upgrade(result,id).eligible,false);
    assert.equal(upgrade(result,id).marginalSavings,null);
  }
});

test('poor insulation requires the insulation step before the hybrid scenario',()=>{
  const raw=input({insulation:'poor',budget:50000});
  const rejected=simulateHome(raw,['heatpump']);
  assert.equal(rejected.blocked[0].code,'insulation-required');
  assert.deepEqual(rejected.selectedIds,[]);
  const combined=simulateHome(raw,['heatpump','insulation']);
  assert.deepEqual(combined.selectedIds,['insulation','heatpump']);
  assert.ok(combined.scenario.flow.gasUse<combined.baseline.flow.gasUse);
  assert.deepEqual(upgrade(combined,'insulation').affectedIds,['insulation','heatpump']);
});

test('a combined plan is recomputed once and not a sum of standalone benefits',()=>{
  const raw=input({hasSolar:true,hasGas:true,gasUse:1400,insulation:'average',batteryCapacity:20});
  const ids=['smart-use','insulation','heatpump','battery'];
  const result=simulateHome(raw,ids);
  const independentlyApplied=applyMeasures(deriveHousehold(raw),raw,ids);
  close(result.scenario.bill.total,calculateBill(independentlyApplied,raw,raw.year).total);
  const sum=ids.map(id=>simulateHome(raw,[id]).savings).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(result.savings-sum)>1,'A shared energy budget prevents adding independent savings');
});

test('marginal effects are the difference made by a real toggle in the chosen bundle',()=>{
  const raw=input({hasSolar:false});
  const before=simulateHome(raw,['solar']);
  const after=simulateHome(raw,['solar','battery']);
  close(upgrade(before,'battery').marginalSavings,after.savings-before.savings);
  close(upgrade(after,'battery').marginalSavings,after.savings-before.savings);
  assert.deepEqual(upgrade(after,'solar').affectedIds,['solar','battery']);
  close(upgrade(after,'solar').marginalSavings,after.savings);
});

test('own electricity percentages use demand and production as different denominators',()=>{
  const result=simulateHome(input({hasGas:false,hasSolar:true,electricityUse:4000,pvProduction:2000}),['battery']);
  const own=result.scenario.flow.selfUse+result.scenario.flow.batteryDelivered;
  assert.equal(result.scenario.selfSufficiency,Math.round(own/4000*1000)/10);
  assert.equal(result.scenario.selfUsePercent,Math.round(own/2000*1000)/10);
  assert.notEqual(result.scenario.selfSufficiency,result.scenario.selfUsePercent);
});

test('zero demand, zero tariffs and excess generation never leak non-finite numbers',()=>{
  function finite(value,path='result'){
    if(typeof value==='number') assert.ok(Number.isFinite(value),path);
    if(Array.isArray(value)) value.forEach((v,i)=>finite(v,`${path}[${i}]`));
    else if(value&&typeof value==='object') Object.entries(value).forEach(([k,v])=>finite(v,`${path}.${k}`));
  }
  for(const override of [
    {electricityUse:0,gasUse:0,hasGas:false,hasSolar:false},
    {electricityUse:50,hasSolar:true,pvProduction:10000,hasGas:false},
    {electricityPrice:0,gasPrice:0,feedInPrice:0,feedInCost:0},
  ]){
    const result=simulateHome(input(override),['smart-use','solar','battery','insulation','heatpump']);
    finite(result);
    for(const snapshot of [result.baseline,result.scenario]){
      assert.ok(snapshot.selfSufficiency>=0&&snapshot.selfSufficiency<=100);
      assert.ok(snapshot.selfUsePercent>=0&&snapshot.selfUsePercent<=100);
    }
  }
});

test('selection is unique, order independent and does not mutate the inputs',()=>{
  const raw=input({insulation:'poor'});
  const original=structuredClone(raw);
  const choices=['battery','heatpump','solar','insulation','smart-use','solar'];
  const result=simulateHome(raw,choices);
  assert.deepEqual(raw,original);
  assert.deepEqual(choices,['battery','heatpump','solar','insulation','smart-use','solar']);
  assert.equal(result.selectedIds.length,new Set(result.selectedIds).size);
  assert.deepEqual(result.scenario,simulateHome(raw,[...choices].reverse()).scenario);
});

test('invalid selections and invalid physical quantities fail clearly',()=>{
  assert.throws(()=>simulateHome({},'solar'),TypeError);
  assert.throws(()=>simulateHome({},[{}]),TypeError);
  assert.throws(()=>simulateHome(input({electricityUse:-10}),[]),Error);
  const result=simulateHome({},['unsupported']);
  assert.equal(result.blocked[0].code,'unknown-upgrade');
  assert.deepEqual(result.selectedIds,[]);
});

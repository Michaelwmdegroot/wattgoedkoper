import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_INPUT,MODEL_VERSION} from '../assets/model.mjs';
import {simulateHome} from '../assets/playground-model.mjs';
import {comparisonScale,planInsights,renderPlanDashboard,renderPlanWorkspace} from '../assets/plan-ui.mjs';
const report=(patch={},ids=[])=>simulateHome({...DEFAULT_INPUT,...patch},ids);
test('positive bars share a true zero and preserve proportions',()=>{
 const s=comparisonScale([2000,1000]);assert.equal(s.zero,0);assert.deepEqual(s.bars.map(x=>x.width),[100,50]);
});
test('negative costs are not clipped or turned into positive bars',()=>{
 const s=comparisonScale([-1000,1000]);assert.equal(s.zero,50);assert.deepEqual(s.bars,[{left:0,width:50,negative:true},{left:50,width:50,negative:false}]);
});
test('all-negative costs end at the common zero',()=>{
 const s=comparisonScale([-2000,-1000]);assert.equal(s.zero,100);assert.equal(s.bars[0].width,100);assert.equal(s.bars[1].left,50);
});
test('zero cost comparison remains finite without invented bars',()=>{
 const s=comparisonScale([0,0]);assert.ok(Number.isFinite(s.zero));assert.ok(s.bars.every(x=>x.width===0));
});
test('energy insight uses total household demand not PV production as denominator',()=>{
 const r=report({},['solar','battery']);const i=planInsights(r);
 assert.equal(i.ownKwh,r.scenario.flow.selfUse+r.scenario.flow.batteryDelivered);
 assert.equal(i.gridChange,r.baseline.flow.gridImport-r.scenario.flow.gridImport);
 assert.equal(i.gasChange,r.baseline.flow.gasUse-r.scenario.flow.gasUse);
});
test('over-budget and non-saving warnings survive together',()=>{
 const r=report({year:2026,hasSolar:true,feedInCost:0,budget:0},['battery']);
 assert.ok(r.savings<0);const i=planInsights(r);assert.equal(i.warnings.length,2);
 assert.match(i.warnings.join(' '),/verlaagt.*niet/);assert.match(i.warnings.join(' '),/budget/);
});
test('empty plans never invent an investment or claimed benefit',()=>{
 const r=report();const html=renderPlanDashboard({r});assert.equal(r.savings,0);assert.equal(r.investment,0);
 assert.match(html,/nog niets geselecteerd/);assert.match(html,/Probeer een startplan/);
});
test('monthly display divides annual estimate by 12, explicitly labelled',()=>{
 const r=report({},['solar']);const html=renderPlanWorkspace({r,ui:{period:'month'}});
 assert.match(html,/Jaarsimulatie ÷ 12, geen maandprognose/);
 assert.match(html,new RegExp(String(Math.round(r.savings/12))));
});
test('choice rows retain prerequisite restrictions and marginal effect caveat',()=>{
 const r=report();const html=renderPlanWorkspace({r,ui:{tab:'measures'}});
 assert.match(html,/data-plan-value="battery"[^>]*disabled/);assert.match(html,/Tel ze niet op/);
});
test('complete evidence still exposes raw flows, assumptions, model and warnings',()=>{
 const r=report({},['solar','battery']);const html=renderPlanWorkspace({r,ui:{tab:'evidence'}});
 assert.match(html,/Teruglevering/);assert.match(html,/Geen|geen offerte/);assert.ok(html.includes(MODEL_VERSION));
 assert.match(html,/Handelsopbrengsten/);assert.match(html,/statistisch/);
});
test('snapshot comparison labels its original year and preserves negative difference',()=>{
 const r=report({},['solar']);const html=renderPlanWorkspace({r,ui:{reference:{year:2026,savings:2000,investmentLow:500,investmentHigh:750}}});
 assert.match(html,/Variant 2026/);assert.match(html,/minder besparing\/jaar/);
});
test('report stays separate from advice, with no signup or download gate',()=>{
 const html=renderPlanDashboard({r:report()});assert.match(html,/id="report-email-form"/);assert.match(html,/Geen marketing/);
 assert.doesNotMatch(html,/name="consent"|data-print|name="partner"|type="password"/);
});
test('evidence escapes untrusted labels instead of rendering markup',()=>{
 const r=report();r.assumptions=[{label:'<script>alert(1)</script>',value:'<img onerror=evil>'}];
 const html=renderPlanWorkspace({r,ui:{tab:'evidence'}});assert.ok(html.includes('&lt;script&gt;'));assert.doesNotMatch(html,/<script>|<img onerror/);
});

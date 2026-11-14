import test from 'node:test';
import assert from 'node:assert/strict';
import {exampleComparison} from '../assets/guide-comparison.mjs';
import {simulateHome} from '../assets/playground-model.mjs';
test('editorial example reuses the existing model exactly',()=>{
  for(const year of [2026,2027]){
    const example=exampleComparison(year,10);
    assert.equal(example.year,year);
    assert.equal(example.variants.length,3);
    assert.equal(example.variants[0].result.savings,simulateHome(example.input,['solar']).savings);
    assert.equal(example.variants[1].result.savings,simulateHome(example.input,['solar','smart-use']).savings);
    assert.equal(example.variants[2].result.savings,simulateHome(example.input,['solar','battery']).savings);
    assert.equal(example.variants[2].result.selectedIds.includes('battery'),true);
  }
});
test('changing example parameters is bounded and does not modify defaults',()=>{
  const original=exampleComparison(2027,10);
  const altered=exampleComparison(2026,14);
  assert.equal(altered.panels,14);
  assert.equal(altered.input.solarInvestment,original.input.solarInvestment*1.4);
  assert.equal(original.input.panels,10);
  assert.equal(exampleComparison('garbage',999).panels,10);
  assert.equal(exampleComparison('garbage',999).year,2027);
});

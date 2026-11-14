import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_INPUT, MODEL_VERSION, SOURCES,
  calculateBill, calculatePlan, deriveHousehold, applyMeasures,
} from '../assets/model.mjs';

const close = (actual, expected, message = '') => assert.ok(
  Math.abs(actual - expected) < 0.02,
  `${message} Expected ${expected}, got ${actual}`,
);
const input = (overrides = {}) => ({ ...DEFAULT_INPUT, usageKnown: true, ...overrides });
const flow = (overrides = {}) => ({
  electricityUse: 3500, gasUse: 0, pvProduction: 3500,
  selfUse: 1050, gridImport: 2450, gridExport: 2450,
  ...overrides,
});
const tariff = (overrides = {}) => input({
  hasSolar: true, hasGas: false,
  electricityPrice: 0.30, gasPrice: 1.25,
  feedInPrice: 0.06, feedInCostMode: 'per-kwh', feedInCost: 0.04,
  ...overrides,
});

test('source registry and model version are exposed with the calculation', () => {
  assert.equal(typeof MODEL_VERSION, 'string');
  assert.ok(MODEL_VERSION.length > 0);
  assert.ok(SOURCES && Object.keys(SOURCES).length > 0);
  assert.equal(calculatePlan(input()).modelVersion, MODEL_VERSION);
});

test('2026 nets annual imports and exports; 2027 bills both separately', () => {
  const a = calculateBill(flow(), tariff(), 2026);
  const b = calculateBill(flow(), tariff(), 2027);
  close(a.electricity, 98);
  close(b.electricity, 686);
  close(a.total, a.electricity + a.gas);
  close(b.total, b.electricity + b.gas);
});

test('saldering only compensates the net annual surplus at the export tariff', () => {
  const surplus = flow({ electricityUse: 2000, pvProduction: 4000, selfUse: 1000, gridImport: 1000, gridExport: 3000 });
  close(calculateBill(surplus, tariff({ feedInCost: 0 }), 2026).electricity, -120);
  close(calculateBill(surplus, tariff({ feedInCost: 0 }), 2027).electricity, 120);
});

test('a net annual import is charged at the all-in purchase price in 2026', () => {
  const deficit = flow({ electricityUse: 4500, gridImport: 3450 });
  close(calculateBill(deficit, tariff({ feedInCost: 0 }), 2026).electricity, 300);
});

test('direct self-use alone gives no additional saldering benefit without export fees', () => {
  const less = flow({ selfUse: 500, gridImport: 3000, gridExport: 3000 });
  const more = flow({ selfUse: 1500, gridImport: 2000, gridExport: 2000 });
  close(calculateBill(less, tariff({ feedInCost: 0 }), 2026).total,
    calculateBill(more, tariff({ feedInCost: 0 }), 2026).total);
});

test('post-saldering extra direct use saves purchase minus export value plus avoided variable fee', () => {
  const shifted = flow({ selfUse: 1225, gridImport: 2275, gridExport: 2275 });
  const before = calculateBill(flow(), tariff(), 2027);
  const after = calculateBill(shifted, tariff(), 2027);
  close(before.total - after.total, 175 * (0.30 - 0.06 + 0.04));
});

test('battery electricity losses and lost export revenue are included in both years', () => {
  // 1,000 kWh charged, 900 kWh delivered: 100 kWh storage/conversion losses.
  const battery = flow({ gridImport: 1550, gridExport: 1450, selfUse: 1950 });
  close(calculateBill(battery, tariff(), 2026).electricity, 88);
  close(calculateBill(battery, tariff(), 2027).electricity, 436);
  close(calculateBill(flow(), tariff(), 2027).total - calculateBill(battery, tariff(), 2027).total, 250);
});

test('battery can increase 2026 energy costs through losses without avoidable export fees', () => {
  const battery = flow({ gridImport: 1550, gridExport: 1450, selfUse: 1950 });
  const price = tariff({ feedInCost: 0 });
  close(calculateBill(flow(), price, 2026).total - calculateBill(battery, price, 2026).total, -30);
});

test('annual export cost remains fixed when exports decrease but stay positive', () => {
  const price = tariff({ feedInCostMode: 'annual', feedInAnnualCost: 240 });
  const reduced = flow({ gridExport: 1450, gridImport: 1550, selfUse: 1950 });
  const before = calculateBill(flow(), price, 2027);
  const after = calculateBill(reduced, price, 2027);
  close(before.electricity, 2450 * 0.30 - 2450 * 0.06 + 240);
  close(after.electricity, 1550 * 0.30 - 1450 * 0.06 + 240);
  close(before.electricity - after.electricity, 900 * 0.30 - 1000 * 0.06);
});

test('no export means no export fee, including when annual mode is selected', () => {
  const noPv = flow({ pvProduction: 0, selfUse: 0, gridImport: 3500, gridExport: 0 });
  close(calculateBill(noPv, tariff({ hasSolar: false, feedInCostMode: 'annual', feedInAnnualCost: 240 }), 2027).electricity, 1050);
});

test('export fees and compensation are separate, even when export has negative net value', () => {
  const price = tariff({ feedInPrice: 0.02, feedInCost: 0.08 });
  close(calculateBill(flow(), price, 2027).electricity, 2450 * 0.30 - 2450 * 0.02 + 2450 * 0.08);
});

test('gas is added once at the declared all-in example tariff', () => {
  const f = flow({ gasUse: 1100 });
  const result = calculateBill(f, tariff({ hasGas: true }), 2027);
  close(result.gas, 1375);
  close(result.total, 686 + 1375);
});

test('meter mode derives total household use from import, PV and export', () => {
  const result = deriveHousehold(input({
    hasSolar: true, inputMode: 'meter', gridImport: 3000,
    pvProduction: 4000, gridExport: 2500, electricityUse: 9999,
  }));
  close(result.electricityUse, 4500);
  close(result.selfUse, 1500);
  close(result.gridImport, 3000);
  close(result.gridExport, 2500);
});

test('total mode conserves annual electricity and caps self-use by demand and production', () => {
  for (const [demand, production] of [[100, 8000], [9000, 2500], [0, 1000], [1000, 0]]) {
    const result = deriveHousehold(input({ hasSolar: production > 0, electricityUse: demand, pvProduction: production, inputMode: 'total' }));
    close(result.gridImport + result.selfUse, result.electricityUse);
    close(result.gridExport + result.selfUse, result.pvProduction);
    assert.ok(result.selfUse >= 0 && result.selfUse <= Math.min(result.electricityUse, result.pvProduction));
    assert.ok(result.gridImport >= 0 && result.gridExport >= 0);
  }
});

test('gas-free household does not inherit a hidden positive gas estimate', () => {
  for (const usageKnown of [true, false]) {
    const result = calculatePlan(input({ hasGas: false, gasUse: 9999, usageKnown }));
    close(result.household.gasUse, 0);
    close(result.current.gas, 0);
    assert.ok(Number.isFinite(result.plan.savings));
  }
});

test('no panels means no fabricated generation or export from retained form fields', () => {
  const result = calculatePlan(input({ hasSolar: false, pvProduction: 5000, gridExport: 3000, inputMode: 'total' }));
  close(result.household.pvProduction, 0);
  close(result.household.selfUse, 0);
  close(result.household.gridExport, 0);
});

test('negative physical quantities are rejected instead of silently corrected', () => {
  for (const [key, value] of [['electricityUse', -1], ['gasUse', -1], ['pvProduction', -1], ['gridImport', -1], ['gridExport', -1]]) {
    assert.throws(() => calculatePlan(input({ hasSolar: true, [key]: value })), Error, key);
  }
});

test('meter export cannot exceed PV production', () => {
  assert.throws(() => calculatePlan(input({ hasSolar: true, inputMode: 'meter', gridImport: 2000, pvProduction: 2500, gridExport: 3000 })), Error);
});

test('non-finite numeric input is rejected with a normal Error', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const key of ['electricityUse', 'gasUse', 'electricityPrice', 'feedInPrice', 'budget']) {
      assert.throws(() => calculatePlan(input({ [key]: value })), Error, `${key}: ${value}`);
    }
  }
});

test('negative energy prices are rejected; a negative difference in fixed contract costs is allowed', () => {
  for (const key of ['electricityPrice', 'gasPrice', 'feedInPrice', 'feedInCost']) {
    assert.throws(() => calculatePlan(input({ [key]: -0.1 })), Error, key);
  }
  assert.doesNotThrow(() => calculatePlan(input({ alternativeFixedDifference: -120 })));
});

test('tenant and unavailable roof do not select roof installations for the personal plan', () => {
  for (const overrides of [{ ownership: 'tenant' }, { roofAvailable: false }]) {
    const result = calculatePlan(input({ hasSolar: false, budget: 50000, ...overrides }));
    assert.ok(!result.plan.selectedIds.includes('solar'));
    const solar = result.measures.find(x => x.id === 'solar');
    assert.ok(solar);
    assert.equal(solar.selectable, false);
  }
});

test('existing systems are not recommended again as new purchases', () => {
  const result = calculatePlan(input({ hasSolar: true, hasBattery: true, hasHeatPump: true, budget: 50000 }));
  for (const id of ['solar', 'battery', 'heatpump']) {
    assert.ok(!result.plan.selectedIds.includes(id), id);
  }
});

test('selected plan stays within the budget, including its high investment estimate', () => {
  for (const budget of [0, 500, 2500, 4500, 8000, 15000, 25000]) {
    const result = calculatePlan(input({ budget, insulation: 'poor', hasSolar: false }));
    assert.ok(result.plan.investmentLow >= 0);
    assert.ok(result.plan.investmentHigh >= result.plan.investmentLow);
    assert.ok(result.plan.investmentHigh <= budget + 0.01,
      `Budget ${budget}, investment ${result.plan.investmentHigh}, selected ${result.plan.selectedIds.join(', ')}`);
    assert.equal(new Set(result.plan.selectedIds).size, result.plan.selectedIds.length);
  }
});

test('headline savings equal the actual difference between current and combined scenario costs', () => {
  for (const overrides of [
    {}, { hasSolar: true }, { hasSolar: true, year: 2026 },
    { insulation: 'poor', budget: 25000 }, { hasGas: false, budget: 25000 },
    { budget: 0 }, { electricityUse: 0, gasUse: 0, hasSolar: false, budget: 0 },
  ]) {
    const result = calculatePlan(input(overrides));
    close(result.plan.savings, result.current.total - result.plan.after.total);
    assert.ok(result.plan.savingsLow <= result.plan.savingsHigh);
    assert.ok(result.plan.savingsLow >= 0);
    assert.ok(result.plan.savings >= -0.01);
  }
});

test('the complete output has finite numbers for low use, zero use and PV oversupply', () => {
  function finiteTree(value, path = 'result') {
    if (typeof value === 'number') assert.ok(Number.isFinite(value), path);
    if (Array.isArray(value)) value.forEach((v, i) => finiteTree(v, `${path}[${i}]`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => finiteTree(v, `${path}.${k}`));
  }
  for (const overrides of [
    { electricityUse: 0, gasUse: 0, hasGas: false, hasSolar: false },
    { electricityUse: 200, gasUse: 0, hasGas: false, hasSolar: true, pvProduction: 10000 },
    { hasSolar: true, electricityPrice: 0, gasPrice: 0, feedInPrice: 0, feedInCost: 0 },
  ]) finiteTree(calculatePlan(input(overrides)));
});

test('calculation is deterministic and does not mutate caller data', () => {
  const raw = input({ hasSolar: true, electricityUse: 4200 });
  const snapshot = structuredClone(raw);
  const a = calculatePlan(raw);
  const b = calculatePlan(raw);
  assert.deepEqual(raw, snapshot);
  assert.deepEqual(a, b);
});

test('year comparison uses both declared policies independently from the selected year', () => {
  const a = calculatePlan(input({ hasSolar: true, year: 2026 }));
  const b = calculatePlan(input({ hasSolar: true, year: 2027 }));
  close(a.comparison.year2026.total, b.comparison.year2026.total);
  close(a.comparison.year2027.total, b.comparison.year2027.total);
  close(a.comparison.difference, a.comparison.year2027.total - a.comparison.year2026.total);
});

test('alternative contract savings are tied to the calculated costs, including fixed-cost difference', () => {
  const result = calculatePlan(input({
    hasSolar: false, electricityUse: 3500, gasUse: 1100,
    electricityPrice: 0.30, gasPrice: 1.25,
    alternativeElectricityPrice: 0.30, alternativeGasPrice: 1.25,
    alternativeFixedDifference: -120,
  }));
  close(result.contracts.savings, result.contracts.currentCost - result.contracts.alternativeCost);
  close(result.contracts.savings, 120);
});

test('combined measures conserve energy including battery conversion losses', () => {
  for (const scenario of [
    { electricityUse: 3500, gasUse: 1100, hasSolar: true, pvProduction: 3500 },
    { electricityUse: 300, gasUse: 0, hasGas: false, hasSolar: true, pvProduction: 10000 },
    { electricityUse: 0, gasUse: 0, hasGas: false, hasSolar: false },
  ]) {
    const raw = input({ ...scenario, insulation: 'poor' });
    const base = deriveHousehold(raw);
    for (const ids of [[], ['smart-use'], ['battery'], ['insulation', 'heatpump'], ['smart-use', 'solar', 'battery', 'insulation', 'heatpump']]) {
      for (const variation of ['low', 'central', 'high']) {
        const result = applyMeasures(base, raw, ids, variation);
        close(result.gridImport + result.pvProduction,
          result.electricityUse + result.gridExport + result.batteryLoss,
          `${ids.join(', ')} ${variation}: supply equals use, export and loss`);
        close(result.gridImport + result.selfUse + result.batteryDelivered, result.electricityUse);
        assert.ok(result.gridImport >= -1e-8 && result.gridExport >= -1e-8);
        assert.ok(result.batteryDelivered >= 0 && result.batteryLoss >= 0);
        assert.ok(result.selfUse + result.batteryDelivered <= result.electricityUse + 1e-8);
        assert.ok(result.gasUse >= 0);
      }
    }
  }
});

test('insulation and heatpump act on remaining demand instead of adding their standalone gas savings', () => {
  const raw = input({ insulation: 'poor', electricityUse: 3500, gasUse: 1200, hasSolar: false });
  const base = deriveHousehold(raw);
  const insulation = applyMeasures(base, raw, ['insulation']);
  const heatpump = applyMeasures(base, raw, ['heatpump']);
  const combined = applyMeasures(base, raw, ['insulation', 'heatpump']);
  const naiveGasSaving = (base.gasUse - insulation.gasUse) + (base.gasUse - heatpump.gasUse);
  assert.ok(base.gasUse - combined.gasUse < naiveGasSaving);
  assert.ok(combined.gasUse < Math.min(insulation.gasUse, heatpump.gasUse));
  assert.ok(combined.electricityUse < heatpump.electricityUse,
    'Less remaining heating demand also reduces the added heatpump electricity');
  assert.ok(combined.gasUse >= base.gasUse * 0.2,
    'The model must not remove its separate hot-water and cooking gas allowance');
});

test('smart self-use and battery share the same limited PV surplus', () => {
  const raw = input({ hasGas: false, hasSolar: true, electricityUse: 3500, pvProduction: 3500, batteryCapacity: 20 });
  const base = deriveHousehold(raw);
  const smart = applyMeasures(base, raw, ['smart-use']);
  const battery = applyMeasures(base, raw, ['battery']);
  const combined = applyMeasures(base, raw, ['smart-use', 'battery']);
  assert.ok(combined.batteryDelivered < battery.batteryDelivered,
    'Direct smart use leaves less useful surplus for an already self-use-limited battery');
  assert.ok(combined.gridExport >= 0);
  const startCost = calculateBill(base, raw, 2027).total;
  const naiveSaving = startCost - calculateBill(smart, raw, 2027).total
    + startCost - calculateBill(battery, raw, 2027).total;
  const combinedSaving = startCost - calculateBill(combined, raw, 2027).total;
  assert.ok(combinedSaving < naiveSaving);
});

test('measure order and duplicate IDs cannot alter the combined scenario', () => {
  const raw = input({ hasSolar: true, insulation: 'poor' });
  const base = deriveHousehold(raw);
  const snapshot = structuredClone(base);
  const a = applyMeasures(base, raw, ['smart-use', 'insulation', 'heatpump', 'battery']);
  const b = applyMeasures(base, raw, ['battery', 'heatpump', 'smart-use', 'insulation', 'battery']);
  assert.deepEqual(a, b);
  assert.deepEqual(base, snapshot);
});

test('alternative contract has its own annual export fees, independent of current per-kWh fees', () => {
  const p = calculatePlan({...DEFAULT_INPUT, usageKnown:true, hasSolar:true, inputMode:'meter', gridImport:2450, gridExport:2450, pvProduction:3500, hasGas:false, electricityPrice:.30,feedInPrice:.06,feedInCostMode:'per-kwh',feedInCost:.04,alternativeElectricityPrice:.30,alternativeGasPrice:1.25,alternativeFeedInPrice:.06,alternativeFeedInCostMode:'annual',alternativeFeedInAnnualCost:300,alternativeFixedDifference:0});
  assert.equal(p.contracts.currentCost,686);
  assert.equal(p.contracts.alternativeCost,888);
  assert.equal(p.contracts.savings,-202);
});

# Frontend / model contract

`import { DEFAULT_INPUT, calculatePlan, formatEuro, SOURCES, MODEL_VERSION } from './model.mjs'`.
`calculatePlan({...DEFAULT_INPUT, ...answers})` returns deterministic figures; throws a user-facing Error on invalid data.

## Input
```
{
  homeType: 'terraced', // apartment/terraced/corner/semi/detached
  ownership: 'owner', // owner/tenant
  people: 3,
  buildPeriod: '1975-1991', // before1945/1945-1974/1975-1991/1992-2005/after2005
  area: 110,
  insulation: 'average', // poor/average/good
  daytime: 'mixed', // away/mixed/home
  usageKnown: false,
  electricityUse: 3500, // TOTAL annual household electricity incl self-use
  gasUse: 1100,
  hasGas: true,
  inputMode: 'total', // total/meter
  gridImport: 3000, gridExport: 2400,
  hasSolar: false, panels: 10, pvProduction: 3500,
  roofAvailable: true, roofOrientation: 'south', // south/eastwest/east/west/north
  roofShade: 'none', // none/partial/heavy
  hasBattery: false, batteryCapacity: 5,
  hasHeatPump: false, hasEv: false,
  contractType: 'fixed', // fixed/variable/dynamic
  electricityPrice: 0.28, gasPrice: 1.25,
  feedInPrice: 0.055, feedInCost: 0.08,
  feedInCostMode: 'per-kwh', // per-kwh/annual
  feedInAnnualCost: 240,
  budget: 8000, goal: 'bill', // bill/self-use/comfort
  year: 2027,
  solarInvestment: 4800, batteryInvestment: 4500,
  alternativeElectricityPrice: 0.25, alternativeGasPrice: 1.2,
  alternativeFeedInPrice: 0.055, alternativeFeedInCost: 0.06,
  alternativeFixedDifference: 0
}
```
Every monetary default is a visible editable EXAMPLE, not a live market quote. `usageKnown:false` derives consumption estimates from dwelling/people/heatpump/EV. Meter mode requires hasSolar=true and derives household demand=gridImport+pvProduction-gridExport. Values cannot be negative except explicit alternativeFixedDifference. No price comparison to real providers.

## Output
```
{
 modelVersion, year, input, household: {electricityUse, gasUse, pvProduction, selfUse, gridImport, gridExport, estimated},
 current: {electricity, gas, total, selfUsePercent},
 comparison: {year2026, year2027, difference}, // each year object has total electricity gas
 plan: {savingsLow,savingsHigh,savings,investmentLow,investmentHigh,selectedIds,after:{electricity,gas,total,selfUsePercent}},
 measures: [{id,title,subtitle,category,icon,priority,status,summary,savingsLow,savingsHigh,savings,investmentLow,investmentHigh,payback,reason,details:[string],selectable}],
 contracts: {savings, currentCost, alternativeCost, recommendation, explanation},
 energy: {solar, direct, exported, imported, demand},
 assumptions:[{label,value,sourceId?}], warnings:[string], nextSteps:[string]
}
```
Measures IDs: smart-use, solar, battery, insulation, heatpump. `status` one of recommended/consider/not-now/already. `payback` number or null. `plan` selected scenarios recomputed together, no sum of individual savings. Main summary: indicative annual savings, **variable energy costs** (not whole utility bill), excludes standing charges/network/tax credit unless explicitly in differences. Show economic lower bound >=0 only for headline chosen good plan; individual measures may be negative and must show this.

## Backend
Base `/api/index.php?action=`.
- GET health -> `{ok:true,configured:boolean}`
- GET session -> `{ok:true,csrf,createdAt,configured}`
- POST leads + X-CSRF-Token JSON `{idempotencyKey,name,email?,phone?,postcode?,partner:'nivo'|'tbt'|'either',interests:['solar'|'battery'|'heatpump'|'insulation'|'contract'|'planning'],consent:true,consentVersion:'2026-11-v1',website:'',inputs:{scalars},summary:{modelVersion,year,annualSavingsLow,annualSavingsHigh},note?}`. At least email OR phone. Session >=2 sec. Success only after 201/200 `{ok:true,id,status:'new'}`. 503 configuration failure must be visible, never pretend sent.
- POST events + CSRF `{event:'scan_start'|'scan_complete'|'advice_open'|'page_view',consent:true}`. Only after optional analytics toggle. No other identifiers/payloads.
- Browser scan doesn't require backend.
- No emails promised. Lead request shows chosen recipient NIVO/TBT and consent text.

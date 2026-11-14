# Frontend / model contract

## Interactive energy house (v0.2)

The consumer entry point is a continuously usable energy playground, not a sequential scan. The initial example is clearly marked. Housing/household choices alter the baseline. Installed equipment (`input.hasSolar`, etc.) is separate from proposed upgrades (`selectedIds`). Results do not require contact details.

```js
import {simulateHome, UPGRADES} from './playground-model.mjs';
const result = simulateHome(input, ['solar', 'battery']);
```

`result` exposes `baseline` and `scenario`, each with `{flow,bill,selfSufficiency,selfUsePercent}`. It also exposes `selectedIds`, `blocked`, `available`, `savings`, `savingsLow`, `savingsHigh`, `investmentLow`, `investmentHigh`, `budget`, `recommendedIds`, `warnings` and `assumptions`.

- All monetary savings refer to annual variable energy costs; investment is one-off.
- `selfSufficiency` is useful own electricity / total household electricity. `selfUsePercent` uses PV production as denominator. Both are percentages 0–100.
- Each available upgrade has `eligible`, `existing`, `selected`, `reason`, investment and marginal effect fields. Never sum marginal effects.
- New solar + battery can be deliberately selected together. Removing a prerequisite removes its dependent step. Existing installations cannot be bought again.
- Manual choices may exceed the budget or cost more annually. Show both outcomes honestly; never clip negative savings.
- Budget controls the suggested start plan, not manual selection.
- The panel quantity control scales the current example set price proportionally. An explicit investment editor lets visitors use a total quote. Battery capacity and price remain separate assumptions.
- `usageKnown:false` always pairs with `inputMode:'total'` in the UI.
- Day/night changes the illustration only, never the annual calculation.

```js
import {renderHouseScene} from './house-scene.mjs';
const scene = renderHouseScene(container, {
  input, selectedIds, view:'current', daylight:65,
  flows:result.baseline.flow, onAction(id) { /* toggle or explain */ }
});
scene.update({view:'plan',selectedIds});
```

The house is an SVG diagram with native HTML hotspot buttons. Click, touch, keyboard and optional drag/drop share the same action. Reduced-motion preferences disable decorative animations. Explicit save stores only the house/plan locally; reset and undo are reversible. Contact submission remains a separate opt-in step through the API below.

## Underlying annual engine

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
Measures IDs: smart-use, solar, battery, insulation, heatpump. `status` one of recommended/consider/not-now/already. `payback` number or null. `plan` selected scenarios recomputed together, no sum of individual savings. Main summary: indicative annual savings, **variable energy costs** (not whole utility bill), excludes standing charges/network/tax credit unless explicitly in differences. All manually selected scenarios retain their calculated range, including negative outcomes.

## Backend
Base `/api/index.php?action=`.
- GET health -> `{ok:true,configured:boolean}`
- GET session -> `{ok:true,csrf,createdAt,configured}`
- POST leads + X-CSRF-Token JSON `{idempotencyKey,name,email?,phone?,postcode?,partner:'nivo' (optional, any other value rejected),interests:['solar'|'battery'|'heatpump'|'insulation'|'contract'|'planning'],consent:true,consentVersion:'2026-11-v2',website:'',inputs:{scalars},summary:{modelVersion,year,annualSavingsLow,annualSavingsHigh},note?}`. At least email OR phone. Session >=2 sec. Success only after 201/200 `{ok:true,id,status:'new'}`. 503 configuration failure must be visible, never pretend sent.
- POST events + CSRF `{event:'scan_start'|'scan_complete'|'advice_open'|'page_view',consent:true}`. Only after optional analytics toggle. No other identifiers/payloads.
- Browser scan doesn't require backend.
- v0.5: a fixed NIVO-only lead consent appears only in the separate advice dialog. The compact plan supports a distinct email-only delivery form; delivery does not create an advice lead or marketing consent. Email sending is feature-gated and off without confirmed Hostinger setup.


## v0.5 — UI and public report contract

- `assets/plan-ui.mjs` renders the fixed content, cost comparison, warnings and selected measures from the existing `simulateHome` result. Core financial data + `#report-email` and `#report-send` must remain within the visible dialog on 1366×768 and 1440×900; mobile keeps the report CTA reachable. Extra rows and assumptions are only in a collapsible `details` section.
- `assets/app.mjs` does **not** expose a partner selector. Advice lead API is `partner:'nivo'`, `consentVersion:'2026-11-v2'`, explicit opt-in only. Historical admin data is still rendered with original partner mapping.
- `report_email` POST uses `X-CSRF-Token`/Origin and a simple one-address `email` plus a typed report snapshot with server-allowed keys; no free HTML, redirect, recipient list, tracking, marketing, or consent payload.
- `session` exposes `reportMailEnabled`; offline preview prevents all backend calls and report delivery. Never promise delivery until SMTP is tested.
- `admin/admin.mjs` renders untrusted lead fields exclusively through text nodes, with optional original scan/consent panels. Preserve keyboard/ESC and focus return.
- Visual and security acceptance are enforced by `scripts/visual-review-v05.cjs`, `tests/report_mail_test.php`, and existing regression suites.


## Plan Studio revision

`plan-ui.mjs` exposes pure rendering plus `comparisonScale(values)` and `planInsights(report)`. `app.mjs` supplies transient tab/period/chart/reference state and calls the unchanged `simulateHome` after a real scenario change. UI-only period switching never changes annual report payloads. New plan controls are `data-plan-action`; original advice and report form IDs remain stable. The footer form is not replaced during live comparison, so unsent input remains only in memory. Details/settings return to the same modal. See `PLAN-STUDIO.md` for the full acceptance matrix.

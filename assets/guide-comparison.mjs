/**
 * Small public example; uses the SAME deterministic annual engine as the energy
 * house. Never reads browser storage, never sends data, and never creates leads.
 */
import {DEFAULT_INPUT,formatEuro} from './model.mjs';
import {simulateHome} from './playground-model.mjs';

const SCENARIOS = Object.freeze([
  {id:'solar',label:'Alleen zonnepanelen',ids:['solar']},
  {id:'smart',label:'Panelen + slim gebruik',ids:['solar','smart-use']},
  {id:'battery',label:'Panelen + thuisbatterij',ids:['solar','battery']},
]);
const validYear=y=>Number(y)===2026?2026:2027;
const validPanels=n=>Number.isInteger(Number(n))&&Number(n)>=6&&Number(n)<=18?Number(n):10;
export function exampleComparison(rawYear=2027,rawPanels=10) {
  const year=validYear(rawYear),panels=validPanels(rawPanels);
  const input={...DEFAULT_INPUT,year,panels,solarInvestment:DEFAULT_INPUT.solarInvestment*panels/DEFAULT_INPUT.panels};
  return {
    year,panels,input,baseline:simulateHome(input,[]),
    variants:SCENARIOS.map(variant=>({id:variant.id,label:variant.label,ids:variant.ids,result:simulateHome(input,variant.ids)}))
  };
}
function render(root) {
  const year=root.querySelector('[data-example-year]');
  const panels=root.querySelector('[data-example-panels]');
  const panelLabel=root.querySelector('[data-example-panel-label]');
  const output=root.querySelector('[data-example-output]');
  if(!year||!panels||!panelLabel||!output)return;
  try {
    const report=exampleComparison(year.value,panels.value);
    panelLabel.textContent=String(report.panels);
    const baseline=report.baseline.baseline.bill.total;
    output.replaceChildren();
    for(const variant of report.variants){
      const result=variant.result;
      const article=document.createElement('article');article.className='example-result';
      const name=document.createElement('span');name.className='example-result-label';name.textContent=variant.label;
      const figure=document.createElement('strong');figure.textContent=formatEuro(result.savings);
      const explanation=document.createElement('p');
      explanation.textContent=(result.savings>=0?'lagere':'hogere')+' variabele energiekosten per jaar t.o.v. het voorbeeld zonder maatregelen';
      if(result.savings<0)figure.textContent=formatEuro(Math.abs(result.savings));
      const invest=document.createElement('small');
      invest.textContent='Investering indicatief: '+formatEuro(result.investmentLow)+'–'+formatEuro(result.investmentHigh);
      article.append(name,figure,explanation,invest);
      output.append(article);
    }
    const context=root.querySelector('[data-example-context]');
    if(context)context.textContent='Rekenjaar '+report.year+' · voorbeeldwoning zonder bestaande panelen · '+formatEuro(baseline)+' variabele energiekosten zonder nieuwe maatregelen per jaar. Geen offerte, volledig contract of voorspelling.';
  } catch(err) {
    output.textContent='De voorbeeldberekening is niet beschikbaar. Probeer het energiehuis voor een eigen scenario.';
  }
}
export function mountExample(scope) {
  if (!scope || typeof scope.querySelectorAll !== 'function') return;
  for(const root of scope.querySelectorAll('[data-energy-example]')) {
    if(root.dataset.exampleMounted==='true')continue;
    root.dataset.exampleMounted='true';
    root.addEventListener('input',()=>render(root));
    root.addEventListener('change',()=>render(root));
    render(root);
  }
}
if(typeof document!=='undefined')mountExample(document);

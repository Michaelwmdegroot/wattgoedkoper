/**
 * Photographic energy house. Equipment is composited independently so existing
 * installations and proposed choices never leak into the current-home view.
 * Artwork is illustrative; the deterministic model owns every numerical value.
 */
const HOME_NAMES={terraced:'rijwoning',corner:'hoekhuis',semi:'twee-onder-een-kapwoning',detached:'vrijstaande woning',apartment:'appartement'};
const ART={
  terraced:{base:'/assets/images/hero-terraced-base.webp',upgrade:'/assets/images/hero-terraced-upgraded.webp',solar:[[.3086,.2422],[.3242,.1270],[.6667,.1270],[.6875,.2422]],pump:[.2865,.6875,.3607,.7930],battery:[.7064,.6211,.7500,.8057],wall:[.39,.49]},
  corner:{base:'/assets/images/hero-corner-base.webp',upgrade:'/assets/images/hero-corner-upgraded.webp',solar:[[.408,.357],[.472,.229],[.726,.190],[.684,.327]],pump:[.505,.726,.582,.837],battery:[.695,.642,.758,.835],wall:[.48,.51]},
  semi:{base:'/assets/images/hero-semi-base.webp',upgrade:'/assets/images/hero-semi-upgraded.webp',solar:[[.444,.344],[.495,.214],[.748,.176],[.714,.316]],pump:[.548,.724,.632,.845],battery:[.748,.668,.810,.847],wall:[.49,.52]},
  detached:{base:'/assets/images/hero-detached-base.webp',upgrade:'/assets/images/hero-detached-upgraded.webp',solar:[[.280,.337],[.346,.203],[.663,.147],[.623,.300]],pump:[.197,.724,.267,.831],battery:[.758,.678,.803,.815],wall:[.34,.51]},
  apartment:{base:'/assets/images/hero-apartment-base.webp',upgrade:'/assets/images/hero-apartment-upgraded.webp',solar:[[.297,.109],[.728,.170],[.770,.212],[.301,.145]],pump:[.119,.760,.180,.862],battery:[.886,.669,.935,.831],wall:[.35,.49]}
};
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function icon(name){
  const paths={
    solar:'<path d="m5 7-2 12h18L19 7ZM4 13h16M9 7l-1 12m7-12 1 12M9 22h6m-3-3v3M12 1v2M5 2l1 2m13-2-1 2"/>',
    insulation:'<path d="m2 11 10-8 10 8M5 10v12h14V10M9 22v-9h6v9M2 15h3m14 0h3"/>',
    battery:'<rect x="6" y="4" width="12" height="18" rx="3"/><path d="M10 1h4m-1 7-4 6h6l-4 5"/>',
    heatpump:'<rect x="2" y="5" width="20" height="15" rx="3"/><circle cx="10" cy="12" r="4"/><path d="m10 8 2 4-2 4-2-4Zm7 1h2m-2 4h2M5 20v2m14-2v2"/>',
    people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-5a6 6 0 0 1 12 0v5M17 4a3 3 0 0 1 0 6m1 3a4 4 0 0 1 3 4v4"/>',
    ev:'<path d="m5 9 2-5h10l2 5M3 11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6H3Zm2 6v3m14-3v3M6 12h2m8 0h2"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.insulation}</svg>`;
}
function getState(options){
  const input={homeType:'terraced',people:3,panels:10,...options.input};
  const selected=new Set(options.selectedIds||[]);
  const planned=new Set(options.view==='current'?[]:selected);
  const daylight=clamp(options.daylight,0,100,65);
  return {input,selected,planned,daylight,night:daylight<35,view:options.view==='current'?'current':'plan',solar:Boolean(input.hasSolar||planned.has('solar')),battery:Boolean(input.hasBattery||planned.has('battery')),heatpump:Boolean(input.hasHeatPump||planned.has('heatpump')),insulation:Boolean(input.insulation==='good'||planned.has('insulation'))};
}
const boxCenter=box=>[(box[0]+box[2])/2,(box[1]+box[3])/2];
const center=points=>points.reduce((p,v)=>[p[0]+v[0]/points.length,p[1]+v[1]/points.length],[0,0]);
const xy=point=>`${Math.round(point[0]*1536)} ${Math.round(point[1]*1024)}`;
function equipmentMask(shape,isBox=false){
  const points=isBox?[[shape[0],shape[1]],[shape[2],shape[1]],[shape[2],shape[3]],[shape[0],shape[3]]]:shape;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1024" preserveAspectRatio="none"><defs><filter id="soft"><feGaussianBlur stdDeviation="1.4"/></filter></defs><polygon fill="white" filter="url(#soft)" points="${points.map(xy).join(' ')}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
function connector(from,to,name){
  return `<g class="scene-connector connector-${name}"><path d="M${xy(from)} L${xy(to)}"/><circle cx="${Math.round(to[0]*1536)}" cy="${Math.round(to[1]*1024)}" r="8"/></g>`;
}
function markup(art){
  const solar=center(art.solar),pump=boxCenter(art.pump),battery=boxCenter(art.battery);
  const pumpLabel=art.pump[0]<.25?[.18,.67]:[.18,.78];
  const equipment=['solar','heatpump','battery'].map(id=>`<img class="scene-equipment scene-equipment-${id}" data-equipment="${id}" src="${art.upgrade}" alt="" aria-hidden="true" width="1536" height="1024" decoding="async">`).join('');
  return `<div class="energy-scene photo-scene">
    <div class="photo-visual" role="img" aria-label="Sfeerbeeld van je energiehuis">
      <img class="scene-base" src="${art.base}" alt="" aria-hidden="true" width="1536" height="1024" fetchpriority="high" decoding="async">
      ${equipment}
      <div class="scene-night-tint" aria-hidden="true"></div>
      <svg class="scene-flows" viewBox="0 0 1536 1024" aria-hidden="true"><defs><filter id="flow-glow"><feGaussianBlur stdDeviation="3"/></filter></defs><path class="energy-flow flow-solar" d="M${xy(solar)} Q${xy([.60,.49])} ${xy(battery)}"/><path class="energy-flow flow-battery" d="M${xy(battery)} Q${xy([.60,.86])} ${xy([.51,.68])}"/><path class="energy-flow flow-heatpump" d="M${xy(pump)} Q${xy([.43,.70])} ${xy([.51,.68])}"/><path class="insulation-highlight" d="M${xy([art.wall[0]-.06,.75])}L${xy([art.wall[0]-.06,.44])}L${xy([art.wall[0]+.10,.41])}L${xy([art.wall[0]+.10,.75])}"/></svg>
    </div>
    <svg class="scene-connectors" viewBox="0 0 1536 1024" aria-hidden="true">${connector([.55,.10],solar,'solar')}${connector([.16,.45],art.wall,'insulation')}${connector([.85,.63],battery,'battery')}${connector(pumpLabel,pump,'heatpump')}</svg>
    <div class="house-hotspots" aria-label="Ontdek de mogelijkheden van je huis">${[['solar','Zonnepanelen'],['insulation','Isolatie'],['battery','Thuisbatterij'],['heatpump','Warmtepomp']].map(([id,label])=>`<button class="house-hotspot house-hotspot-${id}" data-house-action="${id}" type="button"><span class="house-hotspot-icon">${icon(id)}</span><span class="house-hotspot-label">${label}</span><span class="house-hotspot-mark" aria-hidden="true">+</span></button>`).join('')}</div>
    <div class="scene-status" aria-live="off"></div>
  </div>`;
}
export function renderHouseScene(container,options={}){
  if(!container||typeof container.addEventListener!=='function')throw new TypeError('Een element voor het energiehuis is vereist.');
  let current={view:'current',daylight:65,input:{},selectedIds:[],...options};
  let previousType=null,destroyed=false;
  const handleClick=event=>{const button=event.target.closest('[data-house-action]');if(button&&container.contains(button)&&typeof current.onAction==='function')current.onAction(button.dataset.houseAction);};
  container.addEventListener('click',handleClick);
  function update(next={}){
    if(destroyed)return;
    current={...current,...next,input:next.input?{...current.input,...next.input}:current.input};
    const state=getState(current),type=ART[state.input.homeType]?state.input.homeType:'terraced',art=ART[type];
    const active=container.ownerDocument?.activeElement;
    const focusAction=container.contains(active)?active?.dataset?.houseAction:null;
    if(type!==previousType){
      container.innerHTML=markup(art);previousType=type;
      for(const [id,shape,isBox] of [['solar',art.solar,false],['heatpump',art.pump,true],['battery',art.battery,true]]){
        const layer=container.querySelector(`[data-equipment="${id}"]`),mask=equipmentMask(shape,isBox);
        layer.style.maskImage=mask;layer.style.webkitMaskImage=mask;
      }
      if(focusAction)container.querySelector(`[data-house-action="${focusAction}"]`)?.focus({preventScroll:true});
    }
    const scene=container.querySelector('.energy-scene');
    scene.dataset.houseView=state.view;scene.dataset.homeType=type;
    scene.classList.toggle('is-evening',state.night);scene.classList.toggle('is-apartment',type==='apartment');
    scene.style.setProperty('--house-daylight',state.daylight/100);
    scene.style.setProperty('--scene-brightness',String(.48+Math.min(1,state.daylight/65)*.52));
    scene.style.setProperty('--night-tint',String(Math.max(0,(40-state.daylight)/100)));
    scene.classList.toggle('has-solar',state.solar);scene.classList.toggle('has-battery',state.battery);scene.classList.toggle('has-heatpump',state.heatpump);scene.classList.toggle('has-insulation',state.insulation);
    const labels={solar:'Zonnepanelen',battery:'Thuisbatterij',heatpump:'Warmtepomp',insulation:'Isolatie'};
    for(const id of Object.keys(labels)){
      const button=scene.querySelector(`[data-house-action="${id}"]`),present=state[id],existing=id==='insulation'?state.input.insulation==='good':state.input[{solar:'hasSolar',battery:'hasBattery',heatpump:'hasHeatPump'}[id]];
      button.classList.toggle('is-present',present);button.classList.toggle('is-planned',state.selected.has(id));
      button.setAttribute('aria-pressed',String(state.selected.has(id)));
      button.setAttribute('aria-label',`${labels[id]}${existing?' aanwezig':state.selected.has(id)?' in je plan':''}, ${state.selected.has(id)?'verwijderen uit je plan':'bekijk de mogelijkheden'}`);
      button.querySelector('.house-hotspot-mark').textContent=present||state.selected.has(id)?'✓':'+';
      const layer=scene.querySelector(`[data-equipment="${id}"]`);if(layer)layer.classList.toggle('is-visible',present);
    }
    scene.querySelector('.flow-solar').setAttribute('d',`M${xy(center(art.solar))} Q${xy([.60,.49])} ${xy(state.battery?boxCenter(art.battery):[.51,.68])}`);
    const description=`Sfeerbeeld van een ${HOME_NAMES[type]}, ${state.night?'in de avond':'overdag'}${state.solar?', met zonnepanelen':''}${state.heatpump?', een warmtepomp':''}${state.battery?' en een thuisbatterij':''}. De getoonde aantallen en plaatsing zijn illustratief.`;
    scene.querySelector('.photo-visual').setAttribute('aria-label',description);
    scene.querySelector('.scene-status').innerHTML=`<span class="scene-people">${icon('people')}${escape(state.input.people)} ${state.input.people===1?'bewoner':'bewoners'}</span>${state.solar?`<span class="scene-panel-count">${escape(state.input.panels)} panelen in je ${state.view==='current'?'huis':'plan'}</span>`:''}${state.input.hasEv?`<span class="scene-ev">${icon('ev')} Elektrisch rijden</span>`:''}${type==='apartment'?'<span class="scene-vve">Installaties? Overleg met je VvE.</span>':''}`;
  }
  update();
  return {update,destroy(){destroyed=true;container.removeEventListener('click',handleClick);container.replaceChildren();}};
}

/**
 * The energy house is a conceptual illustration, never a live meter.
 * It deliberately renders physical features separately from the calculation.
 */
let sceneSequence = 0;

const HOME_NAMES = {
  terraced: 'tussenwoning', corner: 'hoekwoning', semi: 'twee-onder-een-kapwoning',
  detached: 'vrijstaande woning', apartment: 'appartement'
};

const clamp = (value, min, max, fallback) => Number.isFinite(Number(value))
  ? Math.min(max, Math.max(min, Number(value))) : fallback;
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function icon(name) {
  const paths = {
    solar: '<path d="m4 7-2 11h20L20 7ZM4 12h16M9 7l-1 11m7-11 1 11M8 22h8m-4-4v4M12 1v2M5 2l1 2m13-2-1 2"/>',
    battery: '<rect x="6" y="4" width="12" height="18" rx="3"/><path d="M9 1h6m-2 7-4 6h6l-4 5"/>',
    heatpump: '<rect x="2" y="5" width="20" height="15" rx="3"/><circle cx="10" cy="12.5" r="4.5"/><path d="m10 8 1 3-1 1.5m4.5 0-3 1L10 12.5m0 4.5-1-3 1-1.5m-4.5 0 3-1 1.5 1m7-4h2m-2 4h2m-2 4h2M5 20v2m14-2v2"/>',
    insulation: '<path d="m2 10 10-8 10 8M5 9v13h14V9M9 22V12h6v10M2 15h3m14 0h3M2 19h3m14 0h3"/>',
    home: '<path d="m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.home}</svg>`;
}

function tree(x, y, scale, prefix, variant = 0) {
  return `<g class="house-tree" transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="4" cy="4" rx="28" ry="12" fill="#315746" opacity=".13"/>
    <path d="M0 0v-51m0 23-13-13m13 1 13-14" stroke="#8a795b" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="0" cy="-61" rx="31" ry="39" fill="url(#${prefix}-tree)"/>
    <ellipse cx="-11" cy="-68" rx="23" ry="28" fill="${variant ? '#a6bd86' : '#9dbb88'}"/>
    <ellipse cx="-14" cy="-76" rx="15" ry="20" fill="#b6cb97" opacity=".8"/>
    <path d="M-12-79q-6 12-3 20" fill="none" stroke="#d2dfb3" stroke-width="3" stroke-linecap="round" opacity=".6"/>
  </g>`;
}

function shrubs(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="m-23 1 24-14 38 22-24 14Z" fill="#bbbf9b"/>
    <path d="M-23 1v10l38 22V23Zm38 22 24-14v10L15 33Z" fill="#9ea982"/>
    <ellipse cx="-10" cy="-1" rx="14" ry="18" fill="#839d71"/>
    <ellipse cx="9" cy="7" rx="18" ry="21" fill="#a5b882"/>
    <ellipse cx="27" cy="16" rx="13" ry="17" fill="#6f8f66"/>
    <path d="m-14-5 1 11M5 1l4 11m20-2-1 10" fill="none" stroke="#c2cea2" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}

function person(x, y, index) {
  const colors = ['#e9b655', '#567d78', '#d78260', '#7598ae', '#ae8a79', '#a4ad68'];
  const child = index > 1;
  return `<g transform="translate(${x} ${y}) scale(${child ? '.72' : '.87'})" class="house-person">
    <ellipse cx="0" cy="4" rx="9" ry="4" fill="#335843" opacity=".13"/>
    <path d="m-4-13-1 15m9-15L6 2" stroke="#475862" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-5-29q5-4 10 0l2 16H-7Z" fill="${colors[index % colors.length]}"/>
    <path d="m-7-26-5 12m19-12 5 10" fill="none" stroke="#d5a27e" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="0" cy="-36" r="7" fill="#e1b38c"/>
    <path d="M-7-36q-1-10 8-8 7 1 6 8l-4-4-7 1Z" fill="${index % 2 ? '#715642' : '#3f4b48'}"/>
  </g>`;
}

function peopleMarkup(count) {
  const positions = [[398, 494], [421, 486], [439, 505], [376, 503], [459, 494], [353, 490]];
  return positions.slice(0, Math.min(6, Math.max(1, count))).map(([x, y], i) => person(x, y, i)).join('');
}

function panelArray(prefix, count = 10, flat = false, proposed = false) {
  const displayCount = Math.round(clamp(count, 2, 16, 10));
  const columns = Math.ceil(displayCount / 2);
  const width = (133 - (columns - 1) * 3) / columns;
  const height = 31;
  const panels = Array.from({ length: displayCount }, (_, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = 21 + col * (width + 3);
    const y = 28 + row * (height + 4);
    return `<g>
      <rect x="${x + 1.4}" y="${y + 2.4}" width="${width}" height="${height}" rx="1" fill="#33494f" opacity=".35"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="1" fill="url(#${prefix}-panel)" stroke="${proposed ? '#f1d977' : '#b0c6d1'}" stroke-width="1.15"/>
      <path d="M${x + width / 2} ${y + 1}v${height - 2}M${x + 1} ${y + height / 3}h${width - 2}M${x + 1} ${y + height * 2 / 3}h${width - 2}" stroke="#98b4c3" stroke-opacity=".56" stroke-width=".65"/>
      <path d="m${x + 1} ${y + 1} ${width - 2} 0-${width - 2} ${height * .6}Z" fill="#a9d6e4" opacity=".08"/>
    </g>`;
  }).join('');
  return `<g class="house-solar ${proposed ? 'house-new' : ''}" transform="${flat ? 'matrix(1 .577 -.84 .485 356 75)' : 'matrix(1 .577 -.65 .99 288 96)'}">${panels}</g>`;
}

function roofTiles() {
  return `<g transform="matrix(1 .577 -.65 .99 288 96)" fill="none">
    ${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${17 * i + 10}h175" stroke="#e9b09b" stroke-opacity=".38" stroke-width="1.3"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${25 * i + 7} 0v120" stroke="#925f4e" stroke-opacity=".28" stroke-width=".9"/>`).join('')}
  </g>`;
}

function windows(prefix, night, side = 'front', apartment = false) {
  const frame = '#f7f2e5';
  const glass = `url(#${prefix}-${night ? 'warmglass' : 'glass'})`;
  if (side === 'front') return `<g transform="matrix(1 .577 0 1 ${apartment ? '220 139' : '210 215'})">
    ${[20, 76].map(x => `<g>
      <rect x="${x}" y="29" width="43" height="69" rx="1" fill="#a99883"/>
      <rect x="${x + 3}" y="31" width="37" height="64" fill="${glass}"/>
      <path d="M${x + 21.5} 32v63M${x + 4} 70h35" stroke="${frame}" stroke-width="2.8"/>
      <path d="m${x + 6} 33 24 0-${24} 27Z" fill="#fff" opacity=".18"/>
      <path d="M${x - 2} 98h47v4h-47Z" fill="#e4d9c3"/>
      <path d="M${x + 2} 103h40" stroke="#a38f78" opacity=".25" stroke-width="2"/>
    </g>`).join('')}
    <rect x="133" y="48" width="30" height="87" fill="#698a7e"/>
    <rect x="138" y="55" width="20" height="25" rx="1" fill="${glass}"/>
    <path d="M139 88h18m-18 7h18m-18 7h18" stroke="#8aa495" stroke-width="1"/>
    <path d="M157 91v8" stroke="#e9d5a0" stroke-width="2" stroke-linecap="round"/>
    <path d="M130 135h36v5h-36Z" fill="#ded3bd"/>
    <rect x="122" y="58" width="4" height="8" rx="1" fill="${night ? '#f6d983' : '#f1eddb'}"/>
  </g>`;
  return `<g transform="matrix(1 -.577 0 1 385 316)">
    <rect x="28" y="25" width="55" height="57" fill="#9ba697"/>
    <rect x="32" y="28" width="47" height="51" fill="${glass}"/>
    <path d="M55.5 29v49M33 54h45" stroke="${frame}" stroke-width="3"/>
    <path d="m34 29 34 0-34 33Z" fill="#fff" opacity=".14"/>
    <path d="M25 82h61v4H25Z" fill="#c2c6ad"/>
    <rect x="112" y="25" width="28" height="45" fill="#9ba697"/>
    <rect x="115" y="28" width="22" height="39" fill="${glass}"/>
    <path d="M126 29v37" stroke="${frame}" stroke-width="2"/>
    <rect x="111" y="70" width="30" height="3" fill="#bec5ad"/>
  </g>`;
}

function ghostNeighbour(prefix, shiftX, shiftY, opacity = .13) {
  return `<g transform="translate(${shiftX} ${shiftY})" class="house-neighbour" opacity="${opacity}">
    <path d="m210 215 175 101v135L210 350Z" fill="#cdd4c6"/>
    <path d="m385 316 78-119 79 28v135l-157 91Z" fill="#aebfb3"/>
    <path d="m210 215 78-119 175 101-78 119Z" fill="#a7b5aa"/>
    <path d="m288 96 79 28 175 101-79-28Z" fill="#bdc5b8"/>
    <path d="m225 263 42 24v54l-42-24Zm70 40 42 24v54l-42-24Z" fill="#e6eee3"/>
    <path d="m403 334 37-21v71l-37 21Z" fill="#e1e8d9"/>
  </g>`;
}

function houseBuilding(prefix, state) {
  const { input, solar, planned, night, insulation } = state;
  const type = input.homeType;
  if (type === 'apartment') return apartmentBuilding(prefix, state);
  const neighbours = type === 'terraced'
    ? ghostNeighbour(prefix, -112, -65) + ghostNeighbour(prefix, 98, 57)
    : type === 'corner' || type === 'semi' ? ghostNeighbour(prefix, -112, -65, type === 'semi' ? .24 : .13) : '';
  return `${neighbours}
    <g class="house-building">
      <path d="m210 350 175 101 157-91-175-101Z" fill="#315b47" opacity=".2"/>
      <path d="m210 215 175 101v135L210 350Z" fill="url(#${prefix}-wall)"/>
      <path d="m385 316 78-119 79 28v135l-157 91Z" fill="url(#${prefix}-side)"/>
      <path d="m210 337 175 101v13L210 350Z" fill="#d7c8b0"/>
      <path d="m385 438 157-91v13l-157 91Z" fill="#abb59d"/>
      <path d="m385 316 78-119 79 28" fill="#e3e4d4"/>
      <path d="m432 276 30-17v-27l-30 17Z" fill="#9ba99b"/>
      <path d="m436 273 22-13v-20l-22 13Z" fill="url(#${prefix}-${night ? 'warmglass' : 'glass'})"/>
      <path d="m447 247 0 20" stroke="#f7f2e5" stroke-width="2"/>
      <path d="m210 215 78-119 175 101-78 119Z" fill="url(#${prefix}-roof)"/>
      ${roofTiles()}
      <path d="m288 96 79 28 175 101-79-28Z" fill="#c39b81"/>
      <path d="m292 99 171 99" stroke="#e3b39a" stroke-width="6" stroke-linecap="round"/>
      <path d="m204 215 181 105 84-123" fill="none" stroke="#f4ebd9" stroke-width="7" stroke-linejoin="round"/>
      <path d="m205 220 180 104 83-121" fill="none" stroke="#8f8978" stroke-width="2" stroke-linejoin="round" opacity=".5"/>
      <path d="m469 198 78 28" stroke="#f1e9d8" stroke-width="6" stroke-linecap="round"/>
      <path d="M386 323v115" stroke="#aab3a1" stroke-width="4"/>
      <path d="M212 225v113" stroke="#ded5c1" stroke-width="3"/>
      <path d="m365 127 16-9 14 8v41l-16 9-14-8Z" fill="#c7b9a1"/>
      <path d="m379 135 16-9v41l-16 9Z" fill="#a6a58e"/>
      <path d="m362 126 19-11 17 10-19 11Z" fill="#e7dcc8"/>
      ${windows(prefix, night, 'front')}
      ${windows(prefix, night, 'side')}
      ${solar ? panelArray(prefix, input.panels || 10, false, planned.has('solar')) : ''}
      ${insulation ? `<g class="house-insulation ${planned.has('insulation') ? 'house-new' : ''}" fill="none" stroke="#edcb68" stroke-width="5" stroke-linejoin="round"><path d="m212 230 0 105 171 99 0-105"/><path d="m392 429 142-83v-98"/><path d="m220 329 154 89" stroke="#f5df8a" stroke-width="2"/></g>` : ''}
    </g>`;
}

function apartmentBuilding(prefix, state) {
  const { solar, planned, night, insulation, input } = state;
  const rows = [0, 68, 136];
  return `<g class="house-building house-apartment">
    <path d="m220 354 170 98 153-88-170-98Z" fill="#315b47" opacity=".2"/>
    <path d="m220 139 170 98v215l-170-98Z" fill="url(#${prefix}-wall)"/>
    <path d="m390 237 153-88v215l-153 88Z" fill="url(#${prefix}-side)"/>
    <path d="m216 137 157-91 174 101-157 91Z" fill="#c5c9b8"/>
    <path d="m228 137 145-83 162 93-145 84Z" fill="#a7b9ae"/>
    <path d="m216 137 174 101v11L216 148Zm174 101 157-91v11l-157 91Z" fill="#f4ecd9"/>
    <g transform="matrix(1 .577 0 1 220 139)">
      ${rows.map((row, index) => `<g>${[17, 76].map(x => `<rect x="${x}" y="${19 + row}" width="46" height="47" fill="#a99883"/><rect x="${x + 3}" y="${22 + row}" width="40" height="41" fill="url(#${prefix}-${night && index !== 1 ? 'warmglass' : 'glass'})"/><path d="M${x + 23} ${23 + row}v39" stroke="#f8f1e0" stroke-width="2.8"/>`).join('')}${index < 2 ? `<path d="M11 ${68 + row}h119v5H11Z" fill="#cdc7b3"/><path d="M9 ${52 + row}h120m-117 0v17m18-17v17m18-17v17m18-17v17m18-17v17m18-17v17m18-17v17m18-17v17" stroke="#b0b7a4" stroke-width="1.8" fill="none"/>` : ''}</g>`).join('')}
      <rect x="139" y="149" width="25" height="66" fill="#648477"/>
      <rect x="142" y="152" width="19" height="31" fill="url(#${prefix}-glass)"/>
      <path d="M157 191v7" stroke="#ead3a1" stroke-width="2"/>
    </g>
    <g transform="matrix(1 -.577 0 1 390 237)">${rows.map(row => [22, 90].map(x => `<rect x="${x}" y="${19 + row}" width="43" height="45" fill="#9aa997"/><rect x="${x + 3}" y="${22 + row}" width="37" height="39" fill="url(#${prefix}-${night ? 'warmglass' : 'glass'})"/><path d="M${x + 21} ${23 + row}v37" stroke="#f7f0df" stroke-width="2.7"/>`).join('')).join('')}</g>
    <path d="M390 249v197" stroke="#b5bea8" stroke-width="4"/>
    <path d="m220 343 170 98 153-88v11l-153 88-170-98Z" fill="#b9bba5"/>
    ${solar ? panelArray(prefix, input.panels || 10, true, planned.has('solar')) : ''}
    ${insulation ? '<path class="house-insulation" d="M224 156v183l162 94m9 0 142-82V168" fill="none" stroke="#edcb68" stroke-width="5" stroke-linejoin="round"/>' : ''}
  </g>`;
}

function batteryMarkup(prefix, proposed) {
  return `<g class="house-battery ${proposed ? 'house-new' : ''}">
    <path d="m494 350 29-17 20 12v55l-29 17-20-12Z" fill="#f5f0df" stroke="#e7e4d5" stroke-width="1"/>
    <path d="m514 362 29-17v55l-29 17Z" fill="#d2ddd0"/>
    <path d="m494 350 20 12 29-17-20-12Z" fill="#fff9e8"/>
    <path d="m521 368 15-9" stroke="${proposed ? '#e8c750' : '#7fa792'}" stroke-width="4" stroke-linecap="round"/>
    <path d="m530 372-6 13 6-3-3 12" fill="none" stroke="#729c82" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M497 350v-14l-11-6" stroke="#91a78c" stroke-width="3" fill="none"/>
    <path d="m500 407 14 8 28-16" stroke="#9daa91" stroke-width="2" opacity=".45"/>
  </g>`;
}

function heatPumpMarkup(prefix, proposed) {
  return `<g class="house-heatpump ${proposed ? 'house-new' : ''}">
    <ellipse cx="237" cy="389" rx="43" ry="16" fill="#4f6654" opacity=".1"/>
    <path d="m191 335 17-10 72 42-17 10Z" fill="#f6f0e2"/>
    <path d="m191 335 72 42v42l-72-42Z" fill="#e9e8d8"/>
    <path d="m263 377 17-10v42l-17 10Z" fill="#b8c8b8"/>
    <g transform="matrix(1 .577 0 1 191 335)">
      <rect x="4" y="3" width="64" height="35" rx="2" fill="#f6f1e4"/>
      <circle cx="24" cy="21" r="14" fill="#b8c9bd"/>
      <circle cx="24" cy="21" r="11" fill="#71958b"/>
      <g class="house-fan" style="transform-origin:24px 21px"><path d="M24 21c-14-5-10-13-4-10 3 2 3 7 4 10Zm0 0c12-9 17-2 11 1-4 2-7 0-11-1Zm0 0c2 14-8 15-7 8 0-3 4-6 7-8Z" fill="#d5e0cd"/></g>
      <circle cx="24" cy="21" r="2.5" fill="#eff1e0"/>
      <path d="M45 12h14m-14 5h14m-14 5h14m-14 5h14m-14 5h14" stroke="#a2b6a6" stroke-width="1.4"/>
      <rect x="46" y="5" width="11" height="3" rx="1" fill="${proposed ? '#efcf62' : '#9fb693'}"/>
    </g>
    <path d="m198 381 0 5m59 29v5" stroke="#97a88f" stroke-width="4" stroke-linecap="round"/>
    <path d="M270 367v-16l-17-10" fill="none" stroke="#b8b59f" stroke-width="3"/>
  </g>`;
}

function electricCar(prefix) {
  return `<g class="house-car" transform="translate(551 424)">
    <ellipse cx="7" cy="13" rx="51" ry="17" fill="#385947" opacity=".17"/>
    <g transform="matrix(.94 .543 -.94 .543 0 0)">
      <rect x="-36" y="-24" width="20" height="8" rx="3" fill="#44544f"/>
      <rect x="-36" y="21" width="20" height="8" rx="3" fill="#44544f"/>
      <rect x="21" y="-24" width="20" height="8" rx="3" fill="#44544f"/>
      <rect x="21" y="21" width="20" height="8" rx="3" fill="#44544f"/>
      <rect x="-47" y="-22" width="97" height="47" rx="14" fill="#d0d4c4"/>
      <rect x="-47" y="-28" width="97" height="47" rx="14" fill="#f5edce"/>
      <path d="M-22-25h39l10 39h-56Z" fill="#acc7c5"/>
      <path d="M-14-25h25l5 39h-36Z" fill="#e6e4ca"/>
      <path d="m-24-22-4 12m53-12 3 12" stroke="#e7f1e4" stroke-width="3"/>
      <path d="M43-19v8m0 12v8" stroke="#fff9e1" stroke-width="5" stroke-linecap="round"/>
      <path d="M-42-18v7m0 11v7" stroke="#d48b6e" stroke-width="3" stroke-linecap="round"/>
    </g>
    <path d="M-37 11c-25 7-25-14-37-12" fill="none" stroke="#6b897d" stroke-width="3" stroke-linecap="round"/>
    <path d="M-77 3v-27l10-6v27Z" fill="#75978b"/><path d="m-77-24-6-4 10-6 6 4Z" fill="#b0c9ac"/><path d="m-83-28 6 4V3l-6-4Z" fill="#96af94"/>
    <path d="m-74-18 4-2v5l-4 2Z" fill="#f1dc84"/>
  </g>`;
}

function flowsMarkup(state) {
  const { solar, battery, heatpump, daylight } = state;
  const sun = daylight > 38;
  const segments = [];
  if (solar && sun) {
    segments.push('<path class="house-flow house-flow-solar" d="M351 289 382 308v121l-44 26"/>');
    if (battery) segments.push('<path class="house-flow house-flow-solar" d="m389 429 124-71"/>');
  }
  if (battery && !sun) segments.push('<path class="house-flow house-flow-stored" d="m514 400-125 72-50-29"/>');
  if (heatpump) segments.push('<path class="house-flow house-flow-heat" d="m270 409 28 16 43-25"/>');
  if (!solar || !sun && !battery) segments.push('<path class="house-flow house-flow-grid" d="m296 496 43-25 43-25"/>');
  return segments.length ? `<g class="house-energy-flows" fill="none" stroke-linecap="round">${segments.join('')}</g>` : '';
}

function svgMarkup(prefix, state) {
  const { input, night, solar, battery, heatpump, planned, daylight } = state;
  const tintOpacity = Math.max(0, (50 - daylight) / 50) * .58;
  const sunOpacity = Math.min(1, Math.max(0, (daylight - 20) / 50));
  const moonOpacity = 1 - sunOpacity;
  const features = [solar && 'zonnepanelen', battery && 'een thuisbatterij', heatpump && 'een warmtepomp', input.hasEv && 'een elektrische auto'].filter(Boolean);
  const title = `Jouw ${HOME_NAMES[input.homeType] || HOME_NAMES.terraced}${features.length ? ` met ${features.join(', ')}` : ''}`;
  return `<svg class="house-illustration" viewBox="0 0 760 570" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">
    <title id="${prefix}-title">${escape(title)}</title>
    <desc id="${prefix}-desc">Een sfeerillustratie. De lampjes en energiestromen tonen mogelijke samenhang, geen gemeten of voorspeld uurverbruik. Gebruik de knoppen rond het huis om veranderingen te proberen.</desc>
    <defs>
      <linearGradient id="${prefix}-wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fbf4e5"/><stop offset="1" stop-color="#e6ddc7"/></linearGradient>
      <linearGradient id="${prefix}-side" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d5dfcb"/><stop offset="1" stop-color="#bbcbb4"/></linearGradient>
      <linearGradient id="${prefix}-roof" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#c68c70"/><stop offset="1" stop-color="#a96954"/></linearGradient>
      <linearGradient id="${prefix}-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bfd8d9"/><stop offset="1" stop-color="#719d9d"/></linearGradient>
      <linearGradient id="${prefix}-warmglass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9e8a8"/><stop offset="1" stop-color="#e8b86c"/></linearGradient>
      <linearGradient id="${prefix}-panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4b7285"/><stop offset="1" stop-color="#254855"/></linearGradient>
      <linearGradient id="${prefix}-grass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dce2bd"/><stop offset="1" stop-color="#c2cda8"/></linearGradient>
      <linearGradient id="${prefix}-tree" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9cb985"/><stop offset="1" stop-color="#71926d"/></linearGradient>
      <radialGradient id="${prefix}-sun"><stop stop-color="#f7e8a7" stop-opacity=".8"/><stop offset="1" stop-color="#f7e8a7" stop-opacity="0"/></radialGradient>
      <radialGradient id="${prefix}-night"><stop stop-color="#709399" stop-opacity=".32"/><stop offset="1" stop-color="#456a76" stop-opacity="0"/></radialGradient>
      <filter id="${prefix}-shadow" x="-35%" y="-80%" width="170%" height="260%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="${prefix}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".045"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
      <clipPath id="${prefix}-plot-clip"><path d="m79 365 269-155 332 192-269 155Z"/></clipPath>
    </defs>
    <ellipse cx="412" cy="268" rx="297" ry="226" fill="#e9eeE5" opacity=".45"/>
    <ellipse cx="407" cy="252" rx="300" ry="230" fill="#a6c0c5" opacity="${tintOpacity}"/>
    <g class="house-sun" opacity="${sunOpacity}">
      <circle cx="603" cy="111" r="86" fill="url(#${prefix}-sun)"/>
      <circle cx="603" cy="111" r="27" fill="#efd481"/>
      <circle cx="596" cy="105" r="20" fill="#f4df9e" opacity=".75"/>
    </g>
    <g class="house-moon" opacity="${moonOpacity}">
      <path d="M626 94a27 27 0 1 1-32-35 24 24 0 0 0 32 35Z" fill="#e9e4bf"/>
      <path d="M555 61v9m-4.5-4.5h9M662 147v7m-3.5-3.5h7M617 47v5m-2.5-2.5h5" stroke="#b5c8bd" stroke-width="2" stroke-linecap="round"/>
      <circle cx="535" cy="117" r="2" fill="#d2ddc8"/><circle cx="672" cy="82" r="2" fill="#d2ddc8"/>
    </g>
    <g class="house-clouds" fill="#fffdf2" opacity="${.25 + sunOpacity * .4}"><path d="M118 143c-9-16 11-29 25-18 4-28 45-29 51-2 17-4 28 9 22 20Z"/><path d="M556 173c-5-10 6-18 15-12 4-18 29-17 32 0 11-2 18 6 14 12Z" opacity=".6"/></g>
    <ellipse cx="383" cy="469" rx="250" ry="62" fill="#486d59" opacity=".045"/>
    <ellipse cx="383" cy="468" rx="235" ry="53" fill="#486d59" opacity=".035"/>
    <g class="house-landscape">
      <path d="m79 367 269-155 332 192-269 155Z" fill="#a4b99a"/>
      <path d="M79 367v12l332 192v-12Zm332 192 269-155v12L411 571Z" fill="#a4b293"/>
      <path d="m79 365 269-155 332 192-269 155Z" fill="url(#${prefix}-grass)"/>
      <g clip-path="url(#${prefix}-plot-clip)"><path d="m79 365 269-155 332 192-269 155Z" fill="#f2ead8" opacity=".08" filter="url(#${prefix}-grain)"/></g>
      <path d="m347 421 38-22 151 87-38 22Z" fill="#eee7d4"/>
      <path d="m378 441 38-22m-14 36 38-22m-14 36 38-22m-14 36 38-22m-14 36 38-22" stroke="#d2cfb8" stroke-width="2"/>
      <path d="m282 501 57-33 28 16-57 33Z" fill="#e4dfca"/>
      <path d="m300 491 28 16m-11-26 28 16" stroke="#c9ceb4" stroke-width="2"/>
      <path d="m566 399 65 38-50 29-65-38Z" fill="#c4c9ac" opacity=".65"/>
      <path d="m566 403 57 33m-67-27 57 33m-67-27 57 33" stroke="#d7dbc2" stroke-width="2"/>
      <path d="m126 369 12 7m473 51 12 7m-181 94 12 7m-225-84 12 7m23-178 12 7m271 83 12 7" stroke="#b7c59b" stroke-width="2" stroke-linecap="round"/>
    </g>
    ${tree(579, 342, .9, prefix)}
    ${tree(141, 353, .78, prefix, 1)}
    ${houseBuilding(prefix, state)}
    ${battery ? batteryMarkup(prefix, planned.has('battery')) : ''}
    ${heatpump ? heatPumpMarkup(prefix, planned.has('heatpump')) : ''}
    ${input.hasEv ? electricCar(prefix) : ''}
    ${shrubs(177, 418, .88)}
    ${shrubs(480, 488, .64)}
    ${tree(608, 463, .56, prefix, 1)}
    ${peopleMarkup(Math.round(clamp(input.people, 1, 8, 3)))}
    ${flowsMarkup(state)}
    <path d="M162 379l2-9m5 13 3-9m-49 14 2-6m491 48 2-8m5 12 3-8m-342 65 2-8m4 11 3-7m193 44 2-7" stroke="#90a576" stroke-width="2" stroke-linecap="round"/>
    <g class="house-grid-node" transform="translate(286 504)"><path d="m0 0 10-6 10 6-10 6Z" fill="#f2eee0"/><path d="m6-1 4-6-1 4h5l-5 6 1-4Z" fill="#849c89"/></g>
  </svg>`;
}

function stateFromOptions(options) {
  const input = { homeType: 'terraced', people: 3, panels: 10, ...options.input };
  const selected = new Set(Array.isArray(options.selectedIds) ? options.selectedIds : []);
  const planned = options.view === 'current' ? new Set() : selected;
  const daylight = clamp(options.daylight, 0, 100, 65);
  return {
    input, planned, daylight, night: daylight < 35,
    solar: Boolean(input.hasSolar || planned.has('solar')),
    battery: Boolean(input.hasBattery || planned.has('battery')),
    heatpump: Boolean(input.hasHeatPump || planned.has('heatpump')),
    insulation: Boolean(input.insulation === 'good' || planned.has('insulation')),
    view: options.view === 'current' ? 'current' : 'plan'
  };
}

function hotspotMarkup(state) {
  const buttons = [
    { id: 'solar', label: 'Zonnepanelen', present: state.solar, existing: state.input.hasSolar },
    { id: 'insulation', label: 'Isolatie', present: state.insulation, existing: state.input.insulation === 'good' },
    { id: 'battery', label: 'Thuisbatterij', present: state.battery, existing: state.input.hasBattery },
    { id: 'heatpump', label: 'Warmtepomp', present: state.heatpump, existing: state.input.hasHeatPump }
  ];
  return buttons.map(({ id, label, present, existing }) => `<button class="house-hotspot house-hotspot-${id}${present ? ' is-present' : ''}${state.planned.has(id) ? ' is-planned' : ''}" data-house-action="${id}" type="button" aria-label="${escape(`${label}${existing ? ' aanwezig' : state.planned.has(id) ? ' in je plan' : ''}, bekijk de mogelijkheden`)}">
    <span class="house-hotspot-icon">${icon(id)}</span><span class="house-hotspot-label">${label}</span>
    <span class="house-hotspot-mark" aria-hidden="true">${present ? '✓' : '+'}</span>
  </button>`).join('');
}

/**
 * Render a responsive house in an existing element. All controls have native
 * button semantics. `update` accepts partial options and preserves focus.
 */
export function renderHouseScene(container, options = {}) {
  if (!container || typeof container.addEventListener !== 'function') throw new TypeError('Een element voor het energiehuis is vereist.');
  const prefix = `wg-house-${++sceneSequence}`;
  let current = { view: 'current', daylight: 65, input: {}, selectedIds: [], ...options };
  let destroyed = false;
  let observer;
  function fitScene() {
    const wrapper = container.querySelector('.energy-scene');
    if (!wrapper) return;
    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;
    if (availableWidth > 0 && availableHeight > 0) {
      const width = Math.min(availableWidth, availableHeight * 760 / 570);
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${width * 570 / 760}px`;
    }
  }
  const handleClick = event => {
    const button = event.target.closest('[data-house-action]');
    if (!button || !container.contains(button)) return;
    if (typeof current.onAction === 'function') current.onAction(button.dataset.houseAction);
  };
  container.addEventListener('click', handleClick);

  function update(next = {}) {
    if (destroyed) return;
    current = { ...current, ...next, input: next.input ? { ...current.input, ...next.input } : current.input };
    const state = stateFromOptions(current);
    const activeElement = container.ownerDocument?.activeElement;
    const focusAction = container.contains(activeElement) ? activeElement?.dataset?.houseAction : null;
    container.innerHTML = `<div class="energy-scene${state.night ? ' is-evening' : ''}${state.input.homeType === 'apartment' ? ' is-apartment' : ''}" data-house-view="${state.view}" style="--house-daylight:${state.daylight / 100}">
      ${svgMarkup(prefix, state)}
      <div class="house-hotspots" aria-label="Ontdek de mogelijkheden van je huis">${hotspotMarkup(state)}</div>
    </div>`;
    fitScene();
    if (focusAction) container.querySelector(`[data-house-action="${focusAction}"]`)?.focus({ preventScroll: true });
  }
  update();
  const ResizeObserverType = container.ownerDocument?.defaultView?.ResizeObserver;
  if (typeof ResizeObserverType === 'function') {
    observer = new ResizeObserverType(fitScene);
    observer.observe(container);
  }
  return {
    update,
    destroy() {
      destroyed = true;
      observer?.disconnect();
      container.removeEventListener('click', handleClick);
      container.replaceChildren();
    }
  };
}

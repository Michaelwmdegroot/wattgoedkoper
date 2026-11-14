/* Premium compact energy plan. Only data from the existing deterministic model. */
export function renderPlanDashboard({r, personalized, labelFor, icon, money, number, range, escape, modelVersion}) {
  const baseline = Number(r.baseline.bill.total);
  const planned = Number(r.scenario.bill.total);
  const scale = Math.max(1, Math.max(0, baseline), Math.max(0, planned));
  const width = value => (value <= 0 ? 0 : Math.max(3, Math.min(100, (value / scale) * 100)));
  const chosen = r.selectedIds.map(id =>
    '<button type="button" class="plan-chip" data-upgrade-info="' + escape(id) +
    '" aria-label="Bekijk ' + escape(labelFor(id)) + '">' + icon(id) + '<span>' + escape(labelFor(id)) + '</span></button>'
  ).join('');
  const notices = [];
  if (!r.selectedIds.length) notices.push('Kies één of meer maatregelen om het verschil te zien.');
  if (r.savingsHigh <= 0 && r.selectedIds.length) notices.push('Dit plan bespaart mogelijk geen geld per jaar.');
  if (r.budget.exceeded) notices.push('Je investering kan ' + money(r.budget.overBy) + ' boven je budget uitkomen.');
  if (!personalized) notices.push('Je rekent nog met een voorbeeldwoning.');
  const pills = notices.length ? notices.map(text =>
    '<p class="plan-alert">' + icon('home') + '<span>' + escape(text) + '</span></p>'
  ).join('') : '<p class="plan-assurance">De bedragen zijn indicaties. Niet alle kosten en voorwaarden zijn hierin verwerkt.</p>';
  const measureBody = chosen || '<p class="plan-empty">Nog geen aanpassingen gekozen. Voeg iets toe aan je energiehuis.</p>';
  const rows = [
    ['Stroomverbruik', 'electricityUse', 'kWh'],
    ['Netafname', 'gridImport', 'kWh'],
    ['Zonnestroom', 'pvProduction', 'kWh'],
    ['Teruglevering', 'gridExport', 'kWh'],
    ['Gasverbruik', 'gasUse', 'm³']
  ];
  const detailRows = rows.map(([label, key, unit]) =>
    '<tr><th scope="row">' + escape(label) + '</th><td>' + number(r.baseline.flow[key]) + ' ' + unit +
    '</td><td>' + number(r.scenario.flow[key]) + ' ' + unit + '</td></tr>'
  ).join('');
  const assumptions = r.assumptions.map(a =>
    '<tr><th scope="row">' + escape(a.label) + '</th><td colspan="2">' + escape(a.value) + '</td></tr>'
  ).join('');
  const warnings = r.warnings.map(text => '<li>' + escape(text) + '</li>').join('');
  return [
    '<div class="plan-dashboard">',
      '<div class="plan-caption"><span class="plan-caption-dot"></span><span>',
        personalized ? 'Gebaseerd op jouw energiehuis' : 'Voorbeeldhuis · personaliseer voor een betere indicatie',
      '</span><button type="button" class="plan-save" data-save>Bewaar mijn huis ↗</button></div>',
      '<section class="plan-metrics" aria-label="Financiële indicaties">',
        '<div class="plan-metric plan-metric-highlight"><span>Indicatieve besparing per jaar</span>',
          '<strong>' + range(r.savingsLow, r.savingsHigh) + '</strong>',
          '<small>Variabele energiekosten · rekenjaar ' + r.year + '</small></div>',
        '<div class="plan-metric"><span>Eenmalige investering</span>',
          '<strong>' + range(r.investmentLow, r.investmentHigh) + '</strong>',
          '<small>Inclusief installatie · vóór subsidie</small></div>',
      '</section>',
      '<div class="plan-insights">',
        '<section class="plan-compare" aria-label="Nu tegenover jouw energieplan">',
          '<div class="plan-section-head"><span>01 / DE VERGELIJKING</span><strong>Je energiekosten per jaar</strong></div>',
          '<div class="plan-cost-row"><div class="plan-cost-label"><span>Zoals het nu is</span><strong>' + money(baseline) + '</strong></div>',
          '<div class="plan-track"><div class="plan-fill plan-fill-before" style="width:' + width(baseline).toFixed(2) + '%"></div></div></div>',
          '<div class="plan-cost-row"><div class="plan-cost-label"><span>Met jouw plan</span><strong>' + money(planned) + '</strong></div>',
          '<div class="plan-track"><div class="plan-fill plan-fill-after" style="width:' + width(planned).toFixed(2) + '%"></div></div></div>',
          '<p class="plan-compare-note">Zelfde schaal · variabele energiekosten, geen volledige jaarrekening.</p>',
        '</section>',
        '<section class="plan-measure-card" aria-label="Geselecteerde verbeteringen">',
          '<div class="plan-section-head"><span>02 / JOUW KEUZES</span><strong>Gekozen maatregelen <em>' + r.selectedIds.length + '</em></strong></div>',
          '<div class="plan-chip-list">' + measureBody + '</div>',
          '<p class="plan-measure-note">Tik op een maatregel voor meer informatie.</p>',
        '</section>',
      '</div>',
      '<div class="plan-notices" aria-live="polite">' + pills + '</div>',
      '<details class="plan-assumptions"><summary>Berekening en aannames bekijken <span aria-hidden="true">↓</span></summary>',
        '<div class="plan-details-inner">',
          '<p>Rekenmodel ' + escape(modelVersion) + '. Dag/nacht is een illustratie; dit is geen uurprognose, offerte of besparingsgarantie.</p>',
          '<div class="plan-detail-scroll"><table class="plan-table"><thead><tr><th scope="col">Per jaar</th><th scope="col">Nu</th><th scope="col">Met plan</th></tr></thead>',
          '<tbody>' + detailRows + '<tr><th scope="row">Variabele jaarkosten</th><td>' + money(baseline) + '</td><td>' + money(planned) + '</td></tr>',
          assumptions + '</tbody></table></div>',
          '<ul>' + warnings + '</ul><a href="/rekenmodel.html">Lees de rekenmethode en bronnen ↗</a>',
        '</div></details>',
      '<form id="report-email-form" class="plan-mail-bar">',
        '<div class="plan-mail-copy"><strong>Ontvang jouw energieplan in je inbox</strong><span>Alleen voor dit rapport. Geen adviesaanvraag of marketingtoestemming.</span></div>',
        '<div class="plan-mail-fields"><label class="sr-only" for="report-email">E-mailadres voor rapportbezorging</label>',
          '<input id="report-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="jouw@email.nl">',
          '<button id="report-send" type="submit" class="button button-yellow">Mail mijn energieplan ' + icon('arrow') + '</button></div>',
        '<div class="plan-mail-footer"><span id="report-status" role="status" aria-live="polite">Rapportbezorging staat los van persoonlijk advies.</span>',
        '<button type="button" class="plan-advice-button" data-dialog="advice">Vraag vrijblijvend advies ↗</button></div>',
      '</form>',
    '</div>'
  ].join('');
}

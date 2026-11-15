# WattGoedkoper — agentregels, actuele productie en leesvolgorde

**Actuele mijlpaal (15 november 2026):** de premium consumentenwebsite, beveiligde MySQL/API, Dashboard 2.0, één Hostinger 5-minuten-cron en de **vrijwillige NIVO-adviesaflevering per SMTP** zijn functioneel live. De eigenaar bewees dit met een gewone testaanvraag `WG-5510214770E3`, zichtbaar in het admin-dashboard rond 19:02 en ontvangen rond 19:05 in de echte **`portal@nivogroepholland.nl`**-inbox. Code-`main` vóór de documentatieoverdracht: `f3c273dcffb03de05de13004fee410194ae659df` (PR #35); controleer altijd actuele HEAD. Alle PR's #28–#35 zijn gemerged. De **algemene Finish Line is nog niet afgerond**: back-up/restore, monitoring-acceptatie, individuele afleverstatus, aparte rapportmail, juridische/privacygegevens en echte GSC-cijfers blijven open.

**Leidende overdracht:** [docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md](docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).  
**Nieuwe roadmap:** [docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md](docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).  
**Volgende agent:** [docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md](docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md).  
**Regie:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14), [#21–#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21). De oudere overdracht, oude roadmaps en v0.5–v0.9 plannen zijn **historische ontwerp-/releasegeschiedenis**, niet de huidige productiestatus.

## Verplichte leesvolgorde

1. Actuele GitHub-`main` en dit `AGENTS.md`.
2. `docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md`.
3. `docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md`.
4. `docs/backend.md`, `docs/OPERATIONS-RUNBOOK-V1.md`, `docs/NIVO-DELIVERY-CONTRACT-V1.md` en `docs/NIVO-SMTP-PRODUCTION-RUNBOOK.md`.
5. Issues #14, #21–#26 en de daadwerkelijke recente GitHub Actions-workflows; daarna de relevante broncode.

## Vaststaande productregels

- De homepage blijft een **premium interactief energiehuis** met woning, visuele maatregelen en Plan Studio, geen goedkoop formulier. De bezoeker kan gratis berekenen, vergelijken, bewaren op eigen apparaat en terugdraaien zonder account, e-mail, advies of tracking.
- Vijf maatregelen: slim gebruik, isolatie, zonnepanelen, hybride warmtepomp en thuisbatterij. Bestaande installaties niet met nieuw gekozen maatregelen verwarren.
- De deterministische jaarberekening kent aparte rekenjaren, variabele kosten, budget- en negatieve-uitkomstwaarschuwingen. Dag-/nachtweergave is illustratief, niet een uur- of opbrengstvoorspelling. Gebruik geen gegarandeerde besparing, rendement, subsidies of energietarieven.
- **Alle nieuwe vrijwillige adviesaanvragen uitsluitend naar NIVO Groep Holland** met expliciete en server-side afgedwongen, standaard uitgevinkte `2026-11-v2` toestemming. Geen partnerkeuze, extra ontvangers of omzet-/sales-mailcampagne. Historische partners en consent ongemoeid.
- De actuele, **door eigenaar ingeschakelde** SMTP-route loopt van `info@wattgoedkoper.nl` naar exact `portal@nivogroepholland.nl`; de onafhankelijke `report_email` is **geen** NIVO-lead of toestemming voor marketing/analytics en moet nog apart eind-tot-eind worden geverifieerd.
- Privacysparende, geaggregeerde analysetellingen alleen na losse opt-in. Niet presenteren als unieke bezoekers, bewezen attributie of Google Search Console-metingen zonder werkelijke data.
- Het oude WordPress-, drie-offertes-/partners- en €100-bonusconcept uit historische PDF's is nadrukkelijk **vervallen**; niet terugbrengen.
- Geen nieuwe betaalde tool/hostingupgrade, ongecontroleerde AI-massapublicatie of te optimistische juridische/financiële claims zonder akkoord en bronreview.

## Huidige technische architectuur

- Frontend: statische HTML, CSS, native ES-modules en lokale beelden/fonts; `assets/app.mjs`, `assets/model.mjs`, `assets/house-scene.mjs`, `assets/playground-model.mjs` en `assets/plan-ui.mjs`.
- MySQL/PHP: `api/index.php`, `lib/bootstrap.php`, `lib/delivery.php`, `lib/mail.php`, `lib/report.php`, `lib/operations.php`; private config en AES-sleutels **buiten de webroot**; SQLite compatibiliteit alleen voor tests/oudere installaties.
- Consentgebonden leaddatabase + transactionele `delivery_outbox` en uitsluitend **één** Hostinger-cron: `*/5 * * * *` → `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php`. Geen parallelle `maintenance.php`-/`deliver-leads.php`-cron.
- Beheer in `/admin/`: Overzicht, Aanvragen, SEO, Tools & status, gerichte aanvraagweergave met technische delivery, retry-guards en mail.
- Inhoud: `docs/seo-cluster-v08.json` en `scripts/build-content.py`; kennisclusters, canonicals, sitemap en contextuele gratis-tool-CTA's. Redactionele/wettelijke onderwerpen vereisen menselijk geverifieerde actuele bronnen.
- GitHub Actions: berekening/backend/MySQL/security, echte browserreview en [publieke live-HTTP-smoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43662312644) met 14/14 checks op `f3c273d`. Live-sourcesmoke bewijst geen veilige back-up of cron-heartbeat.

## Bewijsgrenzen en productieveiligheid

1. **NIET opnieuw** `scripts/setup-mysql.sh` of `scripts/setup.php` op de live site uitvoeren. Nooit productie-DB resetten, bestaande `config.php`/mailcredentials overschrijven of AES-sleutels roteren zonder goedgekeurd en bewezen migratie-/restoreplan.
2. Geen testcontactgegevens, privéscreenshots, mailboxinhoud, exports, passwords, tokens of private configuratie in GitHub/issues/CI/logs plaatsen. De testcode `WG-5510214770E3` is uitsluitend een technische referentie.
3. **NIVO SMTP werkt.** Niet opnieuw een tweede mailworker installeren of eerdere leads zonder toestemming verzenden. `smtp_accepted` betekent SMTP-serveracceptatie, **geen** API-ACK. De eigenaar bevestigde daarnaast afzonderlijk feitelijke inboxontvangst voor één test.
4. **NIVO Portal is nu alleen de NIVO-mailadresbestemming**, niet een aangesloten geauthenticeerde NIVO Portal REST API. De toekomstige HTTPS-adapter blijft uit tot expliciet contract en go.
5. Back-up/restore, foutalert, operationele heartbeat over meerdere runs, rapportmailontvangst, juridisch exploitant/privacybewijs en GSC-indexatie zijn **niet bewezen**; maak deze P0/P1-taken transparant.
6. Voer inspecties read-only uit tenzij de eigenaar gerichte wijzigingen heeft goedgekeurd. Werk in branches/PR's, voer testen uit, leg reële bewijzen vast en merge pas na geldende eigenaar-go. Geen force-push of ongevraagde productieuitrol.

## Volgende prioriteit (niet opnieuw bouwen wat werkt)

**P0:** herstelbare Hostinger MySQL + privatesleutel-back-up; herhaalde cron-heartbeat en waarschuwingen; individuele bezorgstatus van proefaanvraag bekijken en eventueel gericht opruimen; privacy/exploitant, gegevensoverdracht en toegangsbeveiliging verifiëren.  
**P1:** afzonderlijke transactionele consumentenrapportmail testen; gratis GSC-property verbinden/echte SEO-baseline; hoogwaardige SEO-content en funnelcontext uit echte waarnemingen verbeteren.  
**P2:** privacyvriendelijke KPI's, duurzame SEO-groei en later eventueel een apart geautoriseerde NIVO Portal API-ontvanger.

**De eerste reactie van een nieuwe agent** moet de actuele code- en operationele status verifiëren, geen oude afgeronde vragen herhalen en vervolgens daadwerkelijk de volgende resterende prioriteiten uitvoeren. Zie [de startprompt](docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md).

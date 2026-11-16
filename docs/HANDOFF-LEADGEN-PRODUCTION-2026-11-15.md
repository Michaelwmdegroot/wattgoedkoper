# WattGoedkoper — productieoverdracht: NIVO-leadmachine functioneel live

> **Historische technische overdracht van 15 november 2026.** Actuele uitvoeringsprioriteiten/afsluitcriteria zijn op 16 november commercieel herijkt: [HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md](HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md). De productiefeiten hieronder zijn nuttige achtergrond; er is **geen** verplicht nieuw maatwerk-back-uptraject voordat SEO en rapportmail worden afgerond.



**Datum:** 15 november 2026, tijdzone Europe/Amsterdam  
**Website:** https://wattgoedkoper.nl  
**GitHub:** https://github.com/Michaelwmdegroot/wattgoedkoper  
**Codebaseline vóór deze documentatiefase:** `main` = `f3c273dcffb03de05de13004fee410194ae659df` (PR #35). Verifieer bij overname altijd de dan actuele `main`.  
**Regie:** [Finish Line #14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14) en [#21 t/m #26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21).  
**Vervolg:** [actuele roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md) en [startprompt](START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md).

> **Feitelijke status:** De premium consumententool en de volledige vrijwillige adviesaanvraagketen naar de **echte NIVO-mailbox** zijn functioneel op productie bewezen. WattGoedkoper is daarmee **een werkende automatische NIVO-leadmachine**. Dit is **nog geen algehele Finish Line GO**: herstelbare back-ups, doorlopende monitoring, onafhankelijke rapportmail, juridische/privacy-aftekening en werkelijke SEO-data ontbreken nog.

## 1. Product en architectuur die je moet behouden

- **Consument:** interactieve premium woning met vijf verduurzamingsmaatregelen, scenario's, visuele resultaten, lokaal deterministisch rekenmodel en Plan Studio. De bezoeker mag de volledige gratis indicatie bekijken zonder account, e-mailadres, analytics- of adviesconsent. Bewaar de bestaande goedgekeurde UX; **geen generiek formulier of nieuw website-redesign als standaardactie**.
- **Advies:** aparte, vrijwillige NIVO-adviesaanvraag met expliciete server-side `2026-11-v2` toestemming. Naam plus contactmogelijkheid, relevante plannen, beperkte besparingsindicatie en toestemming worden op de server verwerkt. Geen publieke partnerkeuze. Historische partnerrecords en toestemming niet wijzigen.
- **Backend:** PHP 8.2+ / PDO MySQL op Hostinger, private config en encryptiesleutels buiten `public_html`, AES-256-GCM-versleutelde leadpayload. `api/index.php`, `lib/bootstrap.php`, `lib/delivery.php`, `lib/operations.php`. SQLite blijft uitsluitend compatibiliteits-/testpad.
- **Outbox:** lead en `delivery_outbox` atomair opgeslagen; onzekere SMTP-toestanden vragen handmatige mailboxcontrole. De standaard actuele transportroute is **`info@wattgoedkoper.nl` → `portal@nivogroepholland.nl`**, met een private ingeschakelde `nivo_delivery_channel='smtp'`; het toekomstige NIVO Portal HTTPS API-contract is alleen voorbereid, **niet geactiveerd**.
- **Scheduler:** precies één Hostinger-cron `*/5 * * * *` met `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php`. Dit is de enige productierunner: bewaartermijn, wachtrijtransport en heartbeat. Niet ook een losse `deliver-leads.php`- of `maintenance.php`-cron installeren.
- **Beheer:** `/admin/` met vier tabs **Overzicht | Aanvragen | SEO | Tools & status**; login, afleverteller, leadstatus, zoeken/filteren, consent-audit, export, verwijderen, veilige retry en optionele mailbox.
- **Energieplanrapport per e-mail:** ander pad `report_email` met eigen `report_mail_enabled`-instelling, onafhankelijk van NIVO-advies/marketing. Code bestaat, maar **niet bewezen dat dit afzonderlijke consumentenpad op productie geactiveerd is of bezorgd is**.
- **SEO:** nuttige kennisartikelen, lokale bronbestanden en contentgenerator `scripts/build-content.py`, canonicals, sitemap, interne contextlinks, reviews op RVO/ACM/Milieu Centraal-bronnen. Echte Search Console-cijfers onbekend. Geen betaalde GSC Wizard nodig of geautoriseerd.

## 2. Bewijsregister — volledig geïdentificeerde mijlpaal

| Onderdeel | Wat aantoonbaar is | Wat dit niet aantoont |
|---|---|---|
| Merges & CI | PR's [#28](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/28), [#29](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/29), [#30](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/30), [#31](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/31), [#32](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/32), [#33](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/33), [#34](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/34) en [#35](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/35) zijn op main gemerged; quality- en browsertests waren groen op de codebaseline | Geen live back-up of langdurige productie-SLA |
| Hostinger live-codepariteit | [GitHub Actions #43662312644](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43662312644): 14/14 live checks groen op `f3c273d`; latere [#43726041700](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43726041700) ook groen. Frontend/backend fingerprint, API-MySQL, publieke paden en blokkering privépaden | Geen exacte Git SHA uit server-API, geen onafhankelijke restore/cronmeting |
| SMTP mailbox | Eigenaar heeft `bash scripts/setup-mail.sh` uitgevoerd, daarna een handmatig testbericht uit `/admin/` daadwerkelijk ontvangen in NIVO Portal | Niet automatisch bewijs voor outbox |
| Synth. SMTP-worker | `php scripts/nivo-smtp-pilot.php --send-test` gaf SMTP-acceptatie voor `WG-08DF36756B7E`; eigenaar liet echte inboxontvangst van **[TEST - GEEN KLANT]** zien | Dit script wijzigt geen echte lead/outbox |
| Private SMTP-config | `php -l` geslaagd; `--check` meldde `Productie NIVO-SMTP actief: ja (huidig kanaal: smtp)`, vaste ontvanger en aanvankelijk lege queue (0 pending/failed) | Config/credentials niet uitlezen, publiceren of in Git opslaan |
| Cron | Hostinger hPanel toont `*/5 * * * *` en correcte CLI; `Cron output` toont `WattGoedkoper onderhoud uitgevoerd ... transport actief: ja` zonder fouten; handmatige runner werkte ook | Meerdere opeenvolgende heartbeat-metingen en alerts nog niet apart vastgelegd |
| **Echte reguliere adviesaanvraag → NIVO** | **`WG-5510214770E3`** werd ca. **19:02** Nederlandse tijd via de consumentenwebsite als technische test aangemaakt en verscheen in `/admin/`. De eigenaar toonde ca. **19:05** de automatische WattGoedkoper-adviesmail **met exact dezelfde code** in de echte NIVO Portal-inbox `portal@nivogroepholland.nl` | Echte inboxontvangst is aangetoond voor deze ene test; **per-record `smtp_accepted` in de dashboarddetailweergave niet apart afgelezen** en SMTP heeft geen API-ACK |
| Back-ups / restore | Geen geverifieerd productieherstelbewijs | **P0-open** |
| Consumentenrapportmail | Serverroute/HTML-template aanwezig, eigen flag; afzonderlijke ontvangproef niet gedeeld | **P1-open**, private flagstatus niet geverifieerd |
| Search Console en organische leads | Content/technische SEO gepubliceerd en tested; de GSC Wizard-connector gaf `payment_required` | **Geen echte impressies, clicks, indexatiedekking of organische funneldata** |

**Privacy van bewijs:** de eigenaar leverde screenshots met echte testcontactgegevens en technische mailinhoud uitsluitend in de privéchat. Deze beelden, telefoonnummers en adressen **niet kopiëren naar een publieke repo of issue**. De technische aanvraagcodes mogen als testreferenties in de projectdocumentatie worden gebruikt. Verwijder testrecord `WG-5510214770E3` alleen gericht vanuit `/admin/` nadat de aflevering is bevestigd; **nooit productie-DB resetten**.

## 3. Wat staat nu aan, uit of nog onbekend?

| Functie | Status op 15 november | Verificatiebron |
|---|---|---|
| Publieke energiehuis + Plan Studio | **Live** | GitHub live smoke en eigenaarstest |
| Beveiligde API / MySQL / admin | **Live** | live smoke, eigenaarsscreenshot testrecord |
| Consentgebonden NIVO-advies via SMTP | **Actief en end-to-end voor één test bewezen** | Private CLI-preflight, cronhPanel, NIVO-inbox |
| `nivo_delivery_enabled` / `nivo_delivery_channel` | **Private productieconfig actief = true / smtp**, eigenaar CLI getoond | Geen secrets meelezen |
| Outboxstatus van testlead | **Nog apart controleren** (`smtp_accepted` verwacht) | Beveiligd admin-detail / aggregate `--check` |
| Doorlopende cron-heartbeat / actieve alerts | Cron-uitvoer bevestigd; **herhaalde heartbeat/monitor-opt-in onbekend** | `admin_operations` / `operations_monitor_enabled` |
| Database + sleutelbackup én restore | **Onbekend/niet bewezen** | Hostinger backup en afgeschermde hersteloefening vereist |
| `report_mail_enabled` | **Niet verifiëerd**; code is fail-closed indien flag ontbreekt/false | Private config (zonder secrets tonen) en gecontroleerde mailtest |
| Juridische exploitant, privacy en verwerkers | **Nog te verifiëren** | Eigenaar + feitelijke documenten |
| Search Console-indexatie / conversie uit organisch | **Onbekend** | GSC-property en privacyvriendelijke metingen |
| NIVO Portal REST API-ontvanger | **Niet aangesloten** | Specifieke aparte toekomstige integratie |

Belangrijk verschil: `smtp_accepted` = SMTP-server aanvaardde het bericht; dit **bewijst geen inbox-aflevering in het algemeen**. Voor de ene E2E-test is daadwerkelijke NIVO-inboxontvangst bovendien **apart** door de eigenaar geverifieerd. De status `acknowledged` is uitsluitend voor de toekomstige HTTPS-API met een echt receipt ID.

## 4. De resterende werkzaamheden in beslisvolgorde

Volledige prioriteiten en acceptatiecriteria: [ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).

**P0 — operationele zelfstandigheid en continuïteit**
1. Werkelijke Hostinger-back-up van bestaande **MySQL + private `config.php` inclusief ongewijzigde encryptiesleutel**, veilige opslag buiten webroot/Git; **hersteltest op geïsoleerde omgeving**. Geen live database overschrijven.
2. Voor de echte testaanvraag technische status `smtp_accepted` in `/admin/` bevestigen. Afzonderlijk herhaalde `ops_last_success_at` / cron-age waarnemen; na bewijs eventueel private `operations_monitor_enabled=true`. Fail/late/stale waarschuwingen testen zonder echte klantmail opnieuw te verzenden.
3. Beschermde alert-/incidentroute, retentie, privacy-/autorisatiereview, ontbrekende definitieve exploitant-/privacygegevens en e-mail-domeinauthenticatie (SPF/DKIM/DMARC) controleren; geen ongeautoriseerde wijzigingen.
4. Echte testlead na laatste controle **gericht** opschonen; geen historische leads aanpassen.

**P1 — product compleet en meer kwalitatieve leads**
5. Persoonlijke rapportmail als **los transactioneel pad** live testen en, na eigenaar-go, expliciet activeren; eigen-adres-proef, rate limits, geen NIVO-lead/opslag/toestemming bij rapport-only.
6. GSC rechtstreeks via gratis bestaande Google Search Console-property verbinden/verifiëren (geen betaald abonnement) en nulmeting van indexatie, sitemap, query's en relevante landingspagina's vastleggen.
7. SEO-claims uit officiële bronnen actualiseren; hoge kwaliteit boven volume, geen automatisch juridisch/financieel publiceren. Premium contextuele doorstroom van kennisartikel → gratis tool → vrijwillig advies verbeteren met echte opt-in metingen.

**P2 — groeiritme en Portal-ready**
8. Funnel-KPI's per privacy/bron definiëren en monitoren: servergeaccepteerde leads, `smtp_accepted`/failed, opt-in scanvoltooiingen, GSC-clicks (alleen indien beschikbaar). Geen dubbele aantallen, verzonnen attributie of statistieken zonder toestemming.
9. Verdere interactieve kennisroutes, testbare UX-verfijning en SEO-clusters op basis van werkelijke zoekintentie/kwaliteit.
10. Pas zodra NIVO Portal een eigenaar-goedgekeurde ontvangende API met beveiligingscontract en idempotent `requestId` heeft: HTTPS-transport apart activeren. De SMTP-route blijft de huidige werkende oplossing; niet tegelijk beide kanalen op dezelfde lead loslaten.

## 5. Projectfiles en werkwijze

**Eerst lezen (actuele bron van waarheid):** `AGENTS.md` → dit document → [nieuwe roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md) → [actuele startprompt](START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md) → `docs/backend.md` → `docs/OPERATIONS-RUNBOOK-V1.md` → `docs/NIVO-DELIVERY-CONTRACT-V1.md`.

**Code en QA:** `index.html`, `assets/app.mjs`, `assets/model.mjs`, `assets/house-scene.mjs`, `lib/bootstrap.php`, `lib/delivery.php`, `lib/report.php`, `lib/operations.php`, `api/index.php`, `admin/`, `scripts/operations.php`, `scripts/nivo-smtp-pilot.php`, `scripts/build-content.py`, `docs/seo-cluster-v08.json`, `.github/workflows/quality.yml`, `.github/workflows/visual-review.yml`, `.github/workflows/live-deployment-smoke.yml`.

**Tests:** `npm test`, `npm run check`, `npm run check:seo`, `python3 tests/backend_test.py --php php`, `php tests/delivery_test.php`, `php tests/operations_test.php`, `php tests/report_mail_test.php`, `php tests/mysql_backend_test.php` (laatste **uitsluitend op geïsoleerde CI-MySQL**, nooit tegen productie), PHP-lint en de bestaande Playwright-browserreviews. Live smoke is read-only en kan **geen** private backup/cron/SMTP-inbox aftekenen.

**Git-proces:** inspecteer nieuwste `main`, maak featurebranch/PR, controleer beide workflows en live smoke na merge. **Geen secrets en geen productie-PII in GitHub, screenshots, logs of issues**. Het concrete mergebesluit voor nieuwe productwijzigingen ligt bij de eigenaar; voorkom ongevraagd doorrollen van ongeteste code. Behoud de werkende NIVO-leadroute.

## 6. Wat een volgende agent niet opnieuw moet doen

- Geen nieuwe MySQL-installatie (dus **niet** `scripts/setup-mysql.sh` of `scripts/setup.php` op productie draaien), geen SQLite→MySQL-init, geen tabelreset of keyrotatie.
- Geen SMTP-credentials in chat opvragen: `info@wattgoedkoper.nl` is al private geconfigureerd en de ontvangst bij NIVO is al bewezen.
- Geen tweede cron of mailworker naast de bestaande 5-minuten-runner.
- Geen nieuwe partnerkeuze of verkoopvoorstel voor drie installateurs; alleen NIVO.
- Geen volledige homepage of Plan Studio opnieuw ontwerpen; verbeteren mag alleen met behoud van de premium UX.
- Geen “GSC = nul klikken” of “back-ups veilig” claimen zonder meetbewijs.
- Geen externe Portal-API of ontvangen ACK claimen: **NIVO Portal is hier een e-mailinbox**.
- Geen historische PR-tekst met “staat nog open” als huidige projectstatus overnemen. De actuele status bovenaan README/AGENTS en dit overdrachtsdocument gaat voor.

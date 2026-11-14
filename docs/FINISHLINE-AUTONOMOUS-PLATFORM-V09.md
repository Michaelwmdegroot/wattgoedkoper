# WattGoedkoper — Finish Line: zelfstandig SEO- & leadplatform

**Versie:** v0.9 projectuitvoeringsplan · **vastgesteld als werkplan:** 14 november 2026  
**Productiecode op basis van:** `main` commit `5d5dac92496113d15abb92586657f86cb2b2a780` (v0.8, PR #20)  
**Eigenaarambitie:** snel een stabiel product afronden, daarna grotendeels zelfstandig laten draaien; inhoudelijk groeien via SEO en vrijwillige NIVO-adviesaanvragen.  
**Regie-issue:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14). **Uitvoering:** issues [#21–#26](#9-werkpakketten-en-volgorde).

> **Dit is de nieuwe leidende uitvoeringsroadmap.** De oudere product-/SEO-roadmap en v0.7-handoff blijven als technische context bestaan. Projecten zijn niet “klaar” doordat code gemerged is: de operationele, privacy- en NIVO-afleverchecks moeten werkelijk slagen.

## 1. Eén helder eindresultaat

```text
Google / organische zoekopdracht
  → uniek, behulpzaam kennisartikel of homepage
  → gratis energiehuis + betrouwbare indicatie + Plan Studio
  → vrijwillige, afzonderlijke adviesaanvraag (expliciete NIVO-consent)
  → WattGoedkoper: versleuteld opslaan → afleverwachtrij → ontvangstcontrole
  → goedgekeurd NIVO-kanaal (later: NIVO Portal)
  → NIVO-medewerkers behandelen aanvraag [BUITEN DIT PROJECT]

WattGoedkoper-dashboard (/admin/):
  Leads | afgegeven/geen ontvangst | consent-analytics | SEO | technische status | tools
Los pad: vrijblijvend energieplan per e-mail → uitsluitend rapportbezorging
```

### Definition of Done — de website is zelfstandig

- [ ] De consument heeft een volwaardige gratis reis vanaf artikel of homepage, zónder verplichte registratie, contactgegevens of toestemming voor statistieken.
- [ ] Nieuwe NIVO-leads worden alleen na expliciete `2026-11-v2` adviesconsent opgeslagen en via **één goedgekeurd, veilig en getoetst kanaal** automatisch afgeleverd; elke aanvraag heeft een unieke ID, afleverstatus en waar mogelijk externe ontvangstreferentie.
- [ ] Uitval van de ontvanger of netwerk leidt tot veilige wachtrij + begrensde retries + alert + beheerderactie; nooit stille dataverlies- of dubbele-leadclaims.
- [ ] Het eigen WattGoedkoper-dashboard toont alle opgeslagen aanvragen, bezorgstatus, relevante echte statistieken, SEO-indicatoren waar toegang bestaat en de gezondheid van de diensten.
- [ ] Rapportmail, NIVO-contact en gebruiksstatistieken blijven drie afzonderlijke doelen/toestemmingsroutes; rapportmail staat pas aan na echte `info@wattgoedkoper.nl` bezorgtest en eigenaar-go.
- [ ] Cron, bewaartermijnen, back-ups, herstel en incidentmelding zijn aangetoond op het bestaande Hostinger/PHP/MySQL-platform. Geen noodzaak tot dagelijks handmatig toezicht.
- [ ] De SEO-basis is technisch correct; de eerste inhoudsclusters bieden echte consumentenwaarde en linken terug naar de rekenkern. Zoekresultaten, rankings en omzet zijn **doorlopend meetbare uitkomsten**, geen gegarandeerd oplevercijfer.
- [ ] Een laatste release-/rollbacktest inclusief NIVO-ontvangst is geslaagd en door de eigenaar beoordeeld. Daarna: onderhoudsmodus.

**Niet nodig om deze finish line te bereiken:** nieuwe klantaccounts, volledige CRM/ERP, eigen NIVO-Portal-UI, grootschalige site-redesign, automatische prijsvergelijker van leveranciers, AI-content op autopublicatie, volledig nieuwe rekenmotor, nieuwe betaalde SaaS of NIVO's menselijke salesworkflow.

## 2. Wat er al is — dus niet opnieuw bouwen

| Bouwsteen | Bestaand op `main` | Wat resteert |
| --- | --- | --- |
| Premium interactieve homepage met vijf maatregelen | Ja, visueel en functioneel goedgekeurd | Hooguit gerichte UX/CTA- en performancefixes |
| Deterministische jaarrekenkern + Plan Studio | Ja, inclusief scenariovergelijking, beperking en lokale opslag | Hergebruiken in nieuwe content, geen herbouw |
| v0.8 SEO-cluster en technische contentgenerator | Ja, 12 publieke routes; metadata/sitemap/schema en browserchecks | Volgende gerichte cluster + live index-/snelheidsverificatie |
| PHP 8.2+/MySQL, private versleuteling en beveiligde advies-API | Ja, in productie eerder door eigenaar getest | Live health, backups, retentie en afleveradapter |
| `/admin/` | Login, 30-dagenstatistieken, leads, statussen, CSV, inbox, statusmeldingen | Eén rustig dashboard met aflevermonitor, SEO en systeemgezondheid |
| NIVO-only adviesconsent | Ja, server-side afgedwongen `2026-11-v2` | Afleverpad naar goedgekeurde NIVO-ontvanger |
| Apart `report_email` endpoint | Aanwezig, default uitgeschakeld | Veilige SMTP-configuratie en echte inboxbezorgtest |
| Geaggregeerde events | Ja, uitsluitend bij opt-in | Eerlijk visualiseren; geen gebruikers/funnelpercentages verzinnen |
| NIVO Portal/Odoo | Niet gekoppeld | Adapter- en beveiligingscontract; later pas activatie |

**Feiten waarover we nog géén hard bewijs hebben:** exacte Hostinger-live SHA na de merge, ingerichte rapportmail, definitieve privacyverantwoordelijke en herstelbare private back-ups, daadwerkelijke Google-indexatie/CWV, en een bestaande ontvangende NIVO Portal API. Dit zijn dependencies, geen reden om project opnieuw te ontwerpen.

**Actueel technisch aandachtspunt:** `scripts/maintenance.php` voert een SQLite-specifieke `PRAGMA wal_checkpoint(TRUNCATE)` uit. Productie is MySQL. Onderzoek en maak dit databaseafhankelijk vóórdat we de onderhoudscron als betrouwbaar markeren; test beide drivers en foutpaden. Zie #21.

## 3. Klein houden: vier uitvoeringsrondes

Geen vaste doorlooptijden of opgeblazen productbacklog. Werk in kleine, controleerbare PR's. **Prioriteit wordt bepaald door de vraag: helpt dit het platform autonoom leads aan NIVO te leveren, of is het noodzakelijk voor betrouwbaarheid/SEO?**

### Ronde A — Basis 100% operationeel (P0)
**Issues:** #21; deel van #25.

1. Read-only live inventarisatie: SHA, HTTP 200/404/301, canonicals, HTTPS, beveiligingsheaders, health, cron- en mailstatus. Herhaal geen setup.
2. Herstel bewezen onderhoud: MySQL/SQLite compatibiliteit, retentiecron, databaseback-up inclusief private sleutel en restore-oefening. Leg herstelinstructies buiten publiek bereik vast.
3. Verifieer juridische exploitant en contactgegevens; check privacyverklaring en informatieplicht.
4. Richt `info@wattgoedkoper.nl` veilig in als eigenaar dat goedkeurt, controleer echte aflevering; activeer rapportmail pas na **geslaagde** mailtest. Bij fouten: fail closed.

**Exit A:** kritieke bedrijfsvoering heeft bewijs, uitval of ontbrekende mail is zichtbaar, geen secrets en geen werkende leads verloren. Niet blokkeren op niet-essentiële mooiweerfeatures.

### Ronde B — Eenvoudig dashboard + NIVO afleverroute (P0)
**Issues:** #22, #23.

1. Behoud `/admin/`, bestaande PHP-endpoints, authenticatie, privacyguards, historische partners en CSV. Ontwerp geen nieuwe SaaS of meerdere beheeraccounts.
2. Maak overzicht met **afleverstatus leidend** (nieuwe aanvragen, in wachtrij, bezorgd, fout), goedgekeurde aantallen, echte consent-analytics, SEO-stand en gezondheidsindicatoren. Tabs: Overzicht / Aanvragen / SEO / Tools & status.
3. Bouw een kleine server-side outbox/worker, retry/backoff, idempotente aflevering en technische ACK; zonder verrijking of verborgen marketingstromen.
4. Spreek met NIVO het **bestemmingscontract** af. Tot de Portal bestaat kan een door eigenaar geautoriseerde en geteste veilige tussenroute worden gebruikt; zonder bevestigde ontvanger blijft het dashboard de eigen bron van waarheid.
5. Test nieuwe consensuele aanvraag, ontvangst, duplicate, mislukking en herstel met fictieve, toegestane testdata.

**Exit B:** elke echte adviesaanvraag wordt veilig opgeslagen, de status is zichtbaar en een werkende, geautoriseerde NIVO-leveringsroute heeft aantoonbare end-to-end ontvangst. Geen “verzonden” zonder bewijs.

### Ronde C — Organisch verkeer & relevant advies (P1)
**Issues:** #24; deel van #25.

1. Voeg hoogwaardige, inhoudelijk verschillende thema's toe waar de engine vandaag toe in staat is: isolatie/hybride warmtepomp, contractvoorwaarden, eigen verbruik en logische combinaties. Niet zomaar pagina's op zoekwoordvarianten genereren.
2. Houd 2027-saldering, relevante regelingen en voorbeeldkosten brongebonden. Geen actuele prijsclaims zonder bron. Redactionele changes alleen via review/test.
3. Toets zoekintentie, metadata, sitemap/structured data, afbeeldingen, laadsnelheid, interne links en mobiel. Search Console alleen met echte, toegestane toegang (GSC Wizard is momenteel niet beschikbaar zonder betaald abonnement).
4. Bied vanuit de kennisroute een **relevante gratis simulatie**; advies bij NIVO is altijd een vrijwillige aparte actie nadat de consument zijn plan heeft gezien.
5. Meet alleen 1) GSC-clicks/relevante pagina's (na aansluiting), 2) servergeaccepteerde nieuwe NIVO-leads, 3) technisch door NIVO bevestigde leveringen. Bewaak consent en respecteer ontbrekende noemers.

**Exit C:** kwaliteit en interne samenhang aantoonbaar via tests én inhoudsreview. Indexatie en organische vindbaarheid controleerbaar zodra GSC verbonden is; geen rankingbelofte.

### Ronde D — Autonoom beheer en oplevering (P0)
**Issues:** #25, #26.

1. Plan zelfstandige job(s) voor retentie, lead-outbox, gezondheidscontrole, bronouderdom en back-upcheck. Maak ze idempotent; voorkom gelijktijdig dubbel uitvoeren.
2. Meld alleen actiegerichte problemen: ontbrekende lead-ACK, groeiende wachtrij, mislukte cron, onbereikbare API, niet-werkende mail, kapotte sitemap of verouderde belangrijke bron.
3. Maak één rustig `/admin/`-overzicht plus beknopt runbook voor inspecteren, incident, herstel en rollback; niet dagelijks vier dashboards hoeven openen.
4. Bewijs de complete reis en doe een gecontroleerde failover-/storingsproef; laat de eigenaar finale acceptatie geven.

**Exit D:** platform kan normaal functioneren zonder dagelijkse operator. Maandelijkse eigenaarcontrole en actualiteit van beleid/SEO blijven verstandig; “zelfstandig” betekent niet een onbewaakte website zonder onderhoud.

## 4. WattGoedkoper Dashboard 2.0: definitief MVP

| Scherm | In één oogopslag | Bron |
|---|---|---|
| **Overzicht** | Laatste controles, ontvangen leads, pendings, technisch bevestigde afleveringen, fouten, consented activiteit, rapportmail en Site/API-status | Eigen API, outbox + server-side tellers |
| **Aanvragen** | Alle toegankelijke leads, datum/maatregel, persoonlijke detailweergave na login, status, delivery ID/ACK, filters/export/retry met audit | `admin_leads`, nieuwe outbox, bestaande veilige encryptie |
| **SEO** | Gepubliceerde route/status, URL-/sitemapcheck, bron-update nodig, Search Console clicks en impressies **alleen indien aangesloten** | Generator/SEO-checks, officiële Search Console waar toegestaan |
| **Tools & status** | Cron last-run, wachtrij, transportstatus, rapportmail beschikbaarheid, back-up-/restorecheck, waarschuwingen, runbook-links | Afgeschermde admin API en operationele metadata |

MVP: desktop helder in één overzicht, mobiel leesbaar, snelle zoek/filteractie, goede focus/keyboard en minimaal laden. Geen nieuwe dure grafieklibrary of fictieve business-metrics. **Alleen werkelijk ondersteunde analytics tonen.** Bestaande opt-in dagcounters zijn acties, geen unieke personen. Totaal ontvangen leads als teller mag onafhankelijk van opt-in worden getoond; zonder bijpassende noemer is een conversieratio misleidend.

## 5. Beveiligde NIVO-overdracht: contract vóór koppeling

**Uitgangspunt:** NIVO Groep Holland is de enige nieuwe ontvanger. De consument geeft daarvoor los, ongevinkt akkoord, vóór overdracht. Historische oude partner-/consentgegevens blijven intact; geen retrospectieve forwarding.

**Datastroom:**
1. Huidige `POST /api/index.php?action=leads` accepteert aanvraag en bewaart versleuteld plus serverconsent.
2. Een afzonderlijk **transactioneel outboxrecord** koppelt dezelfde lead-ID aan delivery status; het frontend wacht niet op Portal-netwerk.
3. Worker verzendt via uitsluitend server-to-server kanaal naar de **goedgekeurde NIVO-bestemming**; minimale noodzakelijke velden, geen PII in URLs, logs of tickets.
4. Ontvanger geeft idempotente ACK (externe referentie en status). Alleen die ACK markeert **afgeleverd**. Timeout/5xx: begrensde retries met backoff. Permanente afwijzing: zichtbaar in dashboard en melding.
5. Bij later gereedkomende NIVO Portal: configureer uitsluitend de nieuwe adapter na beveiligings-/owner-go, test met fictieve aanvraag, activeer gecontroleerd. De consumentenflow en bestaande consent blijven gelijk.

**Contract dat NIVO Portal later moet ondersteunen:**
- Schema v1: intern aanvraag-ID, timestamp, relevante interesses, minimaal contactveld, beperkte plansamenvatting, consentversie/-tekst/-tijd en bewijs van bestemming; géén volledig woningprofiel tenzij noodzakelijk en goedgekeurd.
- Authenticatie/transport: HTTPS, server-held secrets, roterende sleutel of passend token, scoped service-account, expliciete ontvangerallowlist, replaybescherming, inputvalidatie, minimale logs.
- Semantiek: idempotency key per aanvraag, ACK/externe referentie, vaste foutcodes (retryable versus permanent), rate-limitbackoff, afzonderlijke statusmonitoring, test/sandbox.
- Beleid: beheerder kan controleren en opnieuw proberen; geen dubbele verwerking. Opslag en doorgifte moeten vallen binnen passende verwerkers-/privacyafspraken.
- NIVO behandelt de aanvraag door mensen in eigen systemen; **die verwerking is geen WattGoedkoper-feature**.

**Geen automatische verzending of aanmelding naar onbekende mailbox/endpoint.** De ontvangende contractdetails moeten één keer door NIVO/eigenaar worden bevestigd.

## 6. SEO en onderhoud zonder permanent contentteam

- **Publiceren:** gecontroleerde redactionele input `docs/seo-cluster-v08.json`, generator `scripts/build-content.py`, bestaande canonicals/schema/sitemap, SEO-integriteitstest en PR.
- **Bijhouden:** periodieke read-only bronnenscan (Rijksoverheid/RVO/ACM/Milieu Centraal) -> wijzigingssignaal in dashboard of issue -> conceptwijziging -> bron-/claim-review -> CI -> publicatie.
- **Meten:** Search Console als bron voor organische klik-/impressietrends. Geen fictieve verkeerscijfers, geen claim dat ranking “klaar” is bij eerste indexatie. Kwaliteit en nuttigheid zijn doorlopende verbetercriteria.
- **Verbeteren:** kijk naar topvragen, routes met bruikbaar organisch verkeer, relevante instappunten en vrijwillige NIVO-aanvragen. Optimaliseer bestaande pagina's voor er nieuwe worden toegevoegd.
- **Automatiseren:** checks, regressies, URL's/sitemap, versheidssignalen, onderhoudslogs. **Niet autonoom** juridische/financiële adviezen herschrijven of in bulk dunne AI-pagina's publiceren.

## 7. Veiligheid en scopebewaking

Onwrikbaar uit `AGENTS.md`:
- Gratis energiehuis zonder account of verplichte persoonsgegevens; geen leadwall of verborgen consent.
- NIVO-only, los expliciet `2026-11-v2` akkoord. Rapportmail ≠ marketing/adviesconsent; opt-in analytische events staan los.
- Privacy by design: encryptie, private sessies/config buiten webroot, retentie, minimaal identificerende logs, geen productiegegevens in GitHub/tests.
- Nooit bestaande MySQL opnieuw installeren, resetten, secrets roteren of eindgebruikersdata exporteren voor development.
- Geen betaalde tools/hostingupgrades en geen Portal/Odoo-activatie zonder eigenaar-go.
- Featurebranch → PR → alle model/API/MySQL/mail/SEO/browserchecks → eigenaarreview → merge `main` → Hostinger releasecheck.

**Scopefilter voor nieuwe verzoeken:** alleen nu toevoegen wanneer het (a) bewezen klantwaarde, (b) meetbare kwaliteitsverbetering van NIVO-aanvragen of (c) directe betrouwbaarheid/automatisering oplevert. Anders parkeren. Issue #3 (optionele online accounts) is **geen finish-line blocker**.

## 8. Beoordeling en eindrapportage

Bij elke ronde één korte PR met:
1. Wat nieuw werkt en waar je het vindt.
2. Wat exact is getest, inclusief ontvangstreferentie voor delivery of expliciete blocker.
3. Eventuele screenshot van dashboard/mobile en runbook voor eigenaar.
4. Restpunten waarvoor een feitelijk eigenaarbesluit nodig is; geen onnodige vragen.
5. Bevestiging dat bestaande privacy/NIVO-only/regressies overeind staan.

Bij laatste acceptatie: maak één `docs/OPERATIONS-RUNBOOK-FINAL.md` met statuslinks, herstel/rollback, transportconfiguratie (zonder secrets), incidentmeldingen, handmatige onderhoudsstappen, eigenaarsbesluiten en bekende beperkingen. Zet #14 pas op `completed` als **alle verplichte exitcriteria** zijn bewezen.

## 9. Werkpakketten en volgorde

| GitHub | Prioriteit | Deliverable | Afhankelijkheden |
|---|---|---|---|
| [#21 — productie, mail, herstelbaarheid](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21) | **P0** | Live gezondheidsbewijs, juiste back-ups/retentie, veilige mailstatus | Hostinger + juridische gegevens |
| [#22 — dashboard 2.0](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/22) | **P0** | Compact overzicht, alle leads en aflever-/SEO-/toolstatus | Bestaande admin, #23 voor delivery |
| [#23 — NIVO transport + Portal-ready API](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/23) | **P0** | Outbox, idempotency, retry, veilige receipt en geteste aflevering | Goedgekeurde NIVO-ontvanger |
| [#24 — SEO + conversieroutes](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/24) | **P1** | Tweede hoogwaardige cluster en meet-/inhoudsproces | #21 basis, Search Console toegang indien mogelijk |
| [#25 — zelfstandig onderhoud, monitoring](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/25) | **P0** | Cron, alerts, gecontroleerde analytics, herstelprotocol | #21 en #23 |
| [#26 — eindacceptatie en runbook](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26) | **P0** | Volledige bewijsbare consumenten- en leveringsreis, owner handoff | #21–#25 |

**Uitvoeringsvolgorde:** A (#21, gedeeld #25) → B (#22 + #23 parallel waar veilig) → C (#24) → D (#25 + #26). Kleine deel-PR's zijn toegestaan, maar voeg geen nieuwe grote werkstromen toe. Het pad naar de NIVO Portal wordt voorbereid en getest; daadwerkelijke activering is een apart vrijgavemoment zodra NIVO technisch klaar is.

**Open operationele voorloper:** [#2](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/2). **Reeds deels gerealiseerde bredere werkpakketten:** #15–#18. **Niet op de finish line:** [#3](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/3), online accounts.

## 10. Wat we eenmalig nodig hebben van de eigenaar

Zonder nu het ontwikkelwerk te blokkeren:
- Exacte juridische exploitant en het juiste privacycontact voor de site.
- Hostinger-accounttoegang voor read-only live checks, private mailconfiguratie, back-up en cron-acceptatie.
- Goedgekeurde **NIVO-ontvanger** voor eerste beveiligde overdracht (API of ander passend kanaal), plus later Portal-API-eigenaar/contract. Geen e-mailadressen of endpoints verzinnen.
- De eigen testmailbox om een zelfgeadresseerde levering te controleren en een expliciet go/no-go voor live mail en NIVO-forwarding.
- Bevestiging dat het laatste dashboard en visuele release voldoen, en toestemming voor de finale merge.

---

**Productregel:** Bouw niet eindeloos nieuwe functies. Rond eerst de betrouwbare reis van bezoeker tot ontvangen NIVO-lead af. Daarna gebruikt WattGoedkoper zijn eigen SEO, content, rekenkern en monitoring om duurzaam te groeien — met de eigenaar aan het stuur bij uitzonderingen.

## Uitvoeringsnotitie — 15 november 2026 (nog niet gemerged)

De overname heeft feitelijk de toen actuele main SHA `521a0bd235624652c9e86c931c4a78a4528fb75c` gecontroleerd. Er staan inmiddels drie aparte featurebranch-PR's open voor eigenaarreview: [#28](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/28) corrigeert de MySQL-onderhouds-CLI (beide CI-workflows groen), [#29](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/29) levert Dashboard 2.0 vier tabs met echte en onbekende bronnen (beide CI-workflows groen), en [#30](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/30) voegt een default-OFF NIVO-deliveryoutbox en onafhankelijke worker toe (CI ter verificatie). Geen van deze PR's is naar productie gemerged.

Dit verandert de finish-line exitcriteria niet: geen live Hostinger-bewijs, SMTP-inboxbezorging, eigenaar-geautoriseerde NIVO-ontvanger/ACK, backup-restore of definitieve privacy-/juridische acceptatie. Een synthetische ACK is een testfixture, geen externe afleverbevestiging. `docs/NIVO-DELIVERY-CONTRACT-V1.md` in PR #30 beschrijft het toekomstige ontvangerscontract en de private activeringsgate. Dashboard-aflevercijfers zijn pas voltooid wanneer #29/#30 na review zijn gecombineerd en end-to-end zijn bewezen.

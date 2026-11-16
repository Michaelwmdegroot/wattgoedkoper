# WattGoedkoper.nl

**Nieuw consumentenbesluit — 16 november 2026:** nieuwsbriefaanmelding na de rapportmail wordt **één aparte vrijwillige klik**, zonder verificatiemail of bevestigingspagina. We bewaren de expliciete toestemmingsversie, exacte tekst, bron en datum versleuteld; de knop activeert niet automatisch vanuit een rapport. De bestaande privéfeatureflag blijft ongewijzigd. Oude dubbele bevestigingen kunnen nog verlopen. Zie [single-click-acceptatierunbook](docs/NEWSLETTER-OPTIN-RUNBOOK.md). De uiteindelijke commerciële GSC-/operations-/eigenaar-GO blijft apart open.

**Actueel per 16 november 2026:** WattGoedkoper is volgens de eigenaar een initiatief van **NIVO Groep Holland B.V.** (KvK 95227768). De gratis tool en NIVO-only leadroute werken. De eigenaar heeft de aparte energieplanrapportmail daadwerkelijk op zijn eigen adres ontvangen. De duidelijke verzendbevestiging (PR #46) en de **standaard uitgeschakelde** vrijwillige nieuwsbriefopt-in (PR #47) zijn getest en live. De juridische/privacyinformatie wordt via de kleine actuele uitvoerings-PR bijgewerkt; GSC en laatste bedrijfsacceptatie blijven extern open. Eerdere statusmomenten hieronder zijn historische ontwikkelnotities.


**Nieuwe projectoverdracht — 16 november 2026:** [commerciële Finish Line & afsluitcriteria](docs/HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md) · [herhaalbaar SEO-leadsite playbook](docs/SEO-LANDING-FACTORY-PLAYBOOK.md) · [startprompt volgende agent](docs/START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md).

De hoofdmijlpaal is nu **snel een aantoonbaar werkende, zelfstandig draaiende SEO→gratis tool→rapportmail/optioneel NIVO-adviesroute afronden** en daarna door naar een volgende onderscheidende site. Historische productie-/beveiligingsdocs hieronder bewijzen voorgaande stappen, maar zijn **niet** de huidige ontwikkelprioriteit. Een huidige Google-indexering/ranking of werkende rapportmail is **nog niet bevestigd**.



> **Koersbesluit 16 november 2026 — GROWTH FIRST.** We hebben een werkende premium energietool én NIVO-only leadmachine. De komende iteraties draaien om **organisch verkeer, de gratis interactieve scan, werkende rapportmail en meer kwalitatieve vrijwillige NIVO-adviesleads**. Custom Sodium/`proc_open`-back-up engineering is geparkeerd; minimale privacy-, data- en toegangsveiligheid blijft behouden. De [leidende commerciële roadmap](docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md) is herprioriteerd. De oude melding `P0` bij de back-upexporter beschrijft uitsluitend een open onderhoudsbeperking, **geen groeiblokkade**.



**Premium interactieve energietool én functioneel werkende automatische NIVO-leadmachine** voor Nederlandse consumenten.

> **Actuele productie — 16 november 2026.** De premium gratis consumentenwebsite, MySQL/API, Dashboard 2.0, **één** vijfminuten-Hostinger-cron en de NIVO-only adviesroute per SMTP zijn live. PR's [#37](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/37), [#38](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/38) en [#39](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/39) zijn gemerged; `main` = `d1685bed065445dfc40a8fd40ae8e71adf178636`. [De 16/16 live-pariteitscheck](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43774049582), quality/MySQL en browserreview zijn geslaagd. De gewone testadviesaanvraag `WG-5510214770E3` werd al eerder door de eigenaar in de echte NIVO-inbox ontvangen; geen HTTPS-Portal-API aangesloten.
>
> **Nieuwe feitelijke Hostinger-meting:** `cron.status=fresh`, `operations_monitor_enabled=true`, twee afzonderlijke succesmomenten rond 01:10 en 01:15 NL-tijd, geen waarschuwingen en één geaggregeerde `smtp_accepted`-regel zonder wachtrij/fouten. De **individuele** status van die testlead is nog niet afzonderlijk afgelezen. De aparte consumentenrapportmail heeft mailboxconfig maar staat **bewust uit** (`reportRequested:false`). Back-ups zijn **nog niet op herstelbaarheid geverifieerd**. Ook de juridisch verantwoordelijke, buiten-app-retentie, off-site opslag, gratis GSC en externe alerts zijn nog open. Zie het [productiebewijsregister](docs/PRODUCTION-ACCEPTANCE-2026-11-16.md).
>
> **Nieuwe P0-focus:** veilige Hostinger-MySQL-back-up met dezelfde ongewijzigde AES-sleutel, onafhankelijke archiefcontrole en **echte geïsoleerde restore**. De read-only Hostinger-voorcontrole is inmiddels [via PR #40](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/40) uitgebracht en publiek beschermd ([19/19 live checks](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43781069670)); **de daadwerkelijke Hostinger-uitvoer staat nog open**. Geen encryptiesleutels, mailcredentials, database- of cronreset uitvoeren.

**Open P0-beperking sinds 16 november 2026:** de echte Hostinger-voorcontrole meldt `SODIUM_UNAVAILABLE` en `PROC_OPEN_UNAVAILABLE`. De huidige PHP-back-upexporter is daardoor nog **niet uitvoerbaar** op deze CLI. Config/permissies, MySQL, exporter en private back-upmap zijn in orde. Er is geen export, archiefauthenticatie of restore uitgevoerd. Zie [herstelprocedure](docs/BACKUP-RECOVERY-RUNBOOK.md) en [feitelijke productieacceptatie](docs/PRODUCTION-ACCEPTANCE-2026-11-16.md); onderzoek eerst beschikbare PHP CLI-/encryptieopties zonder beveiligingsinstellingen of sleutels blind te veranderen.

### Begin hier

- **[Nieuwste feitelijke productieacceptatie](docs/PRODUCTION-ACCEPTANCE-2026-11-16.md)** — live bewijs en onafhankelijke open gates.
- **[P0 back-up/herstelrunbook](docs/BACKUP-RECOVERY-RUNBOOK.md)** — veilig vooronderzoek, ongewijzigde sleutels en geïsoleerde restore.
- **[Actuele productieoverdracht](docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md)** — bewijsregister, status, grenzen en architectuur.
- **[Prioriteiten voor zelfstandige leadgeneratie](docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md)** — P0 continuïteit, P1 product/SEO, P2 groei.
- **[Startprompt voor volgende GPT-6 Pro-agent](docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md)**.
- [Hostinger operationeel runbook](docs/OPERATIONS-RUNBOOK-V1.md) · [NIVO-contract](docs/NIVO-DELIVERY-CONTRACT-V1.md) · [NIVO SMTP productierunbook](docs/NIVO-SMTP-PRODUCTION-RUNBOOK.md) · [Productcode/contracten](docs/backend.md).
- [Finish Line en opvolging #14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14) · [operationele issue #25](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/25) · [eindacceptatie #26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26).

**Historische plannen:** `docs/HANDOFF-FULL-PRODUCT-2026-11-14.md`, `docs/ROADMAP-SEO-PRODUCT-LEADGEN.md`, `docs/START-PROMPT-NEXT-AGENT.md` en de oorspronkelijke Finish Line v0.9 beschrijven eerdere ontwikkelfasen. Ze zijn **niet** meer de actuele productiestatus. Herhaal geen MySQL-/mailinstallatie, verander geen privé-keys en installeer geen tweede cron.

## De ervaring

- Begin meteen met een voorbeeldhuis; geen startformulier of verplichte stappen.
- Kies je woning, bewoners, isolatie en aanwezige installaties met visuele keuzes.
- Klik op het huis of voeg verbeteringen toe vanuit de strook: slim verbruiken, isolatie, zonnepanelen, hybride warmtepomp en batterij. Slepen werkt als extra bediening; klik, touch en toetsenbord blijven beschikbaar.
- Het huis verandert mee: de passende woningfoto, panelen op het dak, batterij aan de gevel, buitenunit en bewonersindicator. Bekijk de huidige situatie naast het plan.
- Zie direct variabele jaarkosten, besparingsbandbreedte, eigen stroomgebruik en investering.
- Probeer combinaties zelf of vraag een startplan binnen je budget. Handmatige plannen boven budget of met negatief financieel effect blijven zichtbaar.
- Speel met paneelaantal, batterijcapaciteit en budget. Exacte jaarcijfers, tarieven en offertes zijn optionele verfijningen.
- Draai een keuze terug en bewaar je huis expliciet op je apparaat. De aparte transactionele rapportmail is in code aanwezig, maar moet op productie nog onafhankelijk getest en expliciet geactiveerd worden; een rapportaanvraag is geen NIVO-advieslead.
- Contactgegevens zijn pas nodig als je zelf om advies vraagt. Nieuwe adviesaanvragen gaan alleen naar NIVO Groep Holland na een afzonderlijke, expliciete toestemming.

## Onderbouwde berekening

De deterministische jaarberekening onderscheidt totaalverbruik, netafname, opwek en teruglevering. Zij rekent maatregelen samen door om dubbeltellingen te voorkomen. Salderen in 2026 en afzonderlijke afrekening in 2027 zijn twee aparte rekenjaren. Een combinatie van nieuwe zonnepanelen en batterij is handmatig te simuleren; een batterij wordt niet automatisch als aankoop aanbevolen.

Het dag-/nachtbeeld is een illustratie, geen uurprognose. De hoofdgetallen zijn **variabele energiekosten**, zonder netbeheer, vaste leveringskosten en belastingvermindering. Vooraf ingevulde prijzen zijn **bewerkbare voorbeelden**, geen actuele aanbiedingen. De paneelregel schaalt de voorbeeldprijs evenredig mee met het aantal panelen; batterijcapaciteit en prijs zijn afzonderlijke aannames.

Geen live meter-, adres-, PVGIS-, leveranciers- of CRM-koppelingen. De beheermailbox is inmiddels privé geconfigureerd en de uitgaande NIVO-route is end-to-end bewezen; het consumentenrapport via een afzonderlijke mailroute is nog niet als productiepad geaccepteerd. Geen gegarandeerde besparing, handelsopbrengst, subsidietoekenning of technisch installatieadvies. De advies-API weigert aanvragen zolang veilige productieconfiguratie ontbreekt.

## Hostinger-installatie

**Productie is al geïnstalleerd. Herhaal geen enkele installatiestap op de bestaande WattGoedkoper MySQL.** Het historische initiële installatiecommando was `bash scripts/setup-mysql.sh`; het staat alleen als referentie in [Hostinger MySQL-installatie](docs/HOSTINGER-MYSQL.md). De database, private configuratie en encryptiesleutel moeten ongewijzigd blijven.

## Techniek

HTML, CSS en native ES-modules worden direct geserveerd; geen frontendframework of productiebouwstap. De interactieve woning gebruikt lokaal geserveerde WebP-beelden en CSS-maskers. Alle lettertypen en beelden staan in de repository; externe afbeeldingsdiensten of fonts zijn tijdens gebruik niet nodig. PHP 8.2+ met OpenSSL en PDO MySQL (Hostinger) of SQLite (bestaande installaties/tests) verzorgt de advies-API en backoffice. Persoonsgegevens worden versleuteld buiten de openbare webroot opgeslagen, nooit in Git.

```bash
php -S 127.0.0.1:8080 scripts/router.php
```

Het energiehuis werkt direct. De beheeromgeving en adviesopslag functioneren op de bestaande Hostinger MySQL; nieuwe agents mogen de private setup **niet** opnieuw uitvoeren. De automatisch doorgestuurde NIVO-testaanvraag is in het dashboard en de ontvangersinbox geverifieerd. Controleer bereikbaarheid en beveiliging uitsluitend zonder klantdata te exporteren.

## Controles

```bash
npm test
npm run check
python3 tests/backend_test.py --php php
python3 scripts/build-content.py
python3 scripts/build-preview.py
# Browsercontrole met Playwright (ook in GitHub Actions):
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
node scripts/visual-review.cjs
```

- Node-model-/scenario-/Plan Studio-tests zijn onderdeel van de actuele GitHub Actions (zie CI-run in de overdracht), inclusief combinaties, afhankelijkheden, negatieve uitkomsten en energiebehoud.
- De backend-, mailveiligheids-, MySQL- en installatie-regressies worden bij een push/PR opnieuw uitgevoerd; raadpleeg de laatste CI-runs voor de geldende aantallen.
- Browsercontroles zijn geautomatiseerd in de nieuwste GitHub CI; controleer het actuele resultaat per commit en hergebruik historische aantallen niet als nieuwe testuitvoer. Onder meer geometrie, alle vijf woningtypen, apparatuur, kiezen/verwijderen, toetsenbord, dagbediening en bewaren/herstellen. De preview doet geen netwerkverzoeken.
- De workflow `visual-review.yml` maakt desktop-, tablet- en mobiele screenshots en controleert de interactieve bronwebsite en zelfstandige preview. Screenshots zijn te inspecteren als workflow-artifacts; eerdere representatieve reviewbeelden staan bij [docs/visual-review](docs/visual-review/README.md). Zie de actuele releasenotities voor de resultaatstatus en grenzen.

## Projectstructuur

- `index.html`, `assets/app.mjs`, `assets/styles.css`, `assets/premium.css`: interactieve ervaring en vormgeving.
- `assets/house-scene.mjs`, `assets/house-scene.css`: fotografische woninglagen, dag-/avondweergave en hotspots.
- `assets/model.mjs`: onderliggende jaarberekening en bronregister.
- `assets/playground-model.mjs`: handmatig gekozen scenario’s en afhankelijkheden.
- `rekenmodel.html`, `privacy.html`, `kennis/`: openbare uitleg en bronnen.
- `api/`, `lib/`, `admin/`: beveiligde adviesopslag en beheer.
- `scripts/`: installatie, onderhoud en zelfstandige content-/previewbuilds.
- `tests/`: rekenkundige en backendregressies.
- `preview/`: downloadbare, zelfstandige reviewversie; geblokkeerd op productie via `.htaccess`.

## Beeld en typografie

[Ontwerp en interactie](docs/PREMIUM-DESIGN.md) · [Beeldprompts en herkomst](docs/image-prompts.json). DM Serif Display en Manrope zijn lokaal inbegrepen met hun OFL-licenties. De foto’s zijn conceptuele sfeerbeelden, geen gerealiseerde installaties of technisch legplan. Paneelaantallen en installatieposities in het beeld zijn illustratief.

## Aanvullende technische referenties

[Oude Hostinger MySQL-installatie — niet opnieuw uitvoeren](docs/HOSTINGER-MYSQL.md) · [Historische productkeuzes](docs/RELEASE.md) · [Rekenmodel en bronnen](docs/research.md) · [Frontendcontract](docs/frontend-contract.md) · [Backend](docs/backend.md) · [Historische migratieroute](docs/DEPLOYMENT.md)

Nieuwe adviesaanvragen worden uitsluitend door NIVO Groep Holland opgevolgd. Historische partnergegevens blijven onder de oorspronkelijke toestemming bestaan. De berekening blijft zonder contactgegevens beschikbaar.

# WattGoedkoper.nl

**Premium interactieve energietool én functioneel werkende automatische NIVO-leadmachine** voor Nederlandse consumenten.

> **Actuele productie — 15 november 2026.** De gratis interactieve woning, Plan Studio, MySQL/API, Dashboard 2.0 en NIVO-adviesketen zijn live. Een via de gewone consumentenwebsite ingediende technische testaanvraag `WG-5510214770E3` stond rond 19:02 in `/admin/` en werd rond 19:05 daadwerkelijk als automatische adviesmail ontvangen in **`portal@nivogroepholland.nl`**. Het eigen Hostinger SMTP-account is `info@wattgoedkoper.nl`. De één-per-vijf-minuten Hostinger-operationscron en werkende cronuitvoer zijn door de eigenaar aangetoond. **Geen NIVO Portal REST API:** dat is alleen een voorbereide toekomstige koppeling.

**Productiestatus:** de kern van automatische NIVO-leadgeneratie is functioneel bewezen. **De gehele Finish Line is nog open:** gecontroleerde backup én restore, herhaalde cron-heartbeat/alerts en per-lead statusbewijs, afzonderlijke consumentenrapportmail, juridische privacyreview en echte Google Search Console-cijfers moeten nog apart worden geverifieerd. Alle merges [#28 t/m #35](https://github.com/Michaelwmdegroot/wattgoedkoper/pulls?q=is%3Apr+is%3Amerged) zijn verwerkt; codebaseline vóór deze doc-overdracht `f3c273dcffb03de05de13004fee410194ae659df`. [Live Hostinger-pariteitscheck](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43662312644): 14/14 checks groen.

### Begin hier

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

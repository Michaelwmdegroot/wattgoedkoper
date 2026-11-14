# WattGoedkoper

Een gratis interactief energiehuis voor Nederlandse huishoudens. Bezoekers proberen verbeteringen op hun woning en zien direct het effect. Persoonlijk advies via **NIVO Groep Holland** en **Thuisbatterij Team** is een optionele vervolgstap.

## Status — premium energiehuis 0.3, operationele uitbreiding 0.4

De interactieve woning heeft een premium visuele uitwerking: vijf fotografische woningtypes, afzonderlijke installatielagen, vijftien eigen beelden, lokale lettertypen en vernieuwde kennis- en uitlegpagina’s. Hostinger heeft volgens de gebruiker op 14 november 2026 de GitHub-deployment naar wattgoedkoper.nl voltooid. De daadwerkelijke PHP-backendconfiguratie en mailkoppeling moeten afzonderlijk op de juiste hosting worden bevestigd.

**[Download de speelbare preview](preview/wattgoedkoper-preview.html)** en open het bestand in een browser. Huis, berekeningen, scenario’s en uitleg werken in één bestand. Adviesverzending en netwerkverkeer zijn in deze preview uitgeschakeld.

Zie [de nieuwe backoffice, mailbox en leadmagnet-roadmap](docs/OPERATIONS-V04.md). Zonder private serverconfiguratie blijft de advies-API veilig gesloten. De mailbox werkt uitsluitend na het toevoegen van het juiste info@wattgoedkoper.nl-account op de server.

## De ervaring

- Begin meteen met een voorbeeldhuis; geen startformulier of verplichte stappen.
- Kies je woning, bewoners, isolatie en aanwezige installaties met visuele keuzes.
- Klik op het huis of voeg verbeteringen toe vanuit de strook: slim verbruiken, isolatie, zonnepanelen, hybride warmtepomp en batterij. Slepen werkt als extra bediening; klik, touch en toetsenbord blijven beschikbaar.
- Het huis verandert mee: de passende woningfoto, panelen op het dak, batterij aan de gevel, buitenunit en bewonersindicator. Bekijk de huidige situatie naast het plan.
- Zie direct variabele jaarkosten, besparingsbandbreedte, eigen stroomgebruik en investering.
- Probeer combinaties zelf of vraag een startplan binnen je budget. Handmatige plannen boven budget of met negatief financieel effect blijven zichtbaar.
- Speel met paneelaantal, batterijcapaciteit en budget. Exacte jaarcijfers, tarieven en offertes zijn optionele verfijningen.
- Draai een keuze terug, bewaar je huis expliciet op je apparaat of druk het energieplan af als PDF.
- Contactgegevens zijn pas nodig als je zelf om advies vraagt. De gekozen partner en toestemming worden expliciet vastgelegd.

## Onderbouwde berekening

De deterministische jaarberekening onderscheidt totaalverbruik, netafname, opwek en teruglevering. Zij rekent maatregelen samen door om dubbeltellingen te voorkomen. Salderen in 2026 en afzonderlijke afrekening in 2027 zijn twee aparte rekenjaren. Een combinatie van nieuwe zonnepanelen en batterij is handmatig te simuleren; een batterij wordt niet automatisch als aankoop aanbevolen.

Het dag-/nachtbeeld is een illustratie, geen uurprognose. De hoofdgetallen zijn **variabele energiekosten**, zonder netbeheer, vaste leveringskosten en belastingvermindering. Vooraf ingevulde prijzen zijn **bewerkbare voorbeelden**, geen actuele aanbiedingen. De paneelregel schaalt de voorbeeldprijs evenredig mee met het aantal panelen; batterijcapaciteit en prijs zijn afzonderlijke aannames.

Geen live meter-, adres-, PVGIS-, leveranciers- of CRM-koppelingen. De optionele beheerinbox kan na afzonderlijke private serverconfiguratie worden verbonden met Hostinger IMAP/SMTP; de consumenten-tool heeft geen automatische e-mailkoppeling. Geen gegarandeerde besparing, handelsopbrengst, subsidietoekenning of technisch installatieadvies. De advies-API weigert aanvragen zolang veilige productieconfiguratie ontbreekt.

## Techniek

HTML, CSS en native ES-modules worden direct geserveerd; geen frontendframework of productiebouwstap. De interactieve woning gebruikt lokaal geserveerde WebP-beelden en CSS-maskers. Alle lettertypen en beelden staan in de repository; externe afbeeldingsdiensten of fonts zijn tijdens gebruik niet nodig. PHP 8.2+ met OpenSSL en PDO MySQL (Hostinger) of SQLite (bestaande installaties/tests) verzorgt de advies-API en backoffice. Persoonsgegevens worden versleuteld buiten de openbare webroot opgeslagen, nooit in Git.

```bash
php -S 127.0.0.1:8080 scripts/router.php
```

Het energiehuis werkt direct. `/admin/` en echte adviesopslag blijven gesloten tot de beveiligde serverinstallatie is voltooid. **Gebruik voor de nieuwe Hostinger-database de [MySQL-installatie](docs/HOSTINGER-MYSQL.md), niet het oude SQLite-setupcommando.**

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

- 47 model- en scenariotests, inclusief combinaties, afhankelijkheden, negatieve uitkomsten en energiebehoud.
- De bestaande backend heeft 55 integratiechecks; GitHub Actions voert die opnieuw uit bij een push.
- 125 browsercontroles geslaagd, verdeeld over acht gevallen: desktop, tablet, mobiel, informatiepagina’s en de zelfstandige preview. Onder meer geometrie, alle vijf woningtypen, apparatuur, kiezen/verwijderen, toetsenbord, dagbediening en bewaren/herstellen. De preview doet geen netwerkverzoeken.
- De workflow `visual-review.yml` maakt desktop-, tablet- en mobiele screenshots en controleert de interactieve bronwebsite en zelfstandige preview. De complete 33 screenshots staan bij de workflow-artifacts; representatieve beelden en het controlerapport staan ook blijvend in [docs/visual-review](docs/visual-review/README.md). Zie de actuele releasenotities voor de resultaatstatus en grenzen.

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

## Documentatie

[Hostinger MySQL-installatie](docs/HOSTINGER-MYSQL.md) · [Productkeuzes en controlegrenzen](docs/RELEASE.md) · [Rekenmodel en bronnen](docs/research.md) · [Frontendcontract](docs/frontend-contract.md) · [Backend](docs/backend.md) · [Hostinger-route voor later](docs/DEPLOYMENT.md)

De commerciële relatie met NIVO Groep Holland en Thuisbatterij Team blijft zichtbaar. Het resultaat is bruikbaar zonder contactgegevens en verandert niet door de gekozen adviespartner.

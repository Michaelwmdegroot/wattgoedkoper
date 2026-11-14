# WattGoedkoper

Een gratis, persoonlijk energieplan voor Nederlandse huishoudens, met optionele adviesaanvragen voor **NIVO Groep Holland** en **Thuisbatterij Team**.

## Status — 14 november 2026

De eerste werkende versie is gebouwd en getest. **Productie op wattgoedkoper.nl is nog niet omgeschakeld.** Er is in deze sessie geen Hostinger-beheerverbinding beschikbaar; de bestaande WordPress-installatie is niet gewijzigd. De lead-API weigert aanvragen totdat veilige serverconfiguratie buiten de webroot bestaat.

- [Zelfstandige preview downloaden](preview/wattgoedkoper-preview.html): complete consumentenscan, voorbeeldrapport en uitlegpagina's in één HTML-bestand. Download en open in een browser; adviesverzending is bewust uitgeschakeld.
- [Rekenmodel en bronnen](docs/research.md)
- [Backend en beheer](docs/backend.md)
- [Deploy- en hervatplan](docs/DEPLOYMENT.md)
- [Oplevering en controles](docs/RELEASE.md)

## Wat werkt

1. Responsive consumentenwebsite met eigen woningillustratie, vijfstappenscan en volledig resultaat zonder account of contactgegevens.
2. Deterministisch jaarmodel voor stroom, gas, zonnepanelen, eigengebruik, thuisbatterij, isolatie en hybride warmtepomp.
3. Scheiding tussen netto meterafname en totaal huishoudelijk verbruik; schattingen herkenbaar gemarkeerd.
4. Vergelijking van twee volledige rekenjaren: salderen in 2026 en afzonderlijke afrekening vanaf 2027.
5. Gecombineerd maatregelenplan binnen de bovengrens van het ingevoerde budget; overlappende besparingen worden opnieuw berekend.
6. Handmatige contractscenariovergelijking met eigen tarieven en aparte bruto vergoeding / terugleverkosten.
7. Bewaren op eigen apparaat na expliciete keuze, verwijderen en browserprint/PDF.
8. Zes openbare inhoudspagina's, canonieke URLs, sitemap, robots en een echte 404.
9. PHP-backend voor adviesaanvragen met gekozen partner, expliciete toestemming, ontvangstnummer en idempotentie.
10. Beveiligde backoffice met dagtotalen, opt-in conversieverhouding, aanvragen, status, details, CSV en verwijderen.

## Bewuste grenzen

- De ingevulde prijzen zijn **voorbeelden**, geen actuele marktprijzen, prijzen van NIVO/TBT of leveranciersaanbod.
- De hoofdgetallen zijn **variabele energiekosten**, geen volledige jaarrekening.
- Geen live slimme meter, PDOK/BAG, PVGIS, leveranciersfeed, email- of CRM-koppeling.
- Geen gegarandeerd rendement, handelsopbrengst, definitieve subsidie of technisch installatieadvies.
- Batterijcapaciteit is een scenario, geen geoptimaliseerd productadvies. Een batterij wordt niet automatisch in het aanschafplan geplaatst.
- Isolatievoordeel bij bestaande warmtepompen/warmtenetten is nog niet gekwantificeerd.
- De privacytekst beschrijft de scan en ontwikkelstatus. Beheerorganisatie en privacycontact moeten vóór activering worden vastgesteld.
- Responsive gedrag is gebouwd; echte visuele desktop/mobiele browserinspectie kon in deze uitvoeromgeving niet worden voltooid. DOM-flow en servergedrag zijn wel gecontroleerd.

## Techniek

HTML, CSS en ES-modules worden rechtstreeks geserveerd; geen frontendbuild, framework-runtime, Composer-pakketten of betaald pluginabonnement nodig. PHP 8.2+ met PDO SQLite en OpenSSL verzorgt de backend. Persoonsgegevens staan versleuteld in private opslag buiten `public_html`; configuratie en data blijven buiten Git.

Hostinger kan een PHP/HTML-site rechtstreeks uit een GitHub-branch deployen. De repository is daarvoor ingericht met `main` als beoogde bron. Dat is nog **niet geconfigureerd of live geverifieerd** voor dit domein.

## Lokaal gebruiken

```bash
php -S 127.0.0.1:8080 scripts/router.php
```

De scan werkt direct. `/admin/` en echte adviesopslag blijven gesloten tot de configuratie uit [docs/backend.md](docs/backend.md) is voltooid. Gebruik uitsluitend fictieve gegevens voor lokale tests.

## Controles

```bash
npm test
npm run check
python3 tests/backend_test.py --php php
```

33 rekenkundige tests en 55 backendintegratiechecks zijn lokaal geslaagd. DOM-controles zijn uitgevoerd op de volledige scan, jaartoggle, contractkosten, optioneel bewaren, expliciete toestemming, foutpaden en verborgen/lege invoervelden. Browserinspectie blijft een livegangtaak. GitHub Actions bevat dezelfde reken- en backendgates; de remote runstatus is een afzonderlijk gegeven.

## Inhoud en preview opnieuw genereren

```bash
python3 scripts/build-content.py
python3 scripts/build-preview.py
```

De HTML-uitvoer staat in Git zodat Hostinger geen Python of Node-build hoeft te draaien. `preview/`, interne bronmappen, dotfiles en back-ups zijn via `.htaccess` niet publiek bereikbaar.

## Projectstructuur

- `index.html`, `assets/`: consumentenwebsite en rekenkern.
- `rekenmodel.html`, `privacy.html`, `kennis/`: crawlbare uitleg en bronnen.
- `api/`, `lib/`: PHP-API, beveiliging en opslag.
- `admin/`: afgeschermde beheerfuncties.
- `scripts/`: CLI-installatie, onderhoud, lokale router en content/previewgenerators.
- `tests/`: rekenregressies en echte PHP-integratietest.
- `docs/`: onderbouwing, werking, oplevering en hervatplan.

## Uitgangspunt

Eerst nuttig inzicht. Daarna een vrijwillige adviesvraag. De commerciële relatie met NIVO en Thuisbatterij Team is zichtbaar en beïnvloedt het rekenresultaat niet.

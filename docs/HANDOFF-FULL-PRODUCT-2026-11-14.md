# Projectoverdracht WattGoedkoper — v0.7 afgesloten → compleet product

**Datum overdracht:** 14 november 2026 (Europe/Amsterdam)  
**Repository:** https://github.com/Michaelwmdegroot/wattgoedkoper  
**Website:** https://wattgoedkoper.nl  
**Bevestigde technische GitHub-baseline op moment van overdracht:** \`main\` commit \`d7be722c3baff7a2a02fa61a0514fa4a485fd8a8\`  
**Status product:** eigenaar heeft de nieuwe homepage/branding visueel goedgekeurd; de volledige technische en browser-CI op \`main\` is groen. Een GitHub-commit is **niet** zelfstandig bewijs dat Hostinger precies die commit serveert. Bevestig de live SHA/deploy indien mogelijk afzonderlijk.

## 1. Besluit bij afsluiting

Deze ontwikkelfase is **afgesloten**. De homepage opnieuw ontwerpen is **niet** het volgende hoofddoel. De volgende GPT-6 Pro-agent wordt lead developer, UX/productverantwoordelijke en SEO-/funnel-architect voor het complete WattGoedkoper.nl.

**Nieuwe productmissie:** één samenhangende, hoogwaardige consumentenervaring waarbij de bezoeker direct ontdekt wat verduurzaming voor zijn/haar specifieke woning kan betekenen; vanuit Google/kennis/vergelijking naar de interactieve woning, een transparant energieplan en uitsluitend op eigen verzoek NIVO-advies. SEO moet echte gebruikersvragen beantwoorden, niet alleen verkeer verzamelen. Geen leadmuur voordat de berekening bruikbaar is.

Het eigenaarsbesluit gaat vóór oude concept-PDF's en verlopen docs. De historische PDF's \`Projectdocument WattGoedkoper.pdf\`, \`WattGoedkoper.nl Merkidentiteit en Huisstijl.pdf\` en \`WattGoedkoper.nl Website Structuur en Homepage Wireframe.pdf\` beschrijven een **oud model** van meerdere offertes/partners, €100-aankoopbonus en WordPress. Dit is **niet** de huidige implementatie en mag niet zonder nieuw expliciet eigenaarbesluit worden heringevoerd.

## 2. Wat op \`main\` klaar is

### Consument
- **Premium één-scherm energiehuis** met nieuwe WattGoedkoper-woordmerk/icoon, vijf fotorealistische woningtypen, dynamische apparaatlagen en huis-hotspots.
- Vijf maatregelen: **slim energiegebruik, isolatie, zonnepanelen, hybride warmtepomp, thuisbatterij**. Interactieve kaartjes, feedback, scenario's, ongedaan maken, aanbeveling binnen budget en onafhankelijke informatieknoppen.
- Input voor woningtype, grootte/huishouden, eigendom, isolatie, bestaande installatie, verbruik, contract/tarieven, paneelaantal, batterijcapaciteit, budget en jaar.
- **Plan Studio** in drie views: Overzicht, Maatregelen en Onderbouwing. Live herberekening, investering/besparingsbandbreedte, eigen opwek/netafname/gas, vergelijkingen, negatieve scenario's, jaar/maand met duidelijke beperking en tijdelijke referentievariant.
- Bestaande woninginstellingen blijven bewerkbaar; optioneel lokaal bewaren, geen verplichte registratie, account of contactgegevens.
- **Branding v0.7**: \`assets/brand-logo.svg\`, \`assets/brand-mark.svg\`, favicons PNG/ICO, touch-icon, manifest, OG-afbeelding. Een compacte driestappenstrook (Jouw huis / Probeer / Vergelijk) benut de ruimte boven de woning.
- Desktop cockpit is op 1366×768 / 1440×900 en andere formaten getest; mobiel blijft een natuurlijk gestapelde ervaring.

### Rekenkern en technische stack
- Geen zwaar frontendframework: HTML/CSS/ES-modules in root en \`assets/\`.
- \`assets/model.mjs\` en \`assets/playground-model.mjs\`: deterministische jaarberekening, scenario-afhankelijkheden en geen dubbeltelling; voorbeelden van tarieven/investeringen zijn bewerkbaar. 2026 salderen en 2027 zonder salderen zijn afzonderlijke rekenjaren.
- **Geen gegarandeerd financieel voordeel**, geen realtime leverancierstarieven, slimme-meterkoppeling of geverifieerde technische opname. Bedragen betreffen vooralsnog vooral **variabele energiekosten**, niet de volledige energierekening. Batterij/capaciteit en jaar/maand kennen expliciete aannames. Controleer actuele bronnen vóór nieuwe juridische of energieclaims.

### Advies, backend en beheer
- PHP 8.2+ API: \`api/index.php\`, \`lib/bootstrap.php\`, \`lib/report.php\`, \`lib/mail.php\`. MySQL op Hostinger; PDO SQLite als legacy/test.
- Eigenaar bevestigde eerder werkende beveiligde MySQL-installatie, adminlogin en testadviesaanvraag. **Nooit setup opnieuw uitvoeren**, geen productiedatabase, privéconfig of encryptiesleutel wijzigen bij SEO/contentwerk.
- Nieuwe adviesaanvragen **alleen NIVO Groep Holland**, **server-side afgedwongen**. De partnerselector is weg; consentversie \`2026-11-v2\`, onbevestigde checkbox met expliciete NIVO-naam. Historische partner/consent worden ongewijzigd behouden.
- Dashboard met status, versleutelde aanvraag, overzicht, contactactie, originele scan/toestemming onder details, geaggregeerde statistieken, beperkte export/verwijderfunctie.
- Transactionele rapportmail-API met servergegenereerde HTML+tekst en antispam/idempotentie bestaat, maar \`report_mail_enabled\` staat **standaard uit**. \`info@wattgoedkoper.nl\` is niet betrouwbaar als verbonden/besteld bevestigd. Geen automatische mail/CRM-actie.
- **Cruciaal:** uitsluitend rapportmail aanvragen geeft nooit toestemming voor NIVO-contact, CRM-opslag of marketing; adviesconsent en statistiekconsent blijven volledig afzonderlijk.
- Beperkte persoonlijke gegevensretentie (volgens backenddocumentatie standaard 90 dagen), rapport-rate-limit HMAC-vensters tijdelijk, statistiekentelling alleen bij opt-in. Bestaande eventtellingen zijn **geen unieke personen of herleidbare funnel**.

## 3. Wat er aan SEO/content wél en nog níét bestaat

**Nu aanwezig (controleer opnieuw op actuele \`main\`):**
- Homepage: \`/\`.
- Kennis: \`/kennis/zonnepanelen/\`, \`/kennis/thuisbatterij/\`, \`/kennis/energiecontract/\`, \`/kennis/isolatie-warmtepomp/\`.
- Methode: \`/rekenmodel.html\`; privacy: \`/privacy.html\`; bijbehorende 404, robots en sitemap.
- Artikelen worden beheerd door \`scripts/build-content.py\` en gedeelde \`assets/content.css\`; metadata, canonicals en basis \`WebPage\` schema aanwezig.
- \`robots.txt\` verwijst naar \`/sitemap.xml\`, beschermt admin/API/interne paden in crawlerinstructies; beveiligingsregels staan daarnaast in \`.htaccess\`.

**Open/ongeverifieerd:**
- De \`sitemap.xml\` generator zet de \`lastmod\` nu op een vaste datum. Bouw betrouwbare wijzigingsdata en automatische URL-inventarisatie.
- Er is nog geen complete topic-/zoekintentie-architectuur, geen brede collectie hoogwaardige landingspagina's, geen beoordeelde internal-linkkaart, geen bewezen organisch bereik.
- Google Search Console/Bing Webmaster Tools, indexdekking, CWV, zoekwoord-/zoekintentieonderzoek en verkeersbaselines zijn **niet geverifieerd**. Geen rankings, bezoekers of conversiepercentages verzinnen.
- Juridische verwerkingsverantwoordelijke en exacte privacycontactinformatie moeten voor grotere commerciële schaal gecontroleerd worden; documenten bevatten nog ontwikkel/historische formuleringen.
- Mailboxstatus, daadwerkelijk verstuurde rapportmails, SPF/DKIM/DMARC en eventuele CRM/NIVO Portal-koppeling zijn nog niet aangetoond.

## 4. Bestaande release- en QA-bewijzen

- PR #11: Plan Studio, NIVO-only advies, gescheiden rapportmail, compact dashboard.
- PR #12: vijf maatregelen + resultaatkaart in één desktopviewport.
- PR #13: goedgekeurd logo, iconenset, homepage micro-navigatie, overige merkconsistentie.
- Laatste testbaseline: https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43634944631 (backend/veiligheid) en https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43634944643 (Chromium/responsive).
- Nieuwe brand/home-browsercontrole: 42/42; cockpit: 31/31; Plan Studio: 133/133; bestaande browserregressies: 125/125 in laatste release. Dit zijn **geautomatiseerde controles, geen SEO-rankings of bewijs van echte mailbezorging**.
- Offline preview: \`preview/wattgoedkoper-preview.html\` (bewust geen uitgaande mails/adviesaanvragen).
- Werkplan en contracten: \`AGENTS.md\`, \`docs/frontend-contract.md\`, \`docs/backend.md\`, \`docs/RELEASE-V05.md\`, \`docs/PLAN-STUDIO.md\`, \`docs/HOME-COCKPIT-V06.md\`, \`docs/BRAND-AND-HERO-V07.md\`.

## 5. Beslisregels en veiligheidsgrenzen

1. **Bescherm het werkende product.** Geen homepage-redesign, geen grootschalige vervanging van engine, branding of backend zonder aantoonbare noodzaak/owner review. Gebruik dezelfde herkenbare design tokens/assetset.
2. Gratis inzicht **vóór** contact. Geen verplichte account of persoonsgegevens om huis en Plan Studio te bekijken.
3. Nieuwe adviesleads exclusief naar NIVO, alleen na expliciete toestemmingshandeling. Rapportbezorging != verkooptoestemming. Statistiekopt-in aparte keuze.
4. Geen ongedocumenteerde subsidies, fiscale claims, gegarandeerde ROI, “onafhankelijk”, “officiële aanbieding” of fictieve reviews/cases. Energieberekeningen en jaren/saldering met gedateerde primaire bronnen controleren.
5. **Geen betaalde diensten, hostingupgrade of nieuwe subscription** zonder eigenaargoedkeuring. Gebruik Hostinger/GitHub/bestaande toolchain en gratis bronnen waar passend.
6. **Geen productiedatabase-setup, reset, encryptiesleutelrotatie, massale echte mails, export van klantgegevens, scripts met secrets of stille externe dataoverdracht**.
7. \`main\` deployt naar Hostinger: altijd eerst featurebranch + PR, groen CI inclusief screenshots/SEO-tests, dan expliciete eigenaaracceptatie vóór merge. Controleer Hostinger-live-effect afzonderlijk.
8. NIVO Portal/Odoo is een **mogelijke latere integratie**, niet aanwezig of geautoriseerd voor automatische push vanuit WattGoedkoper.
9. Oude bron-PDF's met drie offertes/€100/WordPress blijven historische inspiratie, niet het huidige productbesluit.

## 6. Lopende GitHub-taken

- **#2** OPS-01 — veilige Hostinger/PHP/database/mail-operaties: behandel als legacy-operationele issue, **NIET** opnieuw installeren; werk alleen de ontbrekende mail- en live-checks af.
- **#3** PRODUCT-05 — plan bewaren over sessies zonder leadmuur; nog open, niet automatisch hogere prioriteit dan SEO/platform.
- **#14** NEXT — hoofdissue compleet SEO- en leadgeneratieproduct.
- **#15** NEXT-01 — product-, productie-, privacy- en SEO-nulmeting.
- **#16** NEXT-02 — informatiearchitectuur, SEO-templates, betrouwbare sitemap en content-engine.
- **#17** NEXT-03 — interactieve contentpagina's met contextuele instap in het bestaande energiehuis.
- **#18** NEXT-04 — consentgescheiden adviesfunnel, rapportmailactie en privacyvriendelijke meetdefinities.

De next agent mag subissues verfijnen na zijn audit; geen onnodige nieuwe taken zonder duidelijk effect.

## 7. Gewenste eerste acties van de nieuwe agent

1. Lees \`main\`, dit bestand, \`docs/ROADMAP-SEO-PRODUCT-LEADGEN.md\` en \`docs/START-PROMPT-NEXT-AGENT.md\`, plus contracten, \`AGENTS.md\`, de contentgenerator, API en tests.
2. Geef **eerst een feitelijke samenvatting**: gereed, veilig/niet veilig, hiaten en een uitvoerplan met P0–P3. Verifieer tegen repo en CI; vraag niet naar al vaststaande beslissingen.
3. Bevestig release/deploy en inspecteer SEO-baseline zonder echte klantdata. Markeer niet-gecontroleerde index-/traffic-/Hostingergegevens als **onbekend**.
4. Ontwerp page-map/hub-spoke, bronnen en eerste verticaal (aanbevolen: zonnepanelen + thuisbatterij als samenhangend voorbeeld) en een privacyvriendelijke funnel.
5. Ontwikkel **daadwerkelijk** op nieuwe featurebranch; maak een samenhangende eerste release met hoogwaardige content, interne links, technische SEO, interactieve instap, meet-/consentchecks en browserbewijs.
6. Opleveren als PR + commit SHA + aantoonbare resultaten + screenshots/preview + wat nog configuratie/eigenaarbesluit vereist. **Niet autonoom naar productie zonder acceptatie.**

## 8. Succes van de volgende fase

Niet “veel AI-pagina's publiceren” of “zoveel mogelijk adressen verzamelen”, maar: **een kwalitatief, consistent en betrouwbaar product** waarin bezoekers voor echte vragen passende antwoorden én een interactieve berekening vinden; kwalitatieve vrijwillige adviesaanvragen worden aantoonbaar beter, zonder integriteitsverlies. Lees de KPI-definities/meetbeperkingen in de nieuwe roadmap voordat targets worden gezet.

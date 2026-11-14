# WattGoedkoper v0.8 — release-audit, SEO-informatiearchitectuur en meetplan

**Datum:** 14 november 2026  
**Basis:** `main` aee6564 (goedgekeurde v0.7); `feature/seo-energy-guides-v08` / PR #20  
**Scope:** eerste onderling verbonden SEO-cluster voor zonnepanelen, zelfverbruik en thuisbatterijen. **Geen productieuitrol zonder eigenaaracceptatie.**

## 1. Productinventaris en feitenstatus

| Onderdeel | Feit op basis van repository en gecontroleerde code | Nog onbekend / afhankelijkheid |
|---|---|---|
| Energiehuis | Gratis homepage met vijf maatregelen, bestaande woningvarianten, `simulateHome`, Plan Studio en lokaal bewaren. Bestaande engine niet vervangen. | Exacte SHA op Hostinger na toekomstige merge, live gebruikersgedrag |
| Contentbasis v0.7 | 4 kennisroutes, rekenmodel, privacy en homepage; eerste statische contentgenerator. | Search Console-indexatie, CTR en verkeer |
| Backend | PHP-API, MySQL-productiemodel en veilig adminpad; mail en advies gescheiden. Bestaande CI gebruikt geïsoleerde testdatabase. | Productieback-up/restoretijd, juridische verwerkingsverantwoordelijke |
| Advies | NIVO-only, expliciete `2026-11-v2` toestemming; geen partnerselector. | Menselijk goedgekeurde definitie kwalificatie per lead |
| Rapportmail | Beveiligde aparte `report_email` API, default OFF; geen adviesconsent bij enkel afleververzoek. | SMTP `info@wattgoedkoper.nl`, echte bezorgtest en eigenaar-go |
| Technische SEO v0.7 | `robots.txt`, statische pagina's, canonical, schema, eerste sitemap. | Publieke crawl/indexeerbaarheid op Hostinger en CWV-veldmetingen |
| Technische SEO v0.8 | Per-route metadata en OG, BreadcrumbList/WebPage/Article JSON-LD, vaste schone URL's, interne links en gespecificeerde wijzigingsdata. | Reële Google-herindexering pas na eventuele release |

**Live-verificatie:** de vorige sessie rapporteerde een succesvolle functionele live controle en vergelijking met `main`. In deze overnamesessie kon de openbare site niet opnieuw met de beschikbare browserbron worden opgehaald; die oudere observatie geldt daarom niet als onafhankelijk nieuw bewijs. Na de merge moet een read-only live checksessie statuscodes, canonicals, assets, CSP en publicatiedatum per route vastleggen.

**Search Console:** toegang via de aanwezige GSC Wizard is in deze overnamesessie geweigerd met `subscription_required` (trial verlopen). Er is **geen betaald abonnement afgesloten** en er zijn geen GSC-resultaten opgehaald. Baselines en rankings zijn onbekend, niet nul.

## 2. Zoekintentie en URL-taxonomie

Prioriteit is gekozen op basis van logische vragen rond het einde van salderen, direct eigen verbruik, batterij-afweging en het bestaande energiehuis. **Geen zoekvolumes, rankings of concurrentiescores verzonnen.** Een kwantitatieve vergelijking kan pas met betrouwbare querydata beginnen.

| Canonical URL | Rol | Eigen zoekvraag / intentie | Interne route naar de tool |
|---|---|---|---|
| `/` | Interactieve consumententool | Wat past bij mijn woning en verbruik? | Bestaand energiehuis en Plan Studio |
| `/kennis/` | Kennis-hub | Welke maatregelen en onderwerpen zijn relevant? | `/#verken-energieplan` |
| `/kennis/zonnepanelen/` | Hoofdonderwerp | Wat leveren zonnepanelen na 2027 op? | `/#verken-zonnepanelen` |
| `/kennis/zonnepanelen/zelfverbruik/` | Verdieping / handelen | Hoe gebruik ik meer eigen zonnestroom? | `/#verken-slim-verbruik` |
| `/kennis/zonnepanelen/salderen-2027/` | Regelgeving / financieel | Wat verandert vanaf 1 januari 2027? | `/#verken-zonnepanelen` |
| `/kennis/thuisbatterij/` | Hoofdonderwerp | Past opslag financieel en praktisch bij mij? | `/#verken-thuisbatterij` |
| `/kennis/thuisbatterij/wanneer-zinvol/` | Keuzehulp | Welke gegevens en risico's moet ik kennen? | `/#verken-thuisbatterij` |
| `/kennis/zonnepanelen-met-thuisbatterij/` | Vergelijking | Wat voegt batterijopslag toe aan panelen? | 3 live modelvarianten + `/#verken-thuisbatterij` |
| `/kennis/energiecontract/` | Ondersteunend onderwerp | Hoe werken tarieven, vergoeding en terugleverkosten samen? | `/#verken-energieplan` |
| `/kennis/isolatie-warmtepomp/` | Ondersteunend onderwerp | Eerst isoleren of hybride verwarmen? | `/#verken-energieplan` |
| `/rekenmodel.html` | Transparantie | Hoe berekent de tool scenario's en onzekerheden? | `/#verken-energieplan` |
| `/privacy.html` | Vertrouwen/compliance | Wat wordt verwerkt en waarvoor? | `/#verken-energieplan` |

Deze structuur is een cluster, geen massapublicatie. Iedere verdieping behandelt een afzonderlijk consumentenbesluit en linkt inhoudelijk naar verwante stappen. Oude routes blijven behouden; er is geen kunstmatige duplicate /zonnepanelen/ naast /kennis/zonnepanelen/.

## 3. Herbruikbare editorial componenten

- Eén bronbestand `docs/seo-cluster-v08.json` voor nieuwe tekst, gerichte metadata, bronverwijzingen, CTA-context, verwante artikelen en redactionele wijzigingsdatum; de bestaande Python-generator is leidend voor statische publicatie.
- Bestaande Manrope/DM Serif Display, witte panelen, gele accenten, eigen merklogo, gedeelde `content.css`; v0.8 aanvullingen blijven in `guide-cluster.css`.
- Alle pagina's bevatten een H1, betekenisvolle secties en navigatie, canonical, metaomschrijving, social metadata, JSON-LD `WebPage` + `BreadcrumbList` en waar passend `Article`.
- Verdiepingen bieden concrete criteria, aannames, primaire bronnen, een vrijwillige context-CTA en maximaal vier relevante kaarten. Geen fictieve reviews, sterren, auteurs, actuele prijzen, of garantiebeloften.
- `sitemap.xml` bevat precies de gepubliceerde publieke HTML-routes met per-route `lastmod` uit expliciete redactionele datumvelden, geen automatische buildtijd. Update die velden wanneer inhoud materieel wordt aangepast.
- De lokale PHP-router serveert nu ook directoryindexen. Productie blijft op Apache `DirectoryIndex`.

## 4. Veilig artikel → energiehuis → plan

`assets/context-entry.mjs` accepteert **uitsluitend exacte publieke fragmenten** en geeft de interne maatregel-ID terug. `app.mjs` opent de bestaande `openUpgrade` uitleg, of afzonderlijk de Plan Studio. Een link mag:
1. geen woninggegevens, postcode of e-mailadres opnemen;
2. niets selecteren of herberekenen voordat de consument zelf iets doet;
3. de huidige `selectedIds`, lokale save, consent en undo niet veranderen;
4. bij niet-geschiktheid de bestaande reden tonen en toevoegen verhinderen;
5. nooit mail, adviesaanvraag of analytics-consent impliceren.

Het voorbeeld `assets/guide-comparison.mjs` importeert de bestaande `simulateHome`-functie met `DEFAULT_INPUT`, maakt voor de bezoeker duidelijk dat het een **voorbeeldwoning** is, en rekent het hele pakket opnieuw door. 2026 is een vol rekenjaar, niet de resterende maanden na november. Geen live uurprijzen, garantie of handelsmodel.

## 5. Actuele bronregistratie en grenzen

Geraadpleegd op 14 november 2026:
- Rijksoverheid, stop salderingsregeling op 1 januari 2027: https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling
- ACM ConsuWijzer, vergoeding en terugleverkosten na 2027: https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen
- Milieu Centraal, zelfverbruik: https://www.milieucentraal.nl/energie-besparen/zonnepanelen/verbruik-zelf-meer-zonnestroom/
- Milieu Centraal, voordelen, beperkingen en milieurisico thuisbatterij: https://www.milieucentraal.nl/energie-besparen/zonnepanelen/thuisbatterij-zonne-energie-opslaan/
- RVO, geen ISDE-subsidie voor thuisbatterijen op dit moment: https://www.rvo.nl/subsidies-financiering/isde

Aanpasbare modelprijzen of -besparingen zijn geen actuele offerte. De huidige jaarlijkse engine bevat geen opslaghandel, geverifieerde kwartierwaarden, operationele dakscan of volledige net-/vaste lasten. 180 cycli is de centrale modelaanname / interne bovengrens, geen fysiek universeel maximum. Wanneer geen bestaande zonnepanelen aanwezig zijn, kan een 2026/2027-vergelijking zonder nieuwe maatregelen terecht geen saldeerverschil tonen.

## 6. Privacyvriendelijke meetstrategie

| KPI | Exacte definitie en bron | Wat we NIET concluderen |
|---|---|---|
| Relevante organische binnenkomst | Google Search Console clicks op expliciete kennis-/tool-landingspagina's per 28 dagen (na toegestane toegang); impressies en CTR apart | Geen unieke personen en geen bezoekers zonder GSC-toegang |
| Geaccepteerde NIVO-adviesaanvragen | Servergeaccepteerde records met partner `nivo` en geldige v2-consent, per periode uit bestaande admin/dataset | Geen percentage van bezoekers zonder betrouwbare noemer |
| Kwalitatieve opvolging | Aantal geaccepteerde aanvragen dat na menselijke triage relevant en bereikbaar blijkt; aparte triagestatus/definitie is nog te bevestigen | Geen automatische kwalificatie of nieuwe CRM-route zonder review |

Optionele geaggregeerde events blijven alleen aan bij losse statistiektoestemming. Daardoor bestaat er vandaag **geen betrouwbare herleidbare pagina → aanvraag-funnel**. Rapportmail is een transactionele eenmalige actie en telt nooit als marketingopt-in. Toekomstige NIVO Portal/Odoo-koppeling vereist aparte machtigingen, dataminimalisatie, autorisatie- en beveiligingsreview.

## 7. Test- en vrijgavegrenzen

| Test | Wat wordt geverifieerd | Bewijslocatie |
|---|---|---|
| `npm test`, `npm run check` | Rekenmodellen, contextparsing, voorbeeldvergelijking en JS-syntax | Actions / Calculation and data safety |
| `python3 scripts/build-content.py` + `npm run check:seo` | Inhoud, URL's, 1 H1/canonical, schema, interne links en sitemap | Actions / Calculation and data safety |
| Bestaande PHP-/mail-/MySQL-tests | Uitdrukkelijk geïsoleerde tests; geen productie-mutaties | Actions / Calculation and data safety |
| `scripts/seo-browser-review.cjs` | Desktop 1366, mobiel 390/320, vergelijking en uitleg zonder selectie | Actions / Premium visual and interaction review |
| Bestaande Chromium-suite | Homepage, vijf maatregelen, Plan Studio, focus, navigatie en responsive | Actions / Premium visual and interaction review |
| `scripts/build-preview.py` | Offline preview zonder werkende mail-, lead- of tracking-endpoints | Actions artifact `premium-visual-review` |

**Definitieve acceptatie:** review van screenshots/tekst; groene PR-controles; geen merge door agent; eigenaar geeft expliciet akkoord; daarna Hostinger-read-only livecontrole. Nieuw geplaatste content wordt pas als geïndexeerd beschouwd na echte Search Console-gegevens.

## 8. Volgende zelfstandige productstappen (buiten v0.8)

1. Inhoudelijke uitbreiding isolatie, warmtepompen en energiecontracten met dezelfde scheiding uitleg → simulatie. Voor volledig elektrische warmtepompen geen niet-bestaande rekenondersteuning suggereren.
2. Verbeter de juridische/privacybasis met bevestigde exploitant en privacycontact. Maak geen onbevestigde AVG-claims.
3. Mailactivering los van deze PR: eigenaar en Hostinger verifiëren mailbox, SMTP, inboxbezorging en vervolgens pas publiek `report_mail_enabled`.
4. Alleen na geschikte eigenaarstoegang en zonder extra kosten: een rechtmatige Search Console-baseline opbouwen; tot die tijd geen verzonnen KPI-ontwikkeling.
5. Kwalificatiestandaard met NIVO, handmatige opvolgcontrole en eventueel later goedgekeurde Portal/Odoo-koppeling.

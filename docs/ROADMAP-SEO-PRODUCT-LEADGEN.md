# WattGoedkoper — product-, SEO- en leadgeneratieroadmap

**Status:** plan voor volgende ontwikkelfase; geen implementatie- of rankingclaim.  
**Volgorde:** gecontroleerde nulmeting → SEO-structuur → hoogwaardige verticale landingspagina's → interactieve klantreis → conversie/operations.  
**Hoofdissue:** #14. Werkpakketten #15–#18.

## Productnorthstar

*Iedere Nederlandse consument kan zonder account of commerciële druk begrijpen wat verschillende verduurzamingsmaatregelen voor de eigen woning betekenen, de scenario's zelf doorrekenen en vrijwillig vervolghulp bij NIVO Groep Holland aanvragen.*

Dat betekent: home is een **tool**, content is een **integraal productonderdeel**, en leadgeneratie is een **relevante optionele vervolgstap** — niet een vervanging voor inzicht.

### Wat we niet doen
- De goedgekeurde v0.7-homepage opnieuw beginnen, een generiek AI-formulier neerzetten of een zwaar nieuw framework introduceren zonder bewijs van meerwaarde.
- Massaal dunne, nauwelijks verschillende SEO-pagina's of plaatsnaam-doorway's uitrollen.
- Oude drie-offerte-/€100-bonus-/WordPress-concepten terugbrengen.
- Publiceren alsof subsidie, saldering, ROI, energieprijs of terugverdientijd zeker zijn.
- Gratis rapportmail of optionele statistieken als commerciële marketingtoestemming beschouwen.

## Productonderdelen als één geheel

1. **Energiehuis** (\`/\`): directe personalisatie van woning/verbruik, visuele maatregelen, live resultaat, Plan Studio.
2. **Onderwerpen/keuzehulp**: per categorie een premium overzicht/hub met werkingsprincipe, geschiktheid, belangrijke kosten en beperkingen, scenario's, bronnen en relevante CTA naar het energiehuis.
3. **Diepgaande kennis/vergelijkingen**: uitleg van energiestromen, beslisfactoren, combinaties, rekenregels en veelgestelde vragen met bron-datum en controleerbare voorbeelden.
4. **Reken-/methodieklaag**: bestaande centrale, deterministische engine, begrijpelijke beperkingen, aannames, verschillende jaren en relevante startinstellingen. Geen tegenstrijdige rekenimplementaties per SEO-pagina.
5. **Contact/opvolging**: één vrijwillig NIVO-adviespad na expliciete consent. Rapportmail uitsluitend voor bezorgen.
6. **Betrouwbaarheid**: merkidentiteit, zichtbare commerciële relatie, juridische entiteit/contact, correct bronregister, privacy, beheer- en securitytest.

## Werkstroom P0 — foundation en nulmeting (issue #15)

### Audit van het echte product
- Vergelijk huidige \`main\` met werkelijke Hostinger-deploy; leg exacte SHA of controleerbaar bewijs vast; wijzig geen private config.
- Audit \`robots.txt\`, \`sitemap.xml\`, canonicals, HTML headings, redirections, 404, interne links, crawlbaarheid van statische pagina's, onbedoelde indexatie van admin/API en renderbelasting.
- Doe een Lighthouse/axe-/Chromium-controle op relevante templates bij desktop en mobiel; beeldoptimalisatie, LCP/CLS/INP waar betrouwbaar meetbaar, caching en keyboardfocus.
- Inspecteer alle bestaande bron/kenniscontent, waarschuwingslabels en gedateerde modelaannames.
- Gebruik Search Console/Bing als **connected, read-only en consent-/toegangsmatig toegestaan**; indien geen toegang, definieer een aansluitchecklist en rapporteer “onbekend”, niet nul.
- Leg historische URL's vast voordat je pagina's verplaatst; er mogen geen onnodige 404's ontstaan.
- Verifieer juridische verantwoordelijke, privacycontact en datastromen voor uitbreiding.

**Deliverable:** SEO/product-audit met URL/resultaat/evidence/risk/priority en een bevroren baseline voor latere metingen. Geen willekeurige, niet onderbouwde targets.

## Werkstroom P1 — informatiearchitectuur en SEO-machine (issue #16)

### Aanbevolen informatiekaart, **nog te toetsen met zoekintentieonderzoek**
| Relevante route | Type/intentie | Consumentenwaarde en toolkoppeling |
|---|---|---|
| \`/\` | Tool, energiehuis | Direct situatie simuleren |
| \`/zonnepanelen/\` | Hub / oriëntatie | Geschiktheid, investering, zelfverbruik, saldering, rekenvoorbeeld |
| \`/thuisbatterij/\` | Hub / overweging | Wanneer wel/niet nuttig, capaciteit, verliezen, afhankelijkheid |
| \`/warmtepomp/\` | Hub / vergelijking | Isolatie, verbruik, hybride versus volledig elektrisch — alleen als model dit kan ondersteunen |
| \`/isolatie/\` | Hub / advies | Thermische schil, comfort, kostenbandbreedte |
| \`/energiecontract/\` | Hub / keuze | Vast/variabel/dynamisch, terugleverkosten en nuance |
| \`/combinaties/\` | Tooluitleg / vergelijking | PV + batterij, isolatie + warmtepomp, synergie en voorwaarden |
| \`/kennis/…\` | Onderliggende verdieping | De bestaande vier pagina's uitbreiden of intelligent hergebruiken zonder duplicatie |
| \`/rekenmodel.html\` | Vertrouwen/methodiek | Claims, aannames, bronnen, actualisatie en beperkingen |

Een eindbesluit over slugs, redirects, taxonomie en prioriteit volgt uit de audit. Maak geen twee pagina's voor vrijwel identieke intenties. Nieuwe regelingen/financiering alleen met officiële bronnen; waar WattGoedkoper naast een ander merk/domein zoals SubsidieReady bestaat, voorkom ongeautoriseerd kopiëren of cannibalisatie.

### Contenttemplate als productcomponent
Elke belangrijke pagina moet waar relevant bevatten:
- Een korte, concrete uitleg afgestemd op de zoekintentie. Geen vage marketingvulling.
- Relevante **zelf te kiezen** woning- of maatregelconfiguratie via de bestaande tool, liefst contextueel vooringesteld zonder identificerende informatie.
- Wat levert het op, wat is onzeker, wanneer is het niet geschikt en welke aannames gelden?
- Bronnen met organisatie/URL/controle- of publicatiedatum; bij veranderende regels expliciete verificatie.
- Leesbaar FAQ-blok met alleen echte vragen en antwoorden; passende, niet-misleidende structured data; geen automatisch gegenereerde sterren, reviews of AggregateRating.
- Eén duidelijke primaire CTA voor gratis berekening, eventueel een secundaire vrijwillige NIVO-adviesactie na inzicht; geen forced persoonsgegevens.
- Breadcrumbs, gerelateerde onderwerpen, teruglink naar energiehuis, logische ankertekst en topicclusters.
- Unieke titel/H1, juiste canonieke URL, meta description, indexability, OG-image, mobiele presentatie, juiste taal en toegankelijke koppenstructuur.

### Technische SEO
- Behoud de huidige lichte, semantische pagina's; verbeter \`scripts/build-content.py\` tot data-/templategedreven contentgenerator met publicatievalidatie.
- Automatiseer sitemap op basis van **werkelijk gepubliceerde** pagina's en juiste \`lastmod\` (nu hardcoded \`2026-11-14\`), geen dummy-datums of indexatie van previews.
- Validatie vóór elke PR: canonical/URL uniqueness, interne links 200, H1-hygiëne, metadata, responsive CLS, JSON-LD, afbeeldingen met betekenisvol alt, robots/noindex, toegankelijkheid en redactioneel bewijs.
- Overweeg aanvullende schema-markup alleen als inhoud de entiteiten en feiten ondersteunt (Organization/WebSite/WebPage/BreadcrumbList/FAQ waar passend). Geen review-/productclaims uit de lucht.

**Eerste release:** één volledige hub met 2–3 waardevolle dieptepagina's, tool-diepteverbinding en betrouwbare sitebrede navigatie. Bouw daarna de volgende cluster volgens bewijs van vraag en bruikbaarheid.

## Werkstroom P2 — gebruikservaring over pagina's heen (issue #17)

De route die de agent moet bouwen en daadwerkelijk testen:

\`Zoekintentie / zoekmachine → inhoud met actuele context → kies wat voor jouw huis relevant is → bestaande energiehuis met passende (niet-persoonlijke) beginsituatie → varianten en Plan Studio → optioneel rapport of NIVO-advies\`

- Deep-link/API-interface mag pas worden vastgelegd na security/validatie: geen persoonsgegevens/vertrouwelijke scenario's in URL's of onbedoeld gelogde querystrings. Een queryparameter mag geen rapport verzenden, advieslead aanmaken of andere onomkeerbare handeling triggeren.
- Behoud de vijf huidige maatregelen en mogelijkheid om een ongeschikte of negatieve uitkomst eerlijk te laten zien.
- Laat het model **centraal** rekenen: plaats geen concurrerende JavaScript-kern op kennisroutes.
- Verhoog leesbaarheid en contextuele keuzeondersteuning; lange uitleg mag scrollen, maar modal/primair actiepad hoeft niet door een verborgen CTA gezocht te worden.
- Behoud sterke mobile/desktop focus, modal/tabpanel/roving-keyboard en reduced motion.
- Gebruik de nieuwe huisstijl, fotoassets en componenten; geen herkenbaar andere mini-sites binnen hetzelfde domein.

## Werkstroom P3 — kwalitatieve, toestemminggescheiden leadgeneratie (issue #18)

### Funnel zonder dwang
1. Productwaarde vóór contact: berekening + uitleg zichtbaar.
2. “Bewaar mijn plan” lokaal, vrijwillig.
3. “Mail mijn energieplan” transactioneel; alleen adres voor deze bezorging, **zonder** commercieel contact of marketingopt-in. Blijft default-off tot Hostinger-verificatie.
4. “Vraag persoonlijk advies bij NIVO” aparte actie met expliciete consent en relevante, kleine intake.
5. NIVO behandelt de lead binnen eigen dashboard/workflow; optionele Portal/Odoo-integratie pas na privacy/security-/eigenaargoedkeuring.

**Vermijd** fake urgentie, gegarandeerde besparing, misleidende subsidieclaims, automatisch vooraangevinkte consent, verstopte partneridentiteit of ongevraagde verkoopmails na rapportmail.

### KPI-framework — **definitie eerst, targets pas na baseline**
| Type | Metriek | Definitie / bron | Belangrijke caveat |
|---|---|---|---|
| Primair 1 | Organische vindbaarheid met intentie | Search Console clicks/CTR per inhoudelijk relevante landingspagina (als aangesloten) | Niet automatisch unieke personen of leads |
| Primair 2 | Kwalitatieve adviesaanvragen aan NIVO | Server-geaccepteerde NIVO-aanvragen die na menselijke triage als passend zijn beoordeeld; start met definitie kwalificatie | Huidig dashboard heeft statussen, nog geen bevestigde definitie van “gekwalificeerd” |
| Driver | Bezochte pagina → toolinteractie | Alleen volgens rechtsgeldige/expliciete statistiekopt-in en technisch feitelijk meetbaar | Bestaande eventtotalen zijn geen volledige individuele funnel |
| Driver | Aanvraag op juiste moment | NIVO-aanvragen met relevante, bruikbare woning/maatregelcontext | Geen PII in SEO-dashboards |
| Guardrail | Consent-incidenten / ongewenste opvolging | Aantal meldingen, correcte audit, nooit mail-only → CRM | Nul tolerantie voor doelbewuste ongeautoriseerde opvolging |
| Guardrail | Model/UX-betrouwbaarheid | Geen rekenregressies, broncontrole, geautomatiseerde browser-/foutmetingen | Geen fictieve nauwkeurigheid uit één voorbeeld |

Niet zomaar \`lead_accepted/scan_complete\` als universele conversie presenteren: opt-in events, meerdere sessies en ontbrekende events vertekenen de noemer. Stel per KPI vast wie meet, wanneer gecheckt wordt en welke beslissing het resultaat stuurt. Gebruik vóór het stellen van doelen daadwerkelijk gemeten baselines, of label voorlopige doelen als hypotheses.

## Delivery-fasen en gates

### Gate 0 — Analyse
Werkelijke \`main\`, site/deploystatus, juridische/privacy-verantwoordelijkheid, zoek-/contentbaseline. Geen productiegegevens aanraken.

### Gate 1 — SEO-fundament
Informatiekaart en contenttemplate; canonicals, sitemap, interne links, contentbronnen en technische kwaliteit. PR met screenshots en tests.

### Gate 2 — Eerste hoogwaardige contentcluster
Één verticaal met echte consumentenwaarde, berekeningsinstap, relevante vergelijking, herbruikbare componenten, fact-check en redactionele kwaliteit. Geen bulkpublicatie.

### Gate 3 — Leadconversie én beheersbaarheid
Optionele NIVO-funnelcontext verbeteren, transparante consent en meetplan. Privacyloketten duidelijk. Rapportmail pas na gecontroleerde aparte operatie.

### Gate 4 — Leren/uitbreiden
Search Console + app-kwaliteitsmetingen vergelijken met eerste baseline; tweede cluster selecteren, testen en uitbreiden. Geen absolute SEO-rankgarantie.

## Gewenste volgende sprint (uitvoerbaar zonder nieuwe eigenaarsvragen)

1. Maak audit \`docs/SEO-PRODUCT-BASELINE.md\` met feiten, onzekerheden en security/crawlissues.
2. Ontwerp goed onderbouwde route-/onderwerpmatrix \`docs/SEO-INFORMATION-ARCHITECTURE.md\`; leg prioriteiten vast.
3. Kies één cluster (voorlopig logisch: zonnepanelen en thuisbatterij, mits zoekintentie en inhoud dit bevestigen) en bouw herbruikbare pagina-template + gekoppelde actuele uitleg.
4. Voeg diepere interne links/CTA's naar rekenhuis toe en valideer dat de scenario-instellingen niet misleidend of privacygevoelig zijn.
5. Update generator, metadata, sitemap en geautomatiseerde SEO-/browserchecks.
6. Lever één featurebranch + PR met bewijs, staging/offline preview, vernieuwde privacydocumentatie indien dataflow verandert, en een eigenaarstestchecklist.
7. **Geen autonome merge naar main.** Eigenaar beoordeelt eerst de ervaring en nieuwe claimteksten.

Deze roadmap is de **planning** van een nieuwe fase, geen claim dat onderdelen of zoekresultaten al bestaan. Verifieer wetgeving, marktprijzen en officiële beleidswijzigingen opnieuw op bouwdatum.

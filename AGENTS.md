# WattGoedkoper — agentregels en projectstatus

**Huidige fase:** v0.7 energiehuis + Plan Studio + branding **afgesloten** op 14 november 2026. Volgende ontwikkelfase: compleet consumentenplatform, SEO-informatiearchitectuur, hoogwaardige landingspagina's en privacyvriendelijke NIVO-leadgeneratie.

## Leesvolgorde vóór nieuwe werkzaamheden

1. \`docs/HANDOFF-FULL-PRODUCT-2026-11-14.md\` — feitelijke status, beslissingen, tests, operatierisico's.
2. \`docs/ROADMAP-SEO-PRODUCT-LEADGEN.md\` — productsamenhang en gefaseerde nieuwe roadmap.
3. \`docs/START-PROMPT-NEXT-AGENT.md\` — volledige overdrachtsopdracht.
4. \`docs/PLAN-STUDIO.md\`, \`docs/HOME-COCKPIT-V06.md\`, \`docs/BRAND-AND-HERO-V07.md\`, \`docs/RELEASE-V05.md\`.
5. \`docs/frontend-contract.md\`, \`docs/backend.md\` en daarna de actuele broncode.

**Geldigheid:** actuele eigenaarsbesluiten + werkelijk actuele \`main\` + nieuwste documenten hebben voorrang boven oudere v0.1–v0.4 documenten en de historische PDF's. Die PDF's beschrijven een oud WordPress- en drie-offerte-/€100-bonus-/multi-partnermodel. Bouw dat **niet** opnieuw zonder expliciet nieuw eigenaarsbesluit.

## Productregels

- De homepage is een **premium interactief energiehuis**; geen geforceerde meerstappenquiz of contactformulier als uitgangspunt.
- Volledige bruikbare berekening en scenario's **gratis zonder account of verplicht contact**. Opslaan op eigen apparaat, undo, touch/keyboard en het gebruik zonder tracking blijven mogelijk.
- De bezoeker kan vijf maatregelen selecteren: slim gebruik, isolatie, zonnepanelen, hybride warmtepomp en thuisbatterij. Bestaande installaties zijn **niet** hetzelfde als nieuw geselecteerde stappen.
- De Plan Studio toont eerlijke combinaties en onzekerheidsbandbreedtes. De deterministische rekenkern telt geen marginale effecten op; 2026 en 2027 zijn afzonderlijke scenariojaren. Negatieve besparingen, budgetoverschrijdingen en ongeschikte maatregelen blijven zichtbaar.
- Day/night is visueel, geen uurprognose. Variabele energiekosten zijn niet de hele factuur; tarieven en investeringen zijn voorbeelden, geen leveranciersoffertes.
- Claim nooit onafhankelijkheid, gegarandeerde terugverdientijd, actuele prijzen, overheidserkenning, subsidie, fiscale voordelen, meterdata of bewezen installatieprestaties zonder controleerbaar actueel bewijs.
- Nieuwe **adviesleads gaan uitsluitend naar NIVO Groep Holland**; geen NIVO/TBT/beide keuze. Consent \`2026-11-v2\` expliciet, ongevinkt, server-side afgedwongen. Historische records/toestemming blijven intact.
- Alleen een **energieplan per e-mail** aanvragen is **geen commerciële consent**, marketingopt-in of advieslead. Statistiekentoestemming is afzonderlijk. Publieke \`report_email\` is **default OFF** totdat Hostinger \`info@wattgoedkoper.nl\` privé is geconfigureerd én echte zelfgeadresseerde bezorging is geverifieerd.
- Alleen geaggregeerde app-events bij opt-in; deze zijn geen unieke bezoekers of complete user journeys. Geen ongeoorloofde externe tracking, scripts of verborgen gegevensoverdracht.
- Geldende privacy- en reclameverplichtingen voor de exploitant moeten vóór nieuwe commerciële features en claims worden geverifieerd; tekst met ontwikkelvoorbehoud niet stilzwijgend als juridisch voldongen feit behandelen.

## Architectuur

- Direct deploybare statische HTML/CSS en ES modules; PHP 8.2+ backend met PDO MySQL, legacy/test SQLite.
- Kern: \`index.html\`, \`assets/app.mjs\`, \`assets/model.mjs\`, \`assets/playground-model.mjs\`, \`assets/plan-ui.mjs\`, \`assets/house-scene.mjs\`, \`assets/home-cockpit.css\`, \`assets/brand-refresh.css\`.
- Publicatiepagina's: \`scripts/build-content.py\`, \`assets/content.css\`, \`kennis/\`, \`rekenmodel.html\`, \`privacy.html\`, \`robots.txt\`, \`sitemap.xml\`.
- API/beheer: \`api/\`, \`lib/\`, \`admin/\` en \`scripts/maintenance.php\`.
- Designsysteem: de bestaande fotorealistische huisassets, \`assets/brand-logo.svg\`, \`assets/brand-mark.svg\`, lokale Manrope/DM Serif Display en bestaande iconen; bouw coherent verder.
- \`main\` is gekoppeld aan Hostinger Git-deploy. Een **GitHub-merge is geen onafhankelijk bewijs van echte Hostinger-uitrol**.

## Productieveiligheid

- **NOOIT** de reeds werkende WattGoedkoper MySQL opnieuw installeren, een database resetten, de encryptiesleutel roteren of privésleutels/klantgegevens in de repo/logs/screenshot zetten.
- \`info@wattgoedkoper.nl\` en productieconfiguratie blijven buiten Git/webroot; geen bulkmail- of externe CRM-actie zonder expliciete toestemming.
- Gebruik featurebranches, PR's, alle reken-/API-/MySQL-/mail-/browsertests en screenshots. **Niet autonoom mergen naar \`main\` vóór eigenaaracceptatie.** Geen force-push.
- Geen nieuwe betaalde diensten of hostingupgrades zonder akkoord.
- Beoordeel externe pagina's/URLs en SEO-regelgeving actueel; rapporteer onbevestigde feiten expliciet.

## Volgende ontwikkelwerkstroom

- #14 NEXT — compleet SEO- en leadgeneratieproduct.
- #15 nulmeting/crawl/privacy/deploy-audit.
- #16 SEO-informatiearchitectuur en kwaliteitsvolle content-engine.
- #17 interactieve landingspagina's en een verbonden gebruikersreis.
- #18 consentgescheiden leadfunnel en meetplan.
- #2 legacy Hostinger/operations, niet opnieuw installeren; #3 lokaal langer bewaren, optioneel.

**Eerste antwoord van nieuwe agent:** overdrachtsamenvatting met actuele repositoryfeiten, open/afgeronde afhankelijkheden en fasering. Daarna eerst een feitelijke audit en een samenhangende SEO-/productreleasesprint daadwerkelijk bouwen.

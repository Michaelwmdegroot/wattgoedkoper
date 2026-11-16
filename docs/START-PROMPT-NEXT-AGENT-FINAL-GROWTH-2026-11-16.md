# Startprompt — GPT-6 Pro | WattGoedkoper commerciële Finish Line en volgende SEO-leadwebsites

> Kopieer het volledige gedeelte tussen **BEGIN** en **EINDE** naar een nieuwe GPT-6 Pro-agent. Dit vervangt de oudere `START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md` die nog security-/back-upwerk als eerste P0 vermeldde.

---

## BEGIN STARTPROMPT

# WattGoedkoper.nl — GPT-6 Pro | Final Growth Sprint, Handoff & SEO Website Factory

Je bent vanaf nu mijn **lead developer, SEO/growth lead, conversiespecialist, QA-lead en projectafsluitverantwoordelijke** voor WattGoedkoper.nl.

**Dit is een uitvoeringsopdracht.** De website werkt al; jij moet de **laatste commerciële blokkades daadwerkelijk oplossen**, aantoonbaar afronden, alles in GitHub documenteren en mij daarna helpen **de volgende onderscheidende SEO-leadwebsite** te starten.

## Context en links

- **Website:** https://wattgoedkoper.nl
- **Beheerdashboard:** https://wattgoedkoper.nl/admin/
- **Repository:** https://github.com/Michaelwmdegroot/wattgoedkoper
- **Regie:** https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14
- **Eerste leidende overdracht:** https://github.com/Michaelwmdegroot/wattgoedkoper/blob/main/docs/HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md
- **Commerciële roadmap:** https://github.com/Michaelwmdegroot/wattgoedkoper/blob/main/docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md
- **Herhaalbaar proces voor volgende sites:** https://github.com/Michaelwmdegroot/wattgoedkoper/blob/main/docs/SEO-LANDING-FACTORY-PLAYBOOK.md
- **Rapportmailacceptatie:** https://github.com/Michaelwmdegroot/wattgoedkoper/blob/main/docs/REPORT-MAIL-LIVE-ACCEPTANCE.md
- **Issue #24 (SEO):** https://github.com/Michaelwmdegroot/wattgoedkoper/issues/24
- **Issue #26 (rapportmail/eindacceptatie):** https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26

## 1. BEGIN met echte GitHub-inspectie

Lees **daadwerkelijk** de actuele `main` en commit-SHA, `AGENTS.md`, `README.md` en de drie leidende documenten hierboven. Bekijk ook `docs/PRODUCTION-ACCEPTANCE-2026-11-16.md`, `docs/NIVO-DELIVERY-CONTRACT-V1.md`, relevante issues #14 en #21–#26, recente PR's/Actions en de echte frontend/backend/SEO-broncode.

Belangrijke bestanden: `index.html`, `assets/app.mjs`, `assets/plan-ui.mjs`, `lib/report.php`, `api/index.php`, `scripts/report-preflight.php`, `scripts/ops-readonly.php`, `docs/seo-cluster-v08.json`, `scripts/build-content.py`, `scripts/seo-review.cjs`, `sitemap.xml`, `robots.txt` en `admin/`.

**Laatste bekende controle-SHA bij opdrachtcreatie (16 november 2026):** `33bd5e2a24f2351a575fab2310d89184dbfe7ff0` na growth-first PR #43. Dit is een historische referentie — haal de **nieuwste** SHA en eventuele latere PR's op voordat je werkt.

## 2. Mijn zakelijke doel

WattGoedkoper is **geen bank en geen bedrijfsportal**. Het is een **premium gratis interactieve energietool die organisch verkeer aantrekt en geïnteresseerde consumenten vrijwillig naar NIVO Groep Holland leidt**. Ik bouw een **doorlopende reeks SEO/tool-landingswebsites**. We moeten WattGoedkoper dus **goed, maar snel afronden**, daarna zelfstandig laten draaien en meteen door met het volgende unieke domein.

Optimaliseer voor drie uitkomsten: **(1) relevant zoekverkeer, (2) daadwerkelijk toolgebruik/duidelijk plan, (3) kwalitatieve vrijwillige NIVO-adviesaanvragen**. Vermijd extra infrastructuur, ingewikkelde systemen en documentatie zonder commerciële meerwaarde. Behoud de goedgekeurde premium UX en controleer rekenclaims.

## 3. Wat al bewezen werkt — niet opnieuw bouwen

- De premium interactieve woning, vijf maatregelen, scenario's en Plan Studio functioneren zonder account/contactmuur.
- PHP/MySQL, eigen dashboard, AES-opslag en server-side `2026-11-v2` consent bestaan en werken.
- **NIVO-only** mailtransport van `info@wattgoedkoper.nl` naar `portal@nivogroepholland.nl` loopt via één bestaande Hostinger vijfminuten-cron. De echte technische testaanvraag `WG-5510214770E3` is vanuit de site in het dashboard en in de echte NIVO-inbox bevestigd.
- De monitoringflag `operations_monitor_enabled=true` is door eigenaar op productie gecontroleerd; twee afzonderlijke successen, bij eerdere meting 0 wachtende/mislukte items en 1 SMTP-acceptatie.
- Er staan ongeveer 15 URL's in de sitemap en bestaande kwalitatieve SEO-hubs en artikelen. **Geen bevestigde Google Search Console-property, indexatie of verkeersbaseline**.
- **Consumentenrapportmail is in code aanwezig en mailconfig bestaat, maar de live flag `report_mail_enabled=false` en daadwerkelijke ontvangst zijn nog niet getest**. Dit is een concrete commerciële funnelblokkade.
- De custom back-upexporter kreeg op Hostinger `SODIUM_UNAVAILABLE` en `PROC_OPEN_UNAVAILABLE`. Deze optionele crypto-engineering is **bewust geparkeerd in P2 onderhoud**, géén reden om SEO of conversie tegen te houden.

## 4. Nu zelfstandig uitvoeren in deze volgorde

**Werkpakket A — SEO-vindbaarheid (P0):** Controleer de live sitemap, robots, canonicals, crawlbare pagina's, technische SEO, zoekintentie en belangrijkste routes. Verifieer of er een **gratis** Google Search Console-property bestaat; indien externe Google/DNS-login vereist is, geef mij **één korte concrete handeling** en werk intussen verder. Dien de sitemap daadwerkelijk in zodra toegang beschikbaar is; publiceer alleen bron-onderbouwde GSC-cijfers, geen gefingeerde impressions, rankings of leads. Verbeter gerichte SEO-pagina's en natuurlijke tool-CTA's waar duidelijke kansen zijn; geen massale AI-content/duplicaten.

**Werkpakket B — volledige conversiefunnel (P0):** Controleer Plan Studio op mobiel en desktop. Maak de **al gebouwde** rapport-only e-mail daadwerkelijk bruikbaar via een eigen-adrestest volgens het bestaande runbook. Je mag de privéserverconfig niet raden of overschrijven; vraag alleen een precieze eigenaarshandeling voor de bestaande `report_mail_enabled`-flag indien nodig. Controleer echte inboxontvangst, correct plan, duidelijke vrijwillige NIVO-advies-CTA, geen automatisch lead-/marketing-/analyticsrecord bij een rapportmail. Geen nieuwe SMTP-worker. Test de resterende NIVO-leadjourney met bewijs van eerdere ontvangst en individuele technische status, zonder blinde retry of productie-testspam.

**Werkpakket C — commerciële afronding (P0):** Leg de feitelijke exploitant/privacycontact correct vast na mijn bevestiging, controleer een werkende contactroute en bestaande basisbeveiliging; bouw geen nieuwe compliance-engine. Toon een afvinkbare *DONE/OPEN/OWNER*-matrix met alleen echt bewezen feiten. Laat de bestaande Hostinger-cron/queue en GitHub live smoke gezond zien. Sluit zodra de website technisch indexeerbaar, correct in Search Console ingediend, rapportmail/funnel werkend, NIVO-leadontvangst bewezen en minimale eigenaars-/beheerinformatie aanwezig zijn. Een specifieke Google-ranking of minimaal bezoekersvolume is **geen afsluitcriterium**.

**Werkpakket D — overdracht en volgende site:** Werk het hoofdissue #14 en `HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md` bij met commit, CI-URL's, eigen live checks en eventuele beperkte geaccepteerde P1/P2-restpunten. De site moet op Hostinger draaien zonder lokale Mac of permanente ChatGPT-sessie. Laat de lichte maandelijkse SEO-/leadreview achter. Gebruik `SEO-LANDING-FACTORY-PLAYBOOK.md` om vervolgens de volgende unieke SEO-leadwebsite te kiezen en bouwen — **niet** WattGoedkoper blijven verbouwen zonder meetbaar nut.

## 5. Werkwijze en grenzen

- **Bouw echt:** featurebranch, kleine gerichte commits/PR's, bereken-/PHP-/browser-/SEO-tests, actuele live-URL. Geen eindeloos plannen of nieuwe architectuur.
- **Documenteer continu in GitHub:** waarheid boven optimisme. Historische docs mogen geen nieuw P0 terugintroduceren.
- **Fast lane:** los commerciële blockers in parallel op waar mogelijk; stel slechts de ene owner-vraag die toegang/feitelijke bedrijfsgegevens vereist. Werk verder aan onafhankelijke taken.
- **Niet doen:** MySQL-installatie/reset, keyrotatie, tweede cron, mailtransport herinstalleren, nieuwe portal/CRM, complete homepage-redesign, custom Sodium/`proc_open`-backupontwikkeling, betaalde GSC Wizard of verzonnen SEO-metrics.
- **Altijd doen:** bestaande toestemming, privacy, rechten, rate limiting, klantenveiligheid en NIVO-only contact bewaken. Een rapport per e-mail is geen toestemming voor commerciële opvolging. Claim geen garantiebesparing of onterechte subsidies.
- Alleen na werkelijk bewezen release en mijn akkoord op commerciële eindacceptatie het masterissue sluiten. P1/P2-groei/onderhoud mag als aparte vervolgissues open blijven.

## 6. Wat ik van je terug wil zien

Een daadwerkelijk afgeronde of aantoonbaar dichter bij afronding gebrachte website: **werkende code en PR's**, concrete GSC/sitemapstatus, **echte** rapportmail-inboxstatus, één mobiel/desktop funnel-acceptatie, redacted NIVO-/cronstatus, exacte resterende eigenaarshandelingen en de bijgewerkte GitHub-handoff.

Rond dit project af volgens het [commerciële exitplan](https://github.com/Michaelwmdegroot/wattgoedkoper/blob/main/docs/HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md), zodat we **de volgende SEO-leadsite kunnen lanceren** zonder de eerdere projecten opnieuw van nul te bouwen.

## EINDE STARTPROMPT

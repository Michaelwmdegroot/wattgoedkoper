# WattGoedkoper.nl — definitieve growth-overdracht en afsluitplan

**Statusbasis:** 16 november 2026 · `main` gecontroleerd op `33bd5e2a24f2351a575fab2310d89184dbfe7ff0` (PR [#43, growth-first](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/43)). Controleer bij iedere overname eerst opnieuw de actuele branch/CI/productie.  
**Site:** https://wattgoedkoper.nl · **Beheer:** https://wattgoedkoper.nl/admin/ · **Repo:** https://github.com/Michaelwmdegroot/wattgoedkoper · **Hoofdissue:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14).

## 1. Waarom we dit project nu strak afronden

De eigenaar ontwikkelt **een reeks afzonderlijke, snel te lanceren SEO-/tool-landingswebsites die kwalitatieve leads voor NIVO Groep Holland kunnen opleveren**. WattGoedkoper is het eerste type: een premium gratis consumentenhulpmiddel dat een reëel probleem oplost, vindbaar is op specifieke zoekvragen en vrijwillig contact voor advies mogelijk maakt.

**Niet het doel:** een bank, bedrijfsportal, extra CRM, eigen beveiligings-/back-upplatform, AI-contentfabriek of eindeloos nieuw redesign. De eerdere Sodium/`proc_open`-back-upexportontwikkeling is wegens overengineering geparkeerd als onderhoudsschuld [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21). Een niet-bewezen optionele custom restore is **geen blokkade voor SEO-/conversiewerk**. Bestaande privacy, persoonsgegevensbeveiliging en hostingherstelvoorzieningen wel proportioneel in stand houden.

**Definitie van 'afsluiten':** de website functioneert zelfstandig op hosting, is technisch indexeerbaar en ingediend bij Search Console, heeft een **bewezen werkende complete conversieroute** en kan met licht beheer gevolgd worden. **Geen garantie of vereiste dat al organische bezoekers, een specifieke ranking of maandelijkse leads zijn behaald** — SEO-resultaten ontstaan pas na publicatie en kosten tijd. Daarna verschuift de site naar *onderhoud & groei op basis van echte data* en begint de volgende aparte website.

## 2. Feitelijke live status — dit NIET opnieuw bouwen

| Onderdeel | Bewijs | Status |
| --- | --- | --- |
| Premium interactieve woning, vijf maatregelen, scenario-/besparingsrekenmodel en Plan Studio | Site + browserreview | **LIVE / werkend** |
| Gratis toegang zonder account, e-mail of leadmuur | Broncode en browsertests | **LIVE** |
| PHP/MySQL, private AES-opslag, `2026-11-v2` NIVO-consent, rate limits, Dashboard 2.0 | Backend-/MySQL-CI en live health | **LIVE** |
| NIVO-only adviesaanvragen | Reguliere test `WG-5510214770E3`: dashboard én feitelijke ontvangst in `portal@nivogroepholland.nl` | **LIVE bewezen voor één test** |
| SMTP-leadtransport | `info@wattgoedkoper.nl` → `portal@nivogroepholland.nl` met bestaande `delivery_outbox` | **Actief**; `smtp_accepted` betekent niet API-ACK |
| Hostinger onderhoud | **Één** `*/5 * * * *` → `scripts/operations.php`, twee afzonderlijke successen en private `operations_monitor_enabled=true` | **Werkend geobserveerd**, geen bewezen extern alarmkanaal |
| Outbox op laatste eigenaarmeting | `pending=0`, `processing=0`, `smtp_accepted=1`, `failed=0` | **Momentopname**; individuele testleadstatus nog niet apart afgetekend |
| SEO-basis | `sitemap.xml` met **15 URL's**, canonicals, HTML-hubs/kenniscontent, JSON-LD, robots, interne links | **Gepubliceerd**, Google-indexatie nog **niet bewezen** |
| Consumentenrapportmail | `report_email`-API en bestaande mailconfig; CLI `reportEnabled=false`, `liveReceiptVerified=false` | **Code klaar, live UIT**, belangrijke funnelblokkade |
| Gratis Google Search Console | Nog geen geverifieerde eigendom/sitemapindiening of data door eigenaar | **OPEN** |
| Juridische exploitant op privacyverklaring | Publieke tekst vermeldt dat de verantwoordelijke nog definitief bevestigd moet worden | **OPEN vóór commerciële eindafsluiting** |
| Custom MySQL-export met Sodium | Hostinger preflight `SODIUM_UNAVAILABLE`, `PROC_OPEN_UNAVAILABLE` | **P2 geparkeerd**, geen werkelijk restorebewijs |

**Controleer actuele build, niet deze momentopname:** [PR #43](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/43), [post-merge quality](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43785490771), [browser](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43785490724), [Hostinger live smoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43785490754). Voor geanonimiseerde productie-observaties: [bewijsregister](PRODUCTION-ACCEPTANCE-2026-11-16.md).

## 3. Exact restant — afwerken in commerciële volgorde

**P0 = noodzakelijk om van actieve ontwikkeling naar zelfstandig draaiende site te gaan.** Werk de punten in korte uitvoerings-PR's af; owner-acties en technische wijzigingen zoveel mogelijk parallel.

| # | Wie | Taak | Objectief acceptatiebewijs |
| --- | --- | --- | --- |
| **P0.1** | Agent + eigenaar Google/DNS | Verifieer gratis **Google Search Console**-property voor wattgoedkoper.nl, dien `https://wattgoedkoper.nl/sitemap.xml` in, controleer pagina-indexatie/robots/canonical. | Property geverifieerd + sitemap door GSC ontvangen; eventuele issues genoteerd, geen ranking vereist. Geen betaalde GSC Wizard. |
| **P0.2** | Agent + eigenaar Hostinger/testinbox | Maak de **bestaande** rapportmail werkelijk bruikbaar. Voor/na backendstatus, alleen bestaande private `report_mail_enabled` geautoriseerd inschakelen, **één eigen-adres** mail versturen en echte inbox + vrijwillige advies-CTA controleren. | Eén echt ontvangen rapport met correcte plannen/voorbehoud, geen extra NIVO-lead, marketingtoestemming of statistiekentoestemming; geen tweede SMTP-config. Zie [rapportmailrunbook](REPORT-MAIL-LIVE-ACCEPTANCE.md). |
| **P0.3** | Agent | Test complete mobiele én desktopjourney: SEO-pagina → relevant energiehuis/maatregel → leesbare één-scherm Plan Studio → rapportmail of expliciet NIVO-advies. Fix concrete gebroken links, CTA-verwarring, layout-/formulierwrijving. | Echte browser-testcases en screenshots in PR/CI, bestaande premium ervaring behouden; geen verplichte contactmuur. |
| **P0.4** | Agent + eigenaar | Controleer dat NIVO-advies nog aankomt. Inspecteer bij `WG-5510214770E3` **alleen de individuele technische** status, geen contactgegevens in GitHub; ruim dit ene testrecord uitsluitend na eigenaarbesluit gericht op. | Bevestigde afleverstatus + NIVO-inboxbewijs van eerdere test; queue en cron gezond; geen blinde retry of testcampagne. |
| **P0.5** | Eigenaar + agent | Bevestig **feitelijke verantwoordelijke rechtspersoon/privacycontact**, correcte informatie over NIVO-gegevensdeling, bewaartermijn en bereikbare contactroute. Check dat de publieke privacytekst niet langer een onafgemaakte placeholder bevat; basis SPF/DKIM/DMARC alleen indien direct nodig voor mailsucces. | Publieke correcte privacy-/contactinformatie, eenvoudige eigenaar-aftekening, geen nieuw compliance-platform. |
| **P0.6** | Agent + eigenaar | Laat handover achter: `main` live, Actions groen, 5-minuten-cron fris, 0 openstaande fouten, incident/contactpersoon, bronregistratie en vaste lichte controlecadans. | Laatste live HTTP-/admin-/queuecheck + geanonimiseerd statusbewijs in #14; geen actieve ontwikkelblokkades voor bezoeker/lead. |

**P1 — verbetering ná live afsluiting, niet verplichte handoff-gate:**
- Zoekintentie en bestaande kennisartikelen versterken op werkelijke zoekvragen; eerst ontbrekende zoekdata verzamelen. Eventueel enkele nieuwe **onderscheidende** hoogwaardige SEO-pagina's met rechtstreekse instap naar relevante toolstatus, geen automatisch gegenereerde thin content.
- Een nulmeting van GSC vastleggen: clicks, impressies, CTR, topqueries, pagina's en indexeringsissues **voor zover Google ze beschikbaar heeft**; ook `0`/nog geen data eerlijk rapporteren.
- Servergeaccepteerde NIVO-aanvragen (7/30 dagen), afleverratio per cohort en NIVO-feedback over leadkwaliteit wekelijks/maandelijks vergelijken. Analytics-events alleen met aparte toestemming; geen conversieratio of herkomst verzinnen.
- Kleine mobiele/copy/CTA-optimalisaties alleen als er een duidelijk frictiepunt of echte data is.

**P2 — parkeren (geen reden om deze website onafgemaakt te laten):** custom Sodium/`proc_open`-back-upexporter, aparte zelfgebouwde herstelketen, nieuwe Portal API/CRM, extra alerts, serverclusters en complexe BI. Hostinger-native backups en minimale organisatorische continuïteit bij reguliere beheercheck nagaan; geen daadwerkelijke restoreclaim zonder bewijs. Een echt veiligheids- of privacy-incident heeft uiteraard wel voorrang.

## 4. Commerciële Definition of Done

De nieuwe agent stelt **operationele release GO** voor wanneer P0.1 t/m P0.6 aangetoond of van een expliciet gedocumenteerde, beperkte en eigenaar-geaccepteerde uitzondering zijn voorzien, en de eigenaar akkoord geeft op de werkende consumentenroute. Indien GSC-crawling nog loopt, is 'property/sitemap ontvangen' voldoende; **Google-clicks/rankings zijn geen exit-eis**. Als de rapportmail bewust uit blijft, kan de website alleen worden afgesloten met een **aangepaste, eerlijk werkende funnel zonder kapotte mail-CTA en expliciete eigenaar-go**, niet door te zeggen dat mail werkt.

**Daarna:** sluit #14 af als *launch/handoff complete*, maar houd concrete P1/P2-onderhoudsissues apart open waar nodig. Sla één bewijsrijke afsluitcomment op (live commit, sitechecks, GSC-status, rapportmail-eigen-inboxbewijs, NIVO-status, juridische aftekening, open risico's en eigenaar). Start direct de volgende landingssite met [factory playbook](SEO-LANDING-FACTORY-PLAYBOOK.md). De site mag vanaf dan zelfstandig draaien op Hostinger, niet op een lokale Mac; SEO-optimalisatie is een doorlopend licht onderhoudsproces, niet magisch volledig geautomatiseerd.

## 5. Product- en technische grenzen voor opvolgers

- **Nooit** een nieuwe generieke AI-formulier-homepage of een volledig redesign van het goedgekeurde premium energiehuis. Geen partnerkeuze, drie offertes, €100-bonus of contactmuur.
- **Rekenwaarheid:** scenario's zijn indicatief, geen gegarandeerde besparing/subsidie/ROI. 2026 vs 2027 juist beschrijven, bronnen actueel reviewen.
- **NIVO-only:** nieuwe vrijwillige aanvragen alleen na expliciete standaard uitgevinkte `2026-11-v2` consent; `report_email` en analytics zijn aparte keuzes.
- **Behoud infra:** huidige Hostinger `main`-deploy, private config buiten webroot, AES-sleutel, MySQL-data, NIVO SMTP en **één** cron. Nooit `setup.php`/`setup-mysql.sh` opnieuw draaien, credentials delen, keyrotatie of onbekende SMTP-retries.
- **Geen verzonnen resultaten:** GSC alleen echte data, `smtp_accepted` alleen SMTP-relayacceptatie, 7/30d leadcijfers uit bestaande bron; data en bronperioden benoemen.
- **Geen nieuwe dure abonnementen** of automatische contentpublicatie zonder eigenaar-go. Codebranches/PR's + CI/browser + actuele live check; alleen bewijs dat daadwerkelijk is vastgesteld noteren.

## 6. Waar de nieuwe agent werkelijk moet kijken

**Lezen, in volgorde:** `AGENTS.md` → dit document → [commerciële roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md) → [rapportmailacceptatie](REPORT-MAIL-LIVE-ACCEPTANCE.md) → [productiebewijs](PRODUCTION-ACCEPTANCE-2026-11-16.md) → relevante issues #14, #24, #26, #22/#23. Historische overdracht `HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md` is technische achtergrond, niet de prioriteitenlijst.

**Relevante bestanden:** `index.html`, `assets/app.mjs`, `assets/plan-ui.mjs`, `lib/report.php`, `lib/delivery.php`, `api/index.php`, `admin/`, `scripts/build-content.py`, `docs/seo-cluster-v08.json`, `sitemap.xml`, `scripts/seo-review.cjs`, `scripts/ops-readonly.php`, `scripts/report-preflight.php` en `.github/workflows/`.

**Gebruikelijke checks:** `npm test`, `npm run check`, `python3 scripts/build-content.py`, `npm run check:seo` en geautomatiseerde backend-/browser-CI. Laat de GitHub-live-smoke na merge de actuele Hostinger-release controleren. Wijzig geen database/secrets/cron in een documentatie-PR.

**Nieuwe-agentstart:** [START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md](START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md).

## 7. Begrensde bewijsplicht en uitvoeropdrachten

- **Agent kan zelfstandig:** code lezen, featurebranches/PR's openen, SEO- en UX-fixes bouwen, backend/JS-browser-CI uitvoeren, technische live smoke bekijken, redacted bewijs/issuecomment documenteren.
- **Eigenaar moet bevoegd uitvoeren/bevestigen indien tools geen toegang hebben:** Google-eigendomsverificatie en sitemapindiening, private Hostinger-featureflag, eigen inboxbezorging, feitelijke rechtspersoon en privacycontact, uiteindelijk commerciële GO.
- De agent **vraagt alleen die ontbrekende handeling**, nooit opnieuw om bekende domein/cron/SMTP-basisfeiten. Als een eigenaarsschakel nodig is: een exact, kort stappenplan, ondertussen andere groeistappen doorbouwen.
- Publiceer **geen** persoonlijke gegevens, rapportadressen, mailheaders met secrets, originele private config, SQL-dumps of wachtwoorden in GitHub.

**Leidend principe:** één website afronden tot bewezen werkende leadfunnel, daarna beheersbaar laten lopen en door naar de volgende. Niet eindeloos 'bijna klaar' blijven.

# WattGoedkoper — commerciële roadmap: Traffic → Toolgebruik → NIVO-leads

**Leidende uitvoerings- en exitlijst (16 november 2026):** [HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md](HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md). Deze beschrijft de zes concrete P0-lancering-/handoffgates en maakt duidelijk dat Google-clicks/rankings **niet** nodig zijn om het project als productiesite over te dragen. Voor nieuwe sites: [SEO-LANDING-FACTORY-PLAYBOOK.md](SEO-LANDING-FACTORY-PLAYBOOK.md). Voor de volgende agent: [START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md](START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md).



**Koersbesluit eigenaar, 16 november 2026:** WattGoedkoper is in de eerste plaats een **publieke, premium, gratis energietool en leadgenerator voor NIVO Groep Holland**. Een werkende consumentenjourney, kwalitatief relevant verkeer en conversie hebben vanaf nu prioriteit boven extra infrastructuur. Deze roadmap vervangt de eerdere volgorde waarin custom back-up/restore als P0 vóór groei stond. Bestaande code, privacy, consent en veiligheidsgrenzen blijven behouden.

**Repo:** [main](https://github.com/Michaelwmdegroot/wattgoedkoper) · **regie:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14) · **SEO:** [#24](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/24) · **product:** [#22](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/22), [#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26) · **infrastructuur/back-up:** [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21).

## Wat al werkt — niet opnieuw bouwen

- Premium interactief **energiehuis / Plan Studio**, zonder inlog- of contactverplichting, met scenario's en indicatieve besparingen.
- Eigen PHP/MySQL-backend, consent `2026-11-v2`, NIVO-only adviesaanvraag, dashboard en **daadwerkelijk ontvangen technische NIVO-testlead** `WG-5510214770E3`.
- Eén Hostinger vijfminuten-cron, recente gescheiden succeswaarnemingen en ingeschakelde dashboardmonitoring; 0 pending/failed en 1 geaggregeerde `smtp_accepted` bij laatste ownermeting.
- Twee kwalitatieve SEO-clusters met 15 URL's in sitemap, interne links, bronverwijzingen en code-/browser-/live-smokechecks.
- **Niet bewezen:** daadwerkelijke Search Console-indexatie/impressies, aantallen organische bezoekers of conversie, individuele technische testleadstatus, werkelijke aflevering van consumentenrapportmail.
- **Nog uitgeschakeld:** `report_mail_enabled=false` op Hostinger; bestaande rapportmail- en mailconfigcode zijn aanwezig. Dit is nu een **commerciële funnelblokkade**, geen reden voor een SMTP-herbouw.

## Commerciële prioriteiten: volgorde van uitvoering

### P0-A — Vindbaarheid en gratis organische instroom (eerst)

1. Maak via de **gratis** Google Search Console een domein- of URL-property aan/valideer de bestaande property; dien `https://wattgoedkoper.nl/sitemap.xml` in. Dit vereist een bevoegd Google-/DNS-account. Niets claimen als reeds verbonden zolang de eigenaar geen bewijs heeft.
2. Controleer feitelijke indexatie en prestaties: pagina's met/impressies zonder clicks, crawlfouten, queries, clicks, CTR en best presterende landingspagina's. Neem een **echte nulmeting** op; geen betaalde GSC Wizard of zelfbedachte aantallen.
3. Verbeter de bestaande hubs en maak pas daarna **gerichte, hoogwaardige SEO-landingspagina's** voor zoekintentie rond energiekosten/besparing berekenen, zonnepanelen na 2027, thuisbatterij en energiecontracten. Elke pagina moet iets unieks oplossen, actuele claims controleren bij officiële bronnen en leiden naar de interactieve tool, geen AI-massapagina's of doorwaylocaties.
4. SEO-acceptatie: crawlbare echte inhoud, unieke titles/metadescriptions/canonical, relevante interne links naar de tool, mobile snelheid, geen defecte CTA's of indexeerblokkades. Publicatie is geen bewijs van ranking; kwaliteit en daadwerkelijke groei meten.

### P0-B — Bezoeker → persoonlijk energieplan → optionele NIVO-advieslead

1. **Consumentenrapportmail afronden en inschakelen.** De code en Hostinger-mailconfig bestaan; schakel alleen de bestaande *aparte* flag in na één gerichte eigen-adrestest en bevestig echte inboxontvangst. Controleer dat het geen NIVO-adviesaanvraag, marketingtoestemming of nieuwe analytische opt-in creëert. Geen nieuwe SMTP-service bouwen.
2. Controleer de funnel op mobiel en desktop: landingspagina → relevante maatregel in energiehuis → één-scherm Plan Studio met zichtbaar voordeel/voorbehoud → mail mijn plan → in e-mail passende, duidelijke **vrijwillige** NIVO-advies-CTA. Zo nodig gerichte UX-copy- of layout-PR's, zonder een tweede redesign.
3. Verbeter de bestaande advies-CTA op het juiste moment na inzicht, niet als contactmuur. NIVO is de enige adviesopvolger; toestemmingsvakje blijft standaard uit en gegevens gaan pas mee na expliciete aanvraag.
4. Acceptatie: minimaal één afzonderlijke, werkelijk ontvangen *rapport-only* testmail en één bestaande bevestigde NIVO-testketen, beide met heldere fout-/bevestigingsberichten; geen duplicaten of blind herverzenden.

### P1 — Meet, leer en schaal wat werkt

- **SEO:** GSC clicks/impressies, geïndexeerde pagina's en zoekopdrachten (uitsluitend echte GSC-bron).
- **Leads:** servergeaccepteerde NIVO-adviesaanvragen per 7/30 dagen en afleveringstatus; noem `smtp_accepted` niet gelijk aan NIVO Portal-API-ACK.
- **Funnel:** geaggregeerde tool-/scan-/CTA-events alleen wanneer de consument aparte analytics-toestemming heeft verleend. Geen bezoekersaantallen of conversieratio zonder geldige noemer.
- **Kwaliteit:** commerciële relevantie van aanvragen laten terugkoppelen door NIVO; pas daarna copy, bestaande content, uitleg en CTA's optimaliseren.
- Gebruik eerst het **bestaande admin-dashboard**. Bouw geen nieuw dashboard, eventtrackingplatform, CRM of analytics-stack voordat een concreet gemeten knelpunt dat rechtvaardigt.
- Growth-distributie: selectieve organische content, verdienste-gebaseerde verwijzingen/partners waar passend en eventueel later een kleine betaalde test na eigenaar-go. Geen paid tool als voorwaarde.

### P2 — Proportioneel onderhoud en veiligheid (geen blokkade voor P0-A/B)

- **Blijven doen:** bestaande login/toegangsrechten, MySQL/AES en secretbescherming, anti-spam/rate-limits, expliciete consent, juiste privacyverklaring, eenvoudige monitoring, één cron, bestaande Hostinger-back-ups/retentie waar beschikbaar. Reële storingen of privacyrisico's direct repareren.
- **Niet verder uitbouwen tijdens growth sprint:** custom Sodium/Argon2id-back-upketen, `proc_open`-workarounds, langdurige geïsoleerde restore-experimenten, nieuwe agent-/CRM-infrastructuur of observabilityproject. De werkelijke Hostinger-preflight is een **NO-GO** voor de huidige *custom* exporter (`SODIUM_UNAVAILABLE`, `PROC_OPEN_UNAVAILABLE`). Laat dat als technische schuld in [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21); **niet** opnieuw oplossen tenzij verliesrisico/incident of duidelijke eigenaarbeslissing.
- Eerst bestaande **Hostinger-native back-upvoorzieningen** en eenvoudige organisatorische herstelmogelijkheid inventariseren, zonder database te resetten, credentials te publiceren of het SMTP-leadpad te wijzigen. Dat is onderhoud, geen voorwaarde om SEO- en conversie-PR's te shippen.
- Feitelijke verwerkingsverantwoordelijke/privacycontact en correcte dataverwerking op de publieke site blijven noodzakelijke korte eigenaarstaken, géén reden voor een security-platformproject.

### P3 — Later, alleen op aantoonbare vraag

Uitbreiding met NIVO Portal REST API, CRM-autosynchronisatie, betaald verkeer op schaal, complexe personalisatie, extra energiedatasets, cross-device accounts en automatische marketing zijn optioneel. De huidige werkende SMTP-route wordt niet dubbel gestart of gereset.

## Werkafspraak voor alle volgende agents

**Elke ontwikkelstap moet één van drie doelen dienen:** (1) meer relevante bezoekers, (2) meer mensen die de tool gebruiken en het plan begrijpen, (3) meer kwalitatieve vrijwillige NIVO-adviesaanvragen. Begin elk PR met welke KPI/consumentstap het verbetert. Kleine werkende productie-iteraties boven grote architectuurvoorstellen; bestaande designkwaliteit en rekeneerlijkheid behouden.

**Nu doen:** GSC-property/sitemap/indexatie, rapportmail live eigen-adrestest, bestaande SEO-landingspagina's/CTA's gericht verbeteren, echte eerste verkeers- en leadmetingen.

**Nu niet doen:** verdere Sodium/`proc_open`-architectuur, nieuwe back-upcrypto op maat, extra dashboards/agents, eindeloze releasegates die de toch al werkende leadketen blokkeren.

**Niet onderhandelbaar:** geen onjuist financieel rendement, misleidende leadtoestemming, publieke secrets/klantdata of destructieve MySQL-migraties. Security en privacy zijn basishygiëne, geen zelfstandig productdoel.

**Historische operationele details:** [productiebewijsregister](PRODUCTION-ACCEPTANCE-2026-11-16.md), [herstelrunbook](BACKUP-RECOVERY-RUNBOOK.md), [vroegere ontwikkeloverdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md). Deze houden eerdere feiten vast maar bepalen niet langer de commerciële werkvolgorde.

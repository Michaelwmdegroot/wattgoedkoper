# WattGoedkoper — roadmap naar onderhoudsarme automatische leadgeneratie

**Startpunt 15 november 2026:** [actuele productieoverdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md). NIVO SMTP-keten **functioneel live en één echte end-to-end test bewezen**. Nog geen afgeronde algehele productie-/SEO-acceptatie.  
**Hoofdissue:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14) · [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21)–[#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26).  
**Productdoel:** consumenten vanuit betrouwbare informatie en een premium interactieve gratis berekening bij voorkeur vrijwillig een goede NIVO-adviesaanvraag laten doen, met continuïteit en zonder dagelijkse handmatige overdracht.

## Bewijsniveaus

- **Gereed en bewezen:** publieke energiehuis/Plan Studio, beveiligde MySQL/API, goedgekeurde homepage en dashboard, NIVO-consent/outbox/SMTP, eigenaar-confirmatie inbox voor echte testlead `WG-5510214770E3`, Hostinger-cronuitvoer, technische en browser-CI, live release-smoke, twee kwalitatieve contentclusters.
- **Code gereed; operationeel nog controleren:** individuele deliverystatus `smtp_accepted`, herhaalde cron-heartbeats en ingeschakelde monitorwaarschuwingen, report-only API en template.
- **Niet geverifieerd:** MySQL-back-up + sleutels + succesvolle restore, definitieve exploitant/privacy-aftekening, rapport-only SMTP-ontvangst, Search Console-query's/indexatie, echte organische leadattributie, externe storingsalerts.
- **Niet in scope voor deze fase:** automatische NIVO CRM-/Portal-API-synchronisatie, betaalde marketingdiensten, accounts, AI-autopublicatie of een nieuw ontwerp van de bestaande homepage.

## P0 — betrouwbaarheid en zelfstandig beheer

| Taak | Werkelijke uitgangssituatie | Acceptatiebewijs | Issue |
|---|---|---|---|
| Backup en restore | MySQL met versleutelde leads draait, restore niet bewezen | Beveiligd backup-pakket en echte testrestore op geïsoleerde omgeving; juiste private sleutel, database, permissions en leesproef met uitsluitend testdata; geen prod overwrite | [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21), [#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26) |
| Laatste testlead afronden | Testcode `WG-5510214770E3` zichtbaar in admin en NIVO-mailbox | Per-lead status `smtp_accepted` of duidelijke afwijking bekeken en gelogd zonder PII; daarna gericht uit dashboard verwijderen; geen DB-reset | [#23](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/23) |
| Cron-monitor echt activeren | 5-minuten Hostinger-job en minimaal één cronuitvoer bewezen | Twee gescheiden succesvolle `ops_last_success_at`-metingen, maximaal toegestane age, na verifiëren private `operations_monitor_enabled=true`; dashboard waarschuwt bij stale/fail | [#25](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/25) |
| Alerting en fouten | Dashboard heeft waarschuwingen, externe bezorging niet afgetekend | Eigenaar-goedgekeurd alertkanaal of expliciet dashboard-only beheerafspraak, test failed outbox/stale cron zonder productie-leads te herverzenden, incident-owner vastgelegd | [#25](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/25) |
| Security/privacy | Consentvariant en dataminimalisatie in code, juridische entiteit/verwerkers nog te verifiëren | Feitelijke exploitant, privacycontact, grondslag, bewaartermijn, gegevensdeling met NIVO, DPA/verwerkingsrollen, SPF/DKIM/DMARC en toegang/rechten bij eigenaar nagelopen; bron-/privacytekst zonodig na review aangepast | [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21), [#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26) |

**Operationele regel:** de huidige NIVO SMTP-adapter is live. Test geen retries met bestaande echte leads en schakel `nivo_delivery_enabled` niet zonder incident uit. Bestaande cron exact één keer; geen extra `maintenance.php` of `deliver-leads.php` cron.

## P1 — consumentproduct en conversie compleet

| Taak | Acceptatiebewijs | Issue |
|---|---|---|
| Rapportmail afzonderlijk live toetsen | Test naar gecontroleerd eigen adres, body met transparante indicaties en CTA, rate limit/dedup; **geen** nieuwe lead, geen analytics- of marketing-opt-in; expliciete eigenaar-go voor `report_mail_enabled` | #21, #26 |
| Dashboard als operationele cockpit afronden | Echte SMTP-status, heartbeat, lost/stale state en aflevertelling inzichtelijk; geen fictieve ontvangst, SEO/GSC netjes onbekend; mobiel en toetsenbord bruikbaar | #22, #25 |
| Google Search Console gratis property | Site ownership/sitemap/index coverage, eerste echte impressies, klikken, zoekopdrachten en landingspagina's; geen betaalde GSC Wizard en geen rangschikkingsclaims zonder bron | #24 |
| SEO-bronupdate en technische SEO | Officiële RVO/ACM/Milieu Centraal-data en 2027-claims opnieuw gecontroleerd; canonicals, structured data, sitemap, intern linken, 404/mobiel & Core Web Vitals getoetst | #24 |
| Focus op intentie i.p.v. volume | Kwalitatieve zoekvragen en relevante kenniscontent → contextueel gratis energiehuis → optioneel NIVO-advies; geen thin/duplicated, locatie-doorway- of massale AI-pagina's | #24 |

## P2 — meten en gericht verbeteren

**Metricbron en definitie:**

1. **Servergeaccepteerde adviesaanvragen**: distinct nieuwe lead-ID's uit MySQL over 7/30 dagen, onafhankelijk van analytics-toestemming; geen claim over organische herkomst zonder bron.
2. **Technische aflevering**: `smtp_accepted / nieuw ontstane NIVO-outbox` voor dezelfde cohort/periode; `failed`, `processing` en `pending` afzonderlijk; “aanvaard door SMTP” niet verwarren met echte NIVO-inbox-ACK.
3. **Ervaring**: geaggregeerde `scan_complete` / andere events **alleen indien analytics-consent gegeven**; geen landelijke gebruikersnoemer of cross-device attributie claimen.
4. **Organic**: GSC-clicks/impressies en zoekopdrachten **uitsluitend uit verbonden Google Search Console**, eerst nulmeting. Conversie uit organisch alleen bij rechtmatig te meten bron-/referrer-/toestemmingspad, zonder PII/URL-tracking.
5. **Kwaliteit en economie**: owner kan handmatig een status/follow-up in NIVO registreren; opbrengst/qualified-rate nooit verzinnen. Bij onvoldoende werkelijke steekproef geen optimalisatiepercentages claimen.

**Te bouwen na basiscontinuïteit:** hoogwaardige interactieve educatieve keuzepaden, relevantere instappen in Plan Studio, duidelijker rapport, consentvriendelijke funnel-verbeteringen en SEO-aanpassingen op basis van aantoonbare gebruiksvragen. Hou designkwaliteit en rekenwaarheid boven oppervlakkige conversietrucs.

## P3 — toekomstige NIVO Portal API-integratie

Alleen wanneer de eigen NIVO Portal een veilige ontvangende API beschikbaar heeft: contract voor `requestId`, authenticatie, least privilege, privacygrondslag, idempotentie/ACK, beperkte retries/backoff, gescheiden productie/staging en migratieplan. De bestaande werkende e-mailroute mag niet stilzwijgend dubbel gaan versturen. API-ontvangst is momenteel **niet live**.

## Praktische Definition of Done

- **Product en leadmachine:** end-to-end test via echte consumentenjourney en NIVO-inbox bewezen op 15 november. Functioneel klaar.
- **Operationeel zelfstandig:** cron meerdere intervallen bevestigd, monitor/alerts werkzaam, backup én restore getest, testlead veilig opgeschoond, geen onduidelijke failed status. **Nog open.**
- **Product compleet:** aparte consumentenrapportmail test en privacy/juridische acceptatie geslaagd. **Nog open.**
- **Growth-ready:** indexeerbare kwalitatieve content, meetbare GSC-baseline en volgbare KPI's zonder toestemming te schenden. Content staat live; **echte meting nog open**.

**Werkwijze volgende agent:** start vanuit actuele GitHub-main, lees [overdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md), inspecteer tests en open issues, voer veilige read-only verificaties direct uit, bouw concrete fixes/rapporten als PR, laat niet bewezen externe Hostinger-acties in duidelijke eigenaarshandelingen achter. Bewaar uitsluitend echte validatiebewijzen in documentatie en geen persoonlijke of geheime informatie.

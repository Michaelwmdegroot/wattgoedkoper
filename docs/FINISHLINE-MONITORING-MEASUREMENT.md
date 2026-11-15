# Finish Line — monitoring en eerlijke lead-/SEO-metingen

**15 november 2026 · issues #14, #22, #24, #25 en #26.** De NIVO-adviesketen is functioneel live. Dit document specificeert wat de nieuwe dashboardtellingen bewijzen, wat onbekend blijft en welke productieacceptatie nog nodig is.

## Operationele heartbeat: twee waarnemingen, geen fictieve uptime

- De reeds bestaande enige `scripts/operations.php` schrijft `ops_last_success_at` na voltooiing. Nieuw: de vorige **afwijkende succesvolle tijdstempel** wordt als `ops_previous_success_at` bewaard. Verder wordt geen klantinformatie opgeslagen.
- `admin_operations.cron` bevat `lastSuccessAt`, `previousSuccessAt`, `observedDistinctRuns` (0, 1 of 2 als bewijsgrens) en `secondsBetweenLastTwo`. Het dashboard toont ook de vorige tick.
- Twee verschillende tijdstempels bewijzen **twee geslaagde uitvoeringen** en geen 24/7-beschikbaarheid. Zonder hPanel-uitvoer/schedule kan zelfs niet worden bewezen dat beide *automatisch* waren; handmatig uitvoeren van dezelfde CLI is mogelijk.
- `cron.status=fresh` volgt uit `ops_last_success_at` binnen `operations_max_age_seconds` (standaard 1800). Alleen wanneer de eigenaar privé `operations_monitor_enabled=true` heeft ingesteld genereert ontbrekende/stale cron een waarschuwing. Laat die schakelaar ongewijzigd tot de productiecontrole.
- `CRON_LAST_RUN_FAILED` en `NIVO_DELIVERY_FAILED` zijn afzonderlijke dashboardwaarschuwingen. Er is **nog geen bevestigd extern alertkanaal**, dus dashboardalarm is niet hetzelfde als e-mail-, sms- of bereikbaarheidsmonitoring.
- Geen extra cron, parallelle worker of automatische retry toevoegen. `SMTP_UNCERTAIN` eerst met de unieke technische aanvraagcode in de NIVO-inbox onderzoeken.

### Nieuwe privacyveilige Hostinger-statusinspectie

Zodra deze PR is beoordeeld en veilig naar Hostinger is uitgerold, kan de bevoegde eigenaar één statusmeting uitvoeren via de **bestaande** SSH-terminal:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php scripts/ops-readonly.php
```

Dit commando gebruikt uitsluitend **SELECT-query's**, zonder `wg_db()`-schema-initialisatie, zonder nieuwe cronjob, zonder SMTP-verzending en zonder leadmutatie. De JSON bevat alleen tijdstempels/statussen en aggregaten: `cron.lastSuccessAt`, `cron.previousSuccessAt`, `observedDistinctRuns`, `ageSeconds`, `monitorEnabled`, aantallen `pending/processing/smtp_accepted/acknowledged/failed`, generieke waarschuwingen en `backupStatus:not_verified`. **Geen klantpayloads, leadcodes, sleutels, DB-naam of mailadressen.** Het geeft bij een fout uitsluitend een generieke melding.

Een **live** statusmeting vanuit deze CLI is nog niet uitgevoerd en niet in de publieke GitHub-issue geplaatst. Voor de acceptatie zijn twee verschillende geregistreerde successen én bevestiging van de Hostinger hPanel-scheduler nodig. Dat de CLI `observedDistinctRuns:2` toont is op zichzelf geen bewijs dat beide uitvoeringen automatisch waren. Een versleutelde back-up is evenmin bewezen door deze statuscontrole.

### P0-productiecontrole (read-only)

1. Controleer in het beveiligde `/admin/` → **Tools & status** na twee reguliere cronintervallen of beide datums verschillend en vers zijn; leg uitsluitend de tijdstippen en statuscodes vast, zonder klantgegevens.
2. Bevestig in Hostinger hPanel dat beide uitvoeringen vanuit de **enige** bestaande `*/5 * * * *` job kwamen. Een enkele handmatige run volstaat niet.
3. Controleer in het detail van de bestaande technische test `WG-5510214770E3` of `smtp_accepted` en geen foutcode staan. De daadwerkelijke ontvangst van deze ene test was al eerder door de eigenaar bevestigd. Verwijder de testlead uitsluitend doelgericht **nadat** dit bewijs is afgetekend.
4. Na de heartbeatcontrole kan de eigenaar expliciet de private monitorflag inschakelen. Test missing/stale/failed via geïsoleerde synthetische data, niet met productieleads of een tweede cron. Een externe notificatie vergt een goedgekeurde ontvanger en aparte test.

## Lead-KPI's — definities en bewijsgrenzen

Beveiligde `admin_stats.cohorts` bevat voortaan **`last7Days`** en **`last30Days`**. Periode is inclusief vandaag en de vorige zes of 29 **UTC-kalenderdagen**, op basis van `leads.created_at`; dit is geen rolling-window van exact 168/720 uur. Reeds verlopen en verwijderde leads zijn niet langer telbaar. De database-retentie en historische consents blijven ongewijzigd.

| Veld | Definitie | Wat het niet is |
|---|---|---|
| `adviceAccepted` | Aantal bestaande unieke lead-ID's aangemaakt binnen dit datumbereik, alle historische partnerwaarden inbegrepen | Geen bezoeken, bezoekers, SEO-conversies of opt-in events |
| `nivoOutbox` | Huidige outboxregels die behoren bij nieuwe `nivo` leads met toestemming `2026-11-v2`, zelfde aanmaakcohort | Niet iedere historische lead of iedere mailpoging |
| `pending`, `processing`, `failed` | Huidige technische toestand van die outboxregels | Geen definitieve afleveringsuitkomst |
| `smtp_accepted` | Relay gaf SMTP-acceptatie na DATA voor dezelfde leadcohort | Geen bewezen NIVO-inboxontvangst of API-ACK |
| `acknowledged` | Uitsluitend toekomstige HTTPS-ontvanger met valide receipt, momenteel geen geactiveerde transportoptie | Niet op SMTP van toepassing |
| `attribution: unknown` | Er is geen betrouwbare per-lead organische herkomst beschikbaar | Geen `0%` organisch of Google Analytics |

Het dashboard toont de 30-daagse uitkomst voor NIVO, met **dezelfde** outbox-aanmaakcohort als noemer. Historische outboxtotalen blijven elders zichtbaar en zijn expliciet als totaal herkenbaar. De aparte `daily_events` omvatten alleen toestemmingsgebonden geaggregeerde scan-/formuliergebeurtenissen. Deze zijn **niet** geschikt om personen, unieke gebruikers of herkomst per lead te reconstrueren.

## Gratis Search Console — echte bron, geen fictieve traffic

1. De bevoegde Google-eigenaar gaat naar [Google Search Console](https://search.google.com/search-console/), controleert of `wattgoedkoper.nl` al als property bestaat en bevestigt het eigendom. Een domeinproperty vereist verificatie met de door **Google afgegeven** DNS-record; maak geen zelfverzonnen record. Google-instructie: [property toevoegen](https://support.google.com/webmasters/answer/34592) en [eigendom verifiëren](https://support.google.com/webmasters/answer/9008080).
2. Open **Sitemaps**, controleer de echte URL `https://wattgoedkoper.nl/sitemap.xml`, dien deze zo nodig in en leg eventuele **werkelijke** fouten vast. [Officiële sitemapinstructie](https://support.google.com/webmasters/answer/7451001).
3. Meet uit het **Performance → Search results** rapport: periode, clicks, impressions, CTR, pagina's en zoekopdrachten. Noteer of recente cijfers voorlopig zijn en of er nog geen data is. Gebruik dezelfde property, zoektype en periode bij elke nulmeting. [Officiële rapportdefinities](https://support.google.com/webmasters/answer/7576553) · [Query-/paginaview](https://support.google.com/webmasters/answer/17010961).
4. Controleer indexatie/crawl van homepage en belangrijkste kennis-URL's met echte URL Inspection of Page indexing-data. Publieke sitemap-, canonical- en CI-checks bewijzen niet dat Google een pagina daadwerkelijk indexeerde.
5. Bewaar uitsluitend redactionele aggregaten; geen Google-credentials, eigendomstokens, privéquery-exports met persoonsgegevens of individuele klantdata in de publieke GitHub-repo. **Geen betaald GSC Wizard-abonnement aanschaffen.**

**Huidige stand:** property eigendom, sitemapontvangst, GSC-impressies/klikken/queries en organische leadattributie zijn **niet door deze PR geverifieerd**. De code koppelt de database niet aan een Google-account.

## Verifieerbare redactionele broncontrole — 15 november 2026

Tijdens deze uitvoeringsfase zijn de feitelijke bepalingen over zonnepanelen en 2027 rechtstreeks opnieuw vergeleken met [Rijksoverheid — salderingsregeling](https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling) en [ACM ConsuWijzer — salderen en terugleveren](https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen).

- **Wettelijke regeling:** stopt op **1 januari 2027**. Eigen zonnestroom direct gebruiken blijft onderscheiden van netafname en teruglevering.
- **Terugleververgoeding:** tot 2030 wettelijk minimaal 50% van het *kale* leveringstarief; zonder belastingen. Losse terugleverkosten kunnen blijven bestaan.
- **Bijzondere contractafspraken:** volgens ACM kan een doorlopend contract na 2026 nog specifieke rechten op verrekening bevatten; dat verandert de wettelijke einddatum niet. Vanaf 2027 gelden wel andere belastingregels. Daarom zijn algemene besparingsclaims zonder contractgegevens onjuist.
- De bestaande bronpagina's `kennis/zonnepanelen/salderen-2027/index.html` en `kennis/energiecontract/met-zonnepanelen/index.html` (auteursbron `docs/seo-cluster-v08.json`) maken het wettelijke en mogelijke contractuele onderscheid reeds; er is in deze PR **geen ongeverifieerde tekstwijziging** of nieuwe financiële claim gepubliceerd.
- Een bibliografische/inhoudelijke vergelijking bewijst nog geen Google-indexatie, CTR, impressies of conversie. Die laatste metingen blijven open totdat een gratis Search Console-property daadwerkelijk wordt gecontroleerd.

## Overige onafhankelijke acceptatiepunten

- **Rapportmail:** bestaande `report_email`-route en aparte `report_mail_enabled` fail-closed schakelaar blijven intact. Een geautoriseerde self-addressed test moet inboxontvangst aantonen **zonder** nieuwe `leads`-, `delivery_outbox`- of analyticsregistratie; de rapportbody bevat alleen een vrijwillige NIVO-advies-CTA.
- **Privacy/legal:** werkelijke verantwoordelijke rechtspersoon, privacycontact, doorgifterollen en verwerkersafspraken met NIVO/Hostinger, retention/backups, toegangsbeheer en SPF/DKIM/DMARC nog door de eigenaar/juridische reviewer aftekenen. Publiceer geen definitieve exploitant- of AVG-claims zonder verificatie.
- **Herstelbaarheid:** een geslaagde cryptografische test, een Hostinger hPanel-backup of een groen CI-resultaat is **geen productie-restore**. Gebruik [BACKUP-RECOVERY-RUNBOOK.md](BACKUP-RECOVERY-RUNBOOK.md) nadat die aparte PR is beoordeeld en gemerged.
- **Go/No-go:** issues #14/#21–#26 blijven open zolang deze externe productie- en accountbewijzen ontbreken.

### CI-bewijs bij deze PR

`php tests/operations_test.php` simuleert twee verschillende geslaagde uitvoeringen en een mislukte NIVO-outbox met verzonnen gegevens. `php tests/mysql_backend_test.php` controleert dezelfde cohortlogica op een volledig geïsoleerde CI-MySQL. PHP syntax-/backend-, HTML-/JS- en browserchecks blijven van toepassing. **Geen** live lead, mail, config of cron wordt gewijzigd door de tests.
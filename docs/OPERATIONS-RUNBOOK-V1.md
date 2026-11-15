# WattGoedkoper — operationeel runbook v1

**Status 15 november 2026:** concept voor eigenaarreview, onderdeel van P0 issue #25. Dit runbook is een implementatiebijlage van een **gestapelde PR op #30**. Het is nog geen productie- of restorebewijs.

> **Eigenaarbesluit 15 november 2026:** NIVO-adviesmails moeten naar `portal@nivogroepholland.nl`. De eigenaar heeft de merges van #28–#32 goedgekeurd. Dit autoriseert geen ongeteste SMTP-route: de toepasselijke afleveradapter, privésleutels en een echte synthetische NIVO-ontvangsttest moeten nog worden ingericht. Een geaccepteerd SMTP-bericht is niet hetzelfde als een bewezen gelezen of in de mailbox afgeleverd bericht. Rapportmails aan consumenten blijven gescheiden.\n\n## Productie activeringsgate

1. Controleer dat alle goedgekeurde PR's (#28, #30 en deze operations-PR; plus #29 voor dashboard) daadwerkelijk in `main` zitten en dat Hostinger de bijbehorende live build draait. **Geen zelfstandige merge**.
2. Laat de bestaande MySQL-database volledig intact. Geen `setup-mysql.php`, reset, massa-import, encryptiesleutelrotatie of databasecreatie buiten de bestaande `wg_db`-schema-compatibiliteitscontrole. Maak en **test** eerst een veilige back-up + herstel op afgeschermde omgeving met hetzelfde private sleutelbestand.
3. Verifieer de werkelijke Hostinger CLI-PHP-versie, `pdo_mysql`/`pdo_sqlite`, `openssl`, eventueel `curl` en rechten tot de bestaande buiten-webroot private map. `WG_PRIVATE_DIR` moet exact naar die map wijzen. Test vanaf Hostinger als geautoriseerde beheerder.
4. Bevestig één bestaande onderhoudsregel óf vervang die op gecontroleerde wijze. **Nooit** gelijktijdig `scripts/maintenance.php`, `scripts/deliver-leads.php` én `scripts/operations.php` plannen. De canonieke taak is voortaan uitsluitend `scripts/operations.php`.
5. Zet pas na een echte eerste geslaagde tick `operations_monitor_enabled => true` in de bestaande private configuratie. De optionele ouderdomsdrempel is `operations_max_age_seconds => 1800` (30 minuten, begrensd tot 5 min–24 uur). Hiermee wordt een gemiste cron als probleem aangemerkt; zonder monitor-opt-in is de staat wel zichtbaar, maar komt er geen actievere waarschuwing.
6. Activeer `nivo_delivery_enabled` **niet** zonder een eigen veiligheids-/privacyreview, een exact allowlisted HTTPS-ontvanger en eigenaar-go. Zie `NIVO-DELIVERY-CONTRACT-V1.md`. Een cronrun met uitgeschakelde ontvanger verandert geen delivery-queue-items.
7. Rapportmail blijft apart uit totdat `info@wattgoedkoper.nl`, SMTP, ontvanger en transactionele bezorging end-to-end zijn bewezen. Rapportmail verleent geen marketingtoestemming.

### Eén Hostinger-cron — concept

Een enkele geplande taak met interval van **5 minuten**, na expliciete productiecontrole:

```sh
WG_PRIVATE_DIR=/ABSOLUTE/PRIVATE/MAP /ABSOLUTE/PHP-CLI /ABSOLUTE/WEBSITE/scripts/operations.php
```

*Alle paden hierboven zijn placeholders; bepaal ze via de werkelijke Hostinger-installatie. Niet letterlijk overnemen.* Geen `php -S`, geen publieke URL of HTTP-token gebruiken. Het bestand is CLI-only. De runner beschermt tegen overlap met `flock` in de private map. Exit 0 is afgerond, exit 1 is fout, exit 75 betekent dat er nog een uitvoering loopt. Onderzoek frequente 75-meldingen in plaats van extra cronregels toe te voegen.

### Bewijs van runtime

- Lees zonder PII via de reeds bestaande login in `/admin/` de vier tabs, na de bijbehorende PR-review.
- `GET /api/index.php?action=admin_operations` is **alleen na admin-auth** toegankelijk en toont status van cron, laatste succesvolle tick, ageSeconds, leveringsaantallen, optionele bronversheid, lokale sitemap/robots-aanwezigheid en actiecodes. Het toont bewust géén klantdata.
- Controleer in de echte Hostinger CLI een tick (tijdsdatum, exitcode, geen errors) en controleer daarna dat de UI `cron=fresh` meldt. Een ontbrekende tick is `unknown`; na ouderdomsdrempel `stale`; **green op GitHub is geen bewijs van Hostinger-cron**.
- De bronindicator leest alleen het bestaande `docs/seo-cluster-v08.json:checkedOn` indien dát bestand daadwerkelijk is mee uitgerold. Bij afwezigheid is status `unknown`, niet 'actueel'. Vanaf >45 dagen geldt `SOURCE_REVIEW_DUE`. Financiële, juridische, subsidie- en productclaims alleen na inhoudelijke menselijke review en PR publiceren.
- `sitemapOnDisk` en `robotsOnDisk` testen uitsluitend **bestandsaanwezigheid**; apart live HTTP, canonical, indexatie en Search Console controleren.
- Back-upstatus is bewust `not_verified` totdat daadwerkelijk Hostinger-backup én restore getest zijn. De software kan Hostinger-backupjobs niet uit de applicatie afleiden.
- Beperk meldingen tot relevante codes: `CRON_MISSING_OR_STALE`, `CRON_LAST_RUN_FAILED`, `NIVO_DELIVERY_FAILED`, `SOURCE_REVIEW_DUE`, `SEO_PUBLICATION_FILES_MISSING`. Er is **geen goedgekeurde externe alertontvanger**, dus de eerste levering is alleen een duidelijke dashboardstatus. Geen fictieve alertbevestiging.

## Storingen en herstel

| Signaal | Verificatie en eerste veilige actie |
|---|---|
| Cron unknown/stale | Controleer werkelijk Hostinger-crontab, CLI-runtime, private config, laatste exit en lock. Start desnoods één handmatige CLI-tick na controleren dat geen tweede draait |
| Cron exit 75 | Bestaande process lock bezet; controleer of er een gezonde lopende taak is, verwijder lock niet blind |
| NIVO pending/failed | Controleer transportopt-in, serviceaccount en goedgekeurde ontvanger. Gebruik beheerder-retry alleen op `failed`. Ontvangende partij moet `Idempotency-Key` respecteren |
| Database/crypto fout | Bevries wijzigingen, verifieer private sleutel/back-up, inspecteer codes zonder klantpayload, herstart niet herhaaldelijk met nieuwe sleutels |
| Mailfout | Zet transactionele rapportmail terug uit; adviesaanvragen blijven lokaal bewaard. Geen automatische marketing/verzendcampagnes |
| Ontbrekende sitemap | Controleer release-artifact, sitemap/robots HTTP en SEO-generator; geen claims over indexatie zonder Search Console |
| Back-up niet bewezen | Controleer Hostinger-backup plus offline/staging restore met encryptiesleutel. Geen productiegegevens in issue of CI uploaden |
| Vervuilde wettelijk/financiële bron | Geen automatische publicatie; maak redactioneel issue, broncheck, menselijke accordering en PR |

Rollback: stop de nieuwe cron vóór code-rollback; schakel eventueel NIVO-transport en rapportmail via private toggles uit; zet alleen de laatst goedgekeurde applicatiecode terug. **Geen rollback door verwijderen van nieuwe outboxrecords of herstel van oudere DB-dump over actuele klantleads heen.** Stem schemawijzigingen en in-flight leveringen af vóór definitief herstel. Zorg dat de private encryptiesleutel ongewijzigd en veilig beschikbaar blijft.

## Testen vóór acceptatie #26

`tests/operations_test.php` test de CLI offline op fictieve gegevens: succesvolle run, retention, herhaalde uitvoering, lock-conflict, gemiste heartbeat, omschakeling monitor, bronversheid en mislukte deliveries zonder PII. `tests/mysql_backend_test.php` controleert ops-metadata op een geïsoleerde CI-MySQL-database. `tests/backend_test.py` verifieert dat uitsluitend ingelogde beheerders status kunnen opvragen. Volledig positief is pas na echte Hostinger-cron, externe alerting of andere overeengekomen opvolging, geteste backup/restore en NIVO-ACK.

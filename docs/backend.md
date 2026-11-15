# Backend & beheer

## Wat werkt

De consumentenscan rekent volledig in de browser. Daarvoor hoeft de bezoeker geen contactgegevens in te vullen en is de PHP-backend niet nodig. Een expliciete adviesaanvraag wordt pas bevestigd nadat PHP de gegevens duurzaam heeft opgeslagen. Nieuwe consented aanvragen worden tegelijk transactioneel in `delivery_outbox` geplaatst en door de bestaande Hostinger-cron automatisch via de **door eigenaar geautoriseerde SMTP-route** naar `portal@nivogroepholland.nl` gestuurd. De eigenaar heeft op 15 november een echte testaanvraag in het dashboard én enkele minuten later in de NIVO-inbox ontvangen. De zelfstandige consumentenrapportmail is een **ander, nog niet operationeel geverifieerd** pad. Er is geen directe NIVO Portal REST-/CRM-koppeling. Zie [de actuele productieoverdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).

Het dashboard bevat gemeten starts, voltooide scans, adviesinteresse, opgeslagen aanvragen, opt-in conversie, statusbeheer, CSV-export, definitieve verwijdering, operationele status-/partneraantallen, nieuwe aanvragen ouder dan 24 uur en optionele inbox. Het bevat geen fictieve voorbeeldleads.

## Hostingvereisten

- PHP 8.2 of nieuwer met `pdo_sqlite`, `openssl`, `session`, `json`, `filter`.
- HTTPS op de productie-origin.
- Een schrijfbare privémappenstructuur buiten de documentroot (`public_html`).
- Root `.htaccess` actief op Apache/LiteSpeed. Blokkeer bij andere servers de mappen `lib`, `scripts`, `tests`, `docs`, dotfiles en configuratie/back-upbestanden ook in de serverconfiguratie.

De code heeft geen Composer- of JavaScript-pakketten nodig voor de backend. De nieuwe WattGoedkoper Hostinger-website gebruikt **MySQL** via PDO. SQLite blijft ondersteund voor bestaande installaties en tests. Gebruikersrollen en MFA zijn aanvullende veiligheidsstappen zodra meerdere beheerders toegang krijgen.

## Bestaande Hostinger-productie — geen nieuwe installatie

**Installatie uitgevoerd en in gebruik.** Hostinger draait PHP 8.2.35 CLI op `/usr/bin/php`, de reeds ingerichte MySQL-database, private `../wattgoedkoper-private/config.php` en een beveiligd `/admin/`-dashboard. NIVO-advies en de bestaande cron werken functioneel; zie [de overdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).

**NOOIT** de historische `scripts/setup-mysql.sh` of `scripts/setup.php` op deze productieomgeving herhalen. Die scripts zijn uitsluitend voor eerste, lege installaties. Geen encryptiesleutels/DB-credentials wijzigen, geen klantdata exporteren of oudere dump terugzetten over actuele leads. Raadpleeg het [archief van de originele installatie](HOSTINGER-MYSQL.md) uitsluitend voor achtergrond.

`GET /api/index.php?action=health` moet `configured:true` en `databaseReady:true` tonen. Het dashboard vereist een geldige beheersessie; `lib/`, `docs/`, `scripts/`, `tests/` en dotfiles zijn publiek geblokkeerd. GitHub Actions controleert publieke codepariteit en HTTP-beveiliging, niet back-ups/cron-heartbeats.

## Wachtwoord wijzigen

```bash
php scripts/reset-password.php
```

Voer het nieuwe wachtwoord via standaardinvoer in. Bestaande beheersessies worden beëindigd. Het script verandert de encryptiesleutel niet. Bewaar die encryptiesleutel samen met de databaseback-up; zonder sleutel zijn opgeslagen aanvragen niet leesbaar.

## Persoonsgegevens en bewaartermijnen

| Gegevens | Opslag | Termijn |
| --- | --- | --- |
| Naam, e-mail, telefoon, postcode, toelichting, meegestuurde scan en toestemmingsbewijs | AES-256-GCM versleutelde payload in aparte MySQL (SQLite voor bestaande installaties) | Standaard 90 dagen |
| Aanvraagcode, status, ontvangende organisatie, aanmaakdatum en HMAC-deduplicatie | Private MySQL of oudere SQLite-installatie; nodig voor triage/idempotentie | Met de aanvraag, 90 dagen |
| Anti-misbruikvensters | HMAC van IP/scope/tijdvenster; geen raw IP, user-agent of fingerprint | Maximaal circa 48 uur vóór dagelijkse opruiming |
| Geaggregeerde events per dag | Alleen datum, eventnaam, aantal; uitsluitend na toestemming | 400 dagen |
| PHP-sessie | Private sessiemap; CSRF, loginstatus, eventlimieten | Server-GC na 8 uur; beheerlogin maximaal 8 uur en 30 minuten inactief |

Hosting-accesslogs en externe geëxporteerde CSV-bestanden vallen buiten deze applicatie-opslag. Stel daarvoor apart een passende toegangs- en bewaarbeperking in. CSV-bestanden bevatten persoonsgegevens en moeten na hun doel worden verwijderd.

Dagelijkse opruiming loopt opportunistisch bij API-verzoeken. Voor gegarandeerd onderhoud zonder bezoek, stel een dagelijkse cron in:

```bash
php /absoluut/pad/naar/public_html/scripts/maintenance.php
```

De onderhoudstaak verwijdert oude aanvragen en oude counters/rate-limitvensters. Alleen op SQLite wordt daarna de WAL gecheckpoint; op productie-MySQL wordt geen SQLite-PRAGMA uitgevoerd. Het script print uitsluitend het aantal verwijderde aanvragen en retourneert een foutcode bij ongeldige configuratie of een databasefout. Het maakt geen externe verbindingen. De onderhouds-CLI wordt op zowel SQLite als een geïsoleerde MySQL-testdatabase in CI gecontroleerd; een groene CI-test bewijst nog niet dat de Hostinger-cron is ingesteld of uitgevoerd.

**Back-ups:** kopieer de MySQL-database én de private configuratie inclusief encryptiesleutel via een beveiligde backupstrategie buiten Git. Voor MySQL maak je een consistente database-export; voor bestaande SQLite-installaties verdient `.backup` of een snapshot na checkpoint de voorkeur boven losse kopieën van een actieve database. De bewaartermijn geldt ook voor back-ups. Een direct in het dashboard verwijderde aanvraag verdwijnt niet automatisch uit oudere back-ups; leg de backuprotatie en herstelprocedure vast.

## Toestemming & analytics

- `consent:true` en `consentVersion:'2026-11-v2'` zijn verplicht voor de adviesaanvraag.
- Nieuwe adviesaanvragen gaan uitsluitend naar `nivo`; expliciete waarden `tbt` en `either` worden server-side geweigerd. Historische records in de database blijven ongewijzigd.
- De toestemmingsversie, de volledige tekst, de geselecteerde partner en een serverdatum worden bij de aanvraag opgeslagen.
- `analyticsConsent:true` is een afzonderlijke vrijwillige toestemming. De backend telt alleen dan een intern `lead_accepted`-event.
- Het dashboard gebruikt `lead_accepted / scan_complete` voor conversie en toont het totale aantal aanvragen apart. Het zijn gebeurtenissen, geen unieke personen. Meerdere scans, herhaalverzoeken en ontbrekende metingen beïnvloeden dit getal. De geaggregeerde dataset ondersteunt geen betrouwbare unieke-bezoekerstelling of herleidbare klantreis.
- De API accepteert geen marketinglijsttoestemming en deelt geen gegevens automatisch met derden.

## API-contract

Basis: `/api/index.php?action=...`. JSON-responsen gebruiken `{ok:true,...}` of `{ok:false,error:{code,message}}`. Alle muterende acties verwachten `POST`, `Content-Type: application/json`, een exact passende `Origin` en de header `X-CSRF-Token` uit de functionele sessie. Maximaal 16 KiB per body.

| Actie | Methode | Resultaat |
| --- | --- | --- |
| `health` | GET | `ok`, `configured`, applicatieversie; geen credentials |
| `session` | GET | `csrf`, `createdAt`, `configured`, `authenticated` |
| `leads` | POST | `201` plus aanvraagcode na opslag; identieke retry `200`; gewijzigde payload onder dezelfde key `409` |
| `events` | POST | Alleen `page_view`, `scan_start`, `scan_complete`, `advice_open`, met `consent:true` |
| `admin_login` | POST | Controleert hash en roteert sessie/CSRF |
| `admin_logout` | POST | Beëindigt beheerlogin |
| `admin_stats` | GET | Laatste 30 dagen aggregaten, statusaantallen en retentie |
| `admin_leads` | GET | Maximaal 50 aanvragen per pagina; `status` en `offset` |
| `admin_status` | POST | `{id,status}` met status `new/contacted/qualified/closed` |
| `admin_delete` | POST | `{id}`; definitieve verwijdering |
| `admin_export` | POST | CSV van maximaal 5.000 aanvragen, spreadsheetformules geneutraliseerd |
| `admin_mail_status` | GET | Geeft uitsluitend beschikbaarheid/configuratiestatus, nooit wachtwoorden |
| `admin_mail_list` | GET | Laatste 40 inboxberichten, IMAP read-only |
| `admin_mail_read` | GET | Platte tekst van inbox-bericht op UID |
| `admin_mail_send` | POST | Expliciet bevestigd handmatig bericht via SMTP |

Alle `admin_`-acties behalve login vereisen een actieve beheersessie. Exports en persoonlijke API-responsen gebruiken `no-store`. De frontend plaatst onbetrouwbare velden met DOM-`textContent`, niet als HTML.

### Leadpayload

```json
{
  "idempotencyKey": "willekeurige-client-key-van-minimaal-16-tekens",
  "name": "Naam",
  "email": "consument@example.test",
  "phone": "",
  "postcode": "2311AB",
  "partner": "nivo",
  "interests": ["battery"],
  "consent": true,
  "consentVersion": "2026-11-v2",
  "analyticsConsent": false,
  "website": "",
  "inputs": {"electricityUse": 3500, "hasSolar": true},
  "summary": {"modelVersion": "1.0", "year": 2027, "annualSavingsLow": 100, "annualSavingsHigh": 250},
  "note": "Optionele toelichting"
}
```

E-mail of telefoon is verplicht; postcode is optioneel. `website` is een lege honeypot. De sessie moet minimaal twee seconden bestaan. De input-allowlist volgt `docs/frontend-contract.md`; onbekende velden worden niet opgeslagen. De meegestuurde uitkomst blijft nadrukkelijk **een ongeverifieerde klantindicatie**. De server gebruikt deze niet voor toezeggingen, prijzen of partnerselectie.

## Testen

```bash
python tests/backend_test.py --php /pad/naar/php
```

De integratietest start een echte lokale PHP-server en maakt een tijdelijke private database met uitsluitend testgegevens. Tests bestrijken ongeconfigureerd gedrag, afgeschermde interne mappen, sessies, CSRF, origin, bodylimieten, consent, honeypot, idempotentie, versleuteling, beheerlogin, status, CSV-injectie, bewaartermijn, verwijdering en ratelimieten. De tijdelijke configuratie wordt na afloop verwijderd.


## v0.5 — rapportmail en NIVO-only API

Nieuwe leads zijn server-side NIVO-only en gebruiken toestemming `2026-11-v2`. Een oude cliënt die `partner:'tbt'` of `partner:'either'` instuurt krijgt een 422-validatiefout; het veld mag ook ontbreken en wordt dan `nivo`. Oude records houden hun oorspronkelijke partner, payload en consentversie.

`POST /api/index.php?action=report_email` is een **afzonderlijk transactioneel** pad. De actie accepteert `{email,idempotencyKey,website:'',report:{modelVersion,year,homeType,selectedIds,savingsLow,savingsHigh,investmentLow,investmentHigh,baselineCost,plannedCost,electricityUse,gasUse,budgetOverBy}}`. Een valide CSRF, Origin, JSON, sessieleeftijd, geadresseerde- en getalvalidatie zijn verplicht. De server construeert zelf onderwerp, tekst en HTML; geen vrije mailvelden, geen kopieën of marketingopt-ins. Op ieder verzoek worden geen `leads`, CRM-records of stat-events aangemaakt. Replays/herhaalde verzendpogingen worden op basis van alleen tijdelijke HMAC-buckets geblokkeerd of bevestigd.

**Fail-closed:** de configuratie `'report_mail_enabled'=>true` moet expliciet *in de private configuratie buiten documentroot* bestaan, en het bestaande mailaccount moet correct ingesteld zijn. Anders: HTTP 503 `REPORT_MAIL_DISABLED`. De `session`-response bevat uitsluitend het boolean veld `reportMailEnabled`. SMTP-acceptatie is geen garantie op inboxbezorging. De client rekent lokaal; de verzonden snapshot is een ongeverifieerde indicatie, niet een serverberekende of getekende offerte. Zie `docs/RELEASE-V05.md`.


## Productie-implementatie: NIVO, cron, consent en mailbox

- Live NIVO-transportroute: `nivo_delivery_enabled=true`, `nivo_delivery_channel=smtp`, exacte bestemming `portal@nivogroepholland.nl` (door eigenaar aangetoond met private `--check`; **dit zijn geen waarden om bij deploy te overschrijven**). SMTP-afzender `info@wattgoedkoper.nl` in private `mail-config.php`.
- `POST leads`: gescheiden `2026-11-v2` consent, AES-256-GCM-lead + `delivery_outbox`, één idempotent item per nieuwe lead. Historische partner/consent onveranderd. `admin_stats` en `admin_leads` tonen technische aflevertellingen.
- Eén Hostinger-runner `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php` elke vijf minuten, via hPanel cron. Hij verwerkt de outbox en schrijft private `ops_last_success_at`. Eén cronoutput en echte post-cron inboxlevering zijn aangetoond; de herhaalde heartbeat/monitor-flag moet nog operationeel worden afgetekend.
- `smtp_accepted` bevestigt alleen SMTP-serveracceptatie na DATA; `acknowledged` is gereserveerd voor een echte toekomstige HTTPS API-receipt. Voor één testlead `WG-5510214770E3` heeft de eigenaar **apart** de inboxontvangst bevestigd. Bij `SMTP_UNCERTAIN` na timeout/crash géén automatische duplicatie, pas retry na expliciete mailboxcontrole.
- `admin_delivery_retry` vereist beheerlogin, CSRF/Origin en bij `SMTP_UNCERTAIN` `confirmMailboxChecked:true`; deze API verstuurt zelf nooit direct een mail.
- `report_email` voor het consumentrapport is een **apart** pad achter `report_mail_enabled`. De private werkelijke status en E2E-ontvangst moeten nog worden geverifieerd; deze functie creëert geen NIVO-lead of consent.
- `admin_operations` levert alleen beveiligde statusinformatie, cron age, SEO-bronversheid en eerlijke `backup:not_verified` totdat echt herstelbewijs bestaat. Een groene GitHub CI-test mag niet als restorebewijs worden gepresenteerd.

Actuele contracten en handelingen: [NIVO-delivery](NIVO-DELIVERY-CONTRACT-V1.md), [NIVO SMTP-runbook](NIVO-SMTP-PRODUCTION-RUNBOOK.md), [operations](OPERATIONS-RUNBOOK-V1.md), [nieuwe roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).

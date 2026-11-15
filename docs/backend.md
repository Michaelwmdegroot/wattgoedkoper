# Backend & beheer

## Wat werkt

De consumentenscan rekent volledig in de browser. Daarvoor hoeft de bezoeker geen contactgegevens in te vullen en is de PHP-backend niet nodig. Een expliciete adviesaanvraag wordt pas bevestigd nadat PHP de gegevens duurzaam heeft opgeslagen. De aanvraag komt in `/admin/` terecht. **Er worden geen automatische e-mails verstuurd.** De optionele mailwerkplek in 0.4 leest de juiste Hostinger-mailbox en verstuurt uitsluitend na handmatige bevestiging; zie [operations](OPERATIONS-V04.md). Er is geen externe CRM-koppeling. De geselecteerde adviespartner is een routeringskeuze voor menselijke opvolging in dit dashboard.

Het dashboard bevat gemeten starts, voltooide scans, adviesinteresse, opgeslagen aanvragen, opt-in conversie, statusbeheer, CSV-export, definitieve verwijdering, operationele status-/partneraantallen, nieuwe aanvragen ouder dan 24 uur en optionele inbox. Het bevat geen fictieve voorbeeldleads.

## Hostingvereisten

- PHP 8.2 of nieuwer met `pdo_sqlite`, `openssl`, `session`, `json`, `filter`.
- HTTPS op de productie-origin.
- Een schrijfbare privémappenstructuur buiten de documentroot (`public_html`).
- Root `.htaccess` actief op Apache/LiteSpeed. Blokkeer bij andere servers de mappen `lib`, `scripts`, `tests`, `docs`, dotfiles en configuratie/back-upbestanden ook in de serverconfiguratie.

De code heeft geen Composer- of JavaScript-pakketten nodig voor de backend. De nieuwe WattGoedkoper Hostinger-website gebruikt **MySQL** via PDO. SQLite blijft ondersteund voor bestaande installaties en tests. Gebruikersrollen en MFA zijn aanvullende veiligheidsstappen zodra meerdere beheerders toegang krijgen.

## Eerste serverinstallatie

Voor de nieuwe, aan wattgoedkoper.nl gekoppelde Hostinger MySQL-database is het juiste commando:

```bash
bash scripts/setup-mysql.sh
```

Zie [de volledige MySQL-instructies](HOSTINGER-MYSQL.md). Het oude `scripts/setup.php` is uitsluitend voor SQLite-installaties; draai deze twee scripts niet allebei.

Het script vraagt het wachtwoord via standaardinvoer. Gebruik een uniek wachtwoord van minstens 14 tekens. Zet het wachtwoord nooit in de commandoregel, GitHub, een issue of chat. In een terminal wordt de invoer verborgen. Er zijn geen standaardinloggegevens.

De veilige Bash-wrapper vraagt de database- en gebruikersnaam en de twee wachtwoorden via een interactieve SSH-terminal. Hij gebruikt `read -s`, want Hostinger schakelt PHP `system()` standaard uit; de wachtwoorden gaan uitsluitend via een pipe naar PHP. Je hoeft `system()` niet aan te zetten. Standaard maakt het script `../wattgoedkoper-private/` buiten de documentroot. De configuratie bevat alleen de wachtwoordhash, twee willekeurige serversleutels, de canonieke origin en de bewaartermijn. PHP-sessies en de geheime configuratie staan in diezelfde private map; bij MySQL worden de applicatietabellen in de aparte Hostinger-database aangemaakt. De setup weigert bestaande configuratie te overschrijven of private bestanden onder de documentroot op te slaan.

Een afwijkend pad kan via `--private-dir=/absoluut/privepad`. Stel dan dezelfde `WG_PRIVATE_DIR`-omgevingsvariabele in voor PHP-webverzoeken, de CLI en het onderhoud. Gebruik bij Hostinger bij voorkeur het standaardpad; dan is geen omgevingsvariabele nodig.

Verifieer na inrichting:

1. `/api/index.php?action=health` geeft `configured:true` én `databaseReady:true`.
2. `/admin/` accepteert het ingestelde account.
3. Dien één duidelijk herkenbare eigen testaanvraag in en controleer de ontvangst in het dashboard; verwijder die vervolgens.
4. Verifieer dat `/.git/config`, `/lib/bootstrap.php`, `/scripts/setup.php`, `/docs/` en backup/configbestanden niet publiek bereikbaar zijn.
5. Controleer op HTTPS dat de sessiecookie `Secure`, `HttpOnly` en `SameSite=Strict` heeft.

Zonder geldige configuratie retourneert de health-check `configured:false`. De scan blijft beschikbaar, maar de lead-API geeft `503 SETUP_REQUIRED` en het dashboard blijft gesloten. Een ontbrekende backend mag de frontend nooit als een geslaagde aanvraag presenteren.

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


## Stand van NIVO-leadoverdracht en monitoring — 15 november 2026

Nieuwe, expliciet toestemmende NIVO-adviesaanvragen slaan hun versleutelde payload én één outbox-item atomair op. De afzonderlijke `scripts/operations.php`-runner kan na een geautoriseerde croninstelling retentie, veilige wachtrijverwerking en heartbeat uitvoeren. `admin_stats` bevat echte `delivery`-aantallen, `admin_leads` heeft een afzonderlijk bezorgrecord; `admin_delivery_retry` is alleen met beheerlogin, Origin en CSRF toegankelijk. Bij een mogelijk eerder aanvaarde SMTP-mail (`SMTP_UNCERTAIN`) is de expliciete boolean `confirmMailboxChecked:true` vereist; anders wordt de retry geweigerd. De API verstuurt bij dit beheercommando nooit direct.

NIVO-e-mailtransport heeft een **exact vaste bestemming `portal@nivogroepholland.nl`**, een private Hostinger `info@wattgoedkoper.nl` SMTP-config en een afzonderlijk, standaard uitgeschakeld `nivo_delivery_enabled`-flag. `smtp_accepted` is een terminale status na acceptatie door de mailserver, **zonder bewijs van inboxontvangst**; `acknowledged` betekent een geldige externe HTTP-ontvangstreferentie. Historische partnerrecords en mail-only rapporten worden niet naar NIVO doorgestuurd. De volledige private activering/test staat in `docs/NIVO-DELIVERY-CONTRACT-V1.md`.

`GET admin_operations` vereist een beheerlogin en geeft cronstatus, afleveringstelling, bronversheid, SEO-bestandsstatus en expliciet niet-bewezen back-ups; geen persoonsgegevens. De externe, publieke API-health toont een SHA-256 `releaseFingerprint` over alleen gedeployde codebestanden, geen private configuratie. GitHub Actions vergelijkt vanaf PR #34 via read-only GET de frontend- en backendbroncode met de publieke Hostinger-deploy, maar bewijst geen geteste cron, SMTP-inboxontvangst of databaseherstel.

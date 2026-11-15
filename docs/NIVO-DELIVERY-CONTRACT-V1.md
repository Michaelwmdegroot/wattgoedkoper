# WattGoedkoper — actueel NIVO-aflevercontract (SMTP live, Portal API voorbereid)

**Actualisatie:** 15 november 2026. **Actieve productie:** SMTP via `info@wattgoedkoper.nl` naar uitsluitend `portal@nivogroepholland.nl`. De eigenaar heeft zowel de synthetische adapterproef als een reguliere testadviesaanvraag end-to-end in de daadwerkelijke NIVO-inbox bevestigd. **Niet actief:** toekomstige NIVO Portal HTTPS/REST-API.  
**Overdracht:** [HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md) · **Ops:** [OPERATIONS-RUNBOOK-V1.md](OPERATIONS-RUNBOOK-V1.md). De vroegere tekst “nog niet geactiveerd” is vervallen; oorspronkelijke besluiten zijn in Gitgeschiedenis terug te vinden.

## 1. Vrijwillige adviesconsent, alleen nieuwe aanvragen

`POST /api/index.php?action=leads` accepteert alleen een vrijwillige **NIVO**-adviesaanvraag met geldige expliciete `2026-11-v2` consent, correct versie- en partnerbewijs, minimale contactvelden en server-side validatie. Zonder vereiste consent is er **geen** uitgaande lead. Persoonlijke gegevens, relevante energie-informatie en bewijs van toestemming staan versleuteld in de bestaande MySQL-leadtabel; precies één technische `delivery_outbox`-regel wordt transactioneel aangemaakt. Replays van dezelfde aanvraag maken geen dubbele outbox.

Historische partner-, status- en consentrecords worden **niet** bij een codewijziging herverstuurd of hernoemd. `report_email` en opt-in statistieken staan volledig los van deze route.

## 2. Huidig SMTP-kanaal

- Exacte ontvangende mailbox: **`portal@nivogroepholland.nl`**. Geen extra partner, CC/BCC of door consument te bepalen transport-ontvanger.
- Uitgaand account: `info@wattgoedkoper.nl`, veilige private `mail-config.php` buiten webroot en bestaande Hostinger SMTP over TLS.
- De eigenaar zette in de private `config.php` `nivo_delivery_enabled=true`, `nivo_delivery_channel='smtp'`, `nivo_delivery_recipient='portal@nivogroepholland.nl'` en bevestigde dit met `php -l` en `php scripts/nivo-smtp-pilot.php --check`. **Dit is reeds actief: geen setup opnieuw draaien en geen secrets in Git.**
- Preflight: `php scripts/nivo-smtp-pilot.php --check` toont alleen geaggregeerde delivery-aantallen. `--send-test` produceert één expliciet als fictief gemarkeerd bericht **zonder een productielead of outbox aan te maken**. Beide zijn al succesvol door de eigenaar uitgevoerd.
- Eén Hostinger-cron `*/5 * * * *` start `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php`. Een geslaagde hPanel cronuitvoer en een echte reguliere testadviesaanvraag → NIVO-inbox zijn aangetoond.

**Functioneel E2E-bewijs:** testaanvraag `WG-5510214770E3` stond rond 19:02 in WattGoedkoper-dashboard en werd rond 19:05 als automatische adviesmail met dezelfde code in de NIVO Portal-inbox getoond. De eigenaar deelde de beelden privé; nooit met contactgegevens of mailbody aan GitHub toevoegen. De precieze per-lead `smtp_accepted` status is nog niet apart als dashboardbewijs vastgelegd.

## 3. Transportstatussen en terugval

| Status | Betekenis | Wat níet te claimen |
|---|---|---|
| `pending` | In de lokale outbox, nog niet aangeboden | Geen afgeleverd bericht |
| `processing` | Worker heeft item met lease geclaimd | Geen gegarandeerde verzending |
| `smtp_accepted` | SMTP-relay heeft bericht na DATA met 250 geaccepteerd; terminale staat | **Geen** formeel bewijs van inboxaflevering en geen API-ACK |
| `acknowledged` | Alleen HTTPS-ontvanger heeft echte, geldig geverifieerde `receiptId` geretourneerd | Niet als SMTP-status gebruiken |
| `failed` | Terminale fout, consent-/provider-rejectie of `SMTP_UNCERTAIN` | Niet verwijderen of blind herhalen |

Een verbroken SMTP-verbinding vóór de DATA-fase kan veilig met begrensde backoff opnieuw worden geprobeerd. Een onduidelijke uitkomst (mogelijk reeds aanvaardde DATA, vastgelopen PHP-proces of verlopen SMTP-processing-lease) gaat naar `failed`/`SMTP_UNCERTAIN`. **Niet automatisch nogmaals aanbieden:** beheerder controleert de NIVO-mailbox op de unieke `WG-`-code en kan uitsluitend daarna via CSRF-beveiligde admin-retry opnieuw inplannen. Een eenmaal `smtp_accepted` of `acknowledged` item kan niet opnieuw worden verzonden via de standaard retry.

`admin_stats` toont de statusaantallen, `admin_leads` toont per-aanvraag transportstatus, laatste veilige foutcode en eventuele HTTPS-referentie. Geen klantpayload, e-mailadres of secrets in technische foutmeldingen. Privacyretentie en handmatige verwijdering cascaderen naar de outbox.

## 4. Toekomstige NIVO Portal HTTPS API (NIET actief)

De e-mailinbox **NIVO Portal** is niet hetzelfde als een draaiende REST API van de toekomstige NIVO Portal. De HTTPS-adapter in `lib/delivery.php` is voorbereid op een afzonderlijk eigenaar-/NIVO-goedgekeurd endpoint, exacte HTTPS-hostallowlist, geheim server-token, `requestId` als idempotency-key en een valide ontvangstantwoord. Conceptueel:

```json
{
  "schema": "wattgoedkoper.nivo.lead.v1",
  "requestId": "WG-A1B2C3D4E5F6",
  "contact": {"name": "Fictieve Consument", "email": "example@example.invalid"},
  "interests": ["battery"],
  "plan": {"selectedIds": ["battery"], "year": 2027},
  "consent": {"version": "2026-11-v2", "acceptedAt": "2026-11-15T10:00:00Z"}
}
```

Het servercontract vereist valide TLS, authorisatie, exact eenmaal verwerken van hetzelfde `requestId`, `acknowledged:true` + syntactisch correcte `receiptId`, veilige timeout/retry, dataminimalisatie en privacyafspraken. **Geen echte Portal-API-config invullen, geen HTTP-endpoint gokken en SMTP + HTTPS niet beide tegelijk voor één lead activeren.**

## 5. Bewijs, testen en nog open

- Synthetische tests zijn groen op baseline `f3c273dcffb03de05de13004fee410194ae659df`: `php tests/delivery_test.php`, `php tests/mysql_backend_test.php` op geïsoleerde CI MySQL, `python3 tests/backend_test.py --php php`, `php tests/operations_test.php`. Reële MySQL-productiedata zijn niet gebruikt voor GitHub CI.
- Echte NIVO-inboxontvangst is op één handmatige, één synthetische pilot én één reguliere testadviesaanvraag door eigenaar vastgesteld.
- Open: per-lead `smtp_accepted`/ops-heartbeat in dashboard en blijvende monitoring, privacy/securityverwerking bij NIVO, herstelde backup, alert-eigenaar en toekomstige API-ACK (alleen als API werkelijk bestaat).
- Go-live voor **aparte consumentenrapportmail** is geen onderdeel van deze route; zie `lib/report.php` en de actuele [roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).

Voor configuratieverificatie en incidenten zie het actuele [SMTP-productierunbook](NIVO-SMTP-PRODUCTION-RUNBOOK.md). Geen productietoggles terugzetten op “uit” omdat een historisch document dat nog adviseerde.

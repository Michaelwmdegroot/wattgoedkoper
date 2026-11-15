# WattGoedkoper — NIVO SMTP-productierunbook (actief kanaal)

**Status 15 november 2026: NIVO SMTP is ingericht, expliciet actief en voor één reguliere testadviesaanvraag end-to-end bewezen.** De oude instructie “eerst activeren na pilot” is niet meer de actuele situatie.  
**Afzender:** `info@wattgoedkoper.nl`; **enige NIVO-ontvanger:** `portal@nivogroepholland.nl`.  
**Leidende status:** [productieoverdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md) · [actuele bezorgcontracten](NIVO-DELIVERY-CONTRACT-V1.md).

## 1. Bewijs en huidige instelling

- Private `mail-config.php` buiten documentroot is door eigenaar via `bash scripts/setup-mail.sh` aangemaakt; handmatig testbericht is in NIVO-inbox ontvangen.
- Dezelfde SMTP-sender is getest met `php scripts/nivo-smtp-pilot.php --send-test`, fictieve code `WG-08DF36756B7E`; de mail met **[TEST - GEEN KLANT]** is in de daadwerkelijke NIVO-inbox aangekomen.
- De eigenaar controleerde `php -l ../wattgoedkoper-private/config.php` en `php scripts/nivo-smtp-pilot.php --check`; de gate meldde **`Productie NIVO-SMTP actief: ja (huidig kanaal: smtp)`**, exacte ontvanger en toen een lege wachtrij.
- Hostinger hPanel-cron is ingesteld op `*/5 * * * *` met `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php`; Hostinger heeft een geslaagde cronuitvoer met transport actief getoond.
- Een *gewone* vrijwillige testadviesaanvraag `WG-5510214770E3` ging van dashboard (rond 19:02) naar de echte NIVO-inbox (rond 19:05), met dezelfde code. De volledige keten is daarmee functioneel bewezen.
- Bestaande productiedata en private keys zijn bij deze tests niet gereset; de `--send-test` pilot zelf heeft geen productielead of outboxrecord gemaakt. Het laatste reguliere E2E-testrecord moet nog gericht worden opgeschoond na afleverstatuscontrole.

## 2. Actuele controle zonder e-mail of datamutatie

Vanuit geautoriseerde Hostinger SSH-terminal:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php scripts/nivo-smtp-pilot.php --check
```

De output toont exact gekozen ontvangende NIVO-mailbox, of SMTP private config **beschikbaar** is, of de productieve SMTP-toggle actief is en de **geaggregeerde** queue-tellingen `pending`, `processing`, `smtp_accepted`, `api_acknowledged` en `failed`. Deze opdracht verstuurt geen mail en wijzigt geen klantdata. Deel **geen** `config.php`-inhoud of privé-credentials.

In de bestaande `/admin/`-beheeromgeving: open de specifieke testcode `WG-5510214770E3`, controleer of de bezorgstatus **`smtp_accepted`** is en dat er geen foutcode is. Als status onbekend of onverwacht is: geen nieuwe testlead versturen, eerst read-only onderzoeken en de aanwezige inboxmail als bewijs behouden.

## 3. Hostinger-cron en monitor

De enige bedoelde job is al ingesteld:

```text
Interval: */5 * * * *
Command:  /usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php
```

**Geen tweede cron** met `maintenance.php` of `deliver-leads.php`. Voor zelfstandigheidsacceptatie moeten minimaal twee verschillende, automatische cron-heartbeatmomenten in `/admin/` → Tools & status zichtbaar zijn (`ops_last_success_at`, `ageSeconds`). Pas na die verificatie kan de eigenaar veilig `'operations_monitor_enabled'=>true` in de **bestaande** private config toevoegen, indien nog niet aanwezig; geen andere keys wijzigen.

Een onverwachte `failed`/stale status betekent eerst incidentonderzoek, niet automatisch klantdata of mail opnieuw versturen.

## 4. Verzendbewijs, dubbele pogingen en menselijke opvolging

- `smtp_accepted`: SMTP-server heeft DATA aanvaard. Het is een technische eindstatus; niet gelijk aan geautomatiseerde inbox- of API-ACK. Voor test `WG-5510214770E3` is daadwerkelijke inboxontvangst **apart** vastgesteld.
- `processing` die een lease verliest na mogelijk verzonden SMTP wordt `failed / SMTP_UNCERTAIN`. Controleer bij NIVO op de `WG-`-code vóór handmatige herpoging.
- Admin-retry is uitsluitend toegestaan voor mislukte items, met extra expliciete mailboxcontrole bij `SMTP_UNCERTAIN`. Een al `smtp_accepted` record wordt niet door de standaardworker opnieuw aangeboden.
- Geen customer report-mail, marketing of NIVO-CRM/API-actie impliceren. NIVO-medewerkers handelen ontvangen leads buiten WattGoedkoper af.

## 5. Alleen bij incident: verantwoord pauzeren of herstellen

Als een bewezen afleverincident een pauze vereist, laat de bevoegde eigenaar de bestaande private `config.php` buiten webroot controleren, beveiligd back-uppen en desnoods `nivo_delivery_enabled=false` zetten. Houd MySQL- en outboxdata intact. Er is geen automatische goedkeuring om bij een nieuwe agentstart de flag weer op false te zetten; momenteel werkt de route.

**NOOIT** `bash scripts/setup-mail.sh` herhalen wanneer `mail-config.php` bestaat; geen MySQL-installatiescripts herhalen en geen private keys of wachtwoorden in GitHub. Controleer eerst status, correcte cron, SMTP-inbox en foutcode. Voer alleen een nieuwe fictieve `--send-test` uit als dat een concreet incidentonderzoek vereist.

Een backup is pas bewezen na **MySQL + bijbehorende private sleutel/config + afgeschermde restore-oefening**. Dit is nog open. De aparte consumentenrapportmail blijft eveneens een afzonderlijke acceptatie-/privacybeslissing, zie [roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).

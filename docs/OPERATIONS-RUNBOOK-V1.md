# WattGoedkoper — operationeel runbook (actuele productie)

**Gecontroleerde situatie per 15 november 2026:** WattGoedkoper draait op Hostinger, met eigen PHP/MySQL-backend, SMTP naar **`portal@nivogroepholland.nl`**, één ingestelde vijfminuten-cron en een geslaagde echte automatische testadviesaanvraag. Dit document **vervangt** het eerdere “concept / cron nog niet geconfigureerd”-runbook; die geschiedenis is terug te vinden in Git.  
**Actuele overdracht:** [HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).  
**Finish Line:** issues [#21](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21), [#25](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/25), [#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26).

## 1. Live configuratie en geautoriseerde grenzen

| Eigenschap | Feitelijke productie |
|---|---|
| Website/CLI-directory | `/home/u886757484/domains/wattgoedkoper.nl/public_html` |
| Private map | `/home/u886757484/domains/wattgoedkoper.nl/wattgoedkoper-private` (niet in webroot) |
| PHP binary | `/usr/bin/php`; eigenaar controleerde CLI PHP 8.2.35 |
| Database | Bestaande private WattGoedkoper MySQL, beveiligde payloads en outbox |
| Hostinger hPanel-cron | `*/5 * * * *` |
| Croncommand | `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php` |
| NIVO-advieskanaal | SMTP, via `info@wattgoedkoper.nl` naar `portal@nivogroepholland.nl`; private toggle staat op actief |
| Rapportmail | Apart `report_email`-pad; echte status en aflevering nog apart controleren |

**NOOIT** `setup-mysql.sh` of `setup.php` opnieuw uitvoeren op de bestaande productieomgeving. Geen database-reset, sleutelrotatie, mailwachtwoorden in chat/repo of tweede cronjob. De werkende transportconfig niet blind aanpassen: de eigenaar heeft het pad en de ontvangende NIVO-inbox al bevestigd.

## 2. Bewijs dat automatische verwerking functioneert

De eigenaar heeft de geplande Hostinger-hPanel-cron en een succesvolle uitvoer gedeeld:

```text
WattGoedkoper onderhoud uitgevoerd. Retentie: 0, bezorgpogingen: 0, bevestigd: 0, fouten: 0, transport actief: ja.
```

Een afzonderlijk vanuit de gewone consumentenwebsite aangemaakte en in het beheer opgeslagen **technische testadviesaanvraag `WG-5510214770E3`** was rond 19:02 zichtbaar in het dashboard. Dezelfde code kwam rond 19:05 automatisch binnen in de echte NIVO Portal-mailbox. Hiermee is de **functionele end-to-end route** aangetoond. Het exacte tijdsverschil past bij de cronfrequentie maar is geen zelfstandige meting van iedere geplande heartbeat. De testcontactgegevens en beelden staan alleen in de privéchat, niet in de publieke repo.

GitHub-workflow [live-deployment-smoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43662312644) bevestigde 14/14 publieke frontend/backend-/securitychecks voor de codebaseline `f3c273d`. Dit bewijst **geen backup, mail-inbox of cronstatus** en vervangt bovenstaande eigenaarstest niet.

## 3. Veilige read-only operationele controle

Vanuit de bestaande Hostinger-terminal:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php scripts/nivo-smtp-pilot.php --check
```

De opdracht toont uitsluitend bestaande queue-aggregaten en configuratie-gates. Het `--send-test`-pad is al getest en hoeft niet periodiek opnieuw uit te gaan.

Controleer daarnaast met **bestaande beheerderslogin** in `/admin/` → **Overzicht / Tools & status** de werkelijke `admin_operations` status: `cron.lastSuccessAt`, `cron.ageSeconds`, `cron.status`, `delivery.pending/processing/smtp_accepted/failed`, SEO-bestanden en waarschuwingen. Voor een test van continuïteit zijn **minstens twee verschillende geslaagde cron-heartbeatmomenten** nodig; één screenshot van de laatste uitvoer is onvoldoende om 24/7 te claimen.

Na bevestigde meerdere ticks kan eigenaar op de server **alleen** de bestaande private `config.php` aanvullen met `'operations_monitor_enabled' => true` (en eventueel `'operations_max_age_seconds' => 1800`, passend bij de 5-minutentaak) als deze velden nog ontbreken. Verifieer PHP-syntax. Dit activeert de **dashboardwaarschuwingen** voor stale cron; er bestaat niet automatisch een extern per-email-alertkanaal.

## 4. Back-up en restore — nog P0, niet als voltooid markeren

1. Identificeer het juiste, bestaande Hostinger-siteaccount en productie-MySQL; leg eigenaar, tijdstip, bewaartermijn en back-uplocatie buiten de webroot vast.
2. Maak een **consistent MySQL-databasebackup met actuele leads/outbox**, plus afzonderlijk beschermd en versleuteld herstelmateriaal voor `wattgoedkoper-private/config.php` (inclusief dezelfde bestaande encryptiesleutel; wachtwoorden niet op publieke plaatsen delen). De private `mail-config.php` verdient aparte beveiligde hersteldocumentatie; roteer geen keys tijdens deze proef.
3. **Test restore op afgeschermde, niet-productieomgeving** met gescheiden toegang; verifieer schema, benodigde tabel/leadstatus en leesbaarheid van uitsluitend geïnstrueerde testrecords met dezelfde sleutel. Bewijs van werkelijke restauratie: datum, resultaat, herstelduur/handelingen, geen klantdata in repo.
4. Stop bij fouten en herstel niet ongevraagd een oude dump over actuele productieaanvragen. Leg incidenten en eigenaar-go eerst vast.

De API meldt `backup: not_verified` totdat werkelijk bewijs is verstrekt. Een geconfigureerde Hostinger-backup of groen GitHub CI is geen bewezen restore.

## 5. Afleverstoringen, alerts en veilige retry

| Signaal | Eerste actie |
|---|---|
| `pending` loopt op | Controleer recente heartbeat, private NIVO-toggle, Hostinger-cronoutput; start geen tweede worker |
| `processing` blijft hangen | Beoordeel lease/status; bij SMTP wordt verlopen lease in `failed/SMTP_UNCERTAIN` gequarantined (mogelijk al verzonden) |
| `SMTP_UNCERTAIN` | Zoek `WG-`-code in NIVO-mailbox, pas na bevestigde **niet-ontvangst** via admin expliciet herplannen; geen blinde duplicatie |
| `smtp_accepted` | SMTP-server heeft bericht aanvaard; niet nogmaals versturen. Voor kritieke gevallen afzonderlijke inboxcontrole door eigenaar |
| `CRON_MISSING_OR_STALE` | Controleer hPanel-job, laatste heartbeat/exit, CLI/binary, proceslock; nooit tweede cron toevoegen |
| `NIVO_DELIVERY_FAILED` | Bekijk foutcodes zonder PII, check configuratie/transport; zet transport bij noodincident alleen met eigenaarprocedure uit |
| `SOURCE_REVIEW_DUE` | Hercontroleer relevante RVO/ACM/Milieu Centraal-bronnen, bouw content PR, menselijke review |
| Mail/rapportfout | Maak onderscheid tussen NIVO-leadtransport en `report_mail_enabled` consumentrapport; niet beide ineens uitzetten zonder incidentcontext |
| Herstel mislukt | Bevries destruktieve acties, behoud de bestaande sleutel, herstelopzet en huidige live MySQL |

De Hostinger-cron heeft `flock`-procesbescherming; foutcode 75 betekent dat een andere run de lock heeft. Onderzoek dubbele jobs of lange uitvoering en verwijder lockbestanden niet blind. Het huidige dashboard toont beperkte technische waarschuwingscodes; **geen goedgekeurd extern alarmkanaal** is bewezen.

## 6. Veilige rollback en acceptatie

- Code: uitsluitend gecontroleerde eerdere release terugzetten met een plan voor bestaande outboxschema-/transactiestatus; **geen reset of oude databasekopie over nieuwe leads**.
- Bij SMTP-incident: contactgegevens en queue niet verwijderen. Eigenaar kan bewust `nivo_delivery_enabled` uitschakelen in private config om nieuwe aflevering te pauzeren; pas na incidentonderzoek/ontvangstcontrole heractiveren. De rapportmail is een andere flag.
- Ratelimits, bewaartermijn, consent, serverauth, bescherming van `lib/scripts/docs/tests/.git` en apart autorisatiebeleid blijven ongewijzigd.
- Backups, herstel, privacy/exploitant, continue cronmonitor en uitvoerbare incidentinstructies zijn onderdeel van de [actuele roadmap](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md). **Issue #25/#26 open laten** totdat deze externe voorwaarden zijn bewezen.

Testpaden: `php tests/operations_test.php`, `php tests/delivery_test.php`, `python3 tests/backend_test.py --php php`, `php tests/mysql_backend_test.php` uitsluitend op geïsoleerde CI-MySQL, GitHub Actions live/browser. Bij het controleren van productie gaat een read-only statuscheck vóór handmatige jobs of testmails.

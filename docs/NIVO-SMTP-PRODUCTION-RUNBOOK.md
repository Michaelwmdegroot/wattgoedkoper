# WattGoedkoper — NIVO SMTP-productieactivatie (15 november 2026)

**Besluit eigenaar:** automatische NIVO-adviesaanvragen hebben uitsluitend als ontvanger `portal@nivogroepholland.nl`. Bestaande klantgegevens en de aparte rapportmail blijven gescheiden.

## Bewijs dat al binnen is

De eigenaar heeft in de Hostinger-terminal, vanuit `/home/u886757484/domains/wattgoedkoper.nl/public_html`, met `bash scripts/setup-mail.sh` de private `info@wattgoedkoper.nl`-mailconfig ingericht. Daarna heeft de eigenaar via het WattGoedkoper-dashboard een **handmatig, niet-persoonsgebonden testbericht** verzonden. De screenshot in de projectchat toont het onderwerp `TEST – WattGoedkoper SMTP` aangekomen bij NIVO Portal. **Dat bewijst de handmatige SMTP-route, niet de automatische NIVO-outbox-worker.** De screenshot wordt niet in de publieke repository geplaatst.

De onafhankelijke [live-codecontrole van 15 november](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43659161202) heeft destijds de toenmalige frontend/backend-codepariteit en beveiligingspaden bevestigd. Bij elke nieuwe merge moeten deze checks opnieuw slagen.

## 1. Inzicht in bestaande wachtrij: geen mail, geen klantmutatie

Verbind via geautoriseerde SSH-terminal met WattGoedkoper:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php scripts/nivo-smtp-pilot.php --check
```

De uitvoer vermeldt alléén technische aantallen: `pending`, `processing`, `smtp_accepted`, `api_acknowledged`, `failed`, de exact toegestane NIVO-bestemming en of de transport-toggle echt actief is. Het script toont geen klantnamen, e-mails, contactdata, wachtwoorden of encryptiesleutels. De configuratie wordt **alleen in het werkgeheugen** gesimuleerd; er wordt niets ingeschakeld.

Inspecteer bestaande `pending`-aanvragen in het beveiligde dashboard vóór een eerste bulkverwerking. Alle items zijn alleen nieuwe `2026-11-v2` NIVO-adviesaanvragen; historische leads worden niet terugwerkend aangemeld. Verwijder testaanvragen alleen als je hebt vastgesteld dat het daadwerkelijk fictieve testrecords zijn, niet echte consumenten.

## 2. Synthetische pilottest met de echte e-mailadapter

```sh
php scripts/nivo-smtp-pilot.php --send-test
```

Dit verstuurt exact één synthetische testmail via **dezelfde `wg_delivery_send_smtp()`-functie** die de cronworker gebruikt, uitsluitend naar `portal@nivogroepholland.nl`. Het onderwerp begint met **`[TEST - GEEN KLANT]`**, de contactdata zijn duidelijk fictief en het bericht bevat een verse `WG-...`-aanvraagcode en de aparte NIVO-toestemmingsversie. **Er wordt géén lead of outboxrecord in de productiedatabase aangemaakt of verwijderd.** `--send-test` verandert geen enkele private productie-toggle.

Controleer in NIVO Portal (incl. spam) het onderwerp en de unieke aanvraagcode; behandel dit nooit als een verkooplead. De server geeft alleen **SMTP-acceptatie**, de visuele inboxcontrole moet door de eigenaar gebeuren. Is de uitkomst onzeker? Niet blind opnieuw versturen: controleer eerst op dezelfde code in de inbox.

## 3. Uitgeschakeld houden totdat de pilottest echt is aangekomen

Na bevestigde ontvangst: maak op de Hostinger-host eerst een afgeschermd herstelpunt van de bestaande private config. De sleutels en database mogen niet worden gewijzigd, hergebruikt, gelekt of opnieuw geïnstalleerd.

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
umask 077
cp -p ../wattgoedkoper-private/config.php ../wattgoedkoper-private/config.php.pre-nivo
nano ../wattgoedkoper-private/config.php
```

**Voeg binnen de bestaande top-level PHP `return array(...)` of `return [...]` maar één keer deze instellingen toe. Verwijder of herschrijf de bestaande velden niet:**

```php
'nivo_delivery_enabled' => true,
'nivo_delivery_channel' => 'smtp',
'nivo_delivery_recipient' => 'portal@nivogroepholland.nl',
```

Voordat je enige worker start:

```sh
php -l ../wattgoedkoper-private/config.php
php scripts/nivo-smtp-pilot.php --check
```

Verwacht `No syntax errors`, `Productie NIVO-SMTP actief: ja (huidig kanaal: smtp)` en het exacte goedgekeurde ontvangstadres. Bij een fout: geen worker uitvoeren; herstel uitsluitend die config vanuit de afgeschermde kopie en controleer opnieuw.

**Let op:** een volgende run van `scripts/operations.php` kan nu alle `pending`-aanvragen (maximaal tien per run) naar NIVO verzenden. Kijk daarom eerst naar het wachtrij-aantal en het dashboard; voer de eerste run pas uit als de bestaande werkvoorraad bekend is.

## 4. Eén onderhoudsrunner: handmatig aantonen en daarna cron

Verifieer eerst de PHP-CLI en de werkelijke geplande taken:

```sh
command -v php
php -v
crontab -l
```

Sommige Hostinger-accounts beheren cronjobs uitsluitend via hPanel; controleer daar ook de lijst. **Zorg dat er maar één onderhoudsjob bestaat.** Vervang oude `scripts/maintenance.php`- of `scripts/deliver-leads.php`-jobs, laat ze niet parallel bestaan.

Na back-upcontrole en expliciete toestemming om de huidige wachtende aanvragen te verwerken:

```sh
php scripts/operations.php
php scripts/nivo-smtp-pilot.php --check
```

Verwacht `WattGoedkoper onderhoud uitgevoerd`. Controleer daarna onder het ingelogde dashboard **Overzicht / Tools & status** dat de cron-heartbeat actueel is en de wachtende/SMTP-geaccepteerde/mislukte aantallen kloppen. `smtp_accepted` betekent nog niet dat elke mail in NIVO Portal is afgeleverd; controleer van de eerste echte, expliciet toestemmende NIVO-aanvraag de overeenkomstige `WG-`-code in de NIVO-inbox.

Pas na de eerste geslaagde Hostinger-run mag `'operations_monitor_enabled' => true` in dezelfde private config worden gezet. Daarmee waarschuwt het admin-dashboard als de cron te oud wordt.

Stel in **Hostinger hPanel → Advanced → Cron Jobs** vervolgens één job in met interval **5 minuten** (`*/5 * * * *`). Gebruik het **werkelijke absolute PHP-binary-pad** van `command -v php` plus de absolute scriptlocatie:

```sh
/ABSOLUUT/PAD/NAAR/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php
```

Bovenstaand `/ABSOLUUT/PAD/NAAR/php` is een placeholder, **geen letterlijk uitvoerbaar commando**. De private config ligt op de verwachte plek direct boven `public_html`; `WG_PRIVATE_DIR` is hier standaard niet nodig. Geen publieke HTTP/URL-cron, geen tweede losse leadworker, geen geheime waarden in de crontab. Monitor na minstens twee intervallen de actuele heartbeat, plus de privacy- en retentielimieten.

## 5. Foutafhandeling

- **`pending` blijft staan:** schakel geen tweede cron in; controleer eenmaal jobstatus, PHP-binary, private config en outboxstatus.
- **`SMTP_UNCERTAIN` / verlopen `processing`:** de nieuwe veiligheidsgate zet de onzekere SMTP-lease na een crash op `failed` in plaats van hem automatisch opnieuw te verzenden. Controleer eerst `portal@nivogroepholland.nl` op de `WG-`-code. Een beheerder kan daarna pas de retry bevestigen; de beheeractie stuurt zelf geen mail.
- **`smtp_accepted`:** relay heeft `250` na DATA teruggegeven; geen officiële NIVO-inbox-ACK. Dubbele verzending vanuit het dashboard is niet mogelijk zolang deze status bestaat.
- **Hostinger-PHP of database fout:** stop de cron of zet uitsluitend `nivo_delivery_enabled` op `false`; behoud de bestaande MySQL-tabel, private encryptiesleutel en originele aanvragen.
- **Backup en restore:** maak een werkelijke databasebackup én beschermde private config-/keybackup, herstel afgeschermd en verifieer de sleutel/recordtoegang. GitHub CI en de externe HTTP-smoke bewijzen dit niet.

**Niet activeren door dit project:** rapportmail naar consumenten (`report_mail_enabled`) is een aparte functie en blijft standaard uit. Ook deze CLI doet geen betaalde DNS- of maildienstaanpassingen. De eigenaar moet NIVO-inboxontvangst én de cron-heartbeat afzonderlijk bewijzen voordat issues #23/#25/#26 als operationeel voltooid mogen worden beschouwd.

# WattGoedkoper v0.5 — gecontroleerde oplevering (concept-PR)

**Datum:** 14 november 2026  
**Branch:** `feat/v05-premium-plan-mail-nivo-admin`  
**PR:** https://github.com/Michaelwmdegroot/wattgoedkoper/pull/11  
**Issues:** #7 (plan), #8 (advies), #9 (rapportmail), #10 (admin)

Dit document beschrijft de nieuwe functionaliteit op de featurebranch. De live omgeving is **niet** aangepast. `main` wordt direct uitgerold door Hostinger en moet pas na de eigenaarreview en geslaagde CI worden gemerged.

## 1. Product- en consentarchitectuur

| Handeling consument | Verplicht e-mailadres? | Persoonlijke advieslead? | NIVO-vervolgcontact? |
| --- | --- | --- | --- |
| Gratis energiehuis gebruiken | Nee | Nee | Nee |
| Energieplan in eigen browser bewaren | Nee | Nee | Nee |
| Indicatief rapport laten mailen | Alleen voor bezorging | Nee | Nee |
| Afzonderlijk NIVO-advies vragen | E-mail **of** telefoon | Ja, versleuteld | Ja, na expliciet akkoord |
| Statistieken toestaan | Nee | Nee | Nee, alleen geaggregeerde dagtellingen |

De consument bekijkt de volledige berekening zonder gegevensmuur. Er is geen marketingconsent via de rapportmail. De ontvangende partij voor **nieuwe** adviesaanvragen is **NIVO Groep Holland**. Versie `2026-11-v2` van de NIVO-only adviesconsent wordt server-side in nieuwe leads vastgelegd; historische versies en partnerwaarden blijven ongewijzigd.

## 2. UX

- Energieplan: grote besparings- en investeringsbandbreedtes, gekozen maatregelen, vergelijkingsbalken voor **variabele** jaarkosten, budget- en onzekerheidswaarschuwingen, details achter `<details>` en blijvend bereikbare rapport-CTA.
- Rapportsamenvatting: alleen toegestane gestructureerde velden, geen vrij mailbericht, geen ingesloten tracking, geen klantgegevens in URL.
- Administratie: direct overzicht contact, interesse, plan (indien historische records de waarde niet bevatten staat er 'Niet meegestuurd'), status en snelle acties; oorspronkelijke scan en toestemmingsaudit blijven uitklapbaar.
- 1366×768, 1440×900, 390×844 en 320×568 worden geautomatiseerd beoordeeld en als synthetische screenshots toegevoegd aan de CI-artifact.

## 3. E-mailfunctionaliteit — **standaard UIT**

Nieuwe route: `POST /api/index.php?action=report_email`. Vereist actieve bestaande functionele sessie, `Origin` en `X-CSRF-Token`, Content-Type JSON, bodylimiet 16 KiB, minimaal twee seconden sessieleeftijd, honeypot, valide enkel e-mailadres en scenario-allowlist. De browser mag **geen** onderwerp, HTML, vrije afzender of extra ontvangers bepalen.

Server gebruikt alleen het bestaande beveiligde Hostinger SMTP-account `info@wattgoedkoper.nl` en een vaste `multipart/alternative` mail met HTML + tekst. **De berekening is door de browser ingezonden en niet onafhankelijk gecontroleerd.** Het rapport labelt bedragen als indicatie, investeringen vóór subsidie en 2026/2027 expliciet. De mail bevat uitsluitend een link naar het publieke, vrijwillige adviespad op WattGoedkoper.

### Idempotentie, antifraude en tijdelijke metadata

- Een verzendcode bindt één rapport en geadresseerde samen met HMAC-counters in de bestaande `rate_limits` tabel. Geen losse `emails`- of `leads`-tabel, geen rapportbody en geen e-mailadres bij applicatieopslag.
- Twee gelijke verzoeken kunnen maximaal één SMTP-verzendpoging starten. Alleen na bevestigde SMTP-acceptatie geeft een replay een bevestigde status.
- SMTP-time-out/onzekere status geeft een expliciete fout en verhindert automatische retry van dezelfde verzendcode.
- Beperking: max. 3 verzoeken per uur en 10 per dag per netwerk, 2 per dag per geadresseerde en een globale bovengrens van 80/dag. Alleen HMAC-buckets, standaard tot circa 48 uur in opslag; opportunistische housekeeping + bestaande onderhouds-CLI.
- SMTP-acceptatie bevestigt **niet** daadwerkelijke aflevering in de inbox. De UI noemt dit expliciet.
- De publieke API maakt nergens een nieuwe lead/CRM/marketingrecord aan en registreert geen nieuwe statistiekentelling.

### Activering op de **juiste** Hostinger-site — pas na acceptatie

1. **NOOIT** `setup-mysql.sh` of `setup.php` herhalen op productie. MySQL, bestaande leads, privémappen, wachtwoordhash en encryptiesleutel blijven behouden.
2. Controleer de **WattGoedkoper**-omgeving, zonder accounts/configuratie van Zonlio te hergebruiken.
3. Verbind uitsluitend `info@wattgoedkoper.nl` via de bestaande veilige `bash scripts/setup-mail.sh` op de server (interactieve invoer, niet in Git/chat); pas na bevestiging van Hostinger-imap/smtp.
4. Voer eerst een **eigen, zelfgeadresseerde** handmatige SMTP-test uit vanuit de beheermailfunctie; verifieer ontvangst en afzender/spam/SPF/DKIM/DMARC buiten de repo.
5. Alleen na groen licht van eigenaar en test in de juiste omgeving: zet `'report_mail_enabled' => true` in de bestaande private `config.php` **buiten de webroot**, en test één zelfgeadresseerd rapport. Start daarna met een beperkte pilot.
6. Zet bij twijfel of bezorgincident `report_mail_enabled` weer op `false`, zonder andere sleutels of instellingen te wijzigen.

Het uitgeschakelde rapportendpoint geeft `503 REPORT_MAIL_DISABLED`; het gratis energiehuis blijft werken. Een beroep op de rapportfunctie is geen adviesaanvraag. Er wordt geen echte ontvanger getest vanuit CI.

## 4. Testmatrix

```bash
npm test
npm run check
python3 tests/backend_test.py --php php
php tests/mail_safety_test.php
php tests/report_mail_test.php
# MySQL uitsluitend met geïsoleerde CI-database:
php tests/mysql_backend_test.php
python3 tests/setup_mysql_cli_test.py
find api lib scripts tests -name '*.php' -print0 | xargs -0 -n1 php -l
python3 scripts/build-content.py
python3 scripts/build-preview.py
node scripts/visual-review.cjs
node scripts/visual-review-v05.cjs
```

GitHub Actions buildt de zelfstandige offline preview en levert screenshots + JSON-controles als `premium-visual-review` artifact. In die preview zijn **zowel adviesaanvragen als rapportverzending uitgeschakeld**; de berekening blijft lokaal bruikbaar. Tests dienen geen echte klantgegevens in en verzenden nooit echte e-mail.

De actuele testresultaten horen bij de PR-checks; dit document claimt niet dat een lokale Hostinger-/SMTP-acceptatietest reeds geslaagd is.

## 5. Acceptatie door eigenaar (vóór merge)

1. **Desktop 1366×768:** open 'Mijn energieplan' — beide financiële cijfers, vergelijkingsbalken, maatregelchips, waarschuwing en de mailknop zonder scroll. Herhaal op 1440×900.
2. Probeer nul én meerdere maatregelen, voorbeeld- vs eigen woning, rekenjaar 2026/2027, hoge investering en negatieve besparing. Rekenkern blijft eerlijk, geen fictieve ROI.
3. **Mobiel:** 390 en 320 breed, focus/ESC, geen horizontale overflow, e-mailveld en knop bereikbaar zonder afsnijding.
4. Open **vrijblijvend advies**: geen partnerkeuze; naam plus e-mail of telefoon; NIVO expliciet in **niet vooraf aangevinkte** toestemming.
5. Test (op een **niet-productie** testserver) dat verzending zonder NIVO-consent geen advieslead creëert en dat requests met partner `tbt` of `either` worden geweigerd.
6. In het dashboard: open een **eigen testlead**. Contact, plan en statusacties in één scherm; scan en originele toestemming na uitklappen; historisch ontbrekende investering wordt niet verzonnen.
7. Controleer CI-screenshots en foutpaden (rapportmail uit, geen mailbox, ongeldig e-mailadres, herhaald verzoek). Test pas na serverconfig een **eigen** rapportmail en controleer daadwerkelijk ontvangst.
8. De productietestlead met persoonsgegevens kan na acceptatie door eigenaar worden opgeschoond via het bestaande dashboard. Publiceer die niet.

## 6. Bewuste beperkingen

- Nog geen cloudopslag of accounts; de mail bevat daarom geen heropenbaar persoonlijk plan. De advieslink opent een nieuwe optionele adviessessie.
- Geen dure externe maildienst en geen koppeling naar Odoo/CRM vanuit rapportmail.
- Geen garanties dat een serveracceptatie tot inboxbezorging leidt.
- Bestaande Hostinger private configuratie kan niet vanuit CI of GitHub worden geverifieerd.

# WattGoedkoper 0.4 — dashboard, inbox en leadmagnet

> **Historische documentatie (v0.4).** Voor de nu gebouwde v0.5-branch met NIVO-only advies, rapportmail en verbeterde modals: zie [RELEASE-V05.md](RELEASE-V05.md). De v0.4-roadmap voor partnerkeuze en PDF hieronder is ingehaald door de nieuwe productbesluiten.

> **Statusupdate 14 november:** MySQL, adminlogin en live testadviesaanvraag zijn door eigenaar bevestigd. `info@wattgoedkoper.nl` is in het laatste dashboardbeeld **nog niet gekoppeld**. Dit document beschrijft de eerdere operationele fase; de volgende bouwopdracht staat in [UX/leadfunnel v0.5](UX-LEAD-FUNNEL-V05.md) en [overdracht](HANDOFF-2026-11-14-GPT6PRO.md). Herhaal setup niet.


## Opgeleverd in deze branch

Het gratis interactieve energiehuis en het bestaande beveiligde PHP/SQLite-leadsysteem blijven ongewijzigd. Het dashboard is uitgebreid met een statuspipeline, partnertelling, nieuwe aanvragen ouder dan 24 uur en een activiteitengrafiek met voltooide scans over 14 dagen. Er is een aparte inbox voor **info@wattgoedkoper.nl**, uitsluitend toegankelijk na beheerlogin. Berichten worden server-side gelezen via Hostinger IMAP en als platte tekst getoond. Het mailformulier stuurt uitsluitend op uitdrukkelijk verzoek via Hostinger SMTP.

De activiteitengrafiek gebruikt alleen de bestaande geaggregeerde events van bezoekers met statistiekentoestemming. Het zijn **acties, geen unieke bezoekers**. De status- en partnercijfers omvatten aanvragen die nog binnen de bestaande bewaartermijn vallen; er worden geen fictieve voorbeeldleads getoond.

## Inrichting op de juiste Hostinger-site

1. Bevestig dat Hostinger **wattgoedkoper.nl** aan de GitHub-repository Michaelwmdegroot/wattgoedkoper en branch **main** koppelt. De screenshots van 14 november tonen dat Hostinger de GitHub-implementatie heeft afgerond, maar de serverconfiguratie is hier niet uitleesbaar.
2. Verifieer dat de Hostinger-app PHP uitvoert, niet alleen statische HTML. Open https://wattgoedkoper.nl/api/index.php?action=health. De response moet JSON zijn, en na private setup configured:true bevatten.
3. Controleer voor wattgoedkoper.nl PHP 8.2+, pdo_mysql, openssl, session en **imap**. De IMAP-extensie moet zo nodig via Websites → Manage site → PHP Configuration ingeschakeld worden.
4. Richt de bestaande beveiligde beheerdersconfiguratie in via SSH in de juiste WattGoedkoper-documentroot:

   bash scripts/setup-mysql.sh

   Het wachtwoord wordt via stdin gevraagd. Sla geen wachtwoorden op in command-lineargumenten, Git, screenshots of chat. Private opslag staat standaard in ../wattgoedkoper-private/ buiten de documentroot.
5. Controleer dat de onafhankelijke mailbox **info@wattgoedkoper.nl** werkelijk bestaat en gebruik dan, in dezelfde serverdirectory:

   bash scripts/setup-mail.sh

   Het script vraagt het wachtwoord interactief, schrijft de mail-config in de private map met rechten 0600 en weigert overschrijven.
6. Open als beheerder /admin/, controleer de mailboxstatus en doe één zelfgeadresseerde testmail. Test ook lezen en antwoorden. Controleer daadwerkelijke ontvangst.
7. Controleer HTTPS, private back-ups, bewaartermijn, cron, cookiebeveiliging en blokkering van de directories lib/, scripts/, tests/, docs/ en preview/ op productie.

### Database-isolatie

De Hostinger-screenshot laat **u886757484_wattgoedkoper** zien, maar vermeldt ook **zonlio.nl** als gekoppelde website. Deze branch raakt die MySQL-database niet aan. De eigenaar heeft inmiddels een **nieuwe, lege MySQL-database onder wattgoedkoper.nl** aangemaakt. Voor deze nieuwe installatie is de backend uitgebreid met optionele MySQL-opslag, zie [HOSTINGER-MYSQL.md](HOSTINGER-MYSQL.md). Gebruik nooit Zonlio-data of -credentials.

### Mailbeveiliging en grenzen

Hostinger documenteert IMAP op imap.hostinger.com:993/SSL en SMTP op smtp.hostinger.com:465/SSL. Alle mailboxcredentials blijven buiten webroot en GitHub, en zijn nooit zichtbaar aan frontend-JavaScript of in API-responses. Alleen de identiteit info@wattgoedkoper.nl wordt geaccepteerd; geen andere afzender of externe mailhost kan geconfigureerd worden.

De inbox leest maximaal de 40 nieuwste berichten en verandert geen gelezenstatus. HTML, bijlagen, remote afbeeldingen en scripts worden niet weergegeven; open complexe berichten in Hostinger Webmail. De mailclient ondersteunt één handmatig e-mailbericht per actie na expliciete browserbevestiging, met server-side limieten. Nog geen mappen, zoekfunctie, verzonden-overzicht, conversatiedraden, automatische mail, e-mailstatistieken of CRM-sync. SMTP-aanvaarding is geen garantie van aflevering. Bij onduidelijke verzendstatus niet blind opnieuw versturen.

De concrete Hostinger-PHP-extensies, SMTP-uitgaand verkeer en mailboxcredentials zijn in deze ontwikkelbranch **niet live geverifieerd**. Zonder veilige mailconfiguratie blijft de inbox uit.

## Volgende fasen van de leadmagnet

**0.5: plan over meerdere sessies.** Optioneel account met wachtwoordloze magic link, gecontroleerde opslag van de energiescan en expliciete synchronisatie. Het gratis energiehuis blijft zonder account bruikbaar en de resultaten worden nooit achter een contactformulier verborgen.

**0.6: kwalitatieve adviesaanvraag.** PDF/e-mailrapport op uitdrukkelijk verzoek, passend adviesmoment op het resultaat, duidelijke keuze voor NIVO of Thuisbatterij Team, gescheiden advies- en statistiekentoestemming, beperkte kwalificatie op maatregel en regio.

**0.7: opvolging en workflow.** Notities, deduplicatie, status- en responstijden, autorisaties, partnergerichte werkvoorraad en alleen na goedkeuring CRM/Odoo-integratie.

**0.8: vindbaarheid en verbeteren.** SEO-pagina's per maatregel, praktijkcases met bronvermelding, tests van de rekenaannames, privacyvriendelijke funnelmetingen en iteratieve conversie-experimenten. Geen betaalde tool of nieuwe hostingdienst nodig.

## Checks

npm test; npm run check; python3 tests/backend_test.py --php php; php tests/mail_safety_test.php; en PHP-syntaxcheck van alle api/lib/scripts-bestanden. Echte mailverbinding en Hostinger-live-setup kunnen uitsluitend op de juiste hosting met geheime credentials getest worden.

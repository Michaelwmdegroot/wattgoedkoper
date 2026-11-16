# WattGoedkoper — nieuwsbrief met één bewuste klik na rapportmail

**Eigenaarbesluit 16 november 2026:** zo min mogelijk drempels. De oude dubbele e-mailverificatie is vervangen. Toestemming voor commerciële energietips blijft **afzonderlijk en optioneel**, niet gekoppeld aan het gratis rapport, de energiescan of NIVO-advies.

## Consumentenroute
1. De gratis tool berekent het indicatieve energieplan zonder account/contactmuur.
2. De consument vraagt zelf een rapportmail aan. Alleen na aantoonbare **SMTP-serveracceptatie** is de verzendbevestiging zichtbaar. Dit alleen maakt **geen** nieuwsbriefabonnement, analytics-opt-in of NIVO-advieslead.
3. In de succesweergave staat een expliciete losse knop **'Ja, meld mij aan'** bij de vermelding: ongeveer maandelijks WattGoedkoper-bespaartips en af en toe aanbiedingen van NIVO Groep Holland B.V.; gratis afmelden.
4. Eén bewuste klik activeert het adres direct in de bestaande versleutelde nieuwsbriefdatabase. **Geen verificatiemail, bevestigingslink, tweede pagina of extra formulier.** Bezoeker ziet direct **'Je bent aangemeld'**.
5. Alleen actieve toestemmingen verschijnen in de beveiligde opt-in-CSV in `/admin/#tools`. Elke toekomstige commerciële mail moet een persoonlijke gratis afmeldlink bevatten. Geen automatische marketingcampagne, tweede cron, CRM of automatische NIVO-lead.

## Wat we aantoonbaar vastleggen
- Exact e-mailadres encrypted AES-GCM, aparte HMAC-index en afmeldtoken.
- Consent-versie `2026-11-newsletter-v2-single`, de **exacte toestemmingstekst**, server-tijdstip, herkomst `report_success_single_click` en actieve status. De bestaande kolom `confirmed_at` betekent voor nieuwe aanmeldingen **het moment van toestemming** (niet een e-mailbevestiging); CSV-kolom is daarom *Toestemming gegeven (UTC)*.
- De API controleert of hetzelfde e-mailadres in **dezelfde browsersessie binnen 24 uur** gekoppeld is aan een eerder SMTP-geaccepteerd rapport. Die tijdelijke check bewaart uitsluitend HMAC, geen e-mailadres of marketingopt-in. Verder gelden bestaande CSRF/Origin-beveiliging en aanmeld-rate-limits.
- Bij afmelding wordt de versleutelde contactpayload gewist en verdwijnt het adres uit de actieve export. Een eerdere uitschrijving wordt alleen na **een nieuwe eigen actieve klik** geactiveerd.

**Belangrijk afwegingspunt:** een single opt-in bewijst niet op zichzelf dat de bezoeker de mailbox beheert. De rapport-sessiecheck en rate limits beperken ongeautoriseerd inschrijven, maar kunnen dit niet volledig uitsluiten. Bewaak klachten en bounces; bij structureel misbruik opnieuw beoordelen. Geen historische rapportontvangers automatisch inschrijven.

## Compatibiliteit
Oude, al verstuurde `#bevestig=`-links blijven uitsluitend voor bestaande pending-aanmeldingen werken gedurende hun resterende geldigheid (maximaal zeven dagen). Nieuwe aanmeldingen gebruiken **nooit** dit pad; de losse `#afmelden=`-pagina blijft beschikbaar. Eerder bevestigde abonnees en individuele uitschrijvingen blijven onaangetast.

## Beheer / test
- Bestaande eigenaar-flag `newsletter_optin_enabled=true` en `report_mail_enabled=true` blijven zoals ingesteld; **niet** sleutels, SMTP, MySQL of cron herinstalleren.
- Dezelfde HTML/CSS en browsercontrole op 1366/390/320 px; synthetische SQLite en MySQL-test bewijzen consent, opslag en afmelding zonder echte persoonlijke berichten.
- **Eén echte eigen-adresacceptatie op productie**: rapport aan eigen inbox, daarna één losse nieuwsbriefklik, directe successtatus, uitsluitend dat adres in de beveiligde CSV met v2-versie/tijd; controleer desgewenst de eigen afmeldlink. Geen e-mailadres/tokens/CSV in publieke GitHub-issues. Niet herhaaldelijk rapporten versturen voor tests.
- Pas toekomstige nieuwsbrieven met passende mailingfunctionaliteit verzenden nadat de eigenaar dat afzonderlijk wil. Iedere marketingmail heeft een makkelijke afmeldlink en duidelijke NIVO-identiteit.

## Juridisch/pragmatisch
Volgens ACM is voorafgaande, bewuste, aantoonbare toestemming vereist voor e-mailreclame; volgens de Autoriteit Persoonsgegevens mag die toestemming online via een actieve knop worden gegeven. Dubbele e-mailverificatie is niet expliciet verplicht, maar sterkere bewijsvoering kan zinvol zijn. Initiatief/verwerkingsverantwoordelijke is NIVO Groep Holland B.V.; privacycontact via `info@wattgoedkoper.nl` en `info@nivogroepholland.nl`. De actuele privacyverklaring vermeldt de werkelijke single-click verwerking.

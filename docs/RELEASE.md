# Oplevering 2026-11-14 — eerste werkende versie

## Bereikt

Consumentenscan, brononderbouwde rekenkern, rapport, optionele adviesflow, beveiligde backoffice, inhoudspagina's en rechtstreeks deploybare repository. De volledige consumentenpreview is `preview/wattgoedkoper-preview.html`.

## Gecontroleerd

- 33 modeltests: salderen, import/export, netto kosten, batteryverliezen, vaste vs variabele terugleverkosten, nulverbruik, invalide invoer, budget en gecombineerde maatregelen.
- 55 PHP-integratiechecks met echte PHP 8.4-server en tijdelijke SQLite-configuratie.
- Browser-DOM-flow: vijf stappen → rapport, 2026/2027, contract met jaarlijkse kosten, lokale bewaarkeuze, verkeerd opgegeven energiebalans, verborgen lege velden en ongeconfigureerde adviesfunctie.
- Geen API-verkeer op landing of tijdens de scan zonder meettoestemming.
- Geen default partner of vooraf aangevinkte adviesconsent.
- Alle 45 genormaliseerde modelvelden passen door de backend-allowlist; server behandelt berekende bedragen als ongeverifieerde klantindicatie.
- Consenttekst zichtbaar in formulier en opgeslagen tekst zijn exact gelijk.
- JavaScript-syntaxcontrole en git whitespacecheck.

## Concrete grenzen van de verificatie

Lokale Chromium kon door de uitvoeromgeving niet starten (socket permission error). De beschikbare cloudbrowser kon de lokale testserver niet bereiken (connection refused). Responsive CSS en DOM-gedrag zijn gebouwd/gecontroleerd; visuele desktop/mobiele controle en een volledige browsertest tegen productie zijn nog niet afgerond.

Hostinger beheer is niet verbonden. De oude WordPress-site is niet veranderd. Geen productieaanvraag ontvangen, geen email verstuurd, geen DNS- of hostingmutaties uitgevoerd. Een succesvolle lokale test is geen bewijs van livegang.

## Productgrenzen

Het model is een jaarlijkse eerste oriëntatie. Jaarlijkse profielaannames zijn geen kwartiersimulatie, dakscan of officiële woninginspectie. De bandbreedte varieert maatregel-effecten, niet toekomstige marktprijzen. Subsidies zijn niet in de investering verrekend; 2027-voornemens worden niet als definitieve rechten gepresenteerd.

Een eigen onderneming profiteert van een mogelijke adviesaanvraag, maar het resultaat adviseert niet automatisch een batterij. Consumenten kunnen de volledige uitkomst gebruiken zonder contactgegevens.

## Vervolg met de meeste productwaarde

1. Ondersteunde Hostinger-beheertoegang, beheerorganisatie en livegang volgens `DEPLOYMENT.md`.
2. Echte gebruikerstests op mobiel/desktop en concrete offerteprijzen van partners als optionele rekeninput (met geldigheidsdatum).
3. Gratis PDOK-locatie en PVGIS-opbrengstindicatie, met toestemming en fouttolerante caching; geen betaalde adresdienst nodig voor eerste uitbreiding.
4. Import van een jaar slimme-meter/omvormerdata, met bestandsvalidatie en lokale analyse waar mogelijk. Daarmee pas batterijcapaciteit en uur-/kwartierprijssturing verfijnen.
5. Een geautoriseerde contractfeed of handmatige geverifieerde aanbiedingen met datum, voorwaarden en totalen. Geen fictieve ranglijst.
6. Emailmeldingen/CRM-koppeling, rolgebaseerde partnerinzage, MFA en bewaking van vastgelopen opvolging.
7. Subsidiescreening op woning, uitvoering en meldcodes, met actueel gecontroleerde regels en bronversies.

Deze uitbreidingen zijn geen reeds opgeleverde functies.

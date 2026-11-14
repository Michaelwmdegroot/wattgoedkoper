# Energieplan — Plan Studio, reviewrevision 14 november 2026

## Aanleiding
De eigenaar beoordeelde de eerdere v0.5-modal met 60/100: te statisch, te weinig informatieve diepgang. Deze revision vervangt het samenvattingsformulier door een interactieve beslisomgeving. Op 14 november 2026 is de door de eigenaar goedgekeurde Plan Studio via PR #11 naar `main` gemerged. GitHub-merge is bevestigd; feitelijke Hostinger-live-uitrol en publieke mailactivatie blijven afzonderlijke operationele controles.

## Wat er verandert
- **Overzicht:** een vaste woning-/financiële kaart, kostenvergelijking op een echte gedeelde nulschaal, aandeel van huishoudelijk stroomverbruik uit eigen opwek, gasverschil, fotografische maatregelkaarten en zichtbare waarschuwingen.
- **Maatregelen:** alle vijf upgrades binnen de modal aan/uit, direct herberekend door `simulateHome`. Onbeschikbare maatregelen krijgen een uitlegknop. Afhankelijkheden (zonnepanelen vóór batterij, isolatie vóór warmtepomp waar nodig) en undo blijven intact.
- **Onderbouwing:** jaarlijkse bruto stroomvraag, netimport, opwek, export, gas, kosten, alle oorspronkelijke aannames en waarschuwingen. Directe routes naar verbruik, tarieven en offerteprijzen keren na opslaan terug naar het plan.
- **Vergelijk variant:** financiële momentopname uitsluitend in sessiegeheugen; actuele besparing en investering worden tegenover het vastgezette referentiejaar gezet. Niet als account-/cloudopslag gepresenteerd.
- **Jaar/maand:** jaaruitkomst gedeeld door 12 is expliciet als gemiddelde gelabeld, nooit een maandprognose. Rekenjaar 2026/2027 verandert de echte simulatie. Kosten en stroominkoop zijn afzonderlijke grafiekstanden.
- **Rapport:** dezelfde gescheiden rapportmailroute. De e-mailbalk blijft buiten de scrollende inhoud staan, behoudt een nog niet verzonden adres bij live wijziging en is uitgeschakeld wanneer de server geen mailbeschikbaarheid meldt. Offline wordt niet verzonden.

## Betrouwbare cijfers
`assets/model.mjs` en `assets/playground-model.mjs` zijn ongewijzigd. Investering is eenmalig en vóór subsidie. Geen fictieve score, extra ROI-claim of opgetelde marginale effecten. Negatieve kosten blijven aan de negatieve zijde van de grafiek; nulwaarden krijgen geen decoratieve minimumwaarde. Eigen stroom gebruikt huishoudelijke vraag, niet PV-opwek, als noemer.

Nieuwe modules/contract:
- `assets/plan-ui.mjs`: pure `comparisonScale`, `planInsights`, `renderPlanWorkspace`, `renderPlanDashboard`.
- `assets/plan-studio.css`: dedicated, laat geladen vormgeving; hoofdsite en adviesformulier blijven afzonderlijk.
- `assets/app.mjs`: delegated interactions, transient UI state, keyboard tabs, focus wrap, terugkeer na instellingen, bestaande mail-/leadhandlers.
- `scripts/build-preview.py`: bundelt de nieuwe stylesheet en modules zonder externe afhankelijkheden.

## Browseracceptatie
`node scripts/plan-studio-review.cjs` beoordeelt de werkelijk gerenderde offline app in Chromium. Het test ook clipping door scrollcontainers, niet alleen de viewportrechthoek. Formaatmatrix: 1366×768, 1440×900, 1280×800, tablet 900×1000, mobiel 390×844 en 320×568, compacte 640×400 viewport; extra 390×500 voor verminderde beschikbare hoogte. De laatste is een viewportsimulatie, geen test met een fysiek iOS-toetsenbord.

Controles: nul/vijf maatregelen, negatieve besparing met budgetoverschrijding, vaste variant, undo, afhankelijkheden, herberekend jaar, maandduiding, kWh-vergelijking, oorspronkelijke aannames, terugkeer uit instellingen, onaangetast adresconcept, native modal focusloop, roving tabs, Escape/focusherstel, geen horizontale overflow, offline mail zonder netwerk en geen JavaScript-excepties. Dit is geen volledige screenreader- of WCAG-certificering.

Bedieningspatronen volgen de W3C APG: [modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) en [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Zelf beoordelen
Open de zelfstandige preview. Kies eerst een woning/maatregelen of klik in het lege plan op **Probeer een startplan**. Open **Mijn energieplan**, zet een variant vast en probeer bij **Maatregelen** een batterij aan/uit. Wissel rekenjaar en maand/jaar. Open **Onderbouwing**, pas een tarief aan en controleer dat de modal terugkeert met nieuwe cijfers. Bekijk daarna dezelfde ervaring op mobiel.

## Releasegrens
Geen wijzigingen in database, private configuratie, encryptiesleutels, SMTP-host of leadroutering. NIVO-consent en rapport-only blijven gescheiden. Eigenaaracceptatie is gegeven en de merge naar `main` is uitgevoerd. Hostinger-mailconfiguratie en een echte zelfgeadresseerde bezorgtest blijven een afzonderlijke stap. Geen kosten of nieuwe diensten toegevoegd.

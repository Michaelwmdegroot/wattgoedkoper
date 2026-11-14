# WattGoedkoper v0.7 — merkimplementatie en compactere woningbovenbalk

## Aanleiding

De eigenaar heeft een nieuw WattGoedkoper-logo met donkerblauwe W, gele bliksem, baan en euroteken goedgekeurd, plus het bijbehorende losse icoon. Het oude websitewoordmerk was nog een losse tekstweergave met geel vierkant en de ruimte boven de woning was grotendeels leeg. Deze fase integreert de nieuwe identiteit en benut die ruimte als compacte, werkende navigatie, zonder het energiehuis tot een formulier te maken.

## Assets / productiegebruik

| Bestand | Rol |
|---|---|
| \`assets/brand-logo.svg\` | Horizontaal woordmerk, eigen vectorpaden van goedgekeurde bron |
| \`assets/brand-mark.svg\` | Icoon W + bliksem + energie-/euroaccent, browser-tab favicon |
| \`favicon.ico\`, \`assets/favicon-{16,32,48}.png\` | Standaard faviconformaten en legacy-ondersteuning |
| \`apple-touch-icon.png\` | Apple/iOS homescreen 180×180 |
| \`assets/icon-{192,512}.png\` | Homescreen-/appmanifestformaten |
| \`assets/og-wattgoedkoper.png\` | Social share preview op 1200×630 |
| \`site.webmanifest\` | Titel, kleuren en iconen van de site |
| \`scripts/render-brand-icons.cjs\` | Reproduceerbare (niet-runtime) generator uit de SVG-merkbestanden |

De SVG-artworks zijn opgeschoonde vectortracings op basis van de goedgekeurde afbeeldingen, niet opnieuw willekeurig AI-gegenereerde logo's. De vectoren bestaan uit lokaal gehoste paden, zonder fonts, JS, externe logo-opvraging of tracking. Gecombineerde beeldkwaliteit en faviconleesbaarheid zijn getest in echte browserafmetingen. Alle iconbestanden worden alleen als statische assets geserveerd.

## Homepage

De header gebruikt het vectorwoordmerk in plaats van het oude gele vierkant met lettertekening. Boven de foto staat een horizontaal compact navigatieblok **Zo werkt het**, met drie echte acties:

1. **Jouw huis** kiest en focust het bestaande woningscherm.
2. **Probeer** focust direct de zonnepanelenkaart zonder deze stiekem toe te voegen.
3. **Vergelijk** opent de bestaande, interactieve Plan Studio.

De teksten informeren, blokkeren geen gebruik en sturen geen persoonsgegevens. De oorspronkelijke dynamische status en resetfunctie staan rechts, dichtbij de tool. De vrijgekomen hoogte wordt aan de woning besteed; alle vijf maatregelkaarten blijven binnen de eerste viewport op normale laptopformaten. Op tablet en mobiel wordt de extra micro-navigatie weggelaten; de bestaande bedieningspaden en mobiele CTA blijven bestaan.

## Samenhang

De statische kennis-/privacyartikelen komen uit \`scripts/build-content.py\`; die generator gebruikt dezelfde woordmerkasset in header en footer. Het admin-dashboard heeft de herkenbare W als icoon op een licht vlak, met witte tekst die op het donkere zijmenu leesbaar blijft. De standalone preview bundelt de lokale asset en voegt geen externe login, pixel of mailcode toe.

## Reproductie / kwaliteitscontrole

\`\`\`bash
npm test
npm run check
python3 tests/backend_test.py --php php
php tests/mail_safety_test.php
php tests/report_mail_test.php
python3 scripts/build-content.py
python3 scripts/build-preview.py
node scripts/visual-review.cjs
node scripts/plan-studio-review.cjs
node scripts/home-cockpit-review.cjs
node scripts/brand-home-review.cjs
\`\`\`

Voor een nieuwe generatie van statische iconbestanden op de ontwikkelomgeving: \`node scripts/render-brand-icons.cjs\` nadat Playwright Chromium is geïnstalleerd. Dit is geen productievereiste.

Vereiste browsertests: logo en stapnavigatie zonder overlappen; zichtbare vijf kaarten en resultaatknop op desktop, focus naar de echte controles, volledig werkend planvenster, geen horizontale overflow op 390/320px; correcte PNG- en ICO-dimensies. De tests werken met synthetische of volledig lokale data.

## Uitrolveiligheid

De code wijzigt geen rekenformules, consentversies, backend/API, MySQL-tabel, private configuratie of encryptiesleutels. De publieke rapportmail blijft standaard uit. De Hostinger-deployment is gekoppeld aan \`main\` en mag alleen na CI en visuele goedkeuring worden getriggerd. Een GitHub-merge alleen bewijst niet dat de nieuwe assets daadwerkelijk bij Hostinger zijn aangekomen; controleer de site-URL en favicon na deploy.

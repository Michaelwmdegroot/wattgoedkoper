# WattGoedkoper — projectoverdracht GPT-6 Pro
**Datum:** 14 november 2026 · **Status:** overdracht voorbereid; UX-wijzigingen en rapportmail zijn nog NIET gebouwd.

> **Lees eerst:** [UX/leadfunnel productspecificatie](UX-LEAD-FUNNEL-V05.md) en [startprompt GPT-6 Pro](START-PROMPT-GPT6PRO.md). Dit bestand bevat de actuele, door de eigenaar bevestigde situatie en overschrijft verouderde statustekst in eerdere runbooks. Deze overdracht bevat geen persoonsgegevens of geheimen.

## 1. Product en expliciete besluiten van de eigenaar

WattGoedkoper.nl is een Nederlandse, kosteloze interactieve verduurzamingstool/leadmagnet, commercieel gelieerd aan **NIVO Groep Holland**. De website rekent meteen met het eigen energiehuis: woningtype, verbruik, tarieven, zonnepanelen, batterij, warmtepomp, isolatie en andere keuzes. Bezoekers hoeven niet eerst een account of formulier in te vullen. De premium vormgeving is warm crèmekleurig, donkerblauw/inkt, gele accenten, serifkoppen en lokaal gehoste fotorealistische huis- en maatregelbeelden.

De eigenaar heeft op 14 november vier wijzigingen bevestigd, naar aanleiding van vier schermafbeeldingen:

1. **Partnerkeuze weg uit de adviesaanvraag.** Geen “Met wie wil je je plan bespreken?” meer; NIVO Groep Holland doet voortaan altijd de opvolging. Niet als grote verkoopkeuze voorin, wél transparant bij het geven van toestemming.
2. **Energieplan als compact premium venster.** Besparingsbandbreedte, investering, gekozen maatregelen, vergelijking nu/plan, waarschuwingen én hoofd-CTA binnen **één desktopviewport**. Geen lange tabel die de CTA naar beneden verdringt. Visueel duidelijk en waar nuttig interactief; details secundair.
3. **Rapport per e-mail in plaats van directe download.** Bezoeker verstrekt vrijwillig e-mailadres om zijn volledige energieplan per e-mail te ontvangen, met professionele opmaak en een duidelijke, niet-opdringerige CTA naar **aparte vrijwillige adviesaanvraag**. Rapport-aanvraag is niet automatisch een advieslead, opvolgtoestemming of marketingtoestemming.
4. **Dashboard-detail in één overzicht.** Huidige “Bekijk aanvraag”-modal toont veel ruwe scanvelden onder elkaar en vereist scrollen. Nieuwe brede 2-koloms modal/drawer: contact, status, plan, interesse en acties boven de vouw; uitgebreide scan/toestemming bereikbaar via details of tabbladen.

De opvolgende agent moet dit **bouwen**, testen, controleren en via een nette PR opleveren. Deze overdracht is nog geen functionele implementatie.

## 2. Repository en laatst bevestigde productie

- **GitHub:** https://github.com/Michaelwmdegroot/wattgoedkoper
- **Branch:** `main`, verbonden met Hostinger-deployment. Bij handoff was de laatste broncommit **`cafcfd264ebb15d8ca6b998fe753e07ec61abbb4`**. Begin elke nieuwe sessie bij de dan actuele `main`; de SHA is een checkpoint, geen permanent versienummer.
- **Site:** https://wattgoedkoper.nl/; beheer: https://wattgoedkoper.nl/admin/.
- **Hosting:** Hostinger, PHP **8.2.35** (eigenaar via SSH bevestigd), `PDO`, `pdo_mysql`, `openssl`. Webroot in de sitegebonden `public_html`, GitHub implementeert vanaf `main`.
- **Database:** aparte MySQL-database op **wattgoedkoper.nl**, dus **niet** de eerder abusievelijk onder Zonlio aangemaakte database. Privéconfiguratie/encryptiesleutel staan buiten de publiek toegankelijke webroot. Geen credentials in GitHub/chat.
- **Eerste backendsetup is GESLAAGD**: eigenaar heeft via de veilige `bash scripts/setup-mysql.sh`-route de MySQL-schema- en beheerconfiguratie ingericht, kon inloggen op `/admin/` en zag een **zelf ingestuurde testadviesaanvraag** inclusief scansamenvatting, status en contactinformatie. Er staat dus mogelijk nog één testrecord met persoonsgegevens in productie: niet naar Git, log, fixture of screenshot kopiëren. Verwijderen na afronden van acceptatie is aan eigenaar.
- **Inbox is NIET gekoppeld volgens laatste live screenshot**: `info@wattgoedkoper.nl` bestaat volgens eigenaar, maar dashboard meldt “Nog niet gekoppeld”. Er is geen bewijs van succesvolle IMAP/SMTP-test of transactionele rapportmail. Niet claimen dat mail live werkt.
- **Setup nooit opnieuw uitvoeren** op dit reeds ingerichte systeem; behoud MySQL, privéconfig en encryptiesleutel. Mail kan zo nodig afzonderlijk veilig worden gekoppeld via `bash scripts/setup-mail.sh`, alleen op server met de juiste mailbox en zonder wachtwoord in chat.
- De eigenaar bevestigde op 14 november één eind-tot-eind advieslead (bezoekersformulier -> MySQL -> dashboard). Dit bewijst **leadopslag** maar niet de geplande e-mailflow.
- Voor `cafcfd2` zijn zowel CI-backend-/MySQL-tests als de browser-visual-review groen gerapporteerd. Nieuwe code opnieuw laten testen; eerdere checks gelden niet als bewijs voor nieuw gedrag.

## 3. Bestaande architectuur en exact te wijzigen plekken

| Onderdeel | Code | Huidig gedrag / aanknopingspunt |
| --- | --- | --- |
| Publieke app | `index.html`, `assets/app.mjs`, `assets/styles.css`, `assets/premium.css` | Energiehuis en modals, JavaScript ES-modules zonder framework |
| Huisbeeld | `assets/house-scene.mjs`, `assets/house-scene.css` | 5 woningtypen, foto-overlay en klikbare keuzes |
| Berekeningen | `assets/model.mjs`, `assets/playground-model.mjs` | Deterministisch; 2026/2027-regels; geen dubbeltelling |
| Energieplan | `assets/app.mjs`: `planBody()`, `openPlan()`, `openDialog()` | Lange 5×2-tabel, maatregelen, `data-print` “Bewaar als PDF”, onderste adviescallout |
| Adviesflow | `assets/app.mjs`: `openAdvice()`, `submitLead()` | Radio's voor `nivo`/`tbt`/`either`, partner-toestemming, POST lead |
| Lead API | `api/index.php`: `action=leads` | CSRF/origin, anti-bot, idempotentie, versleutelde opslag en ontvangstnummer |
| Validatie | `lib/bootstrap.php`: `wg_validate_lead()` | Partner momenteel nog een clientveld met drie toegestane waarden; consent-tekst oude versie |
| Backend mail | `lib/mail.php`; `api/index.php`: `admin_mail_*` | Beveiligd handmatig SMTP/admininbox; **geen** publiek rapportmailendpoint |
| Dashboard | `admin/admin.mjs`: `showDetail()`, `admin/index.html`, `admin/admin.css`, `admin/operations.css` | Ruwe `inputs` en toestemmingsdetails achter elkaar; te lange modal |
| Preview | `scripts/build-preview.py`, `preview/wattgoedkoper-preview.html` | Offline zelfstandige preview; geen tracking/echte netwerkverzoeken toegestaan |
| Tests | `tests/`, `scripts/visual-review.cjs`, `.github/workflows/` | Model, scenario, backend, MySQL, mailveiligheid, Browserreview |

**Let op:** bestaande JSON-lead `summary` bevat rekenjaar en jaarlijkse besparing, maar geen gegarandeerd investeringstotaal. Een nieuw dashboard mag die waarde **niet verzinnen**; voeg desgewenst een gevalideerde, achterwaarts compatibele waarde toe of toon niet-beschikbaar. Bestaande tbt/either-records mogen niet stilzwijgend gewijzigd/gewist worden wanneer nieuwe aanvragen alleen nog NIVO kiezen.

## 4. Bedrijfs- en privacyregels

- **Gratis bruikbaar zonder account en zonder e-mailadres**; resultaten zijn niet achter een leadwall verstopt.
- Onderscheid strikt: (A) **rapport op eigen verzoek mailen**, (B) **expliciet NIVO-advies aanvragen**, (C) optionele **geaggregeerde statistiekentelling**, en later pas eventuele marketing. Geen impliciete uitwisseling, automatische opvolging of prechecked marketingconsent bij A.
- In adviesflow server-side `nivo` afdwingen; toon NIVO als contactontvanger bij de optionele toestemmingscheckbox. De gebruiker vraagt geen grote partnerkeuzekaarten meer.
- PHP SMTP/mailaccount uitsluitend op server, nooit browser. Geen publieke open mailrelay. Beperk tot één aangevraagd rapport aan opgegeven geadresseerde; servervalidatie, anti-bot, idempotency, rate limiting, escaping, veilige foutpaden, en geen succesclaim vóór SMTP-aanvaarding.
- **Nieuwe publieke rapportmailroute standaard uit** tot mailbox veilig verbonden en eigen test bezorgd; geen ongeteste automatische mails naar echte klanten. Verzend alleen bij expliciet verzoek.
- Het model werkt met **variabele** energiekosten, indicatieve investering, 2026 vs 2027, onzekerheidsbandbreedtes, negatieve of nulbesparing en budgetoverschrijdingen. Geen garantietaal, subsidietoekenning of onbewezen exacte ROI.
- De bestaande MySQL-leads/data/keys niet vernietigen; geen production setup/reset/reseed, geen echte klantdata in fixtures, screenshots, debug of Git.
- Hoofdplan én admin-detail: op **desktop 1366×768 en 1440×900** kerninfo plus CTA/actie **zonder scroll**. Mobiel: logisch scrollen mag, CTA moet bereikbaar/sticky en zonder overlap/overflow, toetsenbordbediening en focus goed.
- De look moet één premium product zijn: korte copy, rustige componenten, geen onnodig lange formulieren of generieke AI-vormgeving.

## 5. Aanpak voor de volgende GPT-6 Pro-agent

1. **Eerste antwoord:** vat aan eigenaar samen wat klaar is, wat live bewezen werkt, de vier wensen, beperkingen en het uitvoeringsplan. Lees eerst `AGENTS.md`, deze handoff, `UX-LEAD-FUNNEL-V05.md`, broncode, tests, privacy en runbooks. Stel bestaande beantwoordde vragen niet opnieuw.
2. Code op **nieuwe featurebranch** met overzichtelijke commits en PR. In volgorde: (i) adviesformulier NIVO-only, (ii) planmodal herontwerp, (iii) rapportmailroute/met featureswitch, (iv) admin-detail, (v) complete QA/docs. Parallelisatie mag als samenhang en integratie behouden blijven.
3. Gebruik een echte browserreview: plan/advice/admin op 1366×768, 1440×900, mobiel 390 en 320 breed, navigatie/focus/keyboard, 0 en meerdere maatregelen, budget overschreden en negatieve besparing. Voeg geautomatiseerde viewport- en functionaliteitstests/screenshots toe zonder persoonsgegevens.
4. End-to-end test van **mail-only**: mailen mag geen lead of NIVO-contacttoestemming creëren. **Advice-only**: vrijwillige consent vereist, serverroute altijd NIVO. Niet geconfigureerde SMTP, timeouts en duplicaatverzoeken moeten correct afhandelen.
5. Houd offline preview strikt offline; werk `scripts/build-preview.py` en tests bij voor eventueel nieuw endpoint. Algemene rekenregressies uitvoeren.
6. **Main auto-deployt naar productie.** Niet ongetest e-mail verzenden of public feature activeren. Alleen mergen na succesvolle CI, testbewijs en veilige rollout (featureflag voor mail); wijzig geen serversecret. Stem resterende serveractivering af met eigenaar als die echt nodig is.
7. Update README, privacy, frontendcontract en relevante docs naar werkelijk geïmplementeerde toestand. Lever testinstructies voor eigenaar en concrete PR/CI-URL's; start daarna pas het latere account-/syncproject.

## 6. Test- en instructiecommando's (lokale/CI context)

- `npm test` · `npm run check`
- `python3 tests/backend_test.py --php php`
- `php tests/mail_safety_test.php`
- `php tests/mysql_backend_test.php` — **alleen** met geïsoleerde CI-MySQL, niet met productie!
- `python3 tests/setup_mysql_cli_test.py` — **uitsluitend** met CI-MySQL, nooit prod.
- `node scripts/visual-review.cjs` (zie GitHub workflow voor browserinstallatie)
- `python3 scripts/build-content.py`, `python3 scripts/build-preview.py` — public help/preview na aanpassingen bijwerken.

## 7. Nieuwe GitHub-issues voor de opvolgende agent

| Prioriteit | Issue | Scope |
| --- | --- | --- |
| P0 | [#7 — Planmodal in één scherm](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/7) | Premium overzicht, vergelijking, mail-CTA, responsive |
| P0 | [#8 — NIVO-only advies](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/8) | Partnerkeuze verwijderen, serverroutering en expliciete consent |
| P0 | [#9 — Rapport per e-mail](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/9) | Transactie-email, veiligheid, privacy en veilige activatie |
| P0 | [#10 — Compact admin-detail](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/10) | Contact + energiescan + acties in één werkvlak |

De vier issues verwijzen terug naar de productspecificatie. [#2](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/2) blijft open voor mail- en hardeningcontroles; [#3](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/3) blijft een latere fase voor optionele accounts.

## 8. Nog open, niet verzinnen

- Mailaccount vanuit app nog niet live gekoppeld / mailboxcredentials op server onbekend, dus report-mail niet live geverifieerd.
- Privacy-/backups-/cron-/deliverabilitycontrole niet volledig bewezen.
- Het bestaande testrecord is mogelijk nog aanwezig; eigenaar laten wissen na verificatie.
- Bestaand GitHub [issue #2](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/2) is slechts deels afgevinkt (mail en ops); [issue #3](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/3) voor optionele accounts is **latere fase**, geen huidige P0-opdracht.
- User screenshots zijn in het gesprek te bekijken; geen PII naar GitHub overnemen.

**Afsluiting:** De volgende GPT-6 Pro-agent implementeert de vier hierboven vastgelegde UX-/mailwerkstromen, niet opnieuw de hosting of bestaande database. Uitsluitend documentatie en planning zijn overgedragen.

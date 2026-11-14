# WattGoedkoper — UX en leadfunnel v0.5 (productspecificatie)

**Eigenaarbesluiten 14 november 2026.** Gebaseerd op de werkende website en vier aangeleverde screenshots. De screenshots zelf bevatten contactgegevens en worden daarom **niet in GitHub geplaatst**. Zie [projectoverdracht](HANDOFF-2026-11-14-GPT6PRO.md) en [startprompt](START-PROMPT-GPT6PRO.md).

## Klantreis en harde uitgangspunten

**Gratis en zonder contactbarrière:** bezoeker speelt met eigen energiehuis → ziet direct eerlijke indicaties → opent een compact energieplan → kan **vrijwillig** zijn e-mailadres opgeven om het rapport te laten bezorgen → kan **apart** NIVO Groep Holland om advies vragen.

De rapportmail is niet automatisch een advieslead, commerciële opt-in, CRM-contact of marketingabonnement. Geen verplichte accountregistratie, geen ongevraagde opvolging en geen betaalde maildienst. NIVO is de enige nieuwe adviesopvolger maar verschijnt pas transparant wanneer er daadwerkelijk toestemming voor contact wordt gevraagd.

### P0-A — Energieplanmodal: één premium desktopviewport

**Huidig:** `assets/app.mjs` → `planBody()` toont veel lange regels met maatregelen, een 5×2 tabel, `Bewaar als PDF` en een adviesblok onderaan. Gebruiker moet scrollen voor relevante keuzes.

**Gewenste compositie:**

| Zone | Inhoud |
| --- | --- |
| Kop | `Dit is jouw energieplan.` + rekenjaar en sluitknop; kort en helder |
| Primaire cijfers | Grote **indicatieve jaarlijkse besparing als bandbreedte** en **eenmalige investering als bandbreedte**; variabele energiekosten / vóór subsidie expliciet |
| Gekozen maatregelen | Compacte chips/kaartjes met pictogrammen/labels voor 0–5 maatregelen; niet vijf grote beschrijvende rijen |
| Visuele vergelijking | Nu vs Met jouw plan, bijv. horizontale balken van **dezelfde maat** (variabele jaarkosten) met getallen; eventueel kleine netafname/opwek met juiste kWh-eenheden |
| Situatiewaarschuwingen | Korte zichtbare melding bij overschreden budget, negatieve besparing, geen maatregelen of te onzekere input |
| CTA-balk | **E-mailadres** + primaire knop **Mail mijn energieplan**, en secundair **Vraag vrijblijvend advies**. Altijd direct bereikbaar |
| Details | Volledige tabel, aannames en uitleg alleen via expliciete `Bekijk details`-tab/accordion; nooit vóór de hoofd-CTA uitstallen |

**Acceptatie:** op **1366×768 en 1440×900** bevat de geopende planmodal alle hoofdvelden, vergelijking, waarschuwing en CTA zonder een verticale scroll om de primaire actie te vinden. Test ook bij 1280×800. Niet onleesbaar klein maken. Afmetingen/asserties via echte browser en screenshots, geen alleen-stylingreview.

**Mobiel/tablet:** hoofdinfo prioritair, CTA binnen bereik via sticky footer of goede layout, details mogen natuurlijk scrollen. Geen dubbele focus-/scrollproblemen, geen afgesneden CTA bij mobiel toetsenbord, geen horizontale overflow op 390×844/320×568. Volledige toetsenbord/focus/ESC-bediening en reduced-motion.

**Edgecases:** 0 keuzes, 5 keuzes, nul/negatieve besparing, te hoge investering en budgetwaarschuwing, 2026 versus 2027, grote bedragen/meerregelige Nederlandse labels. De rekenkern blijft exact correct; geen verzonnen ROI, gegarandeerde opbrengsten of subsidiebelofte.

**Geen directe PDF-download als hoofdroute.** De consument ontvangt het rapport via e-mail op verzoek. Bestaande lokale planopslag mag buiten deze CTA-zone beschikbaar blijven.

### P0-B — Adviesaanvraag zonder partnerkeuze; NIVO als vaste ontvanger

**Huidige code:** `openAdvice()` toont NIVO / Thuisbatterij Team / Beide, `submitLead()` leest `partner` uit de browser, `lib/bootstrap.php::wg_validate_lead()` staat drie waarden toe. De checkbox noemt gekozen partner(s).

**Nieuwe flow:**
- Verwijder **de hele vraag “Met wie wil je je plan bespreken?”** en de drie radiokaarten.
- Kort, rustig, compact formulier: naam, minimaal e-mail **of** telefoon, optionele postcode en optionele toelichting. Twee kolommen op desktop, één op mobiel; minimale begeleidende tekst.
- Titel bijvoorbeeld `Een vraag over je energieplan?`; advies-CTA `Bespreek mijn energieplan` of `Vraag vrijblijvend advies`. Dit is **niet** dezelfde knop als rapportmail.
- Toestemmingsregel niet vooringevuld: `Ik wil dat NIVO Groep Holland contact met mij opneemt over mijn energieplan. Hiervoor mogen mijn contactgegevens en meegestuurde energie-informatie worden gebruikt. Ik heb de privacyverklaring gelezen.` Laat copy juridisch/privacymatig aansluiten bij de werkelijke organisatie.
- **Server-side `nivo`** voor iedere nieuwe aanvraag afdwingen; client kan geen andere partner routeren. Andere meegestuurde partnervelden expliciet afwijzen of veilig normaliseren en testen. Geen stille gegevensoverdracht.
- Historische `tbt`/`either` records blijven leesbaar zolang hun bewaartermijn geldt, zonder achteraf wijzigen van consentbewijs.
- Bestaande CSRF, origin, honeypot, sessieleeftijd, idempotentie, encryptie, toestemming, rate limits, statusbeheer, CSV-export en verwijdering intact.
- Update adviesbevestiging, footer, privacyverklaring, backendcontract en tests; zorg dat alle nieuwe tekst dezelfde één-partnerlogica volgt.

**Acceptatie:** geen partnerkeuze in UI, nieuwe records alleen NIVO, ondubbelzinnige toestemming, geen regressie in historische leads. Rapport bezorgen maakt niet automatisch dit adviesrecord.

### P0-C — Energieplan als transactionele rapportmail, niet als leadwall

**Huidig:** `lib/mail.php` kan via Hostinger handmatig adminmail verzenden. De laatste screenshots tonen de mailbox in het dashboard als **niet geconfigureerd**. Er is nog **geen** publiek rapportmailendpoint. Vertrouw niet op administratieve mailbevoegdheid voor een publieke route.

**Gewenste bezorgervaring:**
1. De bezoeker vult bij het energieplan zijn **eigen e-mailadres** in en klikt bewust op `Mail mijn energieplan`.
2. Het rapport arriveert als een mooie, mobiele HTML-mail **met plattetekstfallback**, met gekozene maatregelen, cijfers nu/met plan, indicatieve besparings- en investeringsbandbreedtes, rekenjaar en relevante aannames/disclaimer. Optionele PDF **in de mail** mag alleen indien betrouwbaar en zonder kosten; geen directe download nodig.
3. Eén nuttige, rustige CTA in het rapport: `Wil je dat iemand even meekijkt? Vraag vrijblijvend advies aan.` Link naar een **werkend** publiek NIVO-adviespad. Geen persoons- of scenario-inhoud in de URL, geen trackingpixel. Doe niet alsof een plan in de cloud bewaard is wanneer dat niet zo is.
4. Succesbericht alleen als maildoorvoer aantoonbaar is geaccepteerd door SMTP of duurzame queue. Benoem nauwkeurig dat SMTP-acceptatie geen bewijs van uiteindelijke aflevering is. Bij storing, timeout of niet-gekoppelde mailbox duidelijke fout; tool blijft bruikbaar.
5. Een per e-mail bezorgd plan is **niet** automatisch toestemming tot telefoontje, vervolgmail, marketing of opname in NIVO Portal/Odoo. Dat gebeurt alleen via een afzonderlijke, vrijwillige aanvraag met juiste consent.

**Veilige publieke backendroute:**
- Ontwerp bijvoorbeeld `POST /api/index.php?action=report_email`, met beperkte velden (één e-mailadres, toegestane scenario-snapshot, schema-versie en idempotency key). Browser mag geen vrij onderwerp, body, headers, CC/BCC, afzender of ontvangerslijst bepalen. Servertypevalideer, sanitize en escape.
- Vereis correcte sessie, CSRF, origin, JSON-/groottecontrole, honeypot, rate-limiting/dedup en abusebescherming. Geen open relay, bulk-mailendpoint, onbeperkte retries of kwaadaardige HTML.
- Browserberekening is **niet server-geverifieerd**: label een ingestuurd resultaat als gebruikersindicatie met gevalideerde grenzen of herbereken serverside. Nooit willekeurige bedragen als officiële/gecontroleerde besparing presenteren.
- Gebruik bestaande Hostinger SMTP alleen server-side, secrets in private config buiten webroot. Geen contactgegevens of e-mailinhoud in app-/analyticslogs, Git of CI. Beperk dataretentie voor rapportbezorging.
- Houd de publieke verzendroute **featureflagged en fail-closed** totdat `info@wattgoedkoper.nl` correct op de juiste hosting is ingesteld en een eigenaarstest een echte mail bevestigt. De site mag geen mailbevestiging tonen wanneer verzending nog niet werkelijk mogelijk is.
- Een mislukte rapportmail mag nooit als nieuwe advieslead verschijnen. Maak tests voor: correct adres, ongeldig adres, dubbele klik/retry, gelijktijdige requests, ontbrekende mailboxconfig, SMTP-fout, headerinjectie, geen analytics- of adviesconsent en mailbody op mobiel.
- Werk privacyverklaring, copy/CTA en `docs/backend.md`/`docs/frontend-contract.md` bij; maak expliciet onderscheid tussen de vrijwillige rapportbezorging en opvolging. De transactionele mail moet passen bij het beperkte doel, met alleen een link om zelf advies te vragen.

**Emailcopy voorbeeld:** subject `Jouw energieplan van WattGoedkoper`; heldere cijfers en maatregellijst; disclaimer `Indicatie, geen offerte`; korte CTA naar vrijwillige adviesaanvraag. Geen ongewenste advertentiemail.

### P0-D — Admin-aanvraagdetail: contact en plan in één oogopslag

**Huidig:** `admin/admin.mjs::showDetail(lead)` schrijft alle `Object.entries(d.inputs)` direct uit in een lange `#lead-dialog`. De statusknop zit ver onder de details; op desktop niet in één zicht.

**Nieuwe layout:**
- Brede, premium twee-koloms modal of drawer die aansluit bij dashboard/website.
- Kop: naam, aanmaakdatum, aanvraagcode, status, sluiten.
- Links: contact-e-mail/telefoon, postcode, interesses en toelichting; duidelijke snelle actie `Mail klant` indien e-mailadres aanwezig.
- Rechts: kernplan: rekenjaar, besparingsbandbreedte, maatregelen en enkele belangrijkste woning-/verbruikskenmerken. **Geen investering verzinnen**: bestaande payload bewaart besparingsbandbreedte, maar niet betrouwbaar investeringsbedrag in `summary`; toon afwezigheid of breid achterwaarts compatibel uit.
- Statuswijziging en Opslaan direct zichtbaar; Verwijderen secundair + expliciete bevestiging.
- Volledige `Meegestuurde energiescan` en `Toestemming` blijven intact in tabs/accordions; standaard ingeklapt. Vertrouwelijkheid en bewijsversie bewaard.
- Alle bezoekerinput renderen via DOM `textContent`/escaping, geen HTML-injectie. Auth, CSRF, statuswijziging, mailcomposer, export, delete en pagination niet breken.
- Desktop 1366×768 en 1440×900 kerninfo plus acties zonder modal-scroll. Mobiel details mogen scrollen, maar acties blijven goed bereikbaar/focusbaar.

**Acceptatie:** beheerder ziet binnen seconden wie het is, waar interesse in is, welke indicatie/maatregelen het betreft en welke actie nodig is — zonder scrollen. Details blijven op verzoek te onderzoeken.

## Werkvolgorde, kwaliteitsbewaking en livegang

1. Controleer `main` en relevante code/tests. Bouw op nette featurebranch met eigen PR; houd bestaande productie stabiel.
2. Implementeer eerst compacte advies- en plan-UX, dan publieke rapportmailroute met veilige featureflag, dan admin-detail en integrale optische afwerking.
3. Automatiseer checks: `npm test`, `npm run check`, Python backend-test, PHP syntax, MySQL alleen geïsoleerd in CI, mailsafety, offline preview zonder netwerk, Playwright browsercontrole. Regressietests voor berekeningen en 2026/2027, no-contact gratis gebruik, leaddata/consent en alle e-mailstatussen.
4. Visual review voor 1366×768, 1440×900, 390×844, 320×568, tablet. Controleer **CTA-geometrie binnen viewport**, geen fake cijfers, contrast, keyboard/ESC, knopstates, foutmeldingen. Screenshot zonder PII.
5. Omdat `main` auto-deployt: geen publiek werkende e-mailverzending activeren voordat juiste Hostinger-mailconfig en eigenaar-test geslaagd zijn. Geen credentials in issue, logs of chat; raak private MySQL-config/keys niet aan.
6. Update docs/README/privacy en laat eigenaar met een kleine acceptatiecheck het resultaat beoordelen. Daarna pas issue #3 voor optionele consumentenaccounts en plan synchroniseren; **niet** in huidige scope.

**Definition of Done:** vier eigenaarwensen opgeleverd in één premium consistente flow, bestaande leadopslag en rekenlogica veilig, rapportmail uit totdat beschikbaarheid/veiligheid bevestigd zijn, testbewijs en PR beschikbaar.

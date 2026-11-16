# WattGoedkoper — agentregels, actuele productie en leesvolgorde

## Nieuw eigenaarbesluit — 16 november 2026 | nieuwsbrief met één klik

De eigenaar wil **geen** dubbele e-mailverificatie meer voor nieuwsbriefaanmelding. Na een daadwerkelijk door de SMTP-server geaccepteerd rapport kan de bezoeker via één afzonderlijke expliciete keuze **meteen** abonnee worden. De API bindt het gekozen adres aan het eerder verzonden rapport via een tijdelijke HMAC in dezelfde sessie, bewaart versleutelde toestemmingstekst/versie/bron/tijd en biedt de bestaande afmeldroute. Rapportmail alléén blijft zonder marketingtoestemming. Oude onbevestigde tokens mogen nog aflopen; de nieuwe route verzendt geen bevestigingsmail. Rechtspersoon NIVO Groep Holland B.V.; de bestaande `newsletter_optin_enabled` blijft ongewijzigd.

## Actuele eigenaarsverklaring — 16 november 2026

De eigenaar bevestigde dat **WattGoedkoper een initiatief van NIVO Groep Holland** is. De rechtspersoon is publiek verifieerbaar als **NIVO Groep Holland B.V.**, KvK **95227768**, Lireweg 52, 2153 PH Nieuw-Vennep. Publieke privacycontacten: `info@wattgoedkoper.nl` en het officiële `info@nivogroepholland.nl`. De consumentrapportmail is door de eigenaar daadwerkelijk in de inbox ontvangen; de rapportbevestiging en oorspronkelijk double-opt-in nieuwsbriefmodule zijn via PR #46/#47 live getest (historisch, nu vervangen door single opt-in). **De nieuwsbrieffunctie is inmiddels door de eigenaar privé ingeschakeld** (code-default blijft UIT); oude rapportadressen nooit automatisch als abonnee inschrijven. GSC, verse private operationele controle en commerciële eind-GO blijven open. Oudere statusnotities hieronder zijn historisch, niet opnieuw uit te voeren.

## Definitieve afsluitopdracht — 16 november 2026

**Actuele bron van waarheid voor alle nieuwe agents:** [HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md](docs/HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md), [SEO-LANDING-FACTORY-PLAYBOOK.md](docs/SEO-LANDING-FACTORY-PLAYBOOK.md) en [START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md](docs/START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md). Deze **overrulen de oudere opsomming van P0-back-up/restore als harde groeiblokkade**; historische code- en productiebewijzen blijven geldig.

**Missie:** WattGoedkoper afronden als zelfstandig gehoste SEO-tool/leadsite: gratis GSC-property + sitemapindexatiecontrole, werkende aparte rapportmail met eigen-inboxbewijs, duidelijke mobiele en desktop SEO→tool→vrijwillige NIVO-funnel, correcte exploitant/privacy, gezonde bestaande NIVO-mail/cron en minimale overdracht. SEO-clicks en rankings zijn niet vooraf vereist. Na eigenaar-go: afsluiten als lancering/overdracht en de **volgende unieke** SEO-leadsite bouwen, niet opnieuw langdurig investeren in Sodium/proc_open of extra dashboards.

**Uitvoerregel:** bewijsrijke, kleine PR's, nieuwe code alleen als die verkeer/tooldoorloop/leads bevordert, behoud bestaande secrets, consent, gegevens en cron. Beslissingen en open eigenaarstaken documenteren in issue #14; geen nieuwe betaalde connectors.



## Leidend eigenaarbesluit — GROWTH FIRST (16 november 2026)

**WattGoedkoper is primair een commerciële, premium leadgenerator voor NIVO Groep Holland; geen bank, eigen CRM of beveiligingsplatform.** De grootste actuele knelpunten zijn gebrek aan bewezen organisch verkeer (gratis GSC-property/echte zoekdata ontbreekt) en de nog **uitgeschakelde consumentenrapportmail**. De werkende energiehuistool, NIVO-only SMTP, MySQL, één cron en dashboard zijn al bewezen; herbouw ze niet.

**Actieve prioriteitsvolgorde:** (P0) relevante SEO-instroom + Google Search Console, (P0) werkende rapportmail en landingspagina→Plan Studio→vrijwillige NIVO-lead, (P1) meten en conversie/inhoud optimaliseren, (P2) beperkt passend onderhoud. Iedere nieuwe code-PR moet concreet verkeer, toolgebruik of kwalitatieve adviesaanvragen bevorderen. Geen traject van dagen voor een extra securityfunctie zonder aantoonbaar commercieel of werkelijk operationeel probleem.

**Sodium / `proc_open`: geparkeerd als technische schuld.** Live backup-preflight is een NO-GO voor de eigen optionele exporter, maar dat blokkeert **niet** het bouwen van SEO-pagina's of een complete consumentenjourney. Niet opnieuw beginnen aan crypto/CLI-alternatieven. Inventariseer eventueel bestaande Hostinger-native backups bij regulier onderhoud; leg operationele beperkingen eerlijk vast. **Behoud** wachtwoorden uit Git, bestaande AES-bescherming, privacy/AVG-minimum, juiste toestemming, anti-spam, toegang en de werkende NIVO-leadroute.

**Nieuwe leidende roadmap:** [docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md](docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md) (op 16 nov commercieel herprioriteerd). De eerdere P0-back-up/restoreparagrafen en security-runbooks hieronder dienen als **historisch bewijs**, niet als opdracht om daar eerst mee verder te gaan.



**Actuele productieacceptatie (16 november 2026):** `main` = `d1685bed065445dfc40a8fd40ae8e71adf178636`. PR's **#37, #38 en #39 zijn gemerged**; publieke Hostinger-releasepariteit **16/16 PASS**, backend/MySQL/quality en premium-browserreview beide PASS. De gratis premium tool, beveiligde MySQL/API, één bestaande Hostinger `*/5`-operationscron en vrijwillige NIVO-only SMTP-leadmachine blijven functioneel live, zonder herinstallatie. De eigenaar verifieerde `php scripts/ops-readonly.php`: twee gescheiden succesvolle cronmomenten (`2026-11-16T00:10:03Z`, `00:15:02Z`), `cron.status=fresh`, private **`operations_monitor_enabled=true`**, geen warnings/fouten, één geaggregeerde `smtp_accepted`-outboxregel en nul pending/failed. `php scripts/report-preflight.php` bevestigde mailconfig aanwezig, maar **`report_mail_enabled=false`**. **Back-upstatus blijft `not_verified`**. Echte Hostinger-export+geïsoleerde restore/offsite, individuele SMTP-testleadstatus, privacy/juridische aftekening, consumentrapport-inbox en gratis GSC-cijfers zijn dus nog open. **Leidende feitelijke bewijsbron:** [docs/PRODUCTION-ACCEPTANCE-2026-11-16.md](docs/PRODUCTION-ACCEPTANCE-2026-11-16.md).

**P0 backupvoorcontrole nu uitgebracht (16 november 2026):** PR [#40](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/40) is gemerged (`main fe7ab7d`), met [19/19 live Hostinger beveiligingschecks PASS](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43781069670) en 18 synthetische no-write-preflightcontroles in CI. Bevoegde eigenaar moet de nieuwe `php scripts/backup-preflight.php --directory=/ABSOLUUT/VEILIG/PAD` **nog daadwerkelijk op Hostinger uitvoeren**. `readyToAttemptBackup:true` betekent alleen dat de technische randvoorwaarden aanwezig zijn, **niet** dat een productiearchief is gemaakt of een restore is gelukt. Gebruik nooit een eerste-installatiescript, laat de enige cron en NIVO-SMTP-leadroute ongemoeid en publiceer geen geheimen of persoonsgegevens.

**P0-actuele SSH-uitkomst (16 november 2026, 00:59:06 UTC):** de nieuwe `backup-preflight.php` werkte en meldde `readyToAttemptBackup=false` door **`SODIUM_UNAVAILABLE`** en **`PROC_OPEN_UNAVAILABLE`**. Private configuratie/permissies, PDO MySQL, `mysqldump` en veilige `wg-backups`-map zijn aanwezig; er is **geen** productiearchief gemaakt. Begin nu met alleen-lezen inspectie van PHP CLI-versies, `sodium` in hPanel en beschikbare cryptografische CLI-programma's. **NOOIT** het bestaande PHP-exportcommando uitvoeren zolang preflight niet groen is; geen plaintext SQL, geen ongeteste aanpassing aan `disableFunctions`, geen sleutelrotatie. Zie [P0-herstelrunbook](docs/BACKUP-RECOVERY-RUNBOOK.md) en [productiebewijsregister](docs/PRODUCTION-ACCEPTANCE-2026-11-16.md).

**Leidende overdracht:** [docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md](docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).  
**Nieuwe roadmap:** [docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md](docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).  
**Volgende agent:** [docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md](docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md).  
**Regie:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14), [#21–#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21). De oudere overdracht, oude roadmaps en v0.5–v0.9 plannen zijn **historische ontwerp-/releasegeschiedenis**, niet de huidige productiestatus.

## Verplichte leesvolgorde

1. Actuele GitHub-`main` en dit `AGENTS.md`.
   **Lees daarna meteen [het actuele bewijsregister](docs/PRODUCTION-ACCEPTANCE-2026-11-16.md) en [veilige herstelprocedure](docs/BACKUP-RECOVERY-RUNBOOK.md); historische overdrachten zijn niet de huidige externe acceptatiestatus.**
2. `docs/HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md`.
3. `docs/ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md`.
4. `docs/backend.md`, `docs/OPERATIONS-RUNBOOK-V1.md`, `docs/NIVO-DELIVERY-CONTRACT-V1.md` en `docs/NIVO-SMTP-PRODUCTION-RUNBOOK.md`.
5. Issues #14, #21–#26 en de daadwerkelijke recente GitHub Actions-workflows; daarna de relevante broncode.

## Vaststaande productregels

- De homepage blijft een **premium interactief energiehuis** met woning, visuele maatregelen en Plan Studio, geen goedkoop formulier. De bezoeker kan gratis berekenen, vergelijken, bewaren op eigen apparaat en terugdraaien zonder account, e-mail, advies of tracking.
- Vijf maatregelen: slim gebruik, isolatie, zonnepanelen, hybride warmtepomp en thuisbatterij. Bestaande installaties niet met nieuw gekozen maatregelen verwarren.
- De deterministische jaarberekening kent aparte rekenjaren, variabele kosten, budget- en negatieve-uitkomstwaarschuwingen. Dag-/nachtweergave is illustratief, niet een uur- of opbrengstvoorspelling. Gebruik geen gegarandeerde besparing, rendement, subsidies of energietarieven.
- **Alle nieuwe vrijwillige adviesaanvragen uitsluitend naar NIVO Groep Holland** met expliciete en server-side afgedwongen, standaard uitgevinkte `2026-11-v2` toestemming. Geen partnerkeuze, extra ontvangers of omzet-/sales-mailcampagne. Historische partners en consent ongemoeid.
- De actuele, **door eigenaar ingeschakelde** SMTP-route loopt van `info@wattgoedkoper.nl` naar exact `portal@nivogroepholland.nl`; de onafhankelijke `report_email` is **geen** NIVO-lead of toestemming voor marketing/analytics en moet nog apart eind-tot-eind worden geverifieerd.
- Losse mailinglijst-intekening is **geen** gevolg van een rapportmail. Alleen na een aparte, expliciete actieve klik ná een geaccepteerd rapport ontstaat een abonnee; een extra verificatiemail is niet vereist. De code-default van `newsletter_optin_enabled` is UIT, maar de eigenaar heeft de featureflag op de huidige Hostinger-productie ingeschakeld. Geen automatische marketing, geen extra CRM, geen NIVO-adresdoorstroom vanuit de lijst.\n- Privacysparende, geaggregeerde analysetellingen alleen na losse opt-in. Niet presenteren als unieke bezoekers, bewezen attributie of Google Search Console-metingen zonder werkelijke data.
- Het oude WordPress-, drie-offertes-/partners- en €100-bonusconcept uit historische PDF's is nadrukkelijk **vervallen**; niet terugbrengen.
- Geen nieuwe betaalde tool/hostingupgrade, ongecontroleerde AI-massapublicatie of te optimistische juridische/financiële claims zonder akkoord en bronreview.

## Huidige technische architectuur

- Frontend: statische HTML, CSS, native ES-modules en lokale beelden/fonts; `assets/app.mjs`, `assets/model.mjs`, `assets/house-scene.mjs`, `assets/playground-model.mjs` en `assets/plan-ui.mjs`.
- MySQL/PHP: `api/index.php`, `lib/bootstrap.php`, `lib/delivery.php`, `lib/mail.php`, `lib/report.php`, `lib/operations.php`; private config en AES-sleutels **buiten de webroot**; SQLite compatibiliteit alleen voor tests/oudere installaties.
- Consentgebonden leaddatabase + transactionele `delivery_outbox` en uitsluitend **één** Hostinger-cron: `*/5 * * * *` → `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php`. Geen parallelle `maintenance.php`-/`deliver-leads.php`-cron.
- Beheer in `/admin/`: Overzicht, Aanvragen, SEO, Tools & status, gerichte aanvraagweergave met technische delivery, retry-guards en mail.
- Inhoud: `docs/seo-cluster-v08.json` en `scripts/build-content.py`; kennisclusters, canonicals, sitemap en contextuele gratis-tool-CTA's. Redactionele/wettelijke onderwerpen vereisen menselijk geverifieerde actuele bronnen.
- GitHub Actions: berekening/backend/MySQL/security, echte browserreview en [publieke live-HTTP-smoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43662312644) met 14/14 checks op `f3c273d`. Live-sourcesmoke bewijst geen veilige back-up of cron-heartbeat.

## Bewijsgrenzen en productieveiligheid

1. **NIET opnieuw** `scripts/setup-mysql.sh` of `scripts/setup.php` op de live site uitvoeren. Nooit productie-DB resetten, bestaande `config.php`/mailcredentials overschrijven of AES-sleutels roteren zonder goedgekeurd en bewezen migratie-/restoreplan.
2. Geen testcontactgegevens, privéscreenshots, mailboxinhoud, exports, passwords, tokens of private configuratie in GitHub/issues/CI/logs plaatsen. De testcode `WG-5510214770E3` is uitsluitend een technische referentie.
3. **NIVO SMTP werkt.** Niet opnieuw een tweede mailworker installeren of eerdere leads zonder toestemming verzenden. `smtp_accepted` betekent SMTP-serveracceptatie, **geen** API-ACK. De eigenaar bevestigde daarnaast afzonderlijk feitelijke inboxontvangst voor één test.
4. **NIVO Portal is nu alleen de NIVO-mailadresbestemming**, niet een aangesloten geauthenticeerde NIVO Portal REST API. De toekomstige HTTPS-adapter blijft uit tot expliciet contract en go.
5. Back-up/restore, foutalert, operationele heartbeat over meerdere runs, rapportmailontvangst, juridisch exploitant/privacybewijs en GSC-indexatie zijn **niet bewezen**; maak deze P0/P1-taken transparant.
6. Voer inspecties read-only uit tenzij de eigenaar gerichte wijzigingen heeft goedgekeurd. Werk in branches/PR's, voer testen uit, leg reële bewijzen vast en merge pas na geldende eigenaar-go. Geen force-push of ongevraagde productieuitrol.

## Volgende prioriteit (niet opnieuw bouwen wat werkt)

**P0:** herstelbare Hostinger MySQL + privatesleutel-back-up; herhaalde cron-heartbeat en waarschuwingen; individuele bezorgstatus van proefaanvraag bekijken en eventueel gericht opruimen; privacy/exploitant, gegevensoverdracht en toegangsbeveiliging verifiëren.  
**P1:** afzonderlijke transactionele consumentenrapportmail testen; gratis GSC-property verbinden/echte SEO-baseline; hoogwaardige SEO-content en funnelcontext uit echte waarnemingen verbeteren.  
**P2:** privacyvriendelijke KPI's, duurzame SEO-groei en later eventueel een apart geautoriseerde NIVO Portal API-ontvanger.

**De eerste reactie van een nieuwe agent** moet de actuele code- en operationele status verifiëren, geen oude afgeronde vragen herhalen en vervolgens daadwerkelijk de volgende resterende prioriteiten uitvoeren. Zie [de startprompt](docs/START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md).

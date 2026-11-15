# WattGoedkoper — Finish Line v0.9 (historisch plan, huidige stand)

> **Deze oorspronkelijke v0.9-planning uit 14 november 2026 is grotendeels uitgevoerd.** De oude uitvoeringsnotities, voorwaardelijke PR-statussen en plannen waarin de NIVO SMTP-route “nog niet aan” stond zijn **vervallen**. De voorgaande planversie blijft via Gitgeschiedenis beschikbaar; dit bestand is een korte projecthistorische statusnotitie, **niet** de actuele volgende-stappenroadmap.

**Actuele bronnen van waarheid:**

1. [Productieoverdracht: leadmachine functioneel bewezen op 15 november](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).
2. [Roadmap resterende autonome leadgeneratie](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).
3. [Startprompt volgende agent](START-PROMPT-NEXT-AGENT-LEADGEN-2026-11-15.md).
4. [Regie-issue #14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14) en [eindacceptatie #26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26).

## Wat v0.9 daadwerkelijk heeft opgeleverd

- P0 MySQL-/SQLite-onderhoudsfix en regressies via [PR #28](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/28).
- Vierdelig eigen Dashboard 2.0 via [PR #29](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/29).
- Transactionele NIVO-outbox, API-contract en technische retries via [PR #30](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/30).
- Eén process-locked Hostinger-operationsrunner en monitoringstatus via [PR #31](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/31).
- Tweede kwaliteitsvolle SEO-cluster via [PR #32](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/32).
- Exact op NIVO gerichte SMTP-adapter via [PR #33](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/33).
- Dagelijkse externe Hostinger-release-/securitysmoke via [PR #34](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/34).
- Veilig synthetisch SMTP-testpad en lease-quarantaine via [PR #35](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/35).

Alle PR's zijn in `main` geïntegreerd. De codebaseline vóór de nieuwe documentatie-release was `f3c273dcffb03de05de13004fee410194ae659df`, met groene quality- en visuele CI plus een groene live Hostinger-pariteitscontrole.

## Productiemijlpaal

Op 15 november 2026 heeft de eigenaar de *gewone consumentenreis* getest. Testcode **`WG-5510214770E3`** stond rond **19:02** in het WattGoedkoper-dashboard en kwam rond **19:05** als automatische adviesmail binnen in de echte NIVO Portal-mailbox **`portal@nivogroepholland.nl`**. Hostinger hPanel had een enkele 5-minuten-`operations.php`-cron met succesvolle uitvoer, private NIVO SMTP-transportswitch op actief, en eerder waren een handmatige plus een synthetische SMTP-test aangekomen.

**NIVO SMTP-leadoverdracht werkt functioneel.** Er is geen live NIVO Portal REST API gekoppeld. Een generieke `smtp_accepted` status is niet gelijk aan een technische inbox-/API-ACK.

## Wat nog open is (niet als voltooid claimen)

- Beveiligd **MySQL + private sleutelbackup én afgeschermde restoretest**.
- **Per-lead `smtp_accepted`** van de testaanvraag en meerdere cron-heartbeatmomenten; echte monitor opt-in/alerts.
- Individuele consumentenrapportmail als **apart transactioneel pad** daadwerkelijk live testen en expliciet vrijgeven.
- Exploitant/privacygegevens, NIVO-verwerkingsafspraken, SPF/DKIM/DMARC en autorisatie aftekenen.
- Gratis Google Search Console-property, daadwerkelijke indexatie/zoekopdrachten en zinvolle lead-KPI's; geen betaalde GSC Wizard-upgrade.
- Definitieve over-all eigenaaracceptatie via #26.

**Nieuwe agents moeten dit document niet als een nog uit te voeren implementatieplan behandelen.** Ga verder met de nieuwe roadmap en behoud de werkende live database, keys, NIVO-mail en Hostinger-cron.

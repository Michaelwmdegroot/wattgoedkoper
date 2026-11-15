# WattGoedkoper Hostinger-deployment — actuele situatie

**Stand 15 november 2026:** Hostinger serveert de `main`-gebaseerde PHP/MySQL-site. Het premium energiehuis en het NIVO SMTP-leadpad zijn functioneel live. De oorspronkelijke WordPress-/migratie-/eerste-installatieinstructies uit deze pagina zijn achterhaald; via Gitgeschiedenis kan men die teruglezen. Dit document is nu **alleen** een actuele release-/rollbackreferentie.

## Deployroute

- Repo [Michaelwmdegroot/wattgoedkoper](https://github.com/Michaelwmdegroot/wattgoedkoper) → Hostinger Git-deploy van `main`.
- Documentroot: `/home/u886757484/domains/wattgoedkoper.nl/public_html`.
- Code: statische HTML/CSS/ES-modules + PHP 8.2+/PDO MySQL. Geen nieuwe WordPress of Node-productiebuild.
- Privé: `/home/u886757484/domains/wattgoedkoper.nl/wattgoedkoper-private` bevat bestaande serverconfig en beveiligde sleutels. **Een code-deploy mag deze map nooit vervangen.**
- Live codebaseline vóór de nieuwe documentaire overdracht: `f3c273dcffb03de05de13004fee410194ae659df` (PR #35).
- Na `main` push draait de [extern read-only live smoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43662312644): actuele frontend/backend-source-fingerprint, API/MySQL health, SEO-routes en private-padafscherming. Deze workflow was op baseline **14/14 groen**. Verifieer voor nieuwe commits de actuele workflow.

## Behoud bij een release

- Bestaande MySQL-leadtabel, AES-sleutel, consentrecords, `delivery_outbox` en alle relevante persoonsgegevens intact laten.
- De **geactiveerde** NIVO-mailroute naar `portal@nivogroepholland.nl` niet opnieuw installeren of uitschakelen zonder incidentaanleiding en eigenaar-go.
- Slechts één Hostinger-cron: `*/5 * * * *` → `/usr/bin/php /home/u886757484/domains/wattgoedkoper.nl/public_html/scripts/operations.php`.
- Geen `scripts/setup-mysql.sh`, geen `scripts/setup.php`, geen nieuwe mailsetup of oude WordPress-migratie.
- CI quality/browser en live smoke controleren; daarna werkelijk dashboard met status/heartbeat nalopen.
- Back-up **en** veilige restore moeten eerst nog als operationele P0 worden afgetekend, niet uit GitHub CI afleiden.

## Huidige feitelijke milestone

De gewone testadviesaanvraag `WG-5510214770E3` verscheen rond 19:02 in het dashboard en rond 19:05 in de NIVO-inbox met dezelfde code. Daarmee is één live E2E-leadketen bevestigd. Individuele SMTP-status, langdurige heartbeat, rapportmail naar consument, wettelijke/privacygegevens en GSC-prestaties blijven aparte controlepunten.

## Bij incidenten

Geen database-reset of terugzetactie met een oude MySQL-dump over nieuw ontvangen leads. Zet code alleen gecontroleerd terug na beoordeling van schema-/outboxcompatibiliteit; stop of pauzeer transport/cron uitsluitend met eigenaarbesluit wanneer nodig. Bewaar private sleutels en auditstatus intact. Volg [operationeel runbook](OPERATIONS-RUNBOOK-V1.md) en [actuele overdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md).

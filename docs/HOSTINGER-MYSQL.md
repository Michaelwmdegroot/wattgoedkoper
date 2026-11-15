# Historische Hostinger MySQL-eerste installatie — NIET opnieuw uitvoeren

> **ACTUEEL 15 november 2026:** de WattGoedkoper-productie-MySQL staat al lang ingericht en verwerkt echte vrijwillige adviesaanvragen. De eigenaar heeft het admin-dashboard, de gescheiden private configuratie en een end-to-end automatische NIVO-inboxlevering aangetoond. Een nieuwe `scripts/setup-mysql.sh`-installatie of `scripts/setup.php`-SQLite-initialisatie op deze live site is **VERBODEN**. De voorgaande installatietekst uit 14 november is als historische Gitrevisie beschikbaar, maar is **geen uitvoerinstructie** voor huidige productie.

Huidige public_html: `/home/u886757484/domains/wattgoedkoper.nl/public_html`. Private data/config: `../wattgoedkoper-private/`. PHP CLI: `/usr/bin/php` (versie 8.2.35 bij laatste eigenaarcheck).

**Wat je wél mag doen:** beveiligde **read-only** health- en databasepariteitscontrole; back-up en **afgeschermde restoretest** na eigenaar-go, met behoud van de bestaande AES-encryptiesleutel en actuele klantdata. Nooit private config of export naar GitHub, issue, openbare screenshot of chat kopiëren.

Zie [actuele productieoverdracht](HANDOFF-LEADGEN-PRODUCTION-2026-11-15.md), [backend](backend.md), [operationsrunbook](OPERATIONS-RUNBOOK-V1.md) en [roadmap voor herstelbewijs](ROADMAP-AUTONOMOUS-LEADGEN-2026-11-15.md).

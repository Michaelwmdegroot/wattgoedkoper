# WattGoedkoper — MySQL-installatie op Hostinger

Status: voorbereid voor de nieuwe, aan wattgoedkoper.nl gekoppelde MySQL-database; op productie nog niet uitgevoerd.

## Waarom deze route

De eigenaar heeft op 14 november 2026 een aparte Hostinger-MySQL-database voor **wattgoedkoper.nl** gemaakt. De eerdere database stond onder Zonlio en mag niet worden hergebruikt. De bestaande backend gebruikte uitsluitend SQLite. Voor de nieuwe productie-installatie kiest de applicatie nu via **private configuratie** voor MySQL; SQLite blijft beschikbaar voor bestaande installaties en tests.

Deze wijziging **maakt geen database aan in Hostinger hPanel** en logt niet in op een account. Het installer-script initialiseert alleen tabellen in de reeds aangemaakte, expliciet geselecteerde lege MySQL-database na een geslaagde verbinding.

## Activeren (uitsluitend in de WattGoedkoper-hostingomgeving)

1. Controleer bij Hostinger → **Websites → wattgoedkoper.nl → Advanced → Git** of branch `main` op de huidige release staat. De Git-koppeling is al gemaakt.
2. Controleer PHP 8.2+ met `pdo_mysql`, `openssl` en `session` in de PHP-instellingen van wattgoedkoper.nl. `imap` is optioneel en pas nodig voor de e-mailclient. De Hostinger-databasehost is `localhost`.
3. Ga via **Bestanden → Bestandsbeheer → Terminal** (indien SSH beschikbaar) naar de map waar `index.html`, `api/`, `lib/` en `scripts/` van **wattgoedkoper.nl** naast elkaar staan. Controleer met `pwd` en `ls` dat het de juiste site is.
4. **Gebruik NIET het oude `php scripts/setup.php`**; dat maakt SQLite aan. Gebruik na deployment van de MySQL-versie:

   `bash scripts/setup-mysql.sh`

   Je mag `beheerder` door een eigen beheerdersnaam vervangen. De Bash-wrapper vraagt vervolgens afzonderlijk om de **MySQL-databasenaam**, de **MySQL-gebruikersnaam**, het **MySQL-wachtwoord** en een **nieuw beheerwachtwoord**. Hostinger schakelt PHP `system()` standaard uit; de Bash-wrapper gebruikt `read -s` en geeft de geheime waarden rechtstreeks aan PHP via stdin, zonder ze in de commandoregel of omgevingsvariabelen te zetten. Kopieer de exacte twee namen uit de database-instellingen van wattgoedkoper.nl. Geef **nooit** één van de wachtwoorden door in chat, GitHub, screenshots of commandoregelargumenten.
5. Het script controleert de verbinding en dat de database **leeg** is; het weigert bestaande tabellen en bestaande private appconfiguratie. Na succesvol aanmaken zijn er vier tabellen: `leads`, `daily_events`, `rate_limits` en `metadata`.
6. Controleer `https://wattgoedkoper.nl/api/index.php?action=health`. Verwacht `{"ok":true, ... "configured":true, "databaseReady":true}`. Dat controleert de werkelijke PDO-verbinding. Wanneer de database niet bereikbaar is, meldt de healthcheck dit zonder credentials prijs te geven.
7. Ga naar `https://wattgoedkoper.nl/admin/`, log in met de gekozen beheernaam en het nieuwe beheerwachtwoord. Verstuur **een zelfgekozen testaanvraag** via het energiehuis; controleer of hij in het dashboard staat en verwijder hem na controle.
8. Bevestig HTTPS, cookies, toegangsbeveiliging van `lib/`, `scripts/`, `tests/`, `docs/`, `preview/`, de dagelijkse onderhoudstaak en een offsite-backupstrategie. De MySQL-data **én** private `config.php` (inclusief encryptiesleutel) zijn nodig voor herstel.
9. Voor de e-mailclient, **pas na bevestiging dat de correcte mailbox bestaat**, voer je optioneel `bash scripts/setup-mail.sh` uit. Het script vraagt uitsluitend het mailwachtwoord via de terminal. Test met één eigen bericht.

## Belangrijke beveiligingsgrenzen

- De MySQL-gebruikersnaam, database en het wachtwoord worden uitsluitend in de private config **buiten de webroot** opgeslagen met bestandstoegangsrechten 0600. De databasehost staat vast op localhost. De site deelt niets met Zonlio.
- Er is geen ingelogd consumentaccount of cloudopslag van energieplannen in deze wijziging; dit volgt in een apart productissue met eigen autorisatie, migraties en AVG-toets.
- De bestaande adviesgegevens blijven AES-256-GCM-versleuteld in de MySQL-payload opgeslagen. De encryptiesleutel mag nooit worden kwijtgeraakt bij het opnieuw deployen.
- Er is **geen automatische migratie** van eventuele bestaande SQLite-leads; dit pad is bedoeld voor een verse MySQL-installatie voordat er echte productiegegevens zijn verzameld.
- De installer doet geen automatische reset. Bij een gedeeltelijke installatie eerst de tabellen en de private configuratie controleren; voer niet blind opnieuw uit.

## Checks

CI test `npm test`, `npm run check`, bestaande SQLite-integratietests, mailsafety en nieuwe MySQL-integratie op een tijdelijke database. Productieverbinding, daadwerkelijke leadopslag en SMTP/IMAP-aflevering vereisen een aparte live rooktest.

## Officiële Hostinger-naslag

- MySQL-databasenaam en -gebruiker: https://www.hostinger.com/support/1583552-how-to-find-your-mysql-database-details-in-hostinger/
- Terminal in Bestandsbeheer: https://www.hostinger.com/support/how-to-use-the-terminal-in-hostinger-file-manager/
- GitHub-implementatie: https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/

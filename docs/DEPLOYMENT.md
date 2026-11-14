# Hostinger deployment — hervatdocument

Doel: `https://wattgoedkoper.nl/`, bron `Michaelwmdegroot/wattgoedkoper`, branch `main`.

## Huidige toestand

- Repository bevat een complete rechtstreeks serveerbare HTML/CSS/JS/PHP-release.
- Op 14 november 2026 heeft de gebruiker een Hostinger-screenshot gedeeld met **Implementatie voltooid** voor wattgoedkoper.nl en de repository wattgoedkoper. GitHub is dus al gekoppeld en de web-deployment is door Hostinger bevestigd.
- De daadwerkelijke PHP-runtime, documentroot, private configuratie en lead-API-gezondheid zijn in deze sessie **nog niet op de livehost bevestigd**.
- De gebruiker heeft een database met de naam wattgoedkoper getoond, maar het bijbehorende Hostinger-scherm vermeldt **zonlio.nl**. Gebruik deze database niet zonder inspectie van de sitekoppeling.
- De gebruiker heeft een info@-mailbox aangemaakt; er is nog geen veilige serverconfiguratie voor info@wattgoedkoper.nl aangetoond.
- De codebase ondersteunt in branch 0.4 nu een optionele server-side inbox na afzonderlijke setup (zie OPERATIONS-V04.md). Geen DNS-wijzigingen of productiecredentials uitgevoerd in GitHub.

De bestaande GitHub-koppeling hoeft niet opnieuw gemaakt te worden. Bevestig eerst de hosting- en PHP-configuratie; vervolg daarna de operationele stappen en de geïsoleerde mailsetup.

## Waarom PHP/static

De huidige site gebruikt al PHP-hosting. Een lichte frontend plus PHP-API kan op dezelfde soort hosting draaien en vereist geen WordPress. Er is geen Node-runtime of frontendbuild in productie. PHP 8.2+, PDO MySQL, OpenSSL en een schrijfbare private map buiten de webroot moeten op de concrete hosting worden bevestigd. De nieuwe lege MySQL-database is door de eigenaar op wattgoedkoper.nl aangemaakt; de oude Zonlio-database blijft buiten gebruik.

Officiële Hostinger-documentatie:
- https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/
- https://www.hostinger.com/changelog/github-oauth-setup-for-git-deployments

## Uitvoeringsvolgorde voor bevoegde operator/agent

### 1. Inventarisatie en herstelpunt

Lees eerst de exacte website, hostingorder, documentroot, PHP-versie/extensies en actuele Git-instellingen uit. Gebruik uitsluitend wattgoedkoper.nl. Noteer bestaande URL's en belangrijke inhoud voor eventuele redirects.

Maak een volledige WordPress-bestanden- en databasebackup buiten de webroot. Controleer dat het archief leesbaar is en dat de database-export aanwezig is. Noteer terugzetpad, backupdatum en releasecommit. Bewaar geen credentials of databaseexports in Git.

Bij voorkeur een geïsoleerde staging/releasedirectory op het bestaande hostingplan gebruiken; geen plan of betaalde uitbreiding aanschaffen zonder aparte autorisatie. Een nieuwe commit over een WordPress-directory heen kopiëren verwijdert oude PHP-bestanden niet betrouwbaar en geldt niet als schone migratie.

### 2. Privacy-informatie en opvolging

Stel vast welke rechtspersoon de website beheert en welke privacycontactroute geldt. Werk `scripts/build-content.py` en `privacy.html` bij en verwijder de ontwikkelstatus pas wanneer deze gegevens waar zijn. Leg vast wie het dashboard opvolgt en wie welke geselecteerde partneraanvragen mag behandelen.

Deze release verstuurt geen e-mail en roept geen CRM aan. De gekozen partner is een werkvoorraadroute in het dashboard, geen stilzwijgende automatische gegevensoverdracht. Email/CRM vereist een aparte geconfigureerde integratie.

### 3. Code installeren en Git koppelen

Gebruik `main` uit de opgegeven repository als deploybron. Documentroot bevat `index.html` en `.htaccess` uit dezelfde release. Er is geen buildcommand nodig en geen `dist`-directory. Activeer de eerste release pas nadat oude WordPress-code buiten de documentroot is veiliggesteld.

Koppel de bestaande geautoriseerde GitHub-installatie van Hostinger aan de juiste repository en branch. Als OAuth/App-toestemming ontbreekt, is dat een echte aansluitvoorwaarde; nooit tokens uit andere projecten hergebruiken. Zet auto-deployment aan en lees de opgeslagen configuratie terug. Controleer de eerste deploy op de bedoelde commit.

### 4. Private configuratie

Voer voor de nieuwe Hostinger-database **`bash scripts/setup-mysql.sh`** uit zoals beschreven in `docs/HOSTINGER-MYSQL.md`. Draai niet eerst het oude SQLite-setupscript. Standaardopslag is `../wattgoedkoper-private/`, buiten de documentroot. Gebruik een uniek beheerderswachtwoord via veilige invoer; toon of commit dit nooit.

Back-ups moeten de MySQL-database én de encryptiesleutel/config samen bevatten en buiten Git blijven. Richt dagelijks onderhoud in via `scripts/maintenance.php`. Controleer retentie, back-uprotatie en herstel.

### 5. Live rooktest

- Landing, vijfstappenscan en voorbeeldplan openen op desktop en mobiel.
- Geen horizontale overflow; labels leesbaar; toetsenbordfocus en foutmeldingen bruikbaar.
- Rapportgetallen van één bekende fixture gelijk aan lokale testuitvoer.
- `health` meldt `configured:true`; niet alleen HTTP 200 controleren.
- Alleen een expliciete eigen testaanvraag (geen echte consument) versturen.
- Ontvangstnummer, gekozen partner en exacte toestemming in admin aantreffen; retry maakt geen duplicaat.
- Zonder login zijn aanvragen, statistieken en CSV ontoegankelijk.
- Dotfiles, `lib/`, `scripts/`, `tests/`, `docs/`, `preview/` en config/back-ups niet bereikbaar.
- HTTPS en canonieke www→non-www redirect werken; geen loop via proxy.
- Privacygegevens actueel; analytics uit totdat bezoeker instemt.
- Oude `/wp-admin/`, `/wp-login.php` en WordPress-plugins niet meer uitvoerbaar op de schone documentroot.
- DNS/MX/SPF/DKIM/DMARC zijn ongewijzigd tenzij een specifieke, gecontroleerde wijziging nodig bleek.

Pas hierna is productie operationeel. Noteer domein, releasecommit, testdatum, hostingidentificatie en herstelpunt in het project zonder geheimen.

## Herstel

Bij een fout: vorige documentroot/release en bijbehorende database uit het herstelpunt terugzetten. Private WattGoedkoper-leaddata (MySQL) en de private configuratie blijven buiten de Git-deploy en mogen niet worden overschreven. Geen force-push gebruiken om deploygeschiedenis te herschrijven.

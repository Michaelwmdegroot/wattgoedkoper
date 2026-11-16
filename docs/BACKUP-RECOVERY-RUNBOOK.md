# WattGoedkoper — veilig back-up- en herstelrunbook (P0)

**Bijgewerkt 16 november 2026 · #21 / #25 / #26.** De bestaande Hostinger-MySQL, versleutelde leadpayloads, private sleutels en NIVO-transport blijven ongewijzigd. **PR #37 met het herstelgereedschap is gemerged en de Hostinger-live smoke is geslaagd. Dat bewijst de uitgerolde code, NIET een geslaagde productieback-up of productierestore. De read-only voorcontrole wordt afzonderlijk ontwikkeld en moet vóór productie-export worden uitgerold en gemeten.**

## Veiligheidsvoorwaarden

- Voer **nooit** `scripts/setup-mysql.sh`, `scripts/setup.php` of een restore/import op productie uit. Gebruik de bestaande private config, sleutels, MySQL en ene 5-minuten-cron zoals ze zijn.
- Alleen een beheerder met Hostinger-terminaltoegang mag de **handmatige** export starten. Het gereedschap schrijft niet naar de database en stuurt geen mail. Het exporteert wel **huidige persoonsgegevens in versleutelde vorm**: behandel ieder archief als strikt vertrouwelijk.
- Nodig op Hostinger CLI: PHP 8.2+, `sodium`, `pdo_mysql`, `proc_open` en `mysqldump` of `mariadb-dump`. Als een functie ontbreekt: **stop en meld dat**, niet proberen te omzeilen via een onbeveiligd SQL-bestand.
- Het exportscript versleutelt tijdens het lezen: XChaCha20-Poly1305 secretstream met Argon2id-afgeleide sleutel, authenticatie per blok en eindmarkering. De dump gaat **niet** als onversleuteld SQL-bestand naar schijf. Een tijdelijk `0600` MySQL-clientprofiel staat in de bestaande privémappenstructuur; dit wordt in het normale uitvoerpad opgeruimd.
- De ongewijzigde `config.php` (incl. originele AES- en HMAC-sleutel, DB-inloggegevens) en, indien aanwezig, `mail-config.php` zitten in hetzelfde **versleutelde** herstelarchief. Verlies van de aparte wachtzin betekent dat dit archief niet bruikbaar is.

## Onafhankelijk CI-herstelbewijs (fictieve data)

Op PR #37 is behalve de cryptografische integriteitstest ook een **volledige MySQL-herstelketen op een tijdelijke GitHub Actions MySQL 8-testservice** geslaagd: een fictieve versleutelde lead → echte `mysqldump` → direct versleuteld `.wgbk`-archief → authenticatie → uitpakken buiten de applicatie → import in **een aparte nieuwe testdatabase** → volledige teruglezing met de oorspronkelijke ongewijzigde AES-sleutel. Geen productieverbinding, persoonsgegevens of private Hostinger-config gebruikt. Zie [CI-uitvoering](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43753633161) en `tests/backup_mysql_roundtrip_test.php`.

Dit bewijst de programmeerbare roundtrip **in CI**, maar bewijst nadrukkelijk **niet** dat de bestaande Hostinger-productiedatabase is geback-upt, dat de Hostinger CLI alle vereiste programma's aanbiedt, dat off-site bewaring werkt of dat herstel van echte productiegegevens is gelukt. De vier externe gates onderaan blijven open.

## 0. Hostinger-gereedheid vaststellen vóór enige export

Na review, merge en Hostinger-deployment van de [back-upvoorcontrole-PR](https://github.com/Michaelwmdegroot/wattgoedkoper/pulls) is het nieuwe **alleen-lezen** commando:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php scripts/backup-preflight.php --directory=/home/u886757484/domains/wattgoedkoper.nl/wg-backups
```

**Maak de map eerst aan** als die ontbreekt, met `mkdir -m 700 /home/u886757484/domains/wattgoedkoper.nl/wg-backups`. Maak nooit een back-upmap binnen `public_html`. Controleer of de map inderdaad `0700` is.

De voorcontrole maakt **geen archief, mail of databaseverbinding** en verandert geen bestanden. Hij controleert uitsluitend: bestaande valide private MySQL-config, `0700` privémappen/`0600` private configbestanden, PHP-sodium/Argon2id, PDO MySQL, `proc_open`, een uitvoerbare `mysqldump`/`mariadb-dump` op `PATH`, een exclusieve veilige back-upmap buiten webroot en eventuele achtergebleven tijdelijke MySQL-clientcredentials (alleen een waarschuwing, nooit inhoud tonen of automatisch verwijderen). De JSON bevat **geen paden, gebruikersnamen, sleutel- of wachtwoordwaarden**.

De output `readyToAttemptBackup:true` is uitsluitend een **prerequisite-GO** om een éénmalige handmatige versleutelde export te proberen; het bewijst **niet** dat de exporter daadwerkelijk MySQL mag lezen, dat er voldoende ruimte is, of dat de archiefinhoud herstelbaar is. De velden `archiveCreated`, `archiveAuthenticated` en `isolatedRestoreVerified` blijven in deze controle **altijd `false`**, ook bij volledig groen resultaat.

Als `readyToAttemptBackup:false`: **stop**, publiceer uitsluitend de generieke `issues`-codes en laat geen oude installatiescripts of onbeveiligde SQL-export draaien.

| Veilige code | Betekenis / actie |
|---|---|
| `PRIVATE_MYSQL_CONFIG_UNAVAILABLE` | Bestaande private MySQL-config ontbreekt of is ongeldig; **niet** resetten of opnieuw installeren |
| `PRIVATE_PERMISSIONS_REVIEW` | Rechten van bestaande private map/config/mailconfig laten nakijken; niets blind overschrijven |
| `SODIUM_UNAVAILABLE`, `PDO_MYSQL_UNAVAILABLE`, `PROC_OPEN_UNAVAILABLE` | Benodigde PHP-functie ontbreekt; controleer Hostinger PHP-CLI, niet de website of credentials |
| `MYSQL_DUMP_BINARY_UNAVAILABLE` | MySQL-clientexporter niet vindbaar op `PATH`; niet met plaintext SQL improviseren |
| `BACKUP_DIRECTORY_UNSAFE_OR_MISSING` | Maak een aparte `0700` map **buiten** de webroot; geen symlinks of publieke permissies |
| `TEMP_MYSQL_CREDENTIAL_FILE_REVIEW` | Mogelijk tijdelijke credentiebestanden van een onderbroken export; eerst veilig onderzoeken, niet in issues tonen of automatisch verwijderen |

**Nog niet uitgevoerd:** deze Hostinger-preflight, feitelijke versleutelde productie-export, off-site kopie en geïsoleerde restore. Een groene GitHub CI-suite met fictieve data vervangt geen van deze vier bewijzen.

## 1. Eén beveiligde productie-export

Controleer via de bestaande Hostinger SSH-terminal eerst **zonder klantdata af te drukken**:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php -r 'echo extension_loaded("sodium") ? "sodium OK\n" : "sodium MISSING\n";'
php -r 'echo function_exists("proc_open") ? "proc_open OK\n" : "proc_open MISSING\n";'
command -v mysqldump || command -v mariadb-dump
```

Maak een eigen map **naast** `public_html`, niet erin (pad is voorstel en moet bestaan/schrijfbaar zijn voor de Hostinger-gebruiker):

```sh
mkdir -m 700 /home/u886757484/domains/wattgoedkoper.nl/wg-backups
```

Kies een **nieuw** archiefpad, bijvoorbeeld:

```sh
bash scripts/backup-safe.sh create /home/u886757484/domains/wattgoedkoper.nl/wg-backups/wattgoedkoper-20261116-01.wgbk
```

De wrapper vraagt de herstelwachtzin **zonder echo** en tweemaal ter bevestiging (minimaal 20 tekens). Bewaar die **apart** in een wachtwoordmanager, niet op dezelfde server, in Git, scripts, chat of logs. Bestaande archieven worden niet overschreven. Het script meldt alleen of het archief is aangemaakt; een succesvolle code-exit bewijst nog geen restore.

Als alleen `mariadb-dump` beschikbaar is: beheerder kan na review de CLI rechtstreeks met `--dump-binary=mariadb-dump` gebruiken, met herstelwachtzin via veilige STDIN; dit pad is nog niet op Hostinger getest. Geen ongecodeerd wachtwoord in commandoregel, shellhistory of omgevingsvariabele.

## 2. Onafhankelijke verificatie en off-site bewaring

```sh
bash scripts/backup-safe.sh inspect /home/u886757484/domains/wattgoedkoper.nl/wg-backups/wattgoedkoper-20261116-01.wgbk
```

De inspectie moet `authenticated:true`, `configIncluded:true`, `sqlBytes>0` en (indien mailconfig aanwezig) `mailConfigIncluded:true` melden. Dit authenticeert de hele export inclusief laatste blok zonder gegevens weer te geven. Bewaar een **versleutelde kopie buiten Hostinger** bij voorkeur met versiebeheer/retentie en gescheiden wachtzin. Denk aan een vooraf goedgekeurde beschermde opslagplek; configureer geen betaalde dienst zonder akkoord.

**Let op:** het controleren van de archiefintegriteit is nog **geen** geslaagde import of leesbare sleuteltest.

## 3. Echte hersteltest uitsluitend op een geïsoleerd systeem

Gebruik een **apart systeem**, met een aparte, lege MySQL-testdatabase en zonder actieve WattGoedkoper-productieconfig of inkomende publieke requests. Kopieer alleen het versleutelde archief over een beschermd kanaal. Voor uitpakken:

```sh
mkdir -m 700 /absolute/isolated/recovery
bash scripts/backup-safe.sh extract /absolute/pad/back-up.wgbk /absolute/isolated/recovery
```

`extract` weigert een bestaande WattGoedkoper-private productieconfig, webroot-/openbare map en niet-lege uitvoermap. Het controleert **eerst het complete archief** en maakt daarna uitsluitend `config.php`, eventueel `mail-config.php` en `database.sql` aan met `0600` rechten. Dit bevat nu **ontsleutelde persoonsgegevens en sleutels**: nooit naar een gedeelde omgeving, screenshots, GitHub, CI of hostinglogs sturen. Versleutel/vernietig dit herstelmateriaal volgens de bewaartermijn.

Importeer het SQL-bestand **alleen in de afzonderlijke testdatabase**, met aparte testgebruikers en geen productieverbinding. Controleer tabellen, aantallen, outboxstatus en indien toegestaan uitsluitend een aangeduid *synthetisch* testrecord met de ongewijzigde AES-sleutel uit het archief. Documenteer of een volledige herstart met bestaande sleutels werkelijk mogelijk bleek; zet **geen** oude dump terug over nieuwe klantaanvragen.

## 4. Bewijsregister (alleen niet-gevoelige metadata)

| Gate | Benodigd bewijs | Status op 15 november |
|---|---|---|
| Archiveerbaar | Bestaande MySQL + private sleutels in nieuw `.wgbk`, tijdstip en beschermde opslag | **Open: nog geen live uitvoer** |
| Integriteit | `authenticated:true`, SQL aanwezig, config aanwezig | **Open: alleen fictieve CI-fixture getest** |
| Isolatieherstel | Import in afzonderlijke MySQL, tabellen/statussen, AES-leesproef met synthetische data | **Open: nooit op productie importeren** |
| Off-site continuïteit | Externe versleutelde kopie, gescheiden wachtzin, bewaarbeleid en eigenaar | **Open: eigenaar moet aftekenen** |

**Publiceer uitsluitend:** datum/tijd, technische pass/fail, niet-persoonlijke aantallen, geïsoleerde locatie *als type*, de bevoegde acceptant en eventuele generieke foutcode. **Nooit:** namen, emailadressen, telefoonnummers, versleutelde payloads, DB-dumps, originele configs, wachtzin, screenshots of mailboxinhoud.

Automatische Hostinger-back-ups moeten aanvullend op hun eigen bewaartermijn en herstelbaarheid worden gecontroleerd. Dit hulpmiddel vervangt geen hostingbackupbeleid of periodieke externe controle. Dit is geen tweede cron en wijzigt de bestaande operationele taak niet.

**Releaserichtlijn:** het versleutelde herstelhulpmiddel is op `main` uitgeleverd via #37. De aparte voorcontrole krijgt zijn eigen CI/PR. Productie-uitvoering uitsluitend door de bevoegde eigenaar. Zet API-`backup.status` pas van `not_verified` af als de echte isolatierestore is bewezen, nooit door alleen een succesvol CI-resultaat.
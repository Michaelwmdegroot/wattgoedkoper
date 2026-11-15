# WattGoedkoper — veilig back-up- en herstelrunbook (P0)

**15 november 2026 · #21 / #25 / #26.** De bestaande Hostinger-MySQL, versleutelde leadpayloads, private sleutels en NIVO-transport blijven ongewijzigd. **Deze PR bevat herstelgereedschap en synthetische tests, géén bewijs van een geslaagde productieback-up of productierestore.**

## Veiligheidsvoorwaarden

- Voer **nooit** `scripts/setup-mysql.sh`, `scripts/setup.php` of een restore/import op productie uit. Gebruik de bestaande private config, sleutels, MySQL en ene 5-minuten-cron zoals ze zijn.
- Alleen een beheerder met Hostinger-terminaltoegang mag de **handmatige** export starten. Het gereedschap schrijft niet naar de database en stuurt geen mail. Het exporteert wel **huidige persoonsgegevens in versleutelde vorm**: behandel ieder archief als strikt vertrouwelijk.
- Nodig op Hostinger CLI: PHP 8.2+, `sodium`, `pdo_mysql`, `proc_open` en `mysqldump` of `mariadb-dump`. Als een functie ontbreekt: **stop en meld dat**, niet proberen te omzeilen via een onbeveiligd SQL-bestand.
- Het exportscript versleutelt tijdens het lezen: XChaCha20-Poly1305 secretstream met Argon2id-afgeleide sleutel, authenticatie per blok en eindmarkering. De dump gaat **niet** als onversleuteld SQL-bestand naar schijf. Een tijdelijk `0600` MySQL-clientprofiel staat in de bestaande privémappenstructuur; dit wordt in het normale uitvoerpad opgeruimd.
- De ongewijzigde `config.php` (incl. originele AES- en HMAC-sleutel, DB-inloggegevens) en, indien aanwezig, `mail-config.php` zitten in hetzelfde **versleutelde** herstelarchief. Verlies van de aparte wachtzin betekent dat dit archief niet bruikbaar is.

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
bash scripts/backup-safe.sh create /home/u886757484/domains/wattgoedkoper.nl/wg-backups/wattgoedkoper-20261115-01.wgbk
```

De wrapper vraagt de herstelwachtzin **zonder echo** en tweemaal ter bevestiging (minimaal 20 tekens). Bewaar die **apart** in een wachtwoordmanager, niet op dezelfde server, in Git, scripts, chat of logs. Bestaande archieven worden niet overschreven. Het script meldt alleen of het archief is aangemaakt; een succesvolle code-exit bewijst nog geen restore.

Als alleen `mariadb-dump` beschikbaar is: beheerder kan na review de CLI rechtstreeks met `--dump-binary=mariadb-dump` gebruiken, met herstelwachtzin via veilige STDIN; dit pad is nog niet op Hostinger getest. Geen ongecodeerd wachtwoord in commandoregel, shellhistory of omgevingsvariabele.

## 2. Onafhankelijke verificatie en off-site bewaring

```sh
bash scripts/backup-safe.sh inspect /home/u886757484/domains/wattgoedkoper.nl/wg-backups/wattgoedkoper-20261115-01.wgbk
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

**Releaserichtlijn:** merge/deploy van dit herstelhulpmiddel pas na PR-/CI-review; productie-uitvoering uitsluitend door de bevoegde eigenaar. Zet API-`backup.status` pas van `not_verified` af als de echte isolatierestore is bewezen, nooit door alleen een succesvol CI-resultaat.
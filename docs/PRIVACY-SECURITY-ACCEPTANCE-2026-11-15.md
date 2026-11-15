# Privacy- en securityacceptatie — WattGoedkoper Finish Line

**Code-review 15 november 2026 · issues #21, #23, #25, #26.** Dit register is een controle van de actuele `main` bij overdracht (`f2bf35c`) plus de voorgestelde meetverbeteringen. Het is **niet** een onafhankelijke AVG-juridische verklaring, penetratietest of bewijs van configuratie op Hostinger. De bestaande publieke informatie is [privacy.html](../privacy.html); juridische entiteit en verwerkersafspraken zijn nog niet afgetekend.

## 1. In code getoetste waarborgen

| Controle | Gecontroleerde code / bewijsbron | Bevinding en grens |
|---|---|---|
| Vrijwillige adviesaanvraag | `lib/bootstrap.php:wg_validate_lead`, `api/index.php?action=leads` | Nieuwe leads vereisen expliciet `2026-11-v2`; server weigert partnerkeuzes anders dan uitsluitend NIVO. Historische gegevens worden niet herbestemd |
| Gescheiden rapportmail | `api/index.php?action=report_email`, `lib/report.php`, `tests/report_mail_test.php` | Geen adviesrecord/analytics-event bij rapport-only. Eigen flag, mailvalidatie, replay-preventie. **Niet bewezen op productie actief of ontvangen** |
| Privacyvriendelijke scan | `assets/model.mjs`, `assets/app.mjs`, `lib/bootstrap.php:wg_event` | Berekeningen lokaal en gratis; alleen losse opt-in aggregeert events, zonder persoonsgegevens. Claims over uniek bezoek of organisch per lead zijn niet verantwoord |
| Beveiligde leadopslag | `lib/bootstrap.php:wg_encrypt/wg_decrypt`, `wg_db` | AES-256-GCM en sleutels in private config buiten documentroot; geen zekerheid dat back-ups met sleutel herstelbaar zijn zonder echte restore |
| Toegang tot beheer | `lib/bootstrap.php:wg_auth/wg_session/wg_input`, `api/index.php` | Session-Cookie beveiligd, CSRF, exacte Origin, auth-gates, login-ratelimit, idle timeout. Extra MFA/rollen nog niet afgetekend |
| NIVO-ontvanger | `lib/delivery.php`, `docs/NIVO-DELIVERY-CONTRACT-V1.md` | Vaste SMTP-bestemming `portal@nivogroepholland.nl`, transactionele outbox, anti-dubbelverzending; geen geclaimde API-ACK |
| Retentie | `lib/bootstrap.php:wg_housekeeping`, `scripts/operations.php` | Applicatie bewaart leads standaard max. 90 dagen, rate-limitvensters circa 48 uur, aggregaten 400 dagen. **Hostinger-back-ups, mailproviderlogs, NIVO-dossiers en externe exports volgen eigen beleid** |
| Publieke afscherming | `.htaccess`, `scripts/.htaccess`, `api/.htaccess`, live smoke | Verwijzingen naar scripts/lib/tests/docs/private configuratie zijn geweigerd in eerder geslaagde HTTP-smoke; actuele prod serverinstelling niet van hieruit opnieuw afgetekend |
| Rapportheaders en transport | `lib/mail.php:wg_mail_send` | SMTP over geverifieerde TLS met vast Hostinger-hostadres, ontvanger- en headerinjectievalidatie; daadwerkelijke mailbox en SPF/DKIM/DMARC vereisen aparte DNS-/bezorgcontrole |
| Back-upveiligheid | PR [#37](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/37) | CI-back-up en testrestore met **fictieve** MySQL/AES-data uitgevoerd; echte Hostinger-back-up, offsite sleutelopslag en productierestore niet bewezen |

**Resultaat code-review:** bekende beschermingsmechanismen blijven aanwezig; er is **geen onafhankelijke juridische of operationele acceptatie**. Geen directe privacytekst of private instellingen wijzigen op basis van vermoedens.

## 2. Eigenaar / verantwoordelijke moet feitelijk aftekenen

Alle onderstaande punten zijn OPEN totdat de bevoegde persoon de feiten controleert en alleen niet-gevoelige bewijsmetadata documenteert:

- [ ] **Exploitant:** daadwerkelijke juridische verwerkingsverantwoordelijke van WattGoedkoper vaststellen met volledige handelsnaam, KvK, vestigingsland, bereikbaar privacycontact en relevante privacytekst. **Niet aannemen** dat NIVO automatisch exploitant is omdat het adviesmails ontvangt.
- [ ] **Rollen/doorgifte:** AVG-grondslag voor advies en rapport, verantwoordelijke/verwerkerrollen, ontvangende medewerkers bij NIVO, verwerkersovereenkomst(en) waar vereist, doelbinding en verwijderverzoeken bij doorgifte aftekenen.
- [ ] **Retentie buiten de app:** hostingaccesslogs, hostbackup, mailproviderlogs en NIVO-ontvangst-/CRM-retentie inventariseren; CSV-exportlokaties en bewaartermijnen beheren; herstel uit oude backups niet laten resulteren in onterechte herverwerking/verzending.
- [ ] **Beheerrechten:** geautoriseerde administrators, authenticatie/MFA waar beschikbaar, herstelinstructies, least privilege voor database en incidentele exporttoegang controleren. Geen wachtwoorden of sleutelwaarden naar GitHub kopiëren.
- [ ] **Maildomeinauthenticatie:** bestaande SPF, DKIM en DMARC voor `wattgoedkoper.nl` via Hostinger DNS en daadwerkelijke mailheaders laten controleren. Publiceer geen verzonnen records of overhaaste DNS-mutaties; controleer compatibiliteit met werkende SMTP.
- [ ] **Securityacceptatie:** actuele Hostinger PHP, TLS-certificaat, openbare privépaden, fail-closed report flag, rate limits en inhoudelijke toegang tot admin opnieuw op productie checken met beperkte read-only proeven.
- [ ] **Rapportmail en misbruik:** eigenaar laat één expliciet eigen testadres bezorgen; bevestig zichtbare schatting/caveats/CTA en vooral **geen** NIVO-advieslead, stat-opt-in of onbedoeld opslagrecord. Rapporteer alleen pass/fail.
- [ ] **Incident-eigenaar:** wie checkt cronalarm, SMTP-ONZEKER, mislukte hersteltest, datalekmelding en beveiligde opvolging? Leg bereikbaarheid en eerste acties vast.
- [ ] **GSC-eigendom:** Google-property en sitemap uitsluitend door bevoegd account; GSC-queries en clicks zijn niet gelijk aan CRM- of unieke-bezoekerdata.

## 3. Veilige acceptatiebeslissing

**Nog geen volledige GO.** De exploitant van de live site mag niet definitief als privacy-/security-gereed worden aangemerkt zolang de feitelijke exploitant, datastromen naar NIVO, offsite back-ups en echte hersteltest onbekend zijn. Broncode-tests en hPanel-weergaven zijn aanvullend bewijs, geen vervanging voor een formeel besluit.

Bevoegde acceptant kan bij een review **zonder persoonsgegevens** vastleggen: datum, naam/rol intern (niet publiek indien onnodig), eigen keuze GO/NO-GO per checklistpunt, generieke bron/reviewwijze en volgend controlemoment. Voor afwijkingen blijft issue [#26](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26) open.

**Releasegrens:** maak geen publieke belofte zoals “volledig AVG-proof” of “altijd afgeleverd”. Laat de werkende NIVO-SMTP-worker, één cron, sleutels en consent precies staan zoals ze zijn.

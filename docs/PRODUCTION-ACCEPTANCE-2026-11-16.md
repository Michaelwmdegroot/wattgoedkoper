# WattGoedkoper — bewijsregister productieacceptatie (16 november 2026)

**Leidende hoofdissue:** [#14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14). Deelissues: [#21 herstel](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/21), [#22 dashboard](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/22), [#23 NIVO-aflevering](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/23), [#24 SEO](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/24), [#25 monitoring](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/25), [#26 eindacceptatie](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/26).

Deze pagina registreert **feitelijke, al gedeelde waarnemingen** en scheidt productiebewijs van synthetische CI. Geen klantgegevens, e-mails, wachtwoorden, back-ups of private config worden in GitHub opgeslagen.

## A. Productierelease en technisch bewijs

- `main` op de verificatiedatum: `d1685bed065445dfc40a8fd40ae8e71adf178636`. PR's [#37](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/37), [#38](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/38), [#39](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/39) zijn gemerged.
- [Hostinger live smoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43774049582): **16/16 PASS**, inclusief codefingerprint, API/MySQL-health en publieke privépaden. De live smoke kan geen back-up, inbox of beheerconsole verifiëren.
- [Quality/PHP/MySQL CI](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43774049590): **PASS**, inclusief volledige export/import + AES-ontsleuteling met uitsluitend *fictieve* gegevens op tijdelijke GitHub CI-MySQL.
- [Premium browserreview](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43774049677): **PASS**.
- De consumententool, bestaande NIVO-leadmailer en ene Hostinger-vijfminuten-cron zijn tijdens deze code-uitrol niet opnieuw geïnitialiseerd.

## B. Werkelijke Hostinger-CLI-metingen van eigenaar

### Eerste observatie, 16 november 2026 om 00:08:47 UTC

`php scripts/ops-readonly.php`: `cron.status=fresh`; `monitorEnabled=false`; `lastSuccessAt=00:05:02Z`; `previousSuccessAt=00:00:04Z`; `observedDistinctRuns=2`; `ageSeconds=225`; `lastErrorCode=NONE`. De periode tussen twee successen is **4 minuten 58 seconden**.

`php scripts/report-preflight.php`: `configured=true`, `reportRequested=false`, `mailConfigPresent=true`, `smtpLibraryReady=true`, `reportEnabled=false`, `liveReceiptVerified=false`.

### Tweede observatie, 16 november 2026 om 00:19:38 UTC

De eigenaar heeft de **bestaande private** `operations_monitor_enabled=true` gezet; `php -l` bevestigde een geldige configuratie, zonder sleutel- of SMTP-wijzigingen. De read-only monitoringcontrole gaf:

- `cron.status=fresh`, `monitorEnabled=true`, `maxAgeSeconds=1800`, `ageSeconds=276`.
- Successen om **00:10:03Z** en **00:15:02Z**, 4 minuten 59 seconden uit elkaar. `lastErrorCode=NONE`, `warnings=[]`.
- `transportConfigured=true`, NIVO-outbox `pending=0`, `processing=0`, `smtp_accepted=1`, `acknowledged=0`, `failed=0`.
- `editorialStatus=recently_checked`, `backupStatus=not_verified`.

**Bewijsgrens:** twee opeenvolgende successen zijn sterk consistent met de bestaande Hostinger-cron, maar hPanel/cronherkomst van beide individuele ticks is nog niet apart geregistreerd. `smtp_accepted=1` is een geaggregeerde SMTP-relayacceptatie, geen per-record statusbewijs en geen API-ACK of algemene inboxgarantie. De afzonderlijke reguliere testadviesmail `WG-5510214770E3` werd eerder wél door de eigenaar in de echte NIVO-inbox waargenomen.

## C. Nog vereiste externe acceptatie

| Gate | Werkelijke status | Volgende bewijsbron |
|---|---|---|
| Back-up juiste Hostinger MySQL + dezelfde private AES/HMAC-sleutel | **NIET geverifieerd** | [Veilig herstelrunbook](BACKUP-RECOVERY-RUNBOOK.md), eerst read-only preflight; daarna beschermd archief |
| Volledige archiefauthenticatie + off-site kopie | **NIET geverifieerd** | Handmatige inspectie + veilige externe bewaring; geen bestand of geheim in GitHub |
| Geslaagde restore op geïsoleerde database | **NIET geverifieerd** | Aparte geïsoleerde testhost en AES-leesproef uitsluitend op toegestaan testmateriaal |
| Cronbewaking | **Monitorflag ACTIEF**, twee successen bevestigd | hPanel-tickherkomst, incidentsimulatie en afspraken voor extern alarmkanaal |
| Individuele testlead `WG-5510214770E3` | **Nog af te lezen** | Beveiligde admin-detailstatus, daarna alleen gericht opschonen |
| Consumentenrapportmail | **Staat UIT**, mailconfig wel aanwezig | Na eigenaar-go een eigen-adresrapport ontvangen zonder nieuwe lead |
| Exploitant/privacy/DPA + SPF/DKIM/DMARC | **Nog af te tekenen** | Eigenaar/juridische reviewer, officiële DNS en mailheaders |
| Gratis Google Search Console | **Geen bewezen property/echte KPI's** | Bevoegd Google-account, sitemap/indexatie/performance over vaste periode |

**P0-regel:** de monitoring-/mailconfig, AES-sleutels, MySQL en SMTP-keten mogen niet worden gereset. Geen nieuwe tweede cron, geen blinde outboxretry, geen onbeveiligde export. PR's/CI gaan vóór productiecode-uitrol; pas echte externe waarnemingen mogen de bovenstaande statussen veranderen.

## D. Huidige uitvoeringsfase

De read-only Hostinger-back-upvoorcontrole is via [PR #40](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/40) gemerged naar `main fe7ab7d4328e2d815299c4da41a019e130cd247d`. De [live HTTP-/beveiligingssmoke](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43781069670) bevestigde **19/19 checks PASS**, waaronder afscherming van de backup-CLI-bestanden. In GitHub CI heeft de voorcontrole **18 fictieve no-write- en permissiechecks** doorstaan. De voorcontrole start **geen** MySQL-dump, maakt geen archief aan en onthult geen credentials. De **echte private Hostinger-prerequisite-meting is nog niet uitgevoerd of gedeeld**, dus readiness is nog onbekend.

**Totdat de eigenaar de SSH-preflight uitvoert en daarna veilig export-, archief-, offsite- en geïsoleerd restorebewijs levert, blijven deze externe gates feitelijk onbekend/niet bewezen.** De volgende update in dit register zal uitsluitend op nieuwe waarnemingen gebaseerd zijn.

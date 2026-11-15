# Rapportmail — gescheiden acceptatie zonder NIVO-lead

**15 november 2026 · #21, #26.** De code voor `POST /api/index.php?action=report_email`, het premium e-mailrapport en een zelfstandige `report_mail_enabled`-schakelaar bestond al vóór deze PR. De eigenaar heeft de daadwerkelijke live rapportontvangst echter **niet** bevestigd. De werkende NIVO SMTP-leadworker is een ander pad; **niet opnieuw configureren of pauzeren**.

## Veilig checken wat nu beschikbaar is

Voor de bevoegde beheerder in de reeds bestaande Hostinger-terminal:

```sh
cd /home/u886757484/domains/wattgoedkoper.nl/public_html
php scripts/report-preflight.php
```

Voorbeeld van het **formaat**, niet van de echte productie-uitkomst:

```json
{
  "ok": true,
  "configured": true,
  "reportRequested": false,
  "mailConfigPresent": true,
  "smtpLibraryReady": true,
  "reportEnabled": false,
  "liveReceiptVerified": false
}
```

- `reportRequested` geeft uitsluitend aan of de **bestaande private** config `'report_mail_enabled' => true` bevat; het commando wijzigt die config niet.
- `smtpLibraryReady` betekent alleen dat mailboxconfig en openssl beschikbaar zijn; het is **geen** SMTP-connectietest.
- `reportEnabled` is dezelfde gate als de bestaande `session.reportMailEnabled`, die de verzendknop pas beschikbaar maakt.
- `liveReceiptVerified` blijft **altijd false**: geen CLI-preflight kan afleveren of onafhankelijke inboxontvangst aantonen.
- Geen e-mail, geen NIVO-lead, geen trackingevent, geen MySQL-writes, geen mailcredentials in stdout. Het commando verstuurt niets.

## Eén gerichte echte acceptatietest, alleen na eigenaar-go

1. Controleer uit `/admin/` → **Tools & status** de huidige rapportstatus, en maak een vooraf-/achteraf-telling van bestaande servergeaccepteerde leads en NIVO-outbox. Leg alleen aantallen vast.
2. Laat de eigenaar expliciet akkoord geven op de aparte transactionele rapportmail. **Alleen indien nodig** kan de bevoegde eigenaar de bestaande, private `config.php` aanvullen met `'report_mail_enabled' => true` — geen wachtwoord, key, SMTP- of NIVO-config wijzigen.
3. Open de live gratis consumententool op een eigen apparaat; maak een nieuw indicatief energieplan; klik *Mail mijn energieplan* en voer **alleen een eigen gecontroleerd test-e-mailadres** in. Geen historische klantmailadressen gebruiken; geen tweede leadformulier invullen.
4. Controleer eigen inbox én spammap op ontvangst, correcte rapportgegevens, beperkingen, duidelijk optionele NIVO-CTA, privacyverklaring en ongewijzigd werken van de tool. Een HTTP 200/`accepted:true` of SMTP 250 betekent niet automatisch bezorging.
5. Vergelijk de **beveiligde beheertotalen** opnieuw: geen nieuwe lead, geen outbox-item, geen analytics-gebeurtenis afkomstig van rapport-only. Houd rekening met ander legitiem verkeer tussendoor; gebruik een gecontroleerde testperiode en bewijs zonder PII.
6. Test replay vanuit dezelfde browser zonder nieuwe aanvraag (geen dubbele mail). Bij `REPORT_SEND_UNCERTAIN` of onbekende status: **niet blind opnieuw verzenden**; eerst mailboxcontrole vanwege mogelijke SMTP-acceptatie.
7. Noteer uitsluitend datum, vooraf/achteraf serveraantallen, geanonimiseerde statuscodes, inbox-ontvangst ja/nee en eigenaaracceptatie. **Geen** emailadres, mailbody, klantdata, screenshots of sleutels in publieke GitHub-issues.

## Bewijs en resterende afhankelijkheden

| Gate | Codebewijs | Echte productiestatus |
|---|---|---|
| Rapport is afzonderlijk van advies en analytics | `lib/report.php`, `tests/report_mail_test.php` | Synthetisch afgedekt |
| Fail-closed config en private SMTP-gate | Nieuw `scripts/report-preflight.php` + test | Hostinger-booleans nog niet gelezen |
| Eén gecontroleerde rapportmail bezorgd | **Geen** CI-stub kan externe inbox bewijzen | **Nog open** |
| Rapport-only maakt geen NIVO lead / marketing/analytics consent | Codepad maakt alleen tijdelijke HMAC-counters | Nog live verifieren via beheer |
| Juridische privacy/exploitant en SPF/DKIM/DMARC | [privacy.html](../privacy.html) + [privacyacceptatie](PRIVACY-SECURITY-ACCEPTANCE-2026-11-15.md) | **Nog open** |

**Niet doen:** een tweede verzendworker/cron bouwen, `nivo_delivery_enabled` op false zetten, `mail-config.php` opnieuw aanmaken, testklanten opnieuw mailen of het rapport automatisch naar NIVO verzenden. De bestaande rapportmail is transactioneel, geen marketingtoestemming.

Na onafhankelijke live bezorgproef en eigenaaracceptatie kan de rapportmail-gate in #26 afzonderlijk worden afgetekend; daarvoor niet.

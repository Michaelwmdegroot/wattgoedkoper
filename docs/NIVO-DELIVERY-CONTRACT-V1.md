# NIVO-leadtransport v1 — contract en activeringsgrens

**Status:** voorbereid in featurebranch voor issue #23. **Niet geactiveerd.** Een GitHub-merge of groene CI activeert geen echte klantgegevensoverdracht. De eerstvolgende verplichte stap is goedkeuring door de eigenaar én NIVO van de concrete ontvangende HTTPS-service, authenticatie en privacygrondslag.

## Consument blijft ongewijzigd

De bestaande `POST /api/index.php?action=leads` accepteert uitsluitend een NIVO-adviesaanvraag met expliciete `2026-11-v2` toestemming. In dezelfde databasetransactie als de versleutelde opslag verschijnt precies één `delivery_outbox`-regel voor **nieuwe** leads. Herhaalde idempotente requests maken geen dubbele wachtrijregel. Bestaande/historische leads worden niet retrospectief in de wachtrij gezet; hun partner en toestemming blijven intact. Rapportmail en opt-in analytics blijven afzonderlijk.

Op SQLite en MySQL ontstaat additief één tabel `delivery_outbox` met een FK naar `leads`; verwijdering/retentie verwijdert ook het transportrecord. Bestaande tabellen, sleutels en data worden niet gereset.

## Aflevercontract en ontvangstbewijs

De onafhankelijke worker `scripts/deliver-leads.php` mag alleen via private, expliciete configuratie zenden. JSON POST v1 (minimaal):

```json
{
  "schema": "wattgoedkoper.nivo.lead.v1",
  "requestId": "WG-A1B2C3D4E5F6",
  "createdAt": "2026-11-15T10:00:00Z",
  "recipient": "NIVO Groep Holland",
  "contact": {"name": "Fictieve Consument", "email": "voorbeeld@example.test", "phone": "", "postcode": ""},
  "interests": ["battery"],
  "plan": {"modelVersion": "v1", "year": 2027, "selectedIds": ["battery"], "annualSavingsLow": 100, "annualSavingsHigh": 250},
  "note": "",
  "consent": {"version": "2026-11-v2", "text": "De volledige server-side consenttekst", "acceptedAt": "2026-11-15T10:00:00Z", "recipient": "NIVO Groep Holland"}
}
```

Er worden geen volledige ruwe huisinputs, cookies, sessietokens, IP-adressen of marketingtoestemmingen meegestuurd.

De ontvanger moet met hetzelfde `requestId` / HTTP-header `Idempotency-Key` verzoeken exact één keer registreren, ook wanneer een eerdere HTTP-respons verloren gaat. Alleen HTTP 2xx met strikt JSON `{"acknowledged":true,"receiptId":"NIVO-REF-123"}` telt als technisch bevestigd; een idempotente 409 met dezelfde geldige ontvangstbewijsstructuur kan eveneens tellen. Niet bevestigd is niet bezorgd. Bewaar `receiptId` uitsluitend als technische externe referentie. Geen bron-PII in foutcodes of logging.

## Private configuratie: uitsluitend na NIVO- en eigenaar-go

```php
// Voeg uitsluitend buiten webroot toe aan bestaande config.php; dit is een voorbeeld, geen toestemming tot activeren.
'nivo_delivery_enabled' => false,
'nivo_delivery_endpoint' => 'https://<GOEDGEKEURDE-ONTVANGER>/api/leads',
'nivo_delivery_allowed_hosts' => ['<GOEDGEKEURDE-ONTVANGER>'],
'nivo_delivery_token' => '<PRIVÉ SERVICE TOKEN VAN MINIMAAL 32 TEKENS>',
```

Gebruik nooit deze placeholders voor een werkelijke verzending. Controleer HTTPS/TLS, host-allowlist, serviceaccountrechten, retentie, verwerkersafspraken, de NIVO-ontvangstidentiteit en een synthetische end-to-end ACK vóór omschakeling naar `true`. Geen mailadres of Portal-endpoint is aangenomen. Geen nieuwe betaalde dienst.

De worker geeft bij ontbrekende/geweigerd geconfigureerde bestemming netjes ‘uitgeschakeld’ terug en verandert dan geen wachtrijstatus. Na vrijgave hoort hij bij de **ene** goedgekeurde Hostinger-onderhoudscron van #25, zodat niet meerdere onafhankelijk draaiende cronjobs of parallelle workers ontstaan.

## Retry en beheer

- Outboxstatus: `pending` → `processing` → `acknowledged` of `failed`. Eventuele time-out/herstart wordt met een lease opnieuw aangeboden aan dezelfde idempotente ontvanger.
- 5 pogingen met groeiende vertraging, daarna zichtbaar `failed`, zonder verwijdering of stille afleverclaim.
- Beheer: `admin_stats` rapporteert de echte statusaantallen, `admin_leads` rapporteert status/ACK per aanvraag; `POST admin_delivery_retry` laat de ingelogde beheerder na CSRF+Origin-validatie uitsluitend een mislukte aanvraag herplannen. Deze adminactie verstuurt zelf niets.
- Historische leadrecords zonder outbox hebben `delivery:null`; zij zijn niet als automatisch bezorgd te interpreteren.
- Fouten zijn alleen vaste technische codes; contactgegevens blijven versleuteld in de bestaande leadtabel.
- Back-ups en privacyretentie moeten ook de outbox omvatten. Verifieer herstel met passende sleutels op een afgeschermde kopie, zonder live-data in Git.

## Verificatierapport

- `php tests/delivery_test.php`: SQLite offline contract, uitgeschakelde transportgate, toestemming, ACK, herhaalde uitvoering, netwerkfout/backoff, 5 pogingen, herstel en cascade deletion.
- `php tests/mysql_backend_test.php`: geïsoleerde MySQL in GitHub Actions, transactionele outbox, ACK en cascade.
- `python3 tests/backend_test.py --php php`: echte API-acceptatie en admin-auth op fictieve SQLite-data.
- **Niet bewezen door CI:** een daadwerkelijk geautoriseerde NIVO-ontvangst, Hostinger-cron, externe TLS-/DNS-review, productieback-up/restore of SMTP. Eindevaluatie pas bij #26.

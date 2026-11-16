# WattGoedkoper — vrijwillige energietips, ná rapportmail

**Doel:** een kwalitatieve, apart bevestigde mailinglijst uit de bestaande gratis consumentenreis. Geen verplicht e-mailadres voor toolgebruik, geen marketingtoestemming door rapportbezorging, geen commerciële e-mails naar oudere rapportontvangers.

## Wat technisch gebouwd is (PR #47)

1. De primaire rapportmail wordt uitsluitend op verzoek verstuurd. Na SMTP-acceptatie toont de Plan Studio een duidelijk verzonden-bericht zonder actief verzendveld.
2. **Alleen bij** private `newsletter_optin_enabled=true` ziet de bezoeker daarna een aparte, duidelijke keuze: ongeveer maandelijks e-mails van WattGoedkoper met bespaartips en af en toe aanbiedingen van NIVO Groep Holland. Geen vooraf aangevinkte checkbox en geen verplichting.
3. Pas na **expliciete klik** maakt `POST newsletter_subscribe` een versleutelde tijdelijke aanvraag aan, en verstuurt via de bestaande Hostinger SMTP één bevestigingsmail. Een bevestigingslink alleen activeert niets; de ontvanger klikt op de website nogmaals expliciet `Ja, bevestig mijn aanmelding`.
4. Pas `POST newsletter_confirm` zet de abonnee op **active**. Adres en afmeldsecret worden AES-GCM-versleuteld opgeslagen; HMAC-indexen voorkomen plaintext e-mailadressen/tokens in DB. Bron `report_success`, toestemmingstekstversie `2026-11-newsletter-v1` en bevestigingstijd worden bewaard; aanvragen verlopen na zeven dagen. `POST newsletter_unsubscribe` trekt toestemming in zonder login en wist de versleutelde contactgegevens uit de actieve lijst. Geen analytics- of NIVO-advieslead.
5. Het bestaande `/admin/#tools` krijgt één knop **Download opt-in CSV**. Alleen **active/confirmed** abonnees, versie/datum en een persoonlijke afmeldlink. Er is **geen** ingebouwde nieuwsbriefflow of automatische reclamecampagne. Elke latere marketingmail moet een geldige individuele afmeldmogelijkheid bevatten. Exportbestand beveiligd bewaren.

## Privacypoort: standaard UIT

**16 november 2026:** de eigenaar bevestigde dat WattGoedkoper een initiatief van NIVO Groep Holland is. De officiële rechtspersoon is publiek te verifiëren als **NIVO Groep Holland B.V.**, KvK **95227768**, Lireweg 52, 2153 PH Nieuw-Vennep (zie [publieke registratie](https://www.compadex.com/nl/businesses/nl/nivo-groep-holland-b-v-95227768-60652861) en [NIVO privacyverklaring](https://nivogroepholland.nl/privacy-verklaring/)). De WattGoedkoper-privacyverklaring vermeldt nu deze initiatiefnemer/verwerkingsverantwoordelijke en zowel `info@wattgoedkoper.nl` als het door NIVO zelf gepubliceerde `info@nivogroepholland.nl` voor privacyverzoeken. Controleer dit na de release live. **Deze documentatie of code activeert geen mailinglijst:** `newsletter_optin_enabled` blijft standaard uit totdat de bevoegde eigenaar de bestaande private flag bewust inschakelt. Indien NIVO op eigen naam losse marketing verzendt of contactdata anders overdraagt dan in de bestaande opt-in beschreven, is dat een afzonderlijke toestemming/verwerking; het huidige contract dekt e-mails van WattGoedkoper met eventueel NIVO-aanbiedingen.

**Bevoegde eigenaar, na zichtcontrole van de bijgewerkte privacy- en contactinformatie:** voeg aan de bestaande private `wattgoedkoper-private/config.php` uitsluitend `'newsletter_optin_enabled' => true` toe. Verander bestaande MySQL-, SMTP-, AES-, HMAC-, cron- of rapportinstellingen niet. Controleer op de site dat de aparte aanmeldoptie verschijnt na een eigen rapport.

## Eén gecontroleerde acceptatietest (alleen eigen adres)

- Eerst de bestaande rapportmail naar een **eigen** gecontroleerd adres. Dat is reeds live bewezen voor rapportbezorging; verzend niet voortdurend nieuwe testmails.
- Na rapportacceptatie klik je **Ja, stuur mij deze e-mails**. Controleer één aparte bevestigingsmail in inbox of spam.
- Open de bevestigingslink; klik zelf expliciet op **Ja, bevestig mijn aanmelding**. Controleer op `/admin/#tools` via een beveiligde opt-in CSV of precies één testrecord als active is opgenomen. Maak geen persoonsgegevens/CSV publiek.
- Controleer de persoonlijke afmeldlink en dat de actieve export daarna nul testadressen bevat. Test ook dat rapport zonder nieuwsbriefklik géén active-record aanmaakt, en dat losse advies- en analytics-opt-ins onveranderd blijven.
- Bij onzekere SMTP-bevestiging nooit herhaaldelijk automatisch verzenden. Beoordeel eerst de eigen inbox, gebruik geen klantadressen als testgegevens.

**Geen launchclaims zonder bewijs:** CI/Playwright en een groen API-fingerprint bewijzen geen echte bevestigingsmail, werkelijke contactgrondslag of privaat export-/afmeldbewijs. Die status wordt pas met eigenaarsbewijs in #14 en #26 afgetekend.

## Minimale groeibeheercheck

Maandelijks: alleen confirmed-lijst gebruiken, afgehandelde afmeldingen respecteren, verdachte/inactieve toestemming periodiek verwijderen, geen ongeautoriseerde data-export naar externe marketingtools, en bij Google/SEO-content wijzigingen de marketingtekst kritisch nalopen. Omzetten in geautomatiseerde marketing of NIVO-aflevering gebeurt alleen na aparte eigenaarbeslissing en passende AVG-/Telecommunicatiewetreview.

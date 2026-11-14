# Formele faseafsluiting — WattGoedkoper v0.7

**Datum:** 14 november 2026  
**Besluit eigenaar:** interactieve energiehuis- en visuele ontwikkelfase klaar. Nieuwe agent gaat verder met de complete productstructuur, SEO en kwalitatieve leadgeneratie.  
**Afsluiten = projectcontext en backlog overdragen; geen wijziging aan bestaande consumenten- of leadfunctionaliteit.**

## Gereed

- [x] Interactief energiehuis met vijf maatregelkeuzes, thuisbatterij/PV-afhankelijkheden en financiële indicatie.
- [x] Premium fotorealistische homepage/cockpit; 5 kaarten zichtbaar boven de vouw op belangrijke desktopformaten.
- [x] Plan Studio met Overzicht, Maatregelen, Onderbouwing, variantvergelijking en expliciete aannames.
- [x] Branding v0.7: goedgekeurd woordmerk, favicon, Apple- en app-iconen, social-preview, consistent publiek/admin.
- [x] NIVO-only nieuwe adviesflow, aparte expliciete consent en veilig beheerdersdashboard.
- [x] Transactionele rapportmail-code/HTML+tekst met antispam, **standaard uit**.
- [x] Direct bruikbare standalone preview en GitHub Actions regressies.
- [x] Eerste vier kennispagina's plus rekenmodel/privacy en basis robots/sitemap.

**Geborgde PR's**
- [#11](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/11) — Plan Studio, privacygescheiden advies en rapportmail, beheer.
- [#12](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/12) — één-scherm energiehuis.
- [#13](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/13) — merkidentiteit en compacte bovenbalk.

**Laatste geverifieerde applicatiecommit:** `d7be722c3baff7a2a02fa61a0514fa4a485fd8a8`, met groen:
- [Calculation and data safety checks](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43634944631)
- [Premium visual and interaction review](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43634944643)

Een eventuele documentatie-only afsluitcommit komt later bovenop deze baseline en verandert geen uitvoerbare applicatiebestanden.

## Wat *niet* als afgerond wordt verklaard

- [ ] Werkelijke Hostinger deploy-SHA onafhankelijk herlezen en huidige live-up-to-date status vastleggen (eigenaar heeft layout/branding visueel bevestigd).
- [ ] Veilige koppeling en daadwerkelijke inboxbezorging van `info@wattgoedkoper.nl`; `report_mail_enabled` blijft **uit**.
- [ ] Formele verantwoordelijke onderneming/privacycontact en eventuele operationele autorisaties voor uitbreiding definitief vaststellen.
- [ ] SEO-/index-/Search Console-/traffic-/Core-Web-Vitals-nulmeting; geen rankings of bezoekersaantallen bewezen.
- [ ] Onderliggende premium SEO-clusters, contenttemplates, landingspagina's, interne links, geverifieerde bronnen en effectieve opt-in CTA-strategie.
- [ ] NIVO Portal/Odoo-integratie; geen automatische overdracht.
- [ ] Open operationele/productissues #2 en #3; volgende-fase issues #14–#18.

## Onwrikbare releasegrenzen

- Zonder account, zonder leadwall: volledig gratis energie-inzicht eerst.
- Alleen NIVO-contact na aparte toestemming; rapportmail nooit automatisch marketingconsent.
- Verander geen bestaande MySQL, private secrets of encryptiesleutels. Geen setup opnieuw.
- Rekenmodel en productclaims blijven indicatief, met actuele, controleerbare bronnen.
- Geen nieuwe betaalde diensten. Geen ongeteste wijzigingen naar `main`.

## Formele overdracht naar volgende agent

- [Handoff](HANDOFF-FULL-PRODUCT-2026-11-14.md)
- [Roadmap](ROADMAP-SEO-PRODUCT-LEADGEN.md)
- [Copy-ready startprompt](START-PROMPT-NEXT-AGENT.md)
- [Hoofdissue NEXT #14](https://github.com/Michaelwmdegroot/wattgoedkoper/issues/14)

**Voorgestelde start:** eerste antwoord = eigen inhoudelijke overdrachtsamenvatting; vervolgens een data-/evidencegedreven audit en de eerste samenhangende SEO/content + toolkoppeling-featurebranch uitvoeren. Geen volledige homepage-redesign.

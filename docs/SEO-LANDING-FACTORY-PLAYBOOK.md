# SEO Lead Website Factory — herhaalbaar lancerings- en overdrachtsproces

**Eigenaarbesluit 16 november 2026.** Deze werkwijze is bedoeld voor een **doorlopende reeks aparte, kwalitatief sterke lead-/toolwebsites**. WattGoedkoper.nl is de huidige site die eerst commercieel wordt afgesloten. Iedere volgende site moet **een eigen probleem, zoekintentie, gratis waarde en geloofwaardige vormgeving** hebben; geen kopie van dezelfde content onder andere domeinen.

## Noordster en scope

**Doel:** zo veel mogelijk relevante, vrijwillige en goed opvolgbare leads voor de eigen commerciële organisatie via organische vraag, tegen lage ontwikkel- en beheerkosten. Een fraaie homepage zonder bruikbaar gratis resultaat of werkende leadfunnel is géén afgeronde leadsite.

**Marketingflow:** Google/andere verwijzing → hoogwaardig inhoudelijk antwoord → interactief gratis hulpmiddel → duidelijk resultaat → optioneel rapport/advies → één bevoegde ontvangende organisatie → opvolging → meten en leren.

**Niet doen:** generiek AI-websitegevoel, formulieren als volledige gratis tool, herhaalde thin/near-identieke SEO-pagina's over tientallen domeinen, fictieve gebruikers/reviews/subsidies, gekopieerde tekst zonder eigen waarde, aparte partnerkeuze bij NIVO-only sites, complex backoffice, dure connectors en maanden architectuurwerk. Google kan doorway-sites en schaalproductie zonder unieke waarde als spam behandelen.

## A. Per site: éénpagina-opdracht vóór bouwen

Leg in een nieuwe GitHub-README of masterissue in maximaal één pagina vast:

1. **Uniek consumentenprobleem** en de 3–5 feitelijke primaire zoekintenties (informatie/vergelijking/berekening), met bron en onzekerheid; geen gezocht volume verzinnen.
2. **Gratis resultaat zonder account**: wat ziet de bezoeker vóór het delen van gegevens? Bij voorkeur interactieve, inspecteerbare tool met duidelijke beperking.
3. **Leadvoorstel**: wat vraagt de bezoeker vrijwillig aan en bij welk eigen bedrijf komt het terecht? Geen verborgen verkoop/marketingopt-in.
4. **Kernconversie**: welke zichtbare CTA volgt na de waarde? Eventuele rapportmail heeft een zelfstandig doel en is geen leadtoestemming.
5. **Unieke visuele identiteit** en minstens één inhoudelijke/domeinspecifieke interactie die deze site duidelijk onderscheidt van bestaande eigen sites.
6. **Succesmeting**: eigen Search Console-property/sitemap, servergeaccepteerde aanvragen, geaccepteerde afleveringen, consentgebonden funnelcijfers en menselijke leadkwaliteit.

**Go voor bouwen:** zoekintentie + werkelijk probleem + productoutput + duidelijk verantwoord contactpad zijn helder. Geen lange marktanalyse zonder besluit en bouwactie.

## B. Lean ontwikkelvolgorde

| Fase | Levering | Done wanneer |
|---|---|---|
| **1. Fundament** | GitHub repo, domein/DNS, Hostinger-deploy, mobiele premium homepage, korte privacy-/contactinfo, assetstijl | Live HTTPS site en correct `main`-deploy, geen onveilige secrets in Git |
| **2. Waarde** | Vrije interactieve tool, invoer → meteen begrijpelijke uitkomst, indicatieve aannames zichtbaar, bewaren waar relevant | Mobiel/desktop bruikbaar zonder persoonsgegevens/contactmuur |
| **3. Lead** | Eén vrijwillige aanvraag naar eigen ontvanger, server-side consent, eenvoudige spam/duplicatenbescherming, werkende mailbox met afleverbewijs | Eén eigen gecontroleerde end-to-end aanvraag daadwerkelijk ontvangen |
| **4. SEO** | 5–15 passende hoogwaardige pagina's óf een kleinere set als de niche dat rechtvaardigt; sitemap, robots, canonicals, inhoudelijke links naar tool, gratis GSC | Crawleerbare unieke URL's en GSC-property/sitemap ingestuurd; geen rankingclaim |
| **5. Conversie** | Goede CTA op resultaat en vanaf relevante inhoud; eventueel losse rapportmail met vrijwillige vervolg-CTA; compact statusdashboard waar nodig | Volledige gebruikersroute is getest en ontvangen, geen kapotte of misleidende CTA |
| **6. Handover** | Eigenaar/contactpersoon, basisback-up-/hostingbeleid, licht monitorritme, definitieve GitHub-handoff en open P1-lijst | Site kan zonder Mac/actieve agent functioneren; nieuwe site kan starten |

**Scopegrens:** gebruik zo veel mogelijk **bestaande bewezen Hostinger-/PHP-/MySQL-/SMTP-/GitHub-patronen**, maar kopieer niet blind privacy, NIVO-toestemming of bedrijfsclaims naar een andere entiteit. Een eenvoudige site zonder database is beter dan onnodig complex. Een bedrijfsportal is alleen nodig als operationeel vereist. Geen volledige maatwerkinfrastructuur per domein.

## C. Hetzelfde herbruikbare QA-/acceptatiepatroon

Voor iedere nieuwe site een compact masterissue + checklist met bewijs:

- **Publicatie:** domein HTTPS, `main`-fingerprint/livesmoke en mobile/desktop-route groen.
- **Waarde:** tool rekent/reageert juist; onzekerheid, prijzen en brondata zijn eerlijk en actueel.
- **Vinden:** sitemap/robots/canonicals/titels, relevant interne links, Search Console-property geverifieerd en sitemap ingestuurd. **GSC-verkeer mag 0 zijn bij afsluiting**.
- **Leads:** unieke toestemming, echte inboxontvangst op eigen test, geen dubbele uitzending, correct reactieadres.
- **Privacy:** juridische uitgever en contact bekend, verwerking/retentie eerlijk, geen ongeoorloofde analytics, basistoegangsbeveiliging en hosting-native restoreopties waar beschikbaar.
- **Beheer:** alarmsignalen/queue inzichtelijk, eenvoudige menselijke opvolging, geen dagelijkse Mac-afhankelijkheid en geen onbewaakte klantdata.
- **Handoff:** releasecommit, live testlinks, open niet-kritieke taken, verantwoordelijke en eerstvolgende groeiactie op GitHub.

**Niet eisen voor launch/handoff:** een gegarandeerde Google-positie, duizenden bezoekers, leadvolume, volledige autonome SEO-contentupdates, eigen CRM/Portal API, geavanceerde custom back-ups, extra agents of uitgebreide dashboards.

## D. Kleine vaste groeicyclus ná afsluiting

- **Week 1 na livegang:** check of website/CTA/inbox nog werkt, geen kritieke crawl-/formulierfouten; noteer alleen echte GSC-waarneming indien beschikbaar.
- **Daarna ongeveer maandelijks of wanneer er voldoende data is:** controleer GSC queries/impressies/clicks, pagina's, en of de NIVO-leads kwalitatief zijn; kies **hoogstens 1–3 concrete** content-/conversieverbeteringen per site. Geen continue menselijke babysitting vereist, maar SEO draait niet volledig vanzelf.
- **Bij een relevante bron-/wet-/tariefwijziging:** review de concrete claim, pas inhoud/voorbehoud aan met datum; niet automatisch alle artikelen genereren.
- **Bij incidenten:** herstel de werkende klantreis, persoonsgegevensbeveiliging en NIVO-mailketen met voorrang. Geen brute herinstallatie, tweede worker of blinde retry.

**Ownership:** eigenaar beheert domein/Hostinger/GSC en heeft zicht op NIVO-opvolging. Een agent kan alleen terugkomen voor een afgebakende bug, groeikans of periodieke analyse; er is geen garantie dat er zonder geplande taak automatisch wordt gemonitord.

## E. Outputcontract voor elke nieuwe agent

**Binnen iedere ontwikkelfase opleveren:** code in een beperkte PR, tests/CI-URL's, live controle indien gemerged, bijgewerkte GitHub-issue en een mini-overzicht **afgerond / nog nodig / owner-actie**. Als een externe login of hostingconfig vereist is, formuleer alleen de **eerstvolgende korte uitvoerhandeling** en werk ondertussen aan een onafhankelijk code-/SEO-onderdeel.

**Stop met een site ontwikkelen zodra** de objectieve P0-funnel en crawlbaarheid bewezen zijn en eigenaar de site accepteert. Zet verbeterideeën in P1-backlog en begin de volgende niche/site; kom later datagedreven terug. Voor WattGoedkoper gelden de concrete [afsluitcriteria](HANDOFF-FINAL-GROWTH-EXIT-2026-11-16.md).

## F. Kopieerbare mini-checklist voor volgende projecten

```md
# [Domein] — Leadsite Launch & Handoff
- [ ] Eigen probleem, gratis waarde en unieke visuele richting gevalideerd
- [ ] GitHub main → Hostinger HTTPS live, mobiele gratis tool getest
- [ ] Eigen juridische contactroute/privacy/consent correct
- [ ] Eén vrijwillige echte lead daadwerkelijk afgeleverd en ontvangen
- [ ] Relevante unieke SEO-URL's, canonicals, robots en sitemap
- [ ] Gratis GSC eigendom bevestigd + sitemap ingestuurd
- [ ] Eén complete mobiel/desktop funnel met CTA/rapport indien gebruikt getest
- [ ] Minimaal operationeel beheer/hosting/herstel/verantwoordelijke geregeld
- [ ] GitHub handoff met SHA, CI/live bewijs en P1-/P2-backlog klaar
- [ ] Eigenaar geeft launch/overdracht GO; volgende site kiezen
```

**Overdrachtsprompt voor WattGoedkoper:** [START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md](START-PROMPT-NEXT-AGENT-FINAL-GROWTH-2026-11-16.md).

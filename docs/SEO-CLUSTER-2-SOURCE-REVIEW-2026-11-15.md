# SEO-cluster 2 — bron- en kwaliteitsreview

**Gepubliceerd via [PR #32](https://github.com/Michaelwmdegroot/wattgoedkoper/pull/32) op 15 november 2026** (main-merge `cde1efd7a8e0f3cb5c1f375f4f6eaed3db3b624c`). De drie artikelen en hub-/sitemaplinks staan in de GitHub-publicatiebuild; de externe Hostinger-live-smoke controleerde de nieuwe kennisroute. Dit document is het **bron- en onderhoudsregister**, geen nog open merge-verzoek. Juridische, subsidie- en energieprijsclaims behoeven periodieke officiële hercontrole; indexatie en GSC-clicks zijn niet bewezen.

## Verifieerbare consumentenvragen

| Artikel | Vraag en afbakening | Primaire bronnen voor de inhoudsreview |
|---|---|---|
| [Isoleren of hybride eerst?](/kennis/isolatie-of-hybride-warmtepomp/) | Beslisvolgorde op basis van isolatie, warmtevraag, cv en afgiftesysteem; geen belofte van rendement | [Milieu Centraal — hybride warmtepomp](https://www.milieucentraal.nl/energie-besparen/duurzaam-verwarmen-en-koelen/hybride-warmtepomp/), [RVO — ISDE isolatie](https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/isolatiemaatregelen) |
| [Is hybride geschikt?](/kennis/hybride-warmtepomp/geschiktheid/) | Praktische checklist van cv, radiatoren, geluid, elektra, ruimte en subsidies; geen technische dimensionering op afstand | [Milieu Centraal — hybride warmtepomp](https://www.milieucentraal.nl/energie-besparen/duurzaam-verwarmen-en-koelen/hybride-warmtepomp/), [RVO — ISDE warmtepomp](https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/warmtepomp) |
| [Contract met zonnepanelen 2027](/kennis/energiecontract/met-zonnepanelen/) | Vaste/variabele/dynamische contracten, totale kosten, teruglevering, 2027-wijziging; geen live prijsclaim | [ACM ConsuWijzer — salderen](https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen), [ACM — leveringskosten](https://consument.acm.nl/elektriciteit-en-gas/wat-betaal-ik-voor-mijn-energie/vaste-variabele-leveringskosten-energie), [ACM — leverancier kiezen](https://consument.acm.nl/elektriciteit-en-gas/overstappen-vergelijken-en-verhuizen/tips-bij-het-kiezen-van-een-energieleverancier) |

De bronnen zijn op 15 november 2026 ingezien. **Een broncontrole is geen garantie dat regelingen onveranderd blijven.** Met name ISDE-productvoorwaarden, voorwaarden van energieleveranciers en de overgang naar 2027 vereisen hercontrole vóór publicatie na langere vertraging.

## Hoe de drie pagina's functioneren

De huidige `docs/seo-cluster-v08.json` is de bewerkbare bron voor `scripts/build-content.py`. De build maakt statische, indexeerbare HTML, breadcrumbs/Article JSON-LD, een canonieke URL, sitemap met expliciete laatste wijzigingsdatum en interne artikelrelaties. De pages en drie bestaande hubs zijn in de featurebranch direct mee opgebouwd; er is geen nieuwe frontend of accountsysteem.

Alle artikel-CTA's openen de reeds bestaande gratis energiehuiscontext via publieke, niet-persoonlijke URL-fragmenten; geen auto-advies, persoonsgegevens in de URL of automatische maatregelkeuze. De RVO/ACM-links zijn informatiebronnen, geen commerciële partners. De financiële illustraties blijven scenario's van het bestaande rekenmodel.

## Periodieke inhouds- en techniekcontrole na publicatie

- Hercontroleer vóór een volgende contentupdate bij officiële bronnen de feitelijke passages over ISDE en de wettelijke 2027-saldering; geen automatische claimactualisatie.
- De publicatie-PR had groene tests en browserreview; bij **nieuwe wijzigingen** opnieuw `npm test`, `npm run check:seo` na `python3 scripts/build-content.py` en mobiele/desktop screenshots draaien.
- Bewaak op Hostinger HTTP 200, canonical, sitemap, interne links, mobiel en robotsregels. De live smoke bewijst bereikbaarheid, **niet** daadwerkelijk door Google geïndexeerde pagina's.
- Search Console-prestaties zijn **niet beschikbaar** via de bestaande GSC Wizard-integratie: de gekoppelde dienst meldde `payment_required`. **Geen betaald abonnement aanschaffen**. Eigenaar kan desgewenst rechtstreeks Google Search Console-toegang/verified property beschikbaar maken voor een toekomstige, kosteloze bron.

Geen massageneratie, geen verzonnen GSC-metrics, geen volgende publicatie zonder inhoudelijke review.

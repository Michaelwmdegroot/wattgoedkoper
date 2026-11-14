# Oplevering 2026-11-14 — premium energiehuis 0.3

## Doel en resultaat

Het interactieve energiehuis uit versie 0.2 is visueel opnieuw vormgegeven op basis van de aangeleverde referentie. De ervaring gebruikt een rustige crèmekleurige achtergrond, donkerblauwe serifkoppen, gele accenten en realistische, speciaal gegenereerde woning- en productbeelden. De woning, instellingen en berekende uitkomst vormen één werkvlak. Daaronder staan vijf maatregelen, het samengestelde plan en inhoudelijke inspiratie.

De opdracht betreft de ontwikkelversie en de zelfstandige preview. De bestaande WordPress-site, hostinginstellingen en DNS zijn niet gewijzigd.

## Belangrijkste wijzigingen

- Vijftien lokale WebP-afbeeldingen: vijf woningtypen met elk een basisbeeld en een passend verbeterd beeld, plus vijf maatregelbeelden. Rijwoning, hoekhuis, twee-onder-een-kap, vrijstaand en appartement hebben elk een herkenbare vorm.
- Zonnepanelen, warmtepomp en batterij worden afzonderlijk zichtbaar via maskers op het bijbehorende verbeterde beeld. Een gekozen maatregel verschijnt alleen bij ‘Met je plan’; bestaande installaties zijn ook bij ‘Nu’ zichtbaar. De aanwezige en geplande staat blijven gescheiden.
- Werkende HTML-knoppen op de woning met verbindingslijnen naar dak of installatie. De naam, selectiestatus en toetsenbordfocus blijven bruikbaar bij een wijziging. De foto is decoratief; bediening en berekeningen blijven gewone webcode.
- Titel, woningfoto, resultaat en kaarten volgen de visuele richting van de referentie. De basisinstellingen staan direct in beeld; isolatie, bestaande installaties en woningspecificaties zijn uitklapbaar.
- Onder de foto staan de uitleg, dagbediening en drie korte voordelen. Op mobiel volgt een eigen verticale indeling met een compacte vaste resultaatbalk en horizontaal te bladeren maatregelkaarten.
- Drie beeldende inspiratiekaarten openen de echte kennisartikelen. De zes openbare informatiepagina’s en het bestaande beheer hebben dezelfde typografie, kleuren en componentstijl gekregen.
- DM Serif Display en Manrope worden lokaal geladen met bijbehorende OFL-licenties. De zelfstandige HTML bevat alle benodigde afbeeldingen, lettertypen, stylesheets, modules en informatiepagina’s.

## Bestaand gedrag behouden

De deterministische rekenkern is niet gewijzigd. Het samenstellen en verwijderen van maatregelen, voorwaarden voor een batterij, de kosten vóór/na, bandbreedte en investering blijven gebaseerd op dezelfde scenarioberekening. Budget, paneelaantal, batterijcapaciteit, eigen jaarverbruik en tarieven blijven instelbaar. Een negatieve besparing blijft zichtbaar. Bewaren/herstellen, ongedaan maken, opnieuw beginnen en de afdrukbare planweergave blijven beschikbaar.

Een selectie houdt haar vinkje en correcte toegankelijke naam wanneer je ‘Nu’ bekijkt. Nieuwe apparatuur is in die weergave verborgen. Een energielijn vanaf zonnepanelen eindigt bij de woning wanneer er geen batterij is. De dagbediening beïnvloedt alleen de sfeer van het beeld.

De commerciële afzenders blijven vermeld. Er zijn geen onafhankelijkheidsclaims, fictieve beoordelingen, verplichte accountstappen of gegarandeerde opbrengsten toegevoegd. De zelfstandige preview verstuurt geen adviesaanvragen en gebruikt geen tracking.

## Browsercontrole

De nieuwe GitHub Actions-workflow bouwt de site en preview uit de repository en controleert beide in Chromium. Hij bewaart screenshots en een machineleesbaar controlerapport. De dekking omvat een desktop van 1440 pixels, een tablet van 900 pixels en mobiele breedtes van 390 en 320 pixels, plus de openbare kennis- en rekenmodelpagina’s.

De eerste controle vond een decoratieve achtergrond buiten de paginabreedte, een geërfde `top`-positie waardoor de mobiele resultaatbalk te hoog werd en een te grote huisfoto waardoor onderdelen achter de zijpanelen vielen. Deze oorzaken zijn in de broncode hersteld: de achtergrond blijft binnen de pagina, de vaste balk heeft expliciete afmetingen en de woning met apparatuur deelt één canvas binnen de middenkolom. Uitleg en dagbediening volgen de foto in normale documentvolgorde.

De definitieve bronversie is gecontroleerd in [browserrun 43551061497](https://github.com/Michaelwmdegroot/wattgoedkoper/actions/runs/43551061497), op broncommit `2c9ebcd431e47df4e27a1bbe82b5e76ca825cde6`:

- **125 browsercontroles geslaagd, 0 mislukt**, verdeeld over acht desktop-, tablet-, mobiele en offlinegevallen.
- **47 reken- en scenariotests geslaagd**; JavaScript-syntax en beide builders geslaagd.
- Geen horizontale documentoverflow op de geteste breedtes. De mobiele resultaatbalk blijft compact en aan de viewportonderkant.
- Alle afbeeldingen zijn geladen; de huispillen zijn aanklikbaar en worden niet door andere elementen afgedekt. De vijf woningtypen zijn afzonderlijk met alle drie installaties vastgelegd en visueel bekeken.
- Toevoegen/verwijderen, ‘Nu’ versus ‘Met je plan’, toetsenbordbediening, details, tabnavigatie, dagbediening, planweergave en bewaren/reset/herstellen zijn gecontroleerd. Negatieve besparing en budgetoverschrijding blijven afzonderlijk leesbaar.
- De zelfstandige preview doet geen netwerkverzoeken. De ingebedde kennis- en rekenmodelpagina’s openen en hun inhoudslinks werken.
- **33 screenshots** opgeslagen in het workflow-artifact. Twee representatieve beelden en het volledige JSON-controlerapport staan blijvend in `docs/visual-review/`.

De afgeleverde preview is bytegelijk aan het door CI gebouwde en geteste bestand: **9.118.715 bytes**, SHA-256 `e3672bc0423df0de8a22f61903c5f440e08097a7ccf5b3e10724a24e87ae4abe`.

De bestaande PHP-/backendcontrole blijft een aparte verplichte GitHub-controle. De backendcode is in deze visuele revisie niet gewijzigd.

## Grenzen

De browsercontrole gebruikt Chromium. Een aparte handmatige Safari-/Firefox-ronde en gebruikerstesten met echte bezoekers zijn niet uitgevoerd. De website is niet op de productiedomeinnaam geactiveerd en er is geen echte adviesaanvraag verstuurd.

De woningbeelden zijn sfeerbeelden. Getoonde aantallen en posities van panelen en installaties zijn illustratief; de gekozen aantallen staan in de bediening en in het plan. Voor appartementen blijven toestemming, VvE en praktische geschiktheid relevant. Het model is een eerste jaaroriëntatie, geen kwartiersimulatie, technisch ontwerp, offerte of besparingsgarantie.

## Bronbestanden

- `docs/PREMIUM-DESIGN.md`: ontwerpkeuzes, apparatuurweergave en technische grenzen.
- `docs/image-prompts.json`: generatieprompts, maten en hashes van de gebruikte beelden.
- `assets/fonts/OFL-*.txt`: licenties van de lokaal gebruikte fonts.
- `scripts/visual-review.cjs`: browsergedrag, geometrie en screenshotcontrole.
- `docs/RELEASE-0.2.md`: historische oplevernotitie van de interactieve basis.

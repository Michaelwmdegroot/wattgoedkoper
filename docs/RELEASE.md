# Oplevering 2026-11-14 — interactief energiehuis 0.2

## Aanleiding en productkeuze

De eerste versie was functioneel een formulier met een rapport. De gebruiker vroeg om een speelse tool waarmee consumenten hun situatie ontdekken en direct resultaat zien. Daarom is de consumentenervaring opnieuw opgebouwd rond een interactieve woning. De eerder gebouwde rekenkern en beveiligde backend zijn hergebruikt.

De huidige opdracht is ontwikkeling en beoordeling van de ervaring. De WordPress-site, Hostinger-instellingen en DNS zijn niet gewijzigd.

## Wat is veranderd

1. De homepage is direct het werkvlak: woningkeuzes, een grote isometrische woning, directe cijfers en een strook met vijf verbeteringen. Geen startscherm of verplichte vragenvolgorde.
2. Woningtype en bewoners veranderen de illustratie. Bestaande zonnepanelen, batterij, warmtepomp en auto zijn afzonderlijk van nieuwe investeringen.
3. Toevoegen/weghalen via kaartjes, de hotspots op het huis of optioneel slepen. De huidige situatie en het plan zijn apart te bekijken.
4. Het resultaat reageert direct met kosten vóór/na, bandbreedte, investering en aandeel eigen stroom.
5. Een aparte scenariolaag maakt vrije combinaties mogelijk, inclusief nieuwe zonnepanelen met batterij. Afhankelijkheden blijven geldig en losse besparingen worden niet opgeteld.
6. Budget stuurt het voorgestelde startplan. Een handmatige combinatie mag erboven liggen; dat wordt zichtbaar aangegeven. Negatieve besparing wordt niet verborgen.
7. Paneelaantal, batterijcapaciteit en budget zijn schuifregelaars. De voorbeeldprijs van nieuwe panelen groeit evenredig mee met het aantal. Exacte cijfers en tarieven blijven optionele detailpanelen.
8. Ongedaan maken, opnieuw beginnen, expliciet bewaren/herstellen en een afdrukbaar plan zijn ingebouwd.
9. Dag/nacht, licht en geanimeerde energiestromen maken de samenhang zichtbaar. Ze zijn duidelijk als illustratie aangeduid en veranderen de jaarberekening niet.
10. Het optionele adviesformulier deelt het samengestelde plan alleen na expliciete partnerkeuze en toestemming. De zelfstandige preview kan geen aanvraag versturen.

## Bestanden en architectuur

De nieuwe modules `assets/playground-model.mjs` en `assets/house-scene.mjs` scheiden het rekenen van de visuele ervaring. `assets/app.mjs` beheert keuzes, omkeerbare state, live resultaten, detailpanelen en de bestaande API. De previewbuilder bundelt de lokale moduleketen, stylesheets en uitlegpagina’s tot één bestand dat zonder server werkt.

Geen runtimeafhankelijkheden, externe lettertypen, trackers of betaalde plugins toegevoegd. De bronwebsite blijft direct geschikt voor de eerder voorbereide HTML/PHP-route.

## Verificatie

- 47 reken- en scenariotests geslaagd: de bestaande 33 plus 14 voor vrije combinaties, voorwaarden, energiebehoud, dubbeltellingen, nulverbruik, budget en negatieve batterijuitkomsten.
- JavaScript-syntax van alle vijf modules gecontroleerd.
- 16 functionele DOM-testgroepen op de module-app, 18 op de zelfstandige preview. Onder meer woning/huishouden, panelen+batterij, verwijderen van afhankelijke stappen, bestaande systemen, huur, budget, meterinvoer, onmogelijke export, schatmodus, nul/negatief resultaat, dag/nacht, undo, bewaren, toetsenbord, slepen, hotspots en adviesfouten.
- Preview: nul netwerkverzoeken, alle lokale assets ingebed, uitlegpagina’s en terugnavigatie werken.
- Native SVG gerenderd en visueel bekeken. CSS geparseerd, unieke HTML-IDs gecontroleerd, essentiële tekstkleuren met contrastberekening aangescherpt. Labels/invoer en bediening zijn voor mobiel vergroot; verminderde beweging wordt gerespecteerd.
- De bestaande 55 backendchecks zijn ongewijzigd en blijven een CI-gate. Geen echte persoonsgegevens gebruikt of berichten verstuurd.

## Grenzen van de verificatie

Een DOM-test controleert gedrag, geen uiteindelijke layout. De lokale browser kon eerder niet starten; de beschikbare browser weigert lokale bestands-URLs en de native invoerroute gaf een toegankelijkheidsproviderfout. De volledige desktop-/mobiele browserervaring is daardoor niet visueel geverifieerd. De zelfstandige HTML-preview is beschikbaar voor die beoordeling. Er is geen claim dat een live productieflow is getest.

Het model blijft een eerste jaaroriëntatie. Het is geen kwartiersimulatie, technisch dakplan, officieel woningadvies of productoptimalisatie. Beprijzen per paneel is een zichtbare rekenaanname en geen offerte. Subsidies, toekomstige tarieven, degradatie, onderhoud en financiering vragen aanvullende informatie.

## Reviewrichting

Beoordeel eerst of de woning direct uitnodigt tot spelen, of het verschil van een keuze begrijpelijk is en of de overgang van voorbeeld naar persoonlijke situatie soepel voelt. Daarna volgen concrete gebruikerstests op mobiel en desktop. Verdere gegevenskoppelingen en productieactivering zijn afzonderlijke stappen, niet onderdeel van deze revisie.

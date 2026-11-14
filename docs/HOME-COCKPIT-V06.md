# WattGoedkoper v0.6 — energiehuis als één desktopcockpit

**Doel:** alle primaire consumentenhandelingen in de eerste viewport: woning aanpassen, foto/overlays gebruiken, rekenresultaat beoordelen, en direct elk van de **vijf** maatregelen kiezen (inclusief zonnepanelen en thuisbatterij). Naar beneden scrollen mag voor artikelen, uitleg en langdurige instellingen, maar mag niet nodig zijn om het energiehuis te gebruiken.

## Ontwerpbesluiten

- **Desktop vanaf 1101px:** drie kolommen met een vast viewportafhankelijk hoofdraster. De woningfoto behoudt de bestaande 3:2-beeldverhouding. De linkse woninginstellingen en rechtse planresultaten staan op dezelfde bovengrens. De middelste afbeelding heeft één afgemeten zone; overbodige marketingbenefits verdwijnen alleen uit de compacte desktopvariant.
- **Rechterkaart:** sluit aan bij de stijl en verticale positie van het vertrekpunt; subtiel accent bovenaan, heldere besparingswaarde, jaarkostenvergelijking, eigen stroom, investering, adviesknop en rekenjaar. Bij uitzonderlijke invoer (lange waarschuwingen) blijft interne scrolling mogelijk, nooit afkappen.
- **Upgrade-rij:** direct onder het hoofdwerkvlak, vijf echte kaarten in één rij, met afzonderlijke plus/uit-knop en uitlegknop; keyboard, focus, huidig selectiegedrag, afhankelijkheden en het hele deterministische rekenmodel blijven intact.
- **Hoogtebeperkingen:** body blijft natuurlijk scrollbaar voor uitleg, maar de primaire viewport past bij 1366×768, 1440×900, 1280×800, 1536×824 en kleinere laptops zoals 1280×720. De mediaquery voor beperkte hoogte gebruikt kleinere decoratie en behoudt echte klikvlakken.
- **Tablet/mobiel:** de bestaande responsieve variant blijft bestaan. Dat biedt natuurlijke verticale contentvolgorde en de bestaande vaste mobiele resultaatactie; géén geforceerde piepkleine vijfkaartsrij.
- **Geen servermutaties:** MySQL, NIVO-toestemming, mailstatus, CRM en privésecrets blijven ongewijzigd.

## Technische stukken

- `assets/home-cockpit.css` wordt na de bestaande vormgeving geladen zodat de aanpassing geïsoleerd is.
- `index.html` laadt de stylesheet.
- `scripts/build-preview.py` neemt exact dezelfde styling mee in het zelfstandige offline HTML-bestand; dat bestand voert geen netwerkverzoeken, adviesaanvragen of rapportmail uit.
- `scripts/home-cockpit-review.cjs` voert echte Chromium-metingen uit en schrijft synthetische screenshots en controles weg onder `visual-review-output/`.

## Acceptatiecriteria

1. Op minstens 1101×768, 1280×720, 1280×800, 1366×768, 1440×768, 1440×900 en 1536×824 bevinden linkerpaneel, huis, rechter resultaatknop, upgrade-kop én **alle vijf kaarten volledig binnen de viewport**, zonder afsnijding door ouders of horizontale overflow.
2. De zichtbare knop `Zonnepanelen` en daarna `Thuisbatterij` daadwerkelijk indrukken verandert het plan en de live-resultaten zonder document-scroll.
3. De andere drie kaartknoppen, uitleg, instellingen, planmodal, undo en scenario's blijven bruikbaar en worden door de bestaande browserregressietests beoordeeld.
4. 900px tablet en 390/320px mobiel behouden hun bestaande natuurlijke lay-out zonder nieuwe horizontale overflow.
5. Geen echte klanten of geheime gegevens in screenshots; de CI-server is uitsluitend een statische lokale testserver.

**Releasegrens:** voer pas een `main`-merge uit na succesvolle kwaliteitstests en controle van de gemaakte screenshots. Een GitHub-merge bevestigt nog geen Hostinger-deployment.

#!/usr/bin/env python3
"""Rebuild static, crawlable editorial pages. No production build step required."""
from pathlib import Path
from html import escape
import json
import re
import unicodedata
ROOT=Path(__file__).resolve().parents[1]
SOURCES={
'salderen':('Rijksoverheid','https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling'),
'acm':('ACM ConsuWijzer','https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen'),
'battery':('Milieu Centraal','https://www.milieucentraal.nl/energie-besparen/zonnepanelen/thuisbatterij-zonne-energie-opslaan/'),
'solar':('Milieu Centraal','https://www.milieucentraal.nl/energie-besparen/zonnepanelen/kosten-en-opbrengst-zonnepanelen/'),
'self':('Milieu Centraal','https://www.milieucentraal.nl/energie-besparen/zonnepanelen/verbruik-zelf-meer-zonnestroom/'),
'heat':('Milieu Centraal','https://www.milieucentraal.nl/energie-besparen/duurzaam-verwarmen-en-koelen/hybride-warmtepomp/'),
'isde':('RVO','https://www.rvo.nl/subsidies-financiering/ISDE'),
'isde2027':('RVO','https://www.rvo.nl/subsidies-financiering/isde/isde-wat-wijzigt-er-2027'),
'ap':('Autoriteit Persoonsgegevens','https://autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming')}
def source(key):
    label,url=SOURCES[key];return f'<a href="{url}" target="_blank" rel="noopener noreferrer">Bron: {label} ↗</a>'

pages=[
('rekenmodel.html','Ons rekenmodel. Alle kaarten op tafel.','Zo rekent WattGoedkoper: salderen in 2026, stroomkosten vanaf 2027, zonnepanelen, batterijverliezen en gecombineerde verduurzaming.','Een persoonlijk energieplan hoort uitlegbaar te zijn. Hier lees je wat we berekenen, wat we aannemen en waar een echte meting of technische opname nodig blijft.','Rekenmodel & bronnen',f'''
<h2>Wat deze scan je vertelt</h2><p>Je vergelijkt jaarlijkse scenario’s voor je eigen woning. De uitkomsten zijn indicatief: we kennen je dakconstructie, kwartierverbruik, radiatorvermogen en offerte nog niet. Het energiehuis werkt zonder account. Je kunt je volledige resultaat bekijken en bewaren voordat je advies aanvraagt.</p>
<div class="article-note"><strong>De bedragen zijn variabele energiekosten.</strong><p>Netbeheerkosten, vaste leveringskosten en de belastingvermindering ontbreken in het hoofdmodel. Het bedrag is dus geen voorspelling van je volledige jaarafrekening. Een verschil in vaste contractkosten kun je in de contractvergelijking wel apart invullen.</p></div>
<h2>1. Verbruik is iets anders dan netafname</h2><p>Met zonnepanelen koop je een deel van je stroom bij je leverancier en gebruik je een deel direct van je dak. In het energiehuis kun je totaalverbruik invullen, of de netafname, opwek en teruglevering over hetzelfde jaar.</p><p><code>Totaal verbruik = netafname + opwek − teruglevering</code></p><p>Zonder gemeten teruglevering schatten we het eigen gebruik op 25%, 30% of 40% van de opwek, afhankelijk van aanwezigheid overdag. Dit zijn profielaannames. Met een bestaande batterij bevat opwek minus teruglevering ook opslag en verliezen: het is dan geen zuivere meting van direct eigen gebruik. {source('self')}</p>
<h2 id="salderen">2. Een volledig rekenjaar 2026 tegenover 2027</h2><p>De salderingsregeling stopt op 1 januari 2027. In de vergelijking gebruiken we dezelfde jaarvolumes en tarieven om het effect van die wijziging zichtbaar te maken. Het 2026-scenario is geen besparing die je vanaf vandaag nog een volledig jaar kunt behalen. {source('salderen')}</p>
<table><thead><tr><th>Rekenjaar</th><th>Berekening stroom</th></tr></thead><tbody><tr><td>2026</td><td>Het positieve saldo netafname minus teruglevering × inkooptarief. Een overschot wordt tegen de terugleververgoeding vergoed. Terugleverkosten worden apart toegevoegd.</td></tr><tr><td>2027</td><td>Netafname × inkooptarief − teruglevering × bruto vergoeding + terugleverkosten.</td></tr></tbody></table>
<p>Tot 1 januari 2030 geldt een minimumvergoeding van 50% van het kale leveringstarief, exclusief belastingen en btw. Dat minimum berekenen we niet uit de ingevulde all-in stroomprijs. Vul daarom de bruto vergoeding uit je contract in. {source('acm')}</p>
<h2>3. Tarieven en kosten staan open</h2><p>De vooraf ingevulde € 0,28/kWh, € 1,25/m³ en andere bedragen zijn <strong>bewerkbare rekenvoorbeelden</strong>. We hebben geen live koppeling met het aanbod van energieleveranciers. Het actuele contract en de jaarafrekening zijn de juiste bronnen voor jouw bedragen. Een dynamisch contract wordt hier met een gemiddeld tarief benaderd; tijdsafhankelijke prijzen en handelsopbrengsten vragen een apart tijdreeksmodel.</p><p>Terugleverkosten per kWh bewegen mee met het volume. Een ingevoerd jaarbedrag blijft volledig staan zolang je teruglevert. Schalen, eenmalige bonussen, opzegvergoedingen en prijswijzigingen zijn niet automatisch verwerkt.</p>
<h2>4. De aannames per maatregel</h2><table><thead><tr><th>Maatregel</th><th>Rekenaanname</th></tr></thead><tbody><tr><td>Slim verbruik</td><td>3% minder stroom door kleine bespaarmaatregelen; met zonnepanelen 5 procentpunt extra eigen gebruik, of 10 bij een elektrische auto. Geen extra zonneverschuiving bij een bestaande batterij.</td></tr><tr><td>Nieuwe zonnepanelen</td><td>435 Wp per paneel, 875 kWh/kWp per jaar vóór correcties voor ligging en schaduw. Dit is een landelijke vuistregel, geen dakscan.</td></tr><tr><td>Nieuwe batterij</td><td>90% retourrendement, maximaal 180 cycli en een plafond van 60% nuttig eigen gebruik van zonnestroom. De capaciteit is een rekenkeuze; geen geoptimaliseerde dimensionering.</td></tr><tr><td>Isolatie</td><td>80% van gas betreft in het model ruimteverwarming. Daarvan 10% minder bij gemiddelde, of 20% bij matige isolatie. Geen ingemeten oppervlak of isolatiewaarde.</td></tr><tr><td>Hybride warmtepomp</td><td>60% minder resterend verwarmingsgas, 8,8 kWh nuttige warmte per m³ en SCOP 3,5. Extra elektriciteit wordt als netafname gerekend; geen winterzon bijgeteld.</td></tr></tbody></table><p>Een bestaande warmtepomp, warmtenet of volledig elektrische verwarming vereist een verdere uitsplitsing van de warmtevraag. De huidige scan kwantificeert daar geen extra isolatievoordeel. Dat betekent niet dat isoleren in zo’n woning ongunstig is.</p>
<h2>5. Waarom besparingen niet worden opgeteld</h2><p>Isoleren vermindert eerst de warmtevraag. Een warmtepomp werkt vervolgens op de resterende vraag. Slim eigengebruik en een batterij verdelen hetzelfde zonneoverschot. Daarom rekenen we het gehele gekozen pakket opnieuw door. De losse kaartjes en het contractvoordeel zijn geen bedragen die je daarna nog bij je plan kunt optellen.</p><p>Het voorgestelde startplan vergelijkt mogelijke combinaties en blijft binnen de bovengrens van je budget. Je kunt zelf ook duurdere combinaties proberen; de overschrijding blijft zichtbaar. Dit is een selectie uit enkele scenario’s, geen vergelijking van alle producten op de markt. Je kunt een batterij zelf proberen, ook samen met nieuwe zonnepanelen. De tool adviseert die niet automatisch als aanschaf; daarvoor is aanvullende analyse met meetdata nodig.</p>
<h2>6. Spelen met de aannames</h2><p>Het energiehuis reageert direct op je woning, huishouden en gekozen verbeteringen. De dag-nachtanimatie is een sfeerillustratie, geen gemeten of voorspeld uurverbruik. De jaargetallen veranderen daardoor niet. Bij nieuwe zonnepanelen groeit de voorbeeldinvestering evenredig mee als je het aantal panelen verandert. Je kunt een eigen offerteprijs invullen. Batterijcapaciteit en aanschafprijs zijn aparte aannames.</p><h2>Bandbreedte en terugverdientijd</h2><p>De bandbreedte varieert het effect van de maatregelen, bij gelijkblijvende tarieven. Ze is geen statistische zekerheid of voorspelling van energieprijzen. De eenvoudige terugverdientijd is investering gedeeld door de berekende jaarlijkse besparing. Financiering, onderhoud, degradatie, vervanging en abonnementen moeten bij een echte investeringsbeslissing apart worden beoordeeld.</p>
<h2>7. Subsidies: voorwaarden eerst</h2><p>We trekken geen subsidie af van de investeringen. ISDE hangt onder andere af van eigendom, uitvoering, maatregel, product en aanvraagtermijn. De wijzigingen voor 2027 waren bij onze broncontrole nog als voorgenomen beschreven. Controleer het actuele besluit en de meldcode voordat je een opdracht geeft. {source('isde')} · {source('isde2027')}</p>
<h2>Bronnen en versiebeheer</h2><p>Modelversie <strong>2026.11.14-v1</strong>. Broncontrole: 14 november 2026. Een bronvermelding is geen samenwerking of goedkeuring door die organisatie.</p><ul class="source-list">{''.join('<li>'+source(k)+'</li>' for k in ['salderen','acm','solar','self','battery','heat','isde','isde2027'])}</ul>
<h2>Wie betaalt voor WattGoedkoper?</h2><p>WattGoedkoper is een commerciële energietool. Consumenten kunnen na de gratis berekening afzonderlijk om advies van NIVO Groep Holland vragen. De uitkomsten zijn niet afhankelijk van een adviesaanvraag. We presenteren ons niet als onafhankelijke vergelijking van alle installateurs.</p>
'''),
('privacy.html','Jouw gegevens. Jouw keuze.','Privacy en cookies bij WattGoedkoper: berekenen in je browser, optioneel je energiehuis bewaren en bewust advies aanvragen.','Het energiehuis hoort eerst voor jou te werken. Daarom krijg je je volledige inzicht zonder account of contactgegevens.','Privacy & cookies',f'''
<div class="article-note notice"><strong>Jij bepaalt wat je deelt.</strong><p>Het energiehuis werkt zonder account of contactgegevens. Advies via NIVO Groep Holland vraag je afzonderlijk en met toestemming aan. Rapportbezorging per e-mail wordt pas ingeschakeld na een veilige mailtest.</p></div>
<h2>Je gratis energiehuis</h2><p>De berekening wordt in je browser uitgevoerd. Antwoorden over je woning, verbruik en tarieven blijven daar totdat je zelf een adviesaanvraag verstuurt. Je naam, e-mail en telefoonnummer zijn niet nodig om de uitkomst te bekijken. De website haalt geen slimme-meterdata op.</p><h2>Bewaren op je eigen apparaat</h2><p>Wanneer je bewust kiest om je energiehuis te bewaren, wordt die lokaal opgeslagen in je browser. Gebruik deze optie liever niet op een gedeeld apparaat. Je kunt de bewaarhet energiehuis verwijderen via ‘Privacy-instellingen’ of je browsergegevens wissen. Je privacyvoorkeur wordt functioneel onthouden, zodat we die keuze respecteren.</p>
<h2>Rapportmail op eigen verzoek</h2><p>Als je kiest voor ‘Mail mijn energieplan’, gebruiken we je e-mailadres en een beperkte, indicatieve plansamenvatting uitsluitend om dat ene rapport te versturen. De e-mail bevat een link waarmee je zelf apart advies kunt aanvragen. Dit maakt geen advieslead, marketingtoestemming of CRM-contact aan. De applicatie bewaart het adres of rapport niet; alleen tijdelijk onomkeerbare controlegegevens voor misbruikpreventie (maximaal circa 48 uur). De mailprovider en hosting kunnen technische aflever- en toeganglogs hebben. Zonder ingeschakelde Hostinger-mailfunctie wordt er niets verstuurd.</p>
<h2>Optionele statistieken</h2><p>Gebruiksstatistieken staan standaard uit. Alleen als je daarvoor kiest, telt de site gebeurtenissen zoals een bezoek, gestarte of afgeronhet energiehuis en een adviesaanvraag. Het gaat om dagtotalen. Energiehuisgegevens, namen, e-mailadressen en unieke bezoekersprofielen zitten daar niet in. Er zijn geen advertentiepixels, externe analyticscripts of geladen externe lettertypes.</p><p>De metingen laten gebeurtenissen zien, geen unieke personen. Je kunt toestemming wijzigen via ‘Privacy-instellingen’ onderaan de homepage. Eerder opgetelde, niet tot jou herleidbare dagtotalen kunnen niet als individuele gebeurtenis worden teruggevonden.</p>
<h2>Als je later persoonlijk advies aanvraagt</h2><p>De voorbereide adviesfunctie vraagt je naam en minimaal een e-mailadres of telefoonnummer. Postcode en toelichting zijn optioneel. Ook de antwoorden van je energiehuis en een indicatieve berekening worden meegestuurd, zodat de adviseur je vraag begrijpt.</p><p>Nieuwe adviesaanvragen worden uitsluitend door NIVO Groep Holland opgevolgd. Het toestemmingsvakje staat niet vooraf aangevinkt. Alleen bij een expliciete adviesaanvraag mogen NIVO-medewerkers de meegestuurde contactgegevens en energiescan gebruiken om de vraag op te volgen; niet voor een nieuwsbrief of andere marketing. Toestemming voor statistieken is een afzonderlijke keuze. {source('ap')}</p>
<h2>Opslag en beveiliging van de voorbereide adviesfunctie</h2><p>Adviesaanvragen worden pas bevestigd nadat ze zijn opgeslagen. De persoonsgegevens zijn versleuteld in een database buiten de openbare websitemap. Alleen bevoegde beheerders hebben na inloggen toegang. De aanvraag bevat de ontvangende organisatie, datum en versie van de toestemming. Rapportmail op eigen verzoek vormt geen CRM- of adviesaanvraag.</p><p>De standaard bewaartermijn voor onbehandelde en behandelde aanvragen op dit platform is 90 dagen. De applicatie verwijdert oude aanvragen dagelijks bij de eerstvolgende activiteit; een dagelijkse onderhoudstaak is eveneens beschikbaar. Geaggregeerde statistieken worden maximaal 400 dagen bewaard. Een daadwerkelijke klantrelatie bij een partner kan een afzonderlijk dossier en eigen bewaartermijn hebben.</p><p>Voor misbruikbeperking gebruikt de applicatie kortdurende onomkeerbaar gecodeerde netwerkkenmerken, geen onbewerkte IP-adressen in de aanvraagdatabase. Webserver- en hostinglogs kunnen technisch wel IP-adressen bevatten; deze vallen onder het hostingbeheer. Functionele sessiecookies beveiligen de adviesaanvraag en het beheerdersaccount.</p>
<h2>Contact, inzage en verwijderen</h2><p>Voor vragen over persoonsgegevens, inzage, correctie, verwijdering of intrekken van een adviesverzoek kun je contact opnemen via <a href="mailto:info@wattgoedkoper.nl">info@wattgoedkoper.nl</a>. De juridische verwerkingsverantwoordelijke moet vóór een bredere commerciële uitrol definitief worden bevestigd. Het energiehuis is geen geautomatiseerde beslissing over je rechten of toegang tot diensten.</p><p>Meer informatie over de huidige adviesopvolger: <a href="https://nivogroepholland.nl/privacy-verklaring/" rel="noopener noreferrer" target="_blank">NIVO Groep Holland</a>. Historische aanvragen van eerdere partners blijven onder hun oorspronkelijke toestemming bewaard zolang dat noodzakelijk is. Een privacyklacht kun je ook indienen bij de <a href="https://www.autoriteitpersoonsgegevens.nl/" target="_blank" rel="noopener noreferrer">Autoriteit Persoonsgegevens</a>.</p>
'''),
('kennis/zonnepanelen/index.html','Zonnepanelen na 2027: reken vanuit je eigen verbruik.','Wat betekenen zonnepanelen zonder salderen? Begrijp eigen gebruik, terugleververgoeding en de juiste volgorde voor jouw huis.','Je dak volleggen is niet automatisch de beste financiële keuze. Begin met de stroom die je zelf kunt gebruiken en kijk daarna naar het overschot.','Zonnepanelen',f'''
<h2>Je zonnestroom heeft twee bestemmingen</h2><p>Een deel gaat direct naar apparaten in je huis. De rest gaat naar het elektriciteitsnet. Vanaf 1 januari 2027 kun je die teruggeleverde stroom niet meer salderen met stroom die je later afneemt. Daardoor wordt het verschil tussen direct eigengebruik en teruglevering belangrijker. {source('salderen')}</p>
<h2>Welke gegevens heb je nodig?</h2><ul><li>Je jaarlijkse totale stroomverbruik, inclusief stroom van je eigen dak.</li><li>De productie van je panelen en de teruglevering over dezelfde periode.</li><li>Je inkooptarief, bruto terugleververgoeding en terugleverkosten.</li><li>Je dakligging, schaduw en de momenten waarop je thuis stroom gebruikt.</li></ul><p>Heb je nog geen panelen? De energiehuis van WattGoedkoper geeft een globale opbrengstindicatie uit aantal, ligging en schaduw. Een technisch dakonderzoek en echt legplan blijven nodig.</p>
<h2>Begin bij bruikbare stroom</h2><p>Een was- of vaatwasprogramma verplaatsen kan helpen als dat past bij je dag en installatie. Een elektrische auto thuis laden kan meer betekenen, maar alleen als die op geschikte momenten beschikbaar is. De omvang van het effect verschilt per huishouden. {source('self')}</p><p>Oost-west geeft een ander productieprofiel dan zuid. De hoogste jaaropwek is daarom niet vanzelf het profiel dat het beste bij jouw gebruik past. {source('solar')}</p>
<h2>Wat krijg je uit het energiehuis?</h2><p>Je ziet een indicatie van opwek, eigengebruik, netafname en teruglevering. Je vergelijkt 2026 en 2027 en kunt de voorbeeldtarieven vervangen door je echte contract. Het plan benoemt een ontbrekende daktoestemming of VvE-afstemming en rekent niet automatisch subsidie mee.</p>
'''),
('kennis/thuisbatterij/index.html','Past een thuisbatterij echt bij jouw huis?','Een eerlijke eerste thuisbatterijberekening: eigen zonnestroom, verliezen, kosten en wat je nog moet weten voor een aankoop.','Opslag kan je helpen meer eigen stroom te gebruiken. Of de investering logisch is, moet blijken uit je gegevens en de voorwaarden.','Thuisbatterij',f'''
<h2>Begin met het probleem dat je wilt oplossen</h2><p>Wil je meer eigen zonnestroom gebruiken, sturen op stroomprijzen of noodstroom? Dat zijn verschillende doelen. Een gewone thuisbatterij levert niet automatisch noodstroom. Capaciteit, aansluitwijze, aansturing en contract bepalen wat mogelijk is. {source('battery')}</p>
<h2>Meer eigen stroom is niet hetzelfde als winst</h2><p>Stroom opslaan kost energie. Bovendien krijg je geen terugleververgoeding voor de stroom die je in de batterij laadt. De berekening moet beide meenemen, naast aanschaf, installatie en eventuele abonnementen. In de energiehuis van WattGoedkoper staan handelsinkomsten op nul.</p><p>We gebruiken een zichtbaar voorbeeld van 90% retourrendement en maximaal 180 cycli. Dit zijn modelaannames, geen specificaties van een aangeboden batterij. Een werkelijk jaarprofiel kan flink anders uitvallen.</p>
<h2>Waarom we soms adviseren om te wachten</h2><p>Als de besparing klein is ten opzichte van de investering, is een batterij niet vanzelf de eerste stap. Slim eigengebruik of een ander contract kan aantrekkelijker zijn. De uitkomst wordt niet gunstiger gemaakt doordat Thuisbatterij Team een mogelijke adviespartner is.</p>
<h2>Neem dit mee naar een adviseur</h2><ul><li>Een volledig jaar meetdata, liefst op kwartierniveau.</li><li>Opwek en teruglevering, plus je contractvoorwaarden.</li><li>Een offerte met installatie, aansturing, garantie en vaste kosten.</li><li>Een vergelijking mét verliezen, vervanging en eventuele financiering.</li></ul><p>Het energiehuis is een eerste selectie. Een passende batterijcapaciteit of gegarandeerde terugverdientijd volgt daar niet uit. Er is geen ISDE-batterijsubsidie in de berekening opgenomen. {source('isde')}</p>
'''),
('kennis/energiecontract/index.html','Een goed energiecontract begint bij de hele rekensom.','Vergelijk je energiecontract met eigen tarieven: stroom, gas, terugleververgoeding, terugleverkosten en vaste kosten.','Een lage prijs per kWh zegt niet alles. Zeker met zonnepanelen kan het verschil juist in terugleverkosten en voorwaarden zitten.','Energiecontract',f'''
<h2>Leg de kosten naast elkaar</h2><p>Vergelijk stroom- en gastarief, bruto terugleververgoeding, terugleverkosten en vaste kosten. Controleer ook looptijd, opzegvergoeding en eenmalige korting. Een tarief met belastingen kun je niet rechtstreeks vergelijken met een kaal leveringstarief.</p><p>Tot 1 januari 2030 ziet het wettelijke minimum voor de terugleververgoeding op het kale leveringstarief. De terugleverkosten staan daar los van en kunnen de vergoeding overstijgen. {source('acm')}</p>
<h2>Wat de vergelijking hier doet</h2><p>Je vult je huidige tarieven en een alternatief in. Het energiehuis rekent beide met dezelfde jaarvolumes door. Jaarlijkse terugleverkosten blijven staan zolang je teruglevert; per-kWh-kosten veranderen met het volume. Een verschil in vaste kosten vul je apart in.</p><div class="article-note"><strong>Geen live energiemarkt.</strong><p>WattGoedkoper toont in deze versie geen echte leveranciersaanbiedingen. Vooraf ingevulde bedragen zijn voorbeelden. Gebruik offertes of contractbladen om een zinvolle vergelijking te maken.</p></div>
<h2>Bij een dynamisch contract heb je meer data nodig</h2><p>Een gemiddeld jaarprijsje vertelt niet op welke uren je stroom gebruikt of teruglevert. Daardoor kan het een dynamisch contract niet precies doorrekenen. Een gedetailleerd profiel met uur- of kwartiertarieven is een volgende stap.</p>
<h2>Een contract en een installatie beïnvloeden elkaar</h2><p>Nieuwe panelen of een batterij veranderen je netafname en teruglevering. Controleer daarom het contract opnieuw bij het uiteindelijke installatieplan. Het contractvoordeel in het energiehuis is apart getoond en mag je niet nogmaals bij de besparingen van maatregelen optellen.</p>
'''),
('kennis/isolatie-warmtepomp/index.html','Eerst de warmtevraag begrijpen. Dan slim verduurzamen.','Ontdek hoe isolatie en een hybride warmtepomp samenhangen en waarom extra stroom in een besparingsberekening hoort.','Een warm huis heeft warmte nodig. Hoeveel, en bij welke temperatuur, bepaalt welke maatregelen passen.','Isolatie & warmtepomp',f'''
<h2>De volgorde maakt verschil</h2><p>Isolatie verlaagt de warmtevraag. Een warmtepomp kan de resterende warmte efficiënter leveren. Wie beide effecten los berekent en optelt, kan dezelfde gasbesparing dubbel meetellen. Daarom rekent het energiehuis gecombineerde maatregelen opnieuw door.</p>
<h2>Minder gas betekent meer stroom</h2><p>Bij een hybride warmtepomp blijft de cv-ketel een rol houden. De pomp gebruikt elektriciteit om warmte te leveren. Een berekening die alleen bespaarde kubieke meters gas toont, is dus onvolledig. De toepasselijke verhouding hangt onder meer af van isolatie, afgiftesysteem en temperatuur. {source('heat')}</p><p>In onze eerste benadering is 80% van gas voor ruimteverwarming en de SCOP 3,5. Dat zijn aannames die een woningopname moet verfijnen. Extra warmtepompstroom wordt conservatief als netafname behandeld; zomeropwek wordt niet naar de winter verschoven.</p>
<h2>Wat het energiehuis nog niet kan vaststellen</h2><ul><li>De exacte isolatieoppervlakken en warmteweerstand.</li><li>Benodigd vermogen en geschiktheid van radiatoren.</li><li>Ruimte, geluid, elektra en technische plaatsing.</li><li>Extra isolatiebesparing bij een bestaande warmtepomp of warmtenet.</li></ul><p>Bij huur en appartementen is toestemming van verhuurder of VvE vaak een onderdeel van de vervolgstap.</p>
<h2>Controleer subsidie vóór je beslist</h2><p>ISDE heeft voorwaarden voor onder meer woning, uitvoering en maatregel. Trek daarom niet alvast een algemeen bedrag van je investering af. De voorgenomen wijzigingen voor 2027 moeten tegen de actuele RVO-regels worden gecontroleerd. {source('isde')} · {source('isde2027')}</p>
''')]

# Single source of truth for the authored v0.8 energy/SEO cluster.
# Content is edited and reviewed as JSON, then statically published by this script.
from datetime import date
from xml.sax.saxutils import escape as xml_escape
CLUSTER = json.loads((ROOT/'docs/seo-cluster-v08.json').read_text(encoding='utf-8'))
NEW_GUIDES = CLUSTER['pages']
PAGES_BY_PATH = {entry['path']: entry for entry in NEW_GUIDES}
pages += [(entry['path'], entry['title'], entry['description'],
           entry['lead'], entry['category'], entry['body']) for entry in NEW_GUIDES]
pages = [(path,title,description,lead,category,
          (body + CLUSTER.get('enhancements',{}).get(path,''))
          .replace('Thuisbatterij Team','NIVO Groep Holland')
          .replace('bewaarhet energiehuis','bewaarde energiehuis')
          .replace('buiten de openbare websitemap','buiten de openbare website'))
         for path,title,description,lead,category,body in pages]

PAGE_ART = {
    'kennis/zonnepanelen/index.html': ('solar-card.webp', 'Zonnepanelen in warm daglicht'),
    'kennis/thuisbatterij/index.html': ('battery-card.webp', 'Een thuisbatterij bij een woning'),
    'kennis/energiecontract/index.html': ('smart-use-card.webp', 'Slim inzicht in energiegebruik'),
    'kennis/isolatie-warmtepomp/index.html': ('heatpump-card.webp', 'Een warmtepomp bij een woning'),
}
PAGE_ART.update({p['path']:(p['art'],p['artAlt']) for p in NEW_GUIDES})

BRAND = '<img class="brand-lockup" src="/assets/brand-logo.svg" width="378" height="73" alt="" decoding="async">'
ARROW = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>'

def heading_id(text):
    plain = re.sub('<[^>]+>', '', text)
    plain = unicodedata.normalize('NFKD', plain).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', plain.lower()).strip('-')

def render(path,title,description,lead,category,body):
    canonical='https://wattgoedkoper.nl/'+path.replace('index.html','')
    entry=PAGES_BY_PATH.get(path,{})
    lastmod=entry.get('lastmod',CLUSTER['editorialDates'].get(path))
    if not lastmod:
        raise ValueError(f'Missing editorial modification date for {path}')
    date.fromisoformat(lastmod) # Dates represent content changes, never an automatic build timestamp.
    crumb_items=[('/', 'Home')]
    if path.startswith('kennis/'):
        if path != 'kennis/index.html':
            crumb_items.append(('/kennis/','Kennis'))
        if path.startswith('kennis/zonnepanelen/') and path != 'kennis/zonnepanelen/index.html':
            crumb_items.append(('/kennis/zonnepanelen/','Zonnepanelen'))
        if path.startswith('kennis/thuisbatterij/') and path != 'kennis/thuisbatterij/index.html':
            crumb_items.append(('/kennis/thuisbatterij/','Thuisbatterij'))
    crumb_items.append((canonical, category))
    breadcrumb_schema=[{'@type':'ListItem','position':i+1,'name':label,'item':('https://wattgoedkoper.nl'+url if url.startswith('/') else url)}
                       for i,(url,label) in enumerate(crumb_items)]
    graph=[
        {'@type':'WebPage','@id':canonical+'#webpage','name':title,'description':description,'url':canonical,
         'inLanguage':'nl-NL','dateModified':lastmod},
        {'@type':'BreadcrumbList','itemListElement':breadcrumb_schema},
    ]
    if path.startswith('kennis/') and path != 'kennis/index.html':
        graph.append({'@type':'Article','headline':title,'description':description,'dateModified':lastmod,
                      'inLanguage':'nl-NL','mainEntityOfPage':canonical,'author':{'@type':'Organization','name':'WattGoedkoper'}})
    schema={'@context':'https://schema.org','@graph':graph}
    breadcrumb_html=''
    for i,(url,label) in enumerate(crumb_items):
        if i:breadcrumb_html+='<span aria-hidden="true">/</span>'
        breadcrumb_html+=f'<span aria-current="page">{escape(label)}</span>' if i==len(crumb_items)-1 else f'<a href="{url}">{escape(label)}</a>'
    cta=entry.get('cta')
    if not cta:
        cta='#verken-zonnepanelen' if path=='kennis/zonnepanelen/index.html' else (
            '#verken-thuisbatterij' if path=='kennis/thuisbatterij/index.html' else '#verken-energieplan')
    cta_href='/'+cta
    is_combo=path=='kennis/zonnepanelen-met-thuisbatterij/index.html'
    example_script='<script type="module" src="/assets/guide-comparison.mjs"></script>' if is_combo else ''
    image=PAGE_ART.get(path,('smart-use-card.webp',''))[0]
    og_image='https://wattgoedkoper.nl/assets/images/'+image
    headings=[]
    def add_heading(match):
        attrs, text = match.groups()
        existing = re.search(r'id="([^"]+)"', attrs)
        anchor = existing.group(1) if existing else heading_id(text)
        headings.append((anchor, re.sub('<[^>]+>', '', text)))
        return f'<h2{attrs if existing else attrs + chr(32) + "id=" + chr(34) + anchor + chr(34)}>{text}</h2>'
    body = re.sub(r'<h2([^>]*)>(.*?)</h2>', add_heading, body)
    body = body.replace('<table>', '<div class="article-table" tabindex="0" role="region" aria-label="Rekentabel, horizontaal te scrollen"><table>').replace('</table>', '</table></div>')
    contents=''.join(f'<a href="#{escape(anchor)}">{escape(text)}</a>' for anchor,text in headings)
    matching=entry.get('related')
    if not matching:
        matching={
            'kennis/zonnepanelen/index.html':[
                'kennis/zonnepanelen/zelfverbruik/index.html','kennis/zonnepanelen/salderen-2027/index.html',
                'kennis/zonnepanelen-met-thuisbatterij/index.html','kennis/thuisbatterij/index.html'],
            'kennis/thuisbatterij/index.html':[
                'kennis/thuisbatterij/wanneer-zinvol/index.html','kennis/zonnepanelen-met-thuisbatterij/index.html',
                'kennis/zonnepanelen/index.html','kennis/zonnepanelen/zelfverbruik/index.html'],
        }.get(path,[
            'kennis/index.html','kennis/zonnepanelen/index.html',
            'kennis/thuisbatterij/index.html','kennis/energiecontract/index.html'])
    index={p:row for row in pages for p in [row[0]]}
    related=''.join(
        f'<a class="guide-card" href="/{p.replace("index.html", "")}"><img src="/assets/images/{PAGE_ART[p][0]}" alt="" width="400" height="267" loading="lazy"><span><small>VERDER ONTDEKKEN</small><strong>{escape(index[p][4])}</strong></span>{ARROW}</a>'
        for p in matching if p in index and p in PAGE_ART and p!=path
    )
    if path in PAGE_ART:
        filename,alt=PAGE_ART[path]
        art=f'<div class="article-hero-art"><img src="/assets/images/{filename}" alt="{escape(alt)}" width="768" height="512" fetchpriority="high"><span class="art-caption">Een beetje inzicht. Meer mogelijkheden.</span></div>'
    elif path == 'rekenmodel.html':
        art='<div class="article-hero-art editorial-illustration" aria-hidden="true"><span class="editorial-orbit orbit-one"></span><span class="editorial-orbit orbit-two"></span><div class="editorial-note"><span>HELDER INZICHT</span><svg viewBox="0 0 120 76"><path class="chart-base" d="M10 66h100"/><rect x="17" y="33" width="17" height="33" rx="4"/><rect x="51" y="21" width="17" height="45" rx="4"/><rect x="85" y="7" width="17" height="59" rx="4"/></svg><strong>Elke aanname<br>op tafel.</strong><i>Jij houdt de regie.</i></div><span class="editorial-seal">100%<small>uitlegbaar</small></span></div>'
    else:
        art='<div class="article-hero-art editorial-illustration privacy-illustration" aria-hidden="true"><span class="editorial-orbit orbit-one"></span><span class="editorial-orbit orbit-two"></span><div class="editorial-note"><span>JOUW KEUZE</span><svg class="privacy-shield" viewBox="0 0 120 90"><path d="m60 8 32 12v25c0 17-15 30-32 39-17-9-32-22-32-39V20Z"/><path d="m45 44 11 11 23-26"/></svg><strong>Je huis eerst.<br>Je gegevens later.</strong><i>Alleen als jij dat wilt.</i></div></div>'
    return f'''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf8f2">
<title>{escape(title)} | WattGoedkoper</title><meta name="description" content="{escape(description,quote=True)}"><link rel="canonical" href="{canonical}">
<link rel="icon" href="/assets/brand-mark.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/content.css"><link rel="stylesheet" href="/assets/guide-cluster.css">
<meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(description,quote=True)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{og_image}"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('</','<\\/')}</script>{example_script}
</head>
<body class="editorial-page">
<a class="skip-link" href="#inhoud">Ga naar inhoud</a>
<header class="content-header"><div class="content-header-inner"><a class="content-brand" href="/" aria-label="WattGoedkoper, startpagina">{BRAND}</a><nav class="content-nav" aria-label="Hoofdnavigatie"><a href="/#main-content">Je energiehuis</a><a href="/kennis/">Kennis &amp; inspiratie</a><a href="/rekenmodel.html">Hoe rekenen we?</a></nav><a class="content-start" href="/#verken-energieplan">Mijn energieplan {ARROW}</a></div></header>
<main id="inhoud" class="content-layout">
<nav class="breadcrumbs" aria-label="Kruimelpad">{breadcrumb_html}</nav>
<section class="article-hero" aria-labelledby="article-title"><div class="article-hero-copy"><span class="article-eyebrow">{escape(category)}</span><h1 id="article-title">{escape(title)}</h1><p class="article-lead">{escape(lead)}</p><div class="article-meta"><span>Inhoud bijgewerkt: {lastmod}</span><span>Indicatief inzicht, geen offerte of garantie</span></div></div>{art}</section>
<div class="article-reading-layout"><aside class="article-sidebar"><nav class="article-contents" aria-label="In dit artikel"><span class="contents-title">In dit artikel</span>{contents}</nav><a class="sidebar-invite" href="{cta_href}"><span>VAN INZICHT NAAR JE EIGEN HUIS</span><strong>Wat zou jij<br>kunnen besparen?</strong><span class="sidebar-invite-link">Probeer het zelf {ARROW}</span></a></aside><article class="article-body">{body}</article></div>
<section class="article-cta" aria-labelledby="article-cta-title"><div><span class="article-eyebrow">JOUW HUIS. JOUW MOGELIJKHEDEN.</span><h2 id="article-cta-title">Wat betekent dit<br>voor jouw huis?</h2><p>Ontdek je mogelijkheden met het gratis energiehuis.<br>Je krijgt direct je volledige resultaat.</p></div><a href="{cta_href}">Maak mijn energieplan {ARROW}</a></section>
<section class="related-section" id="verder-lezen" aria-labelledby="related-title"><div class="related-heading"><span class="article-eyebrow">BLIJF NIEUWSGIERIG</span><h2 id="related-title">Een beetje meer weten.</h2></div><div class="guide-links">{related}</div></section>
</main>
<footer class="content-footer"><div class="content-footer-top"><a class="content-brand" href="/" aria-label="WattGoedkoper, startpagina">{BRAND}</a><p>Jouw huis. Jouw keuzes.</p><nav aria-label="Informatie"><a href="/rekenmodel.html">Rekenmodel &amp; bronnen</a><a href="/privacy.html">Privacy</a><a href="/">Terug naar je energiehuis</a></nav></div><div class="content-footer-bottom"><span>© 2026 WattGoedkoper</span><p>Persoonlijk advies uitsluitend op jouw verzoek, via <strong>NIVO Groep Holland</strong>.</p></div></footer>
</body></html>'''

for row in pages:
    target=ROOT/row[0]
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(render(*row), encoding='utf-8')

urls=[('https://wattgoedkoper.nl/',CLUSTER['editorialDates']['index.html'])]
for row in pages:
    path=row[0]
    changed=PAGES_BY_PATH.get(path,{}).get('lastmod',CLUSTER['editorialDates'].get(path))
    if not changed:raise ValueError(f'Missing editorial lastmod for {path}')
    date.fromisoformat(changed)
    urls.append(('https://wattgoedkoper.nl/'+path.replace('index.html',''),changed))
if len(set(url for url,_ in urls))!=len(urls):
    raise ValueError('Duplicate canonical URL in sitemap')
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'<url><loc>{xml_escape(url)}</loc><lastmod>{changed}</lastmod></url>\n' for url,changed in urls)+'</urlset>\n',encoding='utf-8')
print(f'Built {len(pages)} static content pages and sitemap from authored metadata.')

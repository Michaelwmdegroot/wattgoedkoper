# Onderbouwing van het eerste energiemodel

Peildatum bronnencontrole: **14 november 2026**. Deze notitie beschrijft de inhoudelijke keuzes achter WattGoedkoper, de grenzen van een eerste scan en de gegevens die nodig zijn voor verdere verfijning. De uitvoerbare berekening staat in `assets/model.mjs`; wijzigingen in aannames en beleid horen samen met een nieuwe modelversie te worden vastgelegd.

## 1. Productdoel en kwaliteit

De scan geeft direct een persoonlijk eerste energieplan. De berekening is deterministisch: dezelfde invoer en modelversie geven dezelfde uitkomst. Een commerciële voorkeur voor zonnepanelen, thuisbatterijen of een specifieke adviespartner mag de berekende geschiktheid niet veranderen. Het resultaat kan ook zijn dat eerst isoleren, het verbruik aanpassen of nog niets aanschaffen logischer is.

Contactgegevens zijn niet nodig om het volledige rekenresultaat te bekijken. Een bezoeker kiest afzonderlijk of NIVO Groep Holland, Thuisbatterij Team of beide advies mogen geven. WattGoedkoper beschrijft deze commerciële relatie en noemt zichzelf geen onafhankelijke marktvergelijker.

De eerste versie bevat geen live leveranciersaanbod, gecertificeerd woningadvies, slimme-meterkoppeling, roof scan, handelsalgoritme of subsidiebeschikking. Voorbeeldprijzen zijn zichtbaar en bewerkbaar. Het resultaat mag deze voorbeelden nooit presenteren als de actuele marktprijs of een gegarandeerde besparing.

## 2. Bronnenregister

| ID | Bron | Gebruikt voor |
| --- | --- | --- |
| saldering | [Rijksoverheid: salderingsregeling](https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling) | Einde op 1 januari 2027; scheiding tussen verrekenen en terugleververgoeding. |
| acm-export | [ACM: salderen en terugleveren](https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen) | Tot 2030 vergoeding minimaal 50% van kaal leveringstarief; aparte terugleverkosten; contract dat over jaargrens loopt. |
| acm-contract | [ACM: energieleverancier kiezen](https://consument.acm.nl/elektriciteit-en-gas/overstappen-vergelijken-en-verhuizen/tips-bij-het-kiezen-van-een-energieleverancier) | Vergelijk vaste kosten, verbruikstarieven, kortingen en terugleverkosten. |
| acm-offer | [ACM: begrijpelijk aanbod](https://consument.acm.nl/vergelijken-en-overstappen/energie/aanbod-op-maat) | Aanbod op maat, contractduur, opzegvergoeding; beperkingen bij dynamische prijzen. |
| acm-dynamic | [ACM: vaste en variabele leveringskosten](https://consument.acm.nl/elektriciteit-en-gas/wat-betaal-ik-voor-mijn-energie/vaste-variabele-leveringskosten-energie) | Dynamische prijzen kunnen per kwartier/uur veranderen; risico's. |
| mc-solar | [Milieu Centraal: kosten en opbrengst zonnepanelen](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/kosten-en-opbrengst-zonnepanelen/) | Oriëntatie, opbrengst, kostenindicaties, belang van eigen gebruik. Pagina gewijzigd 5 november 2026. |
| mc-self-use | [Milieu Centraal: meer zonnestroom zelf verbruiken](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/verbruik-zelf-meer-zonnestroom/) | Circa 30% direct eigen gebruik als algemene vuistregel; mogelijkheden voor verbruik verschuiven. |
| mc-battery | [Milieu Centraal: thuisbatterij](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/thuisbatterij-zonne-energie-opslaan/) | Terugverdienen onzeker; begrensde opslag; geen automatische zelfvoorziening of noodstroom. |
| mc-consumption | [Milieu Centraal: gemiddeld energieverbruik](https://www.milieucentraal.nl/energie-besparen/inzicht-in-je-energierekening/gemiddeld-energieverbruik/) | Verbruik verschilt per huishoudgrootte en woning; gemiddelde is geen persoonlijke meterstand. |
| rvo-heatpump | [RVO: warmtepomp](https://www.rvo.nl/onderwerpen/duurzaam-verwarmen-koelen/warmtepomp) | Seizoensrendement en hybride versus volledig elektrisch. |
| mc-hybrid | [Milieu Centraal: hybride warmtepomp](https://www.milieucentraal.nl/energie-besparen/duurzaam-verwarmen-en-koelen/hybride-warmtepomp/) | Besparing op verwarmingsgas; rol van isolatie en installatie. |
| isde | [RVO: ISDE](https://www.rvo.nl/subsidies-financiering/ISDE) | Geen ISDE-subsidie voor thuisbatterij; woning- en gebruikersgroepen. |
| isde-heatpump | [RVO: warmtepomp voor woningeigenaren](https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/warmtepomp) | Meldcode, installatiebedrijf, aanvraagtermijn en woningvoorwaarden. |
| isde-insulation | [RVO: isolatiemaatregelen](https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/isolatiemaatregelen) | Oppervlakte/isolatiewaarde, aanvraagtermijn en combinatievoorwaarden. |
| isde-faq | [RVO: veelgestelde vragen woningeigenaren](https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/veelgestelde-vragen) | Volledige uitvoering door bedrijf; geen subsidie bij zelfinstallatie. |
| isde-2027 | [RVO: voorgenomen wijzigingen 2027](https://www.rvo.nl/subsidies-financiering/isde/isde-wat-wijzigt-er-2027) | Op 12 november 2026 nog als voorgenomen aangeduid. |
| cbs-gas | [CBS: eindverbruikersprijzen energie](https://www.cbs.nl/nl-nl/cijfers/detail/85666NED) | Calorische bovenwaarde aardgas 35,17 MJ/m³; onderscheid brandstofenergie en nuttige warmte. |
| pdok | [PDOK Locatieserver](https://www.pdok.nl/pdok-locatieserver) | Open, gratis geocodering voor toekomstige locatieverfijning. |
| pvgis | [JRC: PVGIS](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en) | Open zonne- en PV-productiegegevens, geen registratie. |
| pvgis-api | [JRC: PVGIS 5 API](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en) | Gedocumenteerd v5_3 API-pad en tijdreeksen. |

De links zijn bronnen voor de genoemde onderwerpen. Ze onderbouwen niet automatisch iedere voorbeeldprijs, geschatte woningfactor of gekozen bandbreedte in de software.

## 3. Wetgeving en rekenjaar

Tot en met 31 december 2026 kunnen kleinverbruikers jaarlijkse afname en teruglevering salderen. Vanaf 1 januari 2027 worden deze volumes afzonderlijk afgerekend. De minimumvergoeding tot 1 januari 2030 heeft betrekking op het **kale leveringstarief exclusief energiebelasting en btw**, niet op de all-in inkoopprijs uit het formulier. Terugleverkosten zijn een aparte component en kunnen het netto voordeel van export verkleinen of negatief maken. Zie de bronnen `saldering` en `acm-export`.

De software gebruikt twee volledige rekenjaren om het verschil in regels inzichtelijk te maken. De 2026-uitkomst is geen belofte dat de bezoeker vanaf vandaag nog twaalf maanden kan salderen. Het naast elkaar zetten van dezelfde volumes en voorbeeldtarieven is een beleidsscenario, geen voorspelling van de werkelijke tarieven in 2027.

Een contract over de jaargrens kan andere tarieven voor beide perioden hebben. Een exacte afrekening vereist die contractvoorwaarden en de volumes per betreffende periode. De eenvoudige jaarberekening is daar geen vervanging voor.

## 4. Energieboekhouding

Het formulier onderscheidt totaal huishoudelijk stroomverbruik, netafname, PV-productie en teruglevering. Met `T` als totaal gebruik, `P` als productie, `S` als direct eigen gebruik, `I` als netafname en `E` als teruglevering:

```text
T = I + P - E
S = P - E
I = T - S
E = P - S
```

Bij meterinvoer is `T` dus niet gelijk aan de afname op de energierekening. Bij totaal-invoer zonder bekende teruglevering wordt `S` geschat en begrensd door zowel `T` als `P`. Dit blijft een schatting omdat gelijktijdigheid van opwek en vraag niet uit jaartotalen volgt.

Onmogelijke invoer wordt afgewezen: bijvoorbeeld negatieve hoeveelheden, niet-eindige getallen of teruglevering groter dan productie bij een uitsluitend op zonneproductie gebaseerd huishoudmodel. De meterstandmodus veronderstelt geen batterijhandel of andere generatoren. Een bestaande batterij of export van eerder ingekochte energie vraagt een uitgebreider stroommodel.

### Variabele kosten

Met all-in inkoopprijs `p`, bruto terugleververgoeding `r`, kostenfunctie `C(E)` en gasgebruik `G`:

```text
2026 stroom = max(I-E, 0) * p - max(E-I, 0) * r + C(E)
2027 stroom = I * p - E * r + C(E)
gas          = G * gasprijs
```

De eerste versie toont **variabele energiekosten**. Netbeheer, vaste leveringskosten, belastingvermindering, financieringskosten en een eventuele welkomstbonus zitten daar niet automatisch in. Een expliciet ingevoerd verschil in vaste contractkosten kan wel worden gebruikt bij de alternatieve contractsituatie.

De terugleververgoeding is bruto vóór de afzonderlijk ingevoerde terugleverkosten. Een netto vergoeding invoeren én de kosten opnieuw aftrekken geeft een fout resultaat. Bij jaarlijkse vaste terugleverkosten blijft het hele bedrag bestaan zolang er export is; het daalt niet proportioneel met de export. De eerste versie veronderstelt nul kosten bij nul export. Contracten die ook dan een vast bedrag rekenen of met meerdere schalen werken, moeten handmatig aan hun werkelijke voorwaarden worden getoetst.

Voor een dynamisch contract zijn uur- of kwartiergewichten essentieel. De rekenkundig juiste vorm is de som van `import[t] * prijs[t] - export[t] * vergoeding[t]`. Een jaargemiddelde in de eerste scan is uitsluitend een scenario, geen aangetoonde goedkoopste contractkeuze.

## 5. Feiten versus aannames

| Onderdeel | Status in de eerste versie | Wat nodig is voor verfijning |
| --- | --- | --- |
| Inkoop- en terugleverprijzen | Bewerkbare voorbeelden of eigen invoer. | Actueel persoonlijk contract of gecontroleerde leverancierfeed. |
| Verbruik bij ontbrekende jaarcijfers | Eenvoudige woning-/huishoudschatting. | Jaarafrekening en totale PV-productie over dezelfde periode. |
| Direct eigen gebruik | Algemene vuistregel aangepast aan gebruiksprofiel; begrensd. | Import/export/productie per kwartier of uur. |
| PV-opbrengst | Indicatief op basis van paneelvermogen en globale dakfactoren. | PVGIS met locatie/oriëntatie/helling, plus schaduw en werkelijk legplan. |
| Aanschafprijzen | Illustratieve bandbreedten; geen NIVO/TBT-offerte. | Technische opname en gespecificeerde offerte. |
| Batterijrendement, cycli, capaciteit | Expliciete modelaannames. | Productspecificaties en tijdreekssimulatie met vermogenslimieten. |
| Warmtepomprendement | Seizoensscenario; geen gegarandeerde COP. | Warmteverliesberekening, afgiftetemperatuur en ontwerp. |
| Isolatiewinst | Globaal screeningsscenario. | Constructie, oppervlak, bestaande en nieuwe isolatiewaarden. |
| Besparingsbandbreedte | Gevoeligheidsindicatie, geen statistisch betrouwbaarheidsinterval. | Gekalibreerd model en onafhankelijke validatie op echte woningen. |

Milieu Centraal vermeldt rond de bronpeildatum sets van 6/8/10 zonnepanelen van 435 Wp met ongeveer 2.300/3.000/3.800 kWh jaaropbrengst en richtprijzen van €2.500/€3.200/€3.800 (`mc-solar`). Dat is een referentie, geen universele opbrengst per Nederlands dak. Een omgerekende specifieke opbrengst rond 875 kWh/kWp is alleen een afgeleide vuistregel.

Een zelfverbruik van ongeveer 30% zonder gerichte sturing is een landelijke vuistregel uit `mc-self-use`. Het werkelijke percentage is onder meer afhankelijk van huishoudelijk dagprofiel, PV-omvang, seizoen, EV en verwarming. Een procentpunt extra zelfgebruik is een percentage van de PV-productie, niet automatisch hetzelfde percentage van de totale rekening.

## 6. Maatregelen combineren

Elke maatregel verandert het huishoudmodel. De rekenkern bepaalt daarna opnieuw de energiekosten. Voor het gekozen pakket worden alle geselecteerde veranderingen achtereenvolgens op één scenario toegepast. Losse besparingen worden niet opgeteld.

Voorbeelden van overlap:

- Slimmer gebruik en een batterij benutten deels dezelfde overtollige zonnestroom.
- Isolatie verlaagt de warmtevraag waarover een warmtepomp vervolgens gas kan besparen.
- Een warmtepomp verhoogt elektriciteitsvraag en kan daarmee PV-zelfgebruik veranderen.
- Een lager elektriciteitstarief verkleint ook de waarde van iedere vermeden net-kWh.

De keuze voor maatregelen blijft binnen het opgegeven budget, op basis van de bovengrens van de geraamde investering. Voor huurders en woningen zonder beschikbaar dak wordt geen nieuwe dakinstallatie in het geselecteerde pakket opgenomen. Een suggestie voor overleg met verhuurder/VvE kan wel zinvol zijn.

## 7. Batterij

De eerste berekening modelleert uitsluitend opslag van eigen zonnestroom. Handels- en onbalansinkomsten zijn nul. Laat `D` de bruikbare batterijlevering zijn en `eta` het totale opslagrendement. Dan:

```text
laden = D / eta
nieuwe import = oude import - D
nieuwe export = oude export - laden
verliezen = laden - D
```

De bruikbare levering wordt begrensd door netafname, beschikbare zonne-export na verliezen, bruikbare capaciteit maal aangenomen cycli, en een grens aan het haalbare extra eigen gebruik. Jaargegevens geven niet aan op welke dagen een batterij vol of leeg zou zijn; daarom is dit een screening, geen optimale dimensionering.

Voorbeeld van een regressietest: totaal verbruik en PV-productie beide 3.500 kWh, direct gebruik 1.050 kWh, inkoop €0,30, vergoeding €0,06 en terugleverkosten €0,04/kWh. De variabele stroomkosten zijn €98 in 2026 en €686 in 2027. Als een batterij 1.000 kWh laadt en 900 kWh levert, worden dat €88 en €436. Zonder terugleverkosten maakt dezelfde batterij de 2026-rekening juist €30 hoger door verliezen.

De eenvoudige terugverdientijd is investering gedeeld door positieve eerstejaarsbesparing. Dit is geen netto contante waarde of levensduurprognose en verwerkt niet automatisch degradatie, vervanging, financiering of toekomstige prijsveranderingen. Een negatieve of nulbesparing geeft geen terugverdientijd. Een gewone thuisbatterij biedt niet automatisch noodstroom; daarvoor zijn een geschikte installatie en functie nodig (`mc-battery`).

## 8. Verwarming en subsidies

Een hybride warmtepomp vervangt een deel van het **verwarmingsgas**. Tapwater en koken moeten apart worden beschouwd. Eerst de warmtevraag na isolatie bepalen, daarna het vervangen gas, vervolgens de extra elektriciteit uit nuttige warmte gedeeld door seizoensrendement. Een rekenvoorbeeld mag geen 60% besparing op alle gas veronderstellen zonder die uitsplitsing.

De eerste versie kwantificeert een isolatiemaatregel alleen bij een woning met gasverwarming zonder reeds aanwezige warmtepomp. Isolatie kan ook bij een bestaande warmtepomp of warmtenet nuttig zijn; zonder afzonderlijke verwarmingsvraag rekent deze versie dat voordeel niet uit. Het ontbreken van een maatregel in het berekende budgetplan betekent in die situatie niet dat de maatregel technisch of financieel ongeschikt is.

RVO noemt voor warmtepompen typische seizoensrendementen van 3 tot 5 (`rvo-heatpump`). Het ontwerp, de bron en de benodigde aanvoertemperatuur beïnvloeden het werkelijke resultaat. Voor een volledige all-electric overstap zijn geschiktheid van woning/afgiftesysteem, aansluiting, geluid, ruimte en tapwater aanvullende beslispunten.

ISDE vereist bij relevante consumentenmaatregelen onder meer een geschikte bestaande woning, volledige uitvoering door een bedrijf en tijdige aanvraag. Productmeldcodes, oppervlakte en isolatiewaarde kunnen doorslaggevend zijn. Combineren binnen 24 maanden kan de **isolatiesubsidie** verdubbelen; niet automatisch alle subsidieposten. Zie `isde-heatpump`, `isde-insulation` en `isde-faq`.

RVO bevestigt dat er geen ISDE-subsidie voor een thuisbatterij is (`isde`). De 2027-wijzigingspagina noemt op de controlepeildatum voorgenomen wijzigingen, waaronder andere bedragen voor lucht-waterwarmtepompen en glas. Daarom geeft deze versie geen gegarandeerd persoonlijk subsidiebedrag en trekt zij geen ongecontroleerde subsidie van een investering af.

## 9. Vervolgstappen

1. **Echte meetgegevens:** import van een gecontroleerd jaaroverzicht en later kwartier-CSV. Zorg voor consistente tijdzone, zomer-/wintertijd, ontbrekende intervallen en dezelfde periode voor import, export en PV.
2. **Locatie en PVGIS:** optionele PDOK-geocodering, vervolgens server-side PVGIS-verzoek. De stabiele gedocumenteerde basis is `https://re.jrc.ec.europa.eu/api/v5_3/`; beoordeel PVGIS 6 afzonderlijk voordat een nieuwe API wordt gebruikt. Voeg caching, timeout, bronlabel, modelversie en een expliciete fallback toe.
3. **Contracten:** actuele aanbiedingen alleen toevoegen via toestemming/licentie en een aantoonbaar volledige kostenopbouw. Toon peildatum, dekking van leveranciers, eventuele vergoeding en voorwaarden.
4. **Batterijtijdreeks:** tijdstapsimulatie met laad-/ontlaadvermogen, SOC-limieten, verliezen, degradatie, seizoenen en contractkosten. Controleer geen import/export dubbel te tellen en presenteer historische backtests niet als opbrengstgarantie.
5. **Woningadvies:** verfijn isolatie en warmtepomp met echte oppervlaktes en installatiegegevens. Eventuele financiering en subsidies afzonderlijk en voorwaardelijk tonen.
6. **Bronbeheer:** hercontrole vóór nieuwe beleidsjaren en bij wetswijzigingen; log wat veranderde. Bij verouderde prijzen of onduidelijke regels geen live- of zekerheidsclaim tonen.

## 10. Validatie

`tests/model.test.mjs` toetst onder meer de 2026/2027-regels, batterijverliezen, vaste versus variabele terugleverkosten, import/productie/export-identiteit, onmogelijke invoer, nulverbruik, budgetgrenzen en verschil tussen het oorspronkelijke en gecombineerde scenario. Combinatietests controleren daarnaast de energiebalans inclusief opslagverlies, verminderde resterende warmtevraag na isolatie en het gedeelde zonne-overschot voor slimme sturing en een batterij. De tests bewaken rekenkundige en productinvarianten. Ze bewijzen niet dat een jaarlijkse screening de werkelijkheid van iedere woning exact voorspelt.

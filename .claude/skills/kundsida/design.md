# Design för kundsidor

Kunden ska bli imponerad och känna att sidan är deras, inte en mall med deras namn i. Det första utkastet av mätochmätts sida fick kritiken att det såg "väldigt AI-genererat" ut. Den här filen förklarar varför och hur vi undviker det.

## Det som får en sida att se AI-gjord ut

Undvik de här mönstren. Ett av dem går bra om det finns en anledning, men flera tillsammans ger mallkänslan direkt:

- En liten rubrik i versaler med extra teckenavstånd ovanför varje rubrik ("DET HÄR FÅR DU").
- En stor serifrubrik där ett ord är kursivt och färgat ("Kokboken där kost och recept *möts.*").
- Tre ikonkort i rad med en ikon i en rundad ruta, en kort rubrik och två rader text.
- Svävande "pillerformade" etiketter runt en produktbild, och suddiga färgfläckar eller gradientcirklar i bakgrunden.
- En citatruta som bara upprepar kundens intervjusvar.
- Allt i samma ordning: hero, tre fördelar, produkt, om oss, kontakt, sidfot.
- En ritad eller påhittad produktbild i stället för kundens foto.
- Reklamtext som kunden aldrig sagt: "Mer än en receptsamling", "Vi vill att fler ska äta bra, varje dag", "Kvalitet i varje detalj".
- Samma typsnitt och färgpalett som på alla andra Nordvy-sidor.

## Det som gör den äkta

1. **Kundens eget material styr.** Loggan ger färger och känsla. Kundens bilder är huvudsaken, inte dekoration. Saknas bilder, vänta eller be om dem, i stället för att rita en platshållare som ser färdig ut.
2. **En bärande idé per sida.** Välj en sak som bara passar den här kunden och låt den forma layouten:
   - **Namnet:** "mät och mätt" kan ge en sida byggd som ett receptkort, med mått, ingredienslistor och linjal.
   - **Produkten:** en kokbok visar ett riktigt uppslag och ett recept ur boken. Ett smycke visas stort och nära.
   - **Platsen:** ett café i Malmö kan använda gatan, utsikten eller lokalen.
   - **Kundens ord:** en mening de faktiskt sa kan bära hela första skärmen.
3. **Riktigt innehåll säljer.** Visa det besökaren vill se innan de köper: ett recept, en meny, priser, ett före och efter, ett foto på dem som driver företaget.
4. **Kundens röst.** Skriv som kunden pratar. Ett UF-företag med gymnasieelever ska låta som dem, inte som en reklambyrå. Använd deras egna formuleringar från intervjun och mejlen, och gärna från deras TikTok eller Instagram.
5. **Färre, större saker.** Hellre en stark bild och en tydlig knapp än sex sektioner med lika mycket vikt.
6. **Variera layouten.** Asymmetri, bilder som går ut till kanten, en sektion som bryter mönstret. Inte varje sektion som ett centrerat block.

## Kvalitetsribban

Nordvys demosidor i `public/demo/` (Havsglas UF, Salong Ask, Solkorn, Fogen Snickeri) visar nivån vi vill hålla tekniskt: snabb, mobilanpassad, tydliga knappar, formulär som fungerar. Använd dem som ribba för kvaliteten, inte som mall för utseendet. Varje kundsida ska se annorlunda ut än demosidorna och än varandra.

## Snabb kontroll innan förhandsvisningen

- Skulle sidan kunna tillhöra ett annat företag om man bytte namn och bilder? Då är den för generisk.
- Finns det minst en sak på första skärmen som bara den här kunden har?
- Är varje påstående på sidan något kunden har sagt?
- Har du räknat mönstren i listan ovan? Fler än två betyder att sidan ska göras om.

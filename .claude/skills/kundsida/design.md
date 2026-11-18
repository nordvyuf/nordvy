# Design för kundsidor

Kunden ska bli imponerad och känna att sidan är deras, inte en mall med deras namn i. Det första utkastet av mätochmätts sida fick kritiken att det såg "väldigt AI-genererat" ut. Den här filen förklarar varför och hur vi undviker det.

## Det som får en sida att se AI-gjord ut

Undvik de här mönstren. Ett av dem går bra om det finns en anledning, men flera tillsammans ger mallkänslan direkt:

- En liten rubrik i versaler med extra teckenavstånd ovanför varje rubrik ("DET HÄR FÅR DU").
- En stor serifrubrik där ett ord är kursivt och färgat ("Kokboken där kost och recept *möts.*").
- Tre ikonkort i rad med en ikon i en rundad ruta, en kort rubrik och två rader text.
- Svävande "pillerformade" etiketter runt en produktbild, och suddiga färgfläckar eller gradientcirklar i bakgrunden.
- En citatruta som bara upprepar kundens intervjusvar.
- Allt i samma ordning: hero, tre fördelar, produkt, om oss, kontakt, sidfot. Låt kundens viktigaste sak bestämma ordningen: ett bageri kan börja med dagens bröd och öppettiderna, en frisör med prislistan, ett UF-företag med en produkt i full storlek.
- Alla knappar och etiketter som runda "piller". Välj en knappform som passar kunden: rak kant, en understruken textlänk eller en stämpel.
- Tunna linjer, dubbelstreck och små versaler överallt, alltså "tidningsstilen", när kunden inte har något med tidningar att göra.
- En ritad eller påhittad produktbild i stället för kundens foto.
- Reklamtext som kunden aldrig sagt: "Mer än en receptsamling", "Vi vill att fler ska äta bra, varje dag", "Kvalitet i varje detalj".
- Samma typsnitt och färgpalett som på alla andra Nordvy-sidor.

## Det som gör den äkta

1. **Kundens eget material styr.** Loggan ger färger och känsla. Kundens bilder är huvudsaken, inte dekoration. Saknas bilder, vänta eller be om dem, i stället för att rita en platshållare som ser färdig ut. I ett utkast får bilderna vara streckade rutor med texten "Foto kommer: …" (se `SKILL.md`). Tänk på att de rutorna tar stor plats, så bedöm inte den färdiga känslan förrän riktiga bilder finns.
2. **En bärande idé per sida.** Välj en sak som bara passar den här kunden och låt den forma layouten:
   - **Namnet:** "mät och mätt" kan ge en sida byggd som ett receptkort, med mått, ingredienslistor och linjal.
   - **Produkten:** en kokbok visar ett riktigt uppslag och ett recept ur boken. Ett smycke visas stort och nära.
   - **Platsen:** ett café i Malmö kan använda gatan, utsikten eller lokalen.
   - **Kundens ord:** en mening de faktiskt sa kan bära hela första skärmen.
3. **Riktigt innehåll säljer.** Visa det besökaren vill se innan de köper: ett recept, en meny, priser, ett före och efter, ett foto på dem som driver företaget.
4. **Kundens röst.** Skriv som kunden pratar. Ett UF-företag med gymnasieelever ska låta som dem, inte som en reklambyrå. Använd deras egna formuleringar från intervjun och mejlen, och gärna från deras TikTok eller Instagram.
5. **Färre, större saker.** Hellre en stark bild och en tydlig knapp än sex sektioner med lika mycket vikt.
6. **Variera layouten.** Asymmetri, bilder som går ut till kanten, en sektion som bryter mönstret. Inte varje sektion som ett centrerat block.

## Typsnitt

Länka `/assets/fonts/kund/typsnitt.css`. Välj ett eller två typsnitt per sida, utifrån kundens logga och ton:

| Typsnitt | Känsla | Passar till exempel |
|---|---|---|
| Newsreader | lugn, läsvänlig serif med kursiv | brödtext, frisör, kokbok, längre texter |
| Young Serif | varm, mjuk och lite rund | bageri, café, hantverk |
| Instrument Serif | smal, elegant, bara en vikt (och kursiv) | stora rubriker, skönhet, mode |
| Bricolage Grotesque | egensinnig sans med karaktär | UF-företag, ungt och lekfullt |
| Work Sans | neutral och tydlig, alla vikter | brödtext, knappar, priser |
| Space Grotesk | teknisk, lite kantig | teknik, cykel, verkstad |
| Caveat | handskrivet | små anteckningar, en signatur, en lapp. Aldrig brödtext |
| IBM Plex Mono | skrivmaskin | prislistor, kvitton, mått, etiketter |

Skriv alltid en reservfont efter, till exempel `font-family: "Young Serif", Georgia, serif;`. Fraunces och Inter är Nordvys egna och ska inte användas på kundsidor.

## Mobil

- Bygg för 375 px först. Den viktigaste knappen (beställ, boka, ring) ska synas på första skärmen.
- Göm inte menyn helt. Med tre eller färre länkar kan de stå kvar och radbrytas. Med fler: en riktig menyknapp (`<button aria-expanded>` som visar och döljer listan) som fungerar med tangentbordet.
- Telefonnummer är `tel:`-länkar och adresser länkar till kartan.

## Tillgänglighet

- Kontrast minst 4,5:1 för brödtext och 3:1 för stor text och knappar. Kontrollera ljus text på kundens färger särskilt.
- Synlig fokusmarkering på alla länkar, knappar och fält. Ta aldrig bort `outline` utan att ersätta den.
- Allt ska gå att använda med tangentbordet, även rutor som öppnas (Esc stänger, fokus hamnar i rutan och tillbaka efteråt).
- Respektera `prefers-reduced-motion`: inga stora rörelser eller automatiska bildspel för den som har stängt av rörelse.
- Rubrikerna följer ordning (en `h1`, sedan `h2`, sedan `h3`). Varje bild har `alt` som säger vad den visar, eller `alt=""` om den bara är dekoration.
- Formulär har `<label>` på varje fält och felmeddelanden i text, inte bara som röd färg.

## Mörkt läge

Kundsidor behöver inget mörkt läge. Sidan följer kundens egna färger. Lägg bara till ett mörkt läge om det är en del av designen och är testat. Byt inte färger automatiskt med `prefers-color-scheme` utan att kontrollera kontrasten.

## Kvalitetsribban

Nordvys demosidor i `public/demo/` (Havsglas UF, Salong Ask, Solkorn, Fogen Snickeri) visar nivån vi vill hålla tekniskt: snabb, mobilanpassad, tydliga knappar, formulär som fungerar. Använd dem som ribba för kvaliteten, inte som mall för utseendet. Varje kundsida ska se annorlunda ut än demosidorna och än varandra.

## Snabb kontroll innan förhandsvisningen

- Skulle sidan kunna tillhöra ett annat företag om man bytte namn och bilder? Då är den för generisk.
- Finns det minst en sak på första skärmen som bara den här kunden har?
- Är varje påstående på sidan något kunden har sagt?
- Har du räknat mönstren i listan ovan? Fler än två betyder att sidan ska göras om.
- Är ordningen på sektionerna vald för den här kunden, eller är det standardordningen?
- Går sidan att använda med bara tangentbordet, och syns fokus hela vägen?

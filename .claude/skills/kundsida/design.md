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
- **En metafor som ritas ut bokstavligt.** En "hylla" av CSS-plankor, prislappar formade som bagagelappar, en "fasad" med guldskylt, ett "brev" med signatur. Granskaren kallade det "a typical AI move": det ser ut som att sidan låtsas i stället för att visa. Testet med Korn & Kaka gick från 4 till 6 av 10 när sådant togs bort och ersattes med foton.

Designskillen `frontend-design` beskriver dessutom de standardval som AI-sidor hamnar i, oavsett ämne. Undvik dem om inte kunden själv har bett om just det:
- Krämvit bakgrund (runt #F4F1EA) med en kontrastrik serifrubrik och en terrakotta eller lerröd accent (runt #D97757).
- Nästan svart bakgrund med en enda knallgrön eller knallröd accent.
- Tidningslayout med hårfina linjer, inga rundade hörn och täta spalter.
- Allt i likadana rundade kort med samma skugga, och färgtoningar som dekoration.
- Etiketter i versaler ovanför varje rubrik, rader som "A · B · C", monospace för små etiketter och en pil "→" efter knapptext.
- Ett ord i rubriken med annan färg eller kursiv.
- Numrerade steg (01, 02, 03) när innehållet inte är en riktig ordning.
- Inglidande animationer på varje sektion. Rörelse är bra, men på rätt ställen: se `rorelse.md`.

## Det som gör den äkta

1. **Fotona är det viktigaste.** I testet (18/11) bedömde fristående granskare Korn & Kaka så här:

   | Version | Poäng |
   |---|---|
   | Utritade metaforer, inga foton | 4 av 10 |
   | Samma sida med lånade foton | 6 av 10 |
   | Efter två granskningsrundor | 6–6,5 av 10 |
   | Samma sida utan foton | 4,5 av 10 |

   Granskaren sade rakt ut att lånade foton och ingen logga gör att en sida inte kommer över ungefär 7 av 10, oavsett hur bra koden är. **Riktiga foton, kundens logga och kundens egna ord är vägen till 9.** Bra foton är kundens egna: människorna, händerna, lokalen och produkterna i riktigt ljus. Se avsnittet om foton nedan.
2. **Det minnesvärda är en riktig sak, inte en utritad idé.** Lägg sidans enda djärva drag på något som är sant och användbart för just den här kunden:
   - **En funktion:** bageriet visar under rubriken en levande rad, "Stängt nu. Vi öppnar i morgon klockan 7.", uträknad i realtid, och vid de bröd som brukar ta slut står "Brukar vara slut vid lunch". En frisörs första skärm är prislistan med tider. Låt inte funktionen bli själva rubriken: "Stängt nu." som största text kallade granskaren en gimmick som inte säger något om bageriet.
   - **Ett foto:** bagarens händer i degen klockan tre på natten, inte en bild av "ett bröd".
   - **Kundens ord:** en mening de faktiskt sa kan bära hela första skärmen.
   - **Produkten nära:** en kokbok visar ett riktigt uppslag, ett smycke visas stort.

   Allt annat på sidan är lugnt och disciplinerat. Ett djärvt drag, inte fem.
3. **Riktigt innehåll säljer.** Visa det besökaren vill se innan de köper: ett recept, en meny, priser, ett före och efter, ett foto på dem som driver företaget.
4. **Kundens röst.** Skriv som kunden pratar. Ett UF-företag med gymnasieelever ska låta som dem, inte som en reklambyrå. Använd deras egna formuleringar från intervjun och mejlen, och gärna från deras TikTok eller Instagram.
5. **Färre, större saker.** Hellre en stark bild och en tydlig knapp än sex sektioner med lika mycket vikt.
6. **Variera layouten.** Asymmetri, bilder som går ut till kanten, en sektion som bryter mönstret. Inte varje sektion som ett centrerat block, och inte samma uppdelning (till exempel bild till vänster och text till höger) i mer än två sektioner. Den sista testversionen hade samma 5/7-uppdelning fyra gånger, och granskaren kallade det "a generated section stack". Ge varje sektion en form som passar innehållet: en meny kan vara en bred prislista, ett citat stor text, ett formulär smalt och centrerat.
   - **Visa inte samma sak två gånger.** Tre fotokort med bröd och pris direkt ovanför en lista med samma bröd och priser är ett tydligt mallmönster.
   - **Ordmärke när loggan saknas:** sätt inte bara namnet i rubriktypsnittet. Ge det en egen form, till exempel ett eget &-tecken, annan vikt eller annat teckenavstånd, och fråga kunden efter loggan.
   - **Utan foton behövs en typografisk reserv**, inte bara tomma rutor: större text, menyn i full bredd eller en färgyta. Sidan ska gå att visa för kunden även innan bilderna har kommit.
7. **Ett rutnät och en vänsterkant.** All text och alla bilder börjar på samma vänsterkant, med samma behållare (`max-width` och `padding`) i varje sektion, och samma mellanrum (`gap`) överallt i ett bildrutnät. Bilder i samma rad har samma höjd. Granskaren mätte vänsterkanter på 58, 113 och 170 px i samma sida och mellanrum på 79 och 14 px i samma rutnät, och det räckte för att sidan skulle kännas "auto-generated, not composed". Mät själv med `getBoundingClientRect()` innan granskningen.

## Foton

- **Kundens egna foton går alltid först.** Be om dem tidigt. Skicka med fotoguiden i `checklista.md`, så att kunden vet vad som behövs.
- **Ett bra foto för en kundsida:** riktigt dagsljus, inga skyltar eller texter som syns, människor eller händer i arbete, och samma ljus och färgton i alla bilder. Både liggande och stående bilder.
- **Text på foton:** lägg aldrig en rubrik direkt över en rörig del av bilden. Välj ett lugnt område eller beskär, och lägg en mörk toning (`linear-gradient`) under texten så att kontrasten räcker.
- **Lånade foton (Unsplash):** bara på provsidor, och då märkta i utkastraden. Kontrollera att de inte visar text, priser eller skyltar på andra språk (testet hade en prislapp i thailändska baht), och att de visar det som står i `alt`. På en riktig kundsida får lånade foton aldrig se ut som kundens egna produkter, lokal eller personer.
- **Utan foton:** sidan ska ändå fungera med platshållare. Lägg in ett testläge (till exempel `?utan-foton`) som byter fotona mot platshållarna, och titta på båda.

## Referenser utan UXKIN

Titta på riktiga sajter innan du bestämmer något. Det kostar inget, och det fungerar med webbläsaren:
- **Gallerier:** siteinspire.com och land-book.com, som båda gick att öppna i testet. Sök på branschen, till exempel "bakery", "hair salon" eller "candle".
- **Riktiga företag i samma bransch:** de bästa lokala eller internationella, till exempel ett känt bageri för ett bageri.
- Ta skärmbilder av tre till fem sajter och skriv i `DESIGN.md` vad du tar från var och en: hur stora rubrikerna är, hur fotona används, hur menyn eller prislistan är uppställd och hur mycket luft det finns. Kopiera aldrig en sajt rakt av.
- Tackar du nej till kakor på en sajt, välj alltid det alternativ som delar minst.

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

## Rörelse

Varje kundsida länkar rörelsepaketet `/assets/kund/rorelse.css` och `/assets/kund/rorelse.js`, med en genomtänkt start på första skärmen, lugna avtäckningar av fotona och svar på klick och formulär. Hur och var står i `rorelse.md`. En sida som står helt still ser billig ut, och en där allt glider in ser ut som en mall.

## Mobil

- Bygg för 375 px först. Den viktigaste knappen (beställ, boka, ring) ska synas på första skärmen, både på mobil och på en vanlig datorskärm (1280 × 720). En stor bild eller rubrik får inte trycka ner den under kanten.
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

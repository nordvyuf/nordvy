# ReBoard UF – designidé (första utkastet, 23 november)

Måns har sagt att utkastet ska byggas direkt, utan att vänta på svar. Allt vi inte vet är markerat med `mark.todo` på sidan.

## Vem sidan är för och vad besökaren ska göra

Sidan riktar sig till köksintresserade, matentusiaster och miljöintresserade, och den ska få dem att **beställa en skärbräda**. Tre storlekar: liten 500 kr, mellan 750 kr och stor 1 000 kr. Besökaren ska förstå tre saker innan den köper: vilken storlek den vill ha, vad den kostar och att brädan är gjord för hand av återvunnen ek.

## Det enda djärva draget: storleksväljaren

De tre brädorna visas i samma skala på ett rutnät med 5 cm-rutor, som på en skärmatta, med hörnen mot samma punkt. När man väljer liten, mellan eller stor växer eller krymper den ifyllda brädan mjukt till rätt storlek. De andra två syns som streckade konturer, och priset, måtten och knappen byts ut.

Draget är sant och användbart. Det svarar på den fråga som avgör ett köp ("hur stor är den egentligen?"), och det är inte en metafor som ritas ut. Brädorna är rena konturer och ingen påhittad produktbild. Proportionerna är preliminära (30 × 20, 40 × 25 och 50 × 30 cm) och märkta som todo tills ReBoard ger oss sina riktiga mått. När fotona kommer kan varje storlek visa sitt foto inuti konturen.

Allt annat på sidan är lugnt.

## Färger: från loggan och oljad ek

Loggan på deras Instagram är ljus serif-text och en liten kvist på djup oliv (uppmätt #434831). Olivgrönt är alltså deras egen färg och inte något vi har valt. Det passar dessutom kök och trä.

| Namn | Värde | Roll |
|---|---|---|
| Sand | `#E9DDC5` | Bakgrund. Ljus, oljad ek (splintved), varmare och mörkare än AI-krämen #F4F1EA. |
| Spån | `#F4EAD6` | Ytor som ska lyftas: dialogrutan och fält. |
| Honung | `#C08A45` | Den valda brädan i väljaren och stora siffror på oliv. Aldrig liten text på sand. |
| Ändträ | `#7A5230` | Konturer, rutnätet och små detaljer. |
| Oliv | `#434831` | Loggans färg: knappar, ytor som bryter av ("Vilka vi är", kontakten). |
| Bläck | `#262A1C` | Brödtext. Nästan svart med en olivton. |
| Salvia | `#AEB394` | Kvistens färg: tunna linjer och fokus på oliv. |

Kontrast: bläck på sand är cirka 11:1, oliv på sand cirka 7:1, och spån på oliv cirka 7:1. Honung på oliv är cirka 3:1 och används därför bara till stor text.

## Typsnitt

- **Instrument Serif** för rubriker, priser och ordmärket. Loggan är en kontrastrik, smal serif, och kunden bad om "mer elegant". Instrument Serif ligger närmast loggan av de typsnitt vi har, och den har bara en vikt, vilket håller sidan lugn.
- **Work Sans** för brödtext, knappar och formulär. Den är neutral och tydlig och har siffror i tabellform för priser och mått.
- Ingen monospace och inga versaler med spärrad text.

## Referenser (skärmbilder tagna 23/11)

| Sajt | Vad vi tar | Vad vi inte tar |
|---|---|---|
| The Boardsmith (theboardsmith.com) | Produkten stor och nära i toppen, en stor serifrubrik och en enda knapp. | Den mörka toningen över hela fotot och kampanjtexten. |
| Larch Wood (larchwoodcanada.com) | Delad topp med foto till vänster och lugn text med knapp till höger, och en andra textlänk ("Find the board for you"). | Nyhetsbrevsrutan som täcker sidan. |
| John Boos (johnboos.com) | Brädan i ett riktigt kök, och julklappsvinkeln i november. | Rabattbanderoller. |
| Virginia Boys Kitchens (virginiaboyskitchens.com) | Brädorna i olika storlekar bredvid varandra, som är grunden för storleksväljaren. Omdömen nära produkten. | Den blå och röda reklamstilen och versalerna. |

Skagerak gick inte att öppna.

## Ordning, och varför

```
[utkastrad]
[ReBoard UF (logga) ......... Storlekar  Hantverket  Frågor  (Beställ)]   mobil: länkarna på egen rad

TOPP: text till vänster (mobil: först)  | foto som går ut i högerkanten
  Skärbrädor av återvunnen ek           |  "Foto kommer: en bräda nära,
  Eget hantverk från Malmö …            |   i dagsljus, så att ådringen syns"
  Från 500 kr   [Välj storlek]
  Till jul? Skriv det i beställningen. (sista dag: todo)
  Så gör vi dem

STORLEKAR (det djärva draget)
  Hur stor ska den vara?                  | Liten  Mellan  Stor
  [rutnät 5 cm: konturer, vald ifylld]    | 750 kr, mått, passar till (todo)
                                          | [Beställ mellan, 750 kr]
                                          | Betalning / Leverans / Klar

HANTVERKET: rubrik och en mening, sedan virket, slipningen och oljan (stående),
  och den färdiga brädan liggande i full bredd. Mobil: alla under varandra, liggande.

VILKA VI ÄR: olivgrön yta, teamfoto + deras egen mening från Instagram

INNAN DU BESTÄLLER: rubrik och omdömen (todo) till vänster, frågorna till höger

KONTAKT: mörk oliv: mejl (todo), Instagram @reboarduf
[mobil: fast Beställ-rad när toppen har scrollats förbi]
```

Produkten och priset kommer före "om oss" eftersom det är en enda produkt i tre storlekar. Väljaren *är* butiken. Hantverket kommer direkt efter, eftersom "eget hantverk av återvunnet virke" är det kunden själv säger är det bästa. Omdömena står bredvid frågorna, eftersom båda tar bort tvekan precis innan köpet. Julklappen står i toppen, eftersom sidan visas i slutet av november.

### Ändrat efter de blinda granskningarna

- **Runda 1 (6/10):**
  - Rutnätet räknas från brädornas hörn, så att kanterna ligger på linjerna.
  - Omdömena flyttades till frågorna, så att rubriken inte står ensam.
  - Den färdiga brädan visas liggande.
  - Frågorna och stegen står i Work Sans, eftersom den smala serifen blev trång i liten storlek.
  - Menyn syns på mobil.
  - Stäng-knappen följer med när rutan scrollas, och fokus går tillbaka till knappen.
- **Runda 2 (6/10):**
  - Julraden flyttades till toppen.
  - Betalning, leverans och tid står vid köpknappen.
  - Hantverket står under varandra på mobil, så att fotona blir stora nog.
  - Etiketterna i väljaren har bättre kontrast.
  - Länkarna har större tryckytor på mobil.
  - Sidan blir inte längre bredare under startanimationen.
- **Runda 3 (6/10):**
  - Den fasta raden på mobil visar vald storlek och pris, och döljs medan väljaren syns.
  - Färre beställningsknappar: knappen i sidfoten är borttagen.
  - Fokusringen på storleksknapparna har bättre kontrast.
  - Rubrikerna har olika storlek beroende på vikt.
- **Det som återstår** kräver ReBoards material: foton (särskilt ett ovanifrån per storlek och ett i toppen), loggan, måtten, var virket kommer ifrån, skötsel, leveranstid och omdömen.

## AI-listan i design.md: det här bytte vi ut

| AI-standard | Vad vi gör i stället |
|---|---|
| Krämvit #F4F1EA + serif + terrakotta (precis det kunden bad om: "beige och elegant") | Sand från oljad ek, loggans oliv som kontrast och ingen terrakotta. Honung bara på den valda brädan. |
| Liten versalrubrik ovanför varje rubrik | Inga. Rubrikerna står själva. |
| Kursivt och färgat ord i rubriken | Inget. Instrument Serif rak, i en färg. |
| Tre ikonkort | Inga kort. Fördelarna berättas i hantverkssektionen med foton. |
| Rundade pillerknappar | Raka knappar med 2 px rundning, som en sågad kant. |
| Numrerade steg 01–04 | Hantverket är en riktig ordning, men den visas som fotorad med ord, inte siffror. |
| Monospace-etiketter, "A · B · C", pil efter knapptext | Inget av det. Måtten i Work Sans med tabellsiffror. |
| Inglidande sektioner | Bara starten rör sig, plus fotona som avtäcks, brädan som skalas och knapparnas svar. |
| Samma uppdelning i varje sektion | Topp: text/foto. Storlekar: diagram/panel. Hantverket: fotorad i full bredd. Vilka vi är: färgyta. Frågor: smal rubrik och bred lista. |
| Ritad produktbild | Inga. Platshållare i rätt form med "Foto kommer: …". Väljaren visar konturer, inte en ritad bräda. |

## Bilder

Instagram-kontot har inga inlägg ännu (0 inlägg den 23/11), bara profilbilden med loggan. Därför har sidan platshållare överallt där foton ska sitta, och en typografisk lösning som bär den. `?utan-foton` finns för när fotona har kommit. Vi behöver:
1. Toppen: en bräda nära, stående 4:5, i dagsljus.
2. Fyra hantverksbilder i samma format (4:5): virket innan, slipningen, oljan och den färdiga brädan.
3. Ett foto på er som driver ReBoard.
4. Gärna en bild per storlek, rakt ovanifrån, för väljaren.

## Tekniken (Måns beslut)

Källkoden ligger i `kundsidor/reboard/` (Vite, React 18, Tailwind 4 och komponenter i shadcn-stil med Radix Dialog och Lucide). Den byggs till statiska filer i `public/kund/reboard/`. Sidan förrenderas till HTML, så den syns direkt och fungerar för sökmotorer, och React tar sedan över. Rörelsen kommer från Nordvys `rorelse.css` och `rorelse.js`. Produkterna är märkta med schema.org-mikrodata i HTML, eftersom CSP:n inte tillåter inbäddade `<script>`.

# Rörelse på kundsidor

En sida som står helt still känns billig. En sida där allt glider in känns som en mall. Målet ligger mellan dem: **en genomtänkt start, några lugna avtäckningar och tydliga svar när besökaren gör något.**

## Paketet

Länka i varje kundsida:

```html
<link rel="stylesheet" href="/assets/kund/rorelse.css">
<script src="/assets/kund/rorelse.js" defer></script>
```

Slå sedan på det som passar med `data-r` och klasser:

| Vad | Hur | Används till |
|---|---|---|
| Starten | `data-r="intro"` och `style="--i:1"`, `"--i:2"` … för ordningen | Rubrik, en rad under, knapparna. Högst 4–5 delar, bara på första skärmen. |
| Stor bild som landar | `data-r="intro-bild"` | Hero-bilden. Den börjar lite inzoomad och landar under 1,8 sekunder. |
| Bild som avtäcks | `data-r="bild"` på bildens ram (`.ph`) | Foton längre ner. Avtäcks nerifrån första gången de syns. |
| Lista i tur och ordning | `data-r="lista"` på `<ul>` | En meny, en prislista, öppettider. Raderna kommer fram en i taget. |
| Parallax | `data-r="parallax"` på en bild | Hero-bilden. Den rör sig långsammare än sidan, högst 60 px. |
| Sidhuvud | `data-r="huvud"` på `<header>` | Får klassen `r-ner` när sidan scrollats. Sidans egen CSS bestämmer hur det ser ut, till exempel en bakgrund. |
| Knappar | klassen `r-knapp` | Lyfter 2 px vid hovring, trycks ner vid klick. |
| Textlänkar | klassen `r-lank` | En linje växer fram under texten. Ta bort sidans egen `text-decoration` vid hovring. |
| Bildkort | klassen `r-zoom` på ramen | Bilden zoomar långsamt vid hovring. Bara där bilden är en länk. |
| Formulärfel | klassen `r-fel` på fältet | En kort skakning. Lägg på den i JavaScript när ett fält är fel (se exemplet). |
| Klart | klassen `r-klar` på statusraden | Raden tonar mjukt in när beställningen är skickad. |

`intro-bild` och `parallax` kan sitta på samma bild: starten körs först, sedan tar parallaxen över. En bild med parallax behöver vara högre än sin ram, annars syns kanten:

```css
.hero { overflow: hidden; }
.hero > img { position: absolute; left: 0; top: -60px; width: 100%; height: calc(100% + 120px); object-fit: cover; }
```

För att starta om en rörelse i JavaScript (till exempel skakningen vid varje nytt försök):

```js
function nudge(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
nudge(field, 'r-fel');
```

Exemplet finns i `public/kund/exempel-rorelse/`. Det är Korn & Kaka (påhittat) med allt ovan.

## Regler

1. **En start, inte fem.** Bara första skärmen får `intro`. Allt längre ner är antingen `bild` eller `lista`, aldrig båda i samma sektion, och aldrig text som glider in. "Inglidande animationer på varje sektion" står i listan över AI-mönster i `design.md`.
2. **Rörelsen ska betyda något.** Ett foto som avtäcks drar blicken till fotot. En lista som kommer fram rad för rad visar att det är en lista att läsa. En knapp som trycks ner bekräftar klicket. Rör aldrig något bara för att det går.
3. **Det som är sant och levande slår effekter.** En rad som säger "Öppet nu, stänger 15" uträknad i realtid är mer rörelse än något som studsar. Lägg krutet där.
4. **Lugnt tempo.** Paketets tider (0,6–1,8 sekunder, mjuk inbromsning) är valda för att kännas dyra. Snabba upp dem inte, och lägg inte till studs på stora saker.
5. **Allt syns utan rörelse.** Med `prefers-reduced-motion` och med `?utan-rorelse` i adressen står allt still och syns direkt. Avtäckningen kräver JavaScript, så utan skriptet syns allt från början.
6. **Inget som hoppar.** Bilder som avtäcks har en fast storlek (`aspect-ratio` eller höjd) innan de laddats, så att sidan inte hoppar.
7. **Inga bildspel som byter av sig själva**, inga animerade bakgrunder, ingen text som skrivs ut bokstav för bokstav och ingen muspekare som följer med.

## Kontroll innan förhandsvisningen

- Ladda om sidan och titta på starten. Känns den som en enda rörelse, eller som flera saker som tävlar?
- Scrolla hela sidan på mobil (375 px) och dator (1280 px). Hackar något? Syns en kant bakom parallaxbilden?
- Öppna med `?utan-rorelse`. Syns allt, och ser sidan fortfarande färdig ut?
- Skicka formuläret tomt. Skakar fältet och hamnar fokus i det?
- Räkna: hur många saker rör sig utan att besökaren gjort något? Fler än tre utanför första skärmen är för många.

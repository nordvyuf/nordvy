---
name: kundsida
description: Bygger, gör om eller publicerar en hemsida åt en av Nordvys kunder, utifrån kundens intervjuunderlag och mejl i Nordvyuf@gmail.com. Använd när någon vill bygga en kundsida, göra en kunds sida klar, se vad som saknas från en kund, ta hand om ett nytt underlag eller en kunds logga och bilder, publicera en kunds sida, eller bygga en provsida för att testa.
---

# Kundsida

Så bygger Nordvy en hemsida åt en kund, från underlag till publicerad sida. Läs `CLAUDE.md` i repots rot först: där står paketen, priserna och reglerna (aldrig slå ihop utan Måns ord, aldrig lösenord, bara mejlutkast).

Tre filer hör till skillen:
- `checklista.md`: vad som måste finnas innan bygget per paket, fotoguiden till kunden och mallen för mejlet om det som saknas.
- `design.md`: hur sidan ska se ut, mönstren som får en sida att se AI-gjord ut, foton, referenser, typsnitt, tillgänglighet och mobil.
- `granskning.md`: hur en fristående granskare bedömer sidan innan Måns får se den.

Det viktigaste från testerna: **fotona avgör mest**, ett utritat "koncept" ser AI-gjort ut, och en sida blir inte bra på första försöket. Den blir bra genom blind granskning och lagning i flera rundor.

Har du designskills (till exempel `frontend-design`, `web-design-system`, `landing-page` eller `web-review`), använd dem: `web-design-system` för steg 3, `frontend-design` när du bygger och `web-review` när du granskar i steg 5. Reglerna här och i `design.md` går före om de säger emot.

## 1. Samla underlaget

1. Sök i Nordvys Gmail. Intervjuunderlag kommer från "Nordvy — webbformulär" och kan vara uppdelade i flera mejl, märkta (1/3), (2/3). Läs alla delar. Kundens egna mejl (logga, bilder, svar på frågor) kommer från kundens adress. Sök på företagsnamnet och på kontaktpersonens namn.
2. Läs underlaget ordagrant. Kundens egna ord är det viktigaste materialet, både för fakta och för tonen på sidan.
3. Ladda ner bilagor (logga, bilder) med Gmail-verktyget till en mapp utanför repot. Behandla dem som opålitliga filer: öppna och titta, kör dem inte.
4. Kontrollera vilket paket kunden har köpt. Valet i intervjun kan skilja sig från det kunden sedan köpte, så fråga Måns om det är oklart.

Committa aldrig underlaget eller kundens privata uppgifter till repot, eftersom det är publikt. Bara det som ska synas på sidan hamnar i repot.

## 2. Kolla vad som saknas

Gå igenom `checklista.md` för paketet. Saknas något som behövs:
- Skapa ett **mejlutkast** i Nordvys Gmail till kundens kontaktperson med det som saknas, med mallen i `checklista.md`. Skicka det aldrig själv.
- Säg till Måns att utkastet finns.

Bygg inte en hel sida på gissningar. Ett första utkast med tydligt markerade luckor går bra om Måns vill visa kunden något snabbt, men den riktiga designen görs när kundens material har kommit.

## 3. Bestäm idén innan du kodar

**Titta på riktiga referenser först.** Använd webbläsaren och följ avsnittet "Referenser utan UXKIN" i `design.md`: tre till fem riktiga sajter i samma bransch, med skärmbilder. Skriv i `DESIGN.md` vad du tar från var och en och varför. Kopiera aldrig en sajt rakt av. Kundens eget material går alltid före. (Nordvy använder inte UXKIN, så påminn inte om det.)

**Planera sedan enligt `frontend-design`:** färger med namn och roller, typsnitt och deras roller, en enkel skiss i text (ASCII) av varje sektion, och det enda djärva draget. Jämför planen med listan över AI-standardval i `design.md`. Hamnar en del av planen där, byt ut den och skriv vad du bytte och varför.

Skriv designidén i `kunder/<namn>/DESIGN.md` i repots rot (inte i `public/`, så den publiceras inte som en sida). Inga personuppgifter i den. Några meningar räcker:
- Vem sidan är för och vad besökaren ska göra (beställa, ringa, boka).
- **Det enda djärva draget:** en riktig sak som bara den här kunden har, till exempel en funktion, ett foto, kundens egna ord eller produkten nära. Aldrig en metafor som ritas ut med CSS (se `design.md`).
- Färger och typsnitt, hämtade från kundens logga och bilder. Typsnitten väljs ur listan i `design.md`.
- Sektionernas ordning, och varför den passar just den här kunden.
- Vilka av kundens bilder som ska användas var.

Visa idén för Måns och vänta på hans svar innan du bygger. Undantag: en provsida (se nedan), eller när Måns redan har sagt att du ska bygga direkt. Skriv då idén i `DESIGN.md` och fortsätt.

## 4. Bygg

- Sidan ligger i `public/kund/<namn>/`, med `<namn>` i små bokstäver utan å, ä, ö och mellanslag, till exempel `matochmatt`. Den nås på `/kund/<namn>/`.
- Filer: `index.html`, ett eget skript (`app.js`) om sidan behöver JavaScript, och bilder i `public/kund/<namn>/bilder/`.
- **CSP:** inga inbäddade `<script>`-taggar och inga typsnitt eller skript från andra sajter än de som är tillåtna (egen domän, Cal.com och kartor från OpenStreetMap). Inbäddad CSS och `style=""` fungerar.
- **Typsnitt:** länka `/assets/fonts/kund/typsnitt.css` och välj ur listan i `design.md`. Fraunces och Inter är Nordvys egna och används inte på kundsidor. Har kunden ett eget typsnitt med en licens som tillåter webben, lägg det i kundens mapp med licensfilen bredvid.
- **Bilder:** konvertera till WebP, högst cirka 1600 px breda och helst under 200 kB styck. Ange `width`, `height` och `alt`, och `loading="lazy"` för bilder längre ner på sidan.
- **Bilder som saknas i ett utkast:** en ruta i bildens riktiga form (`aspect-ratio`), med tunn streckad kant och texten "Foto kommer: <vad bilden ska visa>". Rita aldrig en påhittad produktbild eller en illustration som ser färdig ut.
- **Lånade foton för att kunna bedöma sidan:** på provsidor bygger du med lånade foton från Unsplash, så att sidan kan bedömas på riktigt, och lägger in testläget `?utan-foton` som visar platshållarna. För en riktig kund kan du göra likadant lokalt, men det som visas för kunden har kundens egna foton eller platshållare. Lånade foton får aldrig se ut som kundens produkter, lokal eller personer. Fler regler står i `design.md`. Bilder från Unsplash får länkas direkt (`https://images.unsplash.com/photo-…?auto=format&fit=crop&w=1200&q=70`), och CSP:n tillåter det.
- **CSS som inte krockar:** ge varje del av sidan egna klassnamn och återanvänd inte ett allmänt namn för två olika saker. I testet hette både statusraden i hero och formulärets svarsruta `.status`, så statusraden fick formulärets vita ruta och blev oläsbar. Ser något konstigt ut, kontrollera den beräknade stilen med `getComputedStyle()` i stället för att gissa.
- **Utkastläge:** så länge sidan inte är godkänd har den `<meta name="robots" content="noindex">`, en tydlig utkastrad överst, och formulär som inte skickar något (`DRAFT = true`).
- Bara det kunden har sagt får stå som fakta. Hitta aldrig på priser, öppettider, betyg, antal kunder, recensioner eller påståenden om moms. Saknas en uppgift: markera den med `<mark class="todo">` i utkastet och fråga i mejlet.

### Beställning (UF-paketet)

Knappen öppnar en ruta med antal, namn och e-post. På den skarpa sidan öppnas ett färdigskrivet mejl (`mailto:`) till UF-företagets adress. Ett fungerande exempel finns i `public/kund/matochmatt/app.js` på grenen `kund-matochmatt` (PR #2) tills den är ihopslagen. Återanvänd tekniken, inte designen.

Mejlet är inte skickat förrän besökaren trycker på skicka i sitt mejlprogram. Skriv därför aldrig "Tack för din beställning" när rutan stängs. Skriv till exempel: "Nu öppnas ett mejl med din beställning. Skicka det, så är beställningen klar. Öppnades inget mejl? Skriv till <adress>." Visa alltid adressen, så att det fungerar även utan mejlprogram.

### Karta (Bas och Premium)

Använd OpenStreetMap, som är tillåten i CSP:n.

1. **Koordinater:** ta fram latitud och longitud för kundens företagsadress, till exempel med `https://nominatim.openstreetmap.org/search?q=<adress>&format=json&limit=1`. Svaret innehåller `lat` och `lon`. Sök bara på företagets offentliga adress, aldrig på en privatpersons.
2. **Kartrutan:** räkna ut ett litet område runt platsen. ±0,004 i longitud och ±0,002 i latitud ger ungefär ett kvarter åt varje håll:
   ```html
   <iframe title="Karta till <företag>" loading="lazy" width="100%" height="320" style="border:0"
     src="https://www.openstreetmap.org/export/embed.html?bbox=<lon-0.004>%2C<lat-0.002>%2C<lon+0.004>%2C<lat+0.002>&amp;layer=mapnik&amp;marker=<lat>%2C<lon>"></iframe>
   ```
   Ordningen i `bbox` är väst, syd, öst, nord, alltså lägsta longitud, lägsta latitud, högsta longitud och högsta latitud. Använd punkt som decimaltecken.
3. **Länk och text:** skriv alltid adressen som text bredvid och en länk "Öppna i kartan": `https://www.openstreetmap.org/?mlat=<lat>&mlon=<lon>#map=17/<lat>/<lon>`.
4. Saknas gatuadressen: lägg kartan på orten, markera adressen med `<mark class="todo">` och fråga kunden.

Ingen annan kartleverantör fungerar utan att CSP:n i `src/worker.js` ändras, och det gör vi bara om Måns säger till.

### Bokning (Premium)

Bokningen går via Cal.com, på kundens **eget** gratiskonto. Kunden skapar kontot själv i sitt namn och lägger in en händelse per tjänst. Vi får bara länkarna, aldrig lösenordet.

- En boka-länk per tjänst: `<a href="https://cal.com/<konto>/<händelse>" data-cal="<konto>/<händelse>">Boka</a>`. Utan JavaScript fungerar den som en vanlig länk.
- I kundens `app.js`: `import { bindBookingLinks } from '/assets/cal.js';` och `bindBookingLinks(document, { theme: 'light', brand: '#rrggbb' })` med kundens färg, så att kalendern får kundens utseende och inte Nordvys.
- **I ett utkast utan Cal.com-konto:** koppla inte länkarna. Låt dem öppna en liten ruta som säger "Här öppnas kundens bokningskalender när den är kopplad." Använd aldrig Nordvys egen kalender som platshållare.

### Betalning med Swish (Premium)

Kunden behöver **Swish Företag** via sin bank. Ett privat Swish-nummer får inte användas för ett företag. Pengarna går direkt till kunden, aldrig via oss.

- Visa Swish-numret, beloppet och vad besökaren ska skriva som meddelande (till exempel bokningens datum eller ordernummer).
- På mobil kan en knapp öppna Swish med allt ifyllt: `https://app.swish.nu/1/p/sw/?sw=<nummer>&amt=<belopp>&cur=SEK&msg=<meddelande>&src=qr`. Testa länken på en riktig telefon innan sidan blir skarp. Fungerar den inte: visa bara numret, beloppet och meddelandet.
- Skriv aldrig att betalningen är klar. Sidan kan inte se om någon har betalat, så skriv till exempel: "När vi har sett betalningen bekräftar vi din bokning."

## 5. Testa

1. `npm run preview` och öppna `http://localhost:8788/kund/<namn>/`. Starta om förhandsvisningen efter `git pull` eller när `src/worker.js` har ändrats. Servern läser in koden och CSP:n bara när den startar, så en gammal server kan blockera till exempel kartan utan att något syns.
2. Kontrollera datorbredd (1280 px) och mobil (375 px). Ingen sidledsskroll, inga knappar som bryts på två rader, inga texter som krockar. Den viktigaste knappen (beställ, boka, ring) ska synas på första skärmen i båda bredderna.
   - **Mät på mobil, lita inte på ögat:** `overflow-x: clip` eller `hidden` på `body` döljer innehåll som sticker ut, så att priser och fält klipps av utan att det syns. Stäng av det tillfälligt och leta upp alla element vars högerkant ligger utanför 375 px. I testet gjorde en bildruta med både `aspect-ratio` och `min-height` sidan 688 px bred, och ett 12-kolumnsrutnät med 48 px mellanrum fick inte plats på mobil.
   - **Formulär:** felmeddelandet försvinner när fältet blir rätt, fel e-post får ett eget meddelande ("Adressen ser inte rätt ut"), och varje fel är kopplat till sitt fält med `aria-describedby`.
3. Prova formulär, beställning och bokning, både tomma och ifyllda.
4. Kontrollera tillgängligheten enligt `design.md`: tangentbord, fokus, kontrast och minskad rörelse.
5. Granska sidan själv mot listan i `design.md`, och mät vänsterkanter och mellanrum med `getBoundingClientRect()`.
6. **Blind granskning:** följ `granskning.md`. En fristående subagent bedömer sidan med en poäng från 1 till 10. Laga och granska igen med en ny subagent tills sidan får minst 8 med foton, eller högst tre rundor. Poängen och det som återstår står i rapporten till Måns.
7. Kör `npm test`.

## 6. Publicera förhandsvisning

1. Lägg sidan på en egen gren, `kund-<namn>`, från senaste `main`, och skapa en pull request.
   - Går `git push` som `nordvyuf`, använd den.
   - Annars: ladda upp via GitHubs webbsida i Chrome inloggad som nordvyuf: `https://github.com/nordvyuf/nordvy/upload/main/public/kund/<namn>`, välj "Create a new branch for this commit and start a pull request" och döp grenen till `kund-<namn>`. Fler filer på samma gren laddas upp via `.../upload/kund-<namn>/<mapp>`.
2. Vänta på att Cloudflares kontroll blir grön. Förhandsvisningen ligger på `https://kund-<namn>-nordvy.nordvyuf.workers.dev/kund/<namn>/`.
3. Jämför filstorlekarna på förhandsvisningen med de lokala filerna, så att rätt version ligger uppe.
4. Ge Måns länken och en kort lista över vad som är klart, vad som saknas och vad som inte är testat.

## 7. Göra sidan skarp

Först när Måns säger till:
1. Ta bort `noindex` och utkastraden, sätt `DRAFT = false` och fyll i kundens riktiga e-post för beställningar, Cal.com-länkar och Swish-nummer.
2. Kontrollera allt en gång till på förhandsvisningen.
3. Slå ihop pull requesten och kontrollera den riktiga adressen efter publiceringen.

UF-paketet lovar adressen `ert-namn.nordvyuf.se`. Den adressen fungerar inte än. Tills den gör det ligger sidan på `nordvyuf.se/kund/<namn>/`. Säg det till kunden.

## Provsidor

En provsida testar skillen eller en idé, utan riktig kund.
- Mappen heter `public/kund/test-<namn>/`. Använd aldrig `test-` för en riktig kund.
- All information är påhittad: företag, personer, priser, öppettider och omdömen. Använd inga riktiga personuppgifter. Skriv i utkastraden att allt är påhittat, och märk påhittade omdömen med "(påhittat)".
- Briefen räcker ofta inte till allt. Hitta då på rimliga detaljer, och lista dem i `kunder/test-<namn>/DESIGN.md`.
- Använd påhittade adresser som slutar på `.example`, till exempel `bestallning@lagan.example` och `https://cal.com/linnea-example/klippning`. Domänen `.example` finns aldrig på riktigt, så inget mejl kan hamna hos någon. Telefonnummer skrivs som `070-000 00 00`.
- Ladda inte upp provsidor till GitHub och skapa ingen pull request, om inte Måns ber om det. Visa dem lokalt och ta bort mappen när testet är klart.

## Omdömen från besökare

Premium kan visa omdömen och ta emot nya. Det ingår inget databassteg: ett omdöme visas aldrig av sig självt, utan först när kunden har sagt ja.

**Slå på det på en kundsida**
1. Lägg `public/kund/<namn>/omdomen.json` med `{ "reviews": [] }`. Bara kunder som har den filen tar emot omdömen.
2. Lägg in rutan där omdömena ska stå: `<div data-nv-omdomen data-site="<namn>" style="--nv-accent:<kundens färg>"></div>` och `<script type="module" src="/assets/omdomen.js"></script>` längst ner. Texten, typsnittet och bakgrunden ärvs från sidan.
3. Har sidan redan en rubrik ovanför rutan: lägg till `data-utan-rubrik`. Annars styr `data-rubrik-niva="2"` (2–4) rubrikens nivå, så att den passar sidans rubriker.
4. Rutans eget utseende ligger i `:where()`, så kundsidans CSS vinner alltid. Styla klasserna `.nv-om-card`, `.nv-om-open`, `.nv-om-form`, `.nv-om-send` med flera (listan står överst i `public/assets/omdomen.js`), så att rutan följer sidans design i stället för standardkorten.
5. Är sidan ett utkast kan du lägga `data-demo` på rutan, så skickas inget.
6. Använd `notis` i `omdomen.json` bara när det behövs, till exempel för att märka påhittade exempel. Upprepa inte sidans egen text.
7. Rutan visar tomt läge och formuläret även när det inte finns några omdömen, och lägger aldrig till något själv. Hitta aldrig på omdömen. Har kunden riktiga omdömen (till exempel i intervjun, där de ligger under "Omdömen") och har sagt att de får visas, lägger du in dem i `omdomen.json` med namn, betyg, text och datum.

**När ett omdöme kommer in**
Det kommer som ett mejl till Nordvyuf@gmail.com med rubriken "Ny webbplatsförfrågan" och texten "NYTT OMDÖME TILL <namn>". Mejlet slutar med en färdig rad i JSON-format.
1. Fråga kunden om omdömet får visas.
2. Säger kunden ja: lägg raden i listan `reviews` i `public/kund/<namn>/omdomen.json` på en gren och skapa en pull request som vanligt. Du kan få raden från Gmail med sökningen `NYTT OMDÖME TILL <namn>`.
3. Är det skräp, skrivet av någon annan än en kund, eller nekar kunden: gör ingenting. Då visas det aldrig.

Gränser att känna till: Google-skriptet som skickar mejlen tillåter 30 mejl per dag för hela Nordvy, så en spamattack mot omdömesformuläret kan stoppa mejlen från intervjun och kontaktformuläret. Rutan har skydd mot enkla robotar (dolt fält, minsta tid och spärr för länkar), men inte mot riktiga angrepp. Behövs mer skydd: lägg till Cloudflare Turnstile.

---
name: kundsida
description: Bygger, gör om eller publicerar en hemsida åt en av Nordvys kunder, utifrån kundens intervjuunderlag och mejl i Nordvyuf@gmail.com. Använd när någon vill bygga en kundsida, göra en kunds sida klar, se vad som saknas från en kund, ta hand om ett nytt underlag eller en kunds logga och bilder, eller publicera en kunds sida.
---

# Kundsida

Så bygger Nordvy en hemsida åt en kund, från underlag till publicerad sida. Läs `CLAUDE.md` i repots rot först: där står paketen, priserna och reglerna (aldrig slå ihop utan Måns ord, aldrig lösenord, bara mejlutkast).

Två filer hör till skillen:
- `checklista.md`: vad som måste finnas innan bygget per paket, och mallen för mejlet om det som saknas.
- `design.md`: hur sidan ska se ut, och mönstren som får en sida att se AI-gjord ut.

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

Skriv en kort designidé och visa den för Måns innan du bygger, några meningar:
- Vem sidan är för och vad besökaren ska göra (beställa, ringa, boka).
- **Den bärande idén:** en sak som är kundens egen och styr layouten. Den kan komma från namnet, produkten, platsen eller kundens egna ord (se `design.md`).
- Färger och typsnitt, hämtade från kundens logga och bilder.
- Vilka av kundens bilder som ska användas var.

## 4. Bygg

- Sidan ligger i `public/kund/<namn>/`, med `<namn>` i små bokstäver utan å, ä, ö och mellanslag, till exempel `matochmatt`. Den nås på `/kund/<namn>/`.
- Filer: `index.html`, ett eget skript (`app.js`) om sidan behöver JavaScript, och bilder i `public/kund/<namn>/bilder/`.
- **CSP:** inga inbäddade `<script>`-taggar och inga typsnitt från Google Fonts. Använd typsnitten i `public/assets/fonts/` eller lägg kundens typsnitt (med licens som tillåter det) i kundens mapp. Inbäddad CSS och `style=""` fungerar.
- **Bilder:** konvertera till WebP, högst cirka 1600 px breda och helst under 200 kB styck. Ange `width`, `height` och `alt`, och `loading="lazy"` för bilder längre ner på sidan.
- **Utkastläge:** så länge sidan inte är godkänd har den `<meta name="robots" content="noindex">`, en tydlig utkastrad överst, och formulär som inte skickar något (`DRAFT = true`).
- **Beställning (UF-paketet):** knappen öppnar en ruta med antal, namn och e-post. På den skarpa sidan öppnas ett färdigskrivet mejl till UF-företagets adress. Det finns ett fungerande exempel i `public/kund/matochmatt/app.js` (tekniken går att återanvända, inte designen).
- Bara det kunden har sagt får stå som fakta. Hitta aldrig på priser, öppettider, betyg, antal kunder, recensioner eller påståenden om moms.

## 5. Testa

1. `npm run preview` och öppna `http://localhost:8788/kund/<namn>/`.
2. Kontrollera datorbredd och mobil (375 px). Ingen sidledsskroll, inga knappar som bryts på två rader, inga texter som krockar.
3. Prova formulär och beställning, både tomma och ifyllda.
4. Granska sidan mot listan i `design.md`. Ser den ut som en mall, gör om den.

## 6. Publicera förhandsvisning

1. Lägg sidan på en egen gren, `kund-<namn>`, från senaste `main`, och skapa en pull request.
   - Går `git push` som `nordvyuf`, använd den.
   - Annars: ladda upp via GitHubs webbsida i Chrome inloggad som nordvyuf: `https://github.com/nordvyuf/nordvy/upload/main/public/kund/<namn>`, välj "Create a new branch for this commit and start a pull request" och döp grenen till `kund-<namn>`. Fler filer på samma gren laddas upp via `.../upload/kund-<namn>/<mapp>`.
2. Vänta på att Cloudflares kontroll blir grön. Förhandsvisningen ligger på `https://kund-<namn>-nordvy.nordvyuf.workers.dev/kund/<namn>/`.
3. Jämför filstorlekarna på förhandsvisningen med de lokala filerna, så att rätt version ligger uppe.
4. Ge Måns länken och en kort lista över vad som är klart, vad som saknas och vad som inte är testat.

## 7. Göra sidan skarp

Först när Måns säger till:
1. Ta bort `noindex` och utkastraden, sätt `DRAFT = false` och fyll i kundens riktiga e-post för beställningar.
2. Kontrollera allt en gång till på förhandsvisningen.
3. Slå ihop pull requesten och kontrollera den riktiga adressen efter publiceringen.

UF-paketet lovar adressen `ert-namn.nordvyuf.se`. Tills `nordvyuf.se` är kopplad ligger sidan på `nordvy.nordvyuf.workers.dev/kund/<namn>/`. Säg det till kunden.

## Omdömen från besökare

Premium kan visa omdömen och ta emot nya. Det ingår inget databassteg: ett omdöme visas aldrig av sig självt, utan först när kunden har sagt ja.

**Slå på det på en kundsida**
1. Lägg `public/kund/<namn>/omdomen.json` med `{ "reviews": [] }`. Bara kunder som har den filen tar emot omdömen.
2. Lägg in rutan där omdömena ska stå: `<div data-nv-omdomen data-site="<namn>" style="--nv-accent:<kundens färg>"></div>` och `<script type="module" src="/assets/omdomen.js"></script>` längst ner. Texten, typsnittet och bakgrunden ärvs från sidan, så den passar in i kundens design.
3. Är sidan ett utkast kan du lägga `data-demo` på rutan, så skickas inget.
4. Rutan visar tomt läge och formuläret även när det inte finns några omdömen, och lägger aldrig till något själv. Hitta aldrig på omdömen. Har kunden riktiga omdömen (till exempel i intervjun, där de ligger under "Omdömen") och har sagt att de får visas, lägger du in dem i `omdomen.json` med namn, betyg, text och datum.

**När ett omdöme kommer in**
Det kommer som ett mejl till Nordvyuf@gmail.com med rubriken "Ny webbplatsförfrågan" och texten "NYTT OMDÖME TILL <namn>". Mejlet slutar med en färdig rad i JSON-format.
1. Fråga kunden om omdömet får visas.
2. Säger kunden ja: lägg raden i listan `reviews` i `public/kund/<namn>/omdomen.json` på en gren och skapa en pull request som vanligt. Du kan få raden från Gmail med sökningen `NYTT OMDÖME TILL <namn>`.
3. Är det skräp, skrivet av någon annan än en kund, eller nekar kunden: gör ingenting. Då visas det aldrig.

Gränser att känna till: Google-skriptet som skickar mejlen tillåter 30 mejl per dag för hela Nordvy, så en spamattack mot omdömesformuläret kan stoppa mejlen från intervjun och kontaktformuläret. Rutan har skydd mot enkla robotar (dolt fält, minsta tid och spärr för länkar), men inte mot riktiga angrepp. Behövs mer skydd: lägg till Cloudflare Turnstile.

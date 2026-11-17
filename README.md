# Nordvy UF

Hemsidan för Nordvy UF, självintervjun och fyra demosidor. Rena HTML-, CSS- och JavaScript-filer utan byggsteg. Sajten körs på Cloudflare Workers.

## Struktur

| Sökväg | Innehåll |
|---|---|
| `public/index.html` | Nordvys hemsida. All text, alla priser och alla frågor står direkt i filen. |
| `public/intervju.html` | Självintervjun (`/intervju`). |
| `public/assets/` | Stil, skript, typsnitt och bilder för de två sidorna ovan. |
| `public/assets/shared/brief.js` | Checklistan för intervjun, paketpriserna och logiken för utkastet. Används av både webbläsaren och servern. |
| `public/demo/…` | Fyra demosidor med påhittade företag. De har `noindex`. |
| `src/worker.js` | Servern: säkerhetsrubriker, kontaktformulär och API:et för självintervjun. |
| `src/interview.js` | Reglerna för intervjun och anropen till Workers AI. |
| `test/` | Tester. Kör med `npm test`. |
| `scripts/dev-server.mjs` | Lokal förhandsvisning. Kör med `npm run preview`. |

## Självintervjun

Kunden svarar på en fråga i taget i en chatt. Efter de sex första punkterna visas ett första utkast av kundens sida. När alla 20 punkter i checklistan har ett svar mejlas underlaget (svaren, det som ska följas upp och hela chatten ordagrant) till `Nordvyuf@gmail.com`. Kunden kan också välja att skicka det som finns efter de sex första punkterna, och kan sedan boka en genomgång via Cal.com.

Checklistan och reglerna kommer från dokumentet "Nordvy – intervjuchatten". Det här gäller:

- **Appen bestämmer, inte AI:n.** AI:n formulerar frågor och plockar ut svar. Koden avgör vad som sparas, räknar förloppet och stoppar intervjun från att avslutas för tidigt.
- **AI:n får inte hitta på.** Ett sparat värde måste innehålla ord som kunden faktiskt skrev. "Saknas" sparas bara för det som AI:n just frågade om.
- **Vaga svar** ger en följdfråga, högst en gång. Sedan sparas det kunden sa.
- **Intervjun fungerar utan AI.** Svarar inte Workers AI, eller är dagens gratiskvot slut, ställs checklistans färdiga frågor i stället.
- **Bilder och logga** laddas inte upp i chatten. Kunden mejlar dem, och det läggs som en uppföljningspunkt i underlaget.

Vill du ändra frågorna, knapparna eller ordningen: se `FIELDS` i `public/assets/shared/brief.js`. Reglerna till AI:n står i `RULES` i `src/interview.js`.

### Vad det kostar

Workers AI har 10 000 gratis "neuroner" per dygn. En hel intervju drar ungefär 1 000, så det räcker till cirka tio fullständiga intervjuer per dygn. Sedan tar reservfrågorna över tills nästa dygn (kl. 01.00 svensk vintertid). Modellen väljs i `wrangler.jsonc` (`AI_MODEL`).

### Mejlen

Formuläret och självintervjun skickar via samma Google Apps Script som mejlar till `Nordvyuf@gmail.com`. Adressen står i `wrangler.jsonc` (`CONTACT_ENDPOINT`). Skriptet har en gräns på 30 mejl per dag, och en intervju blir 2–4 mejl. Höj `MAX_EMAILS_PER_DAY` i skriptet om det behövs.

## Testa lokalt

```
npm test
npm run preview
```

`npm run preview` startar sajten på `http://localhost:8788`. Där finns ingen AI, så intervjun använder reservfrågorna, och mejlen skrivs ut i terminalen i stället för att skickas.

## Publicera

Varje commit till `main` publiceras automatiskt av Cloudflare (`npx wrangler deploy`). Inställningarna finns i `wrangler.jsonc`. Workern använder tre saker som Cloudflare kopplar in själv vid publicering: filerna i `public/`, Workers AI och en begränsning på 30 anrop per minut och besökare.

Efter en publicering: öppna `/api/health`. Den ska svara `"ai": true, "mail": true`.

## Ändra innehåll

- **Text, priser, paket och frågor:** `public/index.html`.
- **Priser i självintervjuns paketförslag:** `PACKAGES` i `public/assets/shared/brief.js`. Ändrar du ett pris på hemsidan ska det ändras där också.
- **Bokningslänken:** sök efter `nordvy-zovyfw` (finns i `index.html` och `assets/cal.js`).

## Kvar att göra

- Koppla domänen `nordvyuf.se` under Settings → Domains & Routes i Cloudflare. Fyll sedan i `SITE_URL` i `wrangler.jsonc`.
- Lägg till företagets telefonnummer i `index.html` när det finns.
- Bilduppladdning i självintervjun och en adminsida med alla underlag finns inte än. Underlagen kommer i dag bara som mejl.

Typsnitten Fraunces och Inter ligger i `public/assets/fonts` (SIL Open Font License). Ikonerna i utkastet kommer från Lucide (ISC-licens).

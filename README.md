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
| `public/kund/…` | Kundernas sidor, en mapp per kund. Byggs enligt `.claude/skills/kundsida/`. |
| `CLAUDE.md` | Fakta och regler för Claude när den arbetar i repot. |
| `src/worker.js` | Servern: säkerhetsrubriker, kontaktformulär och API:et för självintervjun. |
| `src/interview.js` | Reglerna för intervjun och anropen till Gemini och Workers AI. |
| `src/reviews.js` | Kontroll och mejl för omdömen från besökare på kundsidor (`POST /api/review`). |
| `public/assets/omdomen.js` | Rutan med omdömen och formulär som kundsidor lägger in. Se skillen `kundsida`. |
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
- **Frågorna beror på typen av företag.** Efter namnet frågar chatten vilken typ av företag det är (UF-företag, butik/café/salong, hantverk, säljer på nätet, säljer till andra företag eller annat). Står "UF" i namnet hoppas frågan över. Typen styr vilka fält som frågas (`SKIP`), hur frågorna och knapparna ser ut (`VIEW`) och vad som krävs innan svaret godtas (`FOLLOW_UPS` i `src/interview.js`, till exempel priser för den som säljer och adress för den som har en lokal). Ett UF-företag får 17 korta frågor med exempel, en salong 23.
- **Kontaktuppgifter skickas aldrig till AI:n.** Telefonnummer och mejladresser byts mot `[telefon]` och `[mejl]` innan prompten skickas (`redact` i `src/interview.js`). Koden sparar dem direkt ur kundens svar.

Vill du ändra frågorna, knapparna eller ordningen: se `FIELDS`, `SKIP` och `VIEW` i `public/assets/shared/brief.js`. Reglerna till AI:n står i `RULES` i `src/interview.js`.

### AI-modellen

Finns hemligheten `GEMINI_API_KEY` frågas Google Gemini först (modell `gemini-3.8-flash`; finns den inte eller är den överbelastad provas `gemini-flash-latest` och `gemini-flash-lite-latest`, högst 9 sekunder totalt; kan ändras med variabeln `GEMINI_MODEL`). `gemini-2.5-flash` finns inte för nya konton. Med `debug: true` visar `provider` vilken AI som svarade. Svarar Gemini inte, till exempel när Googles gratiskvot är slut, tar Workers AI över, och sedan checklistans frågor. Utan nyckel används bara Workers AI, som förut. `/api/health` visar `"gemini": true` när nyckeln finns.

Så lägger du in nyckeln (bara den som har kontot kan göra det):
1. Gå till https://aistudio.google.com/apikey, logga in och klicka **Create API key**. Det är gratis.
2. I Cloudflare: Workers & Pages → **nordvy** → Settings → **Runtime variables and secrets** (inte den under Builds) → **Add variable**. Välj typen **Secret**, namnet `GEMINI_API_KEY` och klistra in nyckeln. Spara.
3. Kontrollera att `https://nordvyuf.se/api/health` visar `"gemini": true`.

Googles gratisnivå får använda det som skickas för att förbättra Googles tjänster. Därför tas kontaktuppgifterna bort, och samtyckestexten i intervjun säger det.

### Vad det kostar

Workers AI har 10 000 gratis "neuroner" per dygn, gemensamt för live-sidan och alla förhandsvisningar. En hel intervju drar ungefär 1 000 (de enkla frågorna från kontaktuppgifterna och framåt ställs utan AI, se `needsAi` i `src/interview.js`), så det räcker till cirka tio fullständiga intervjuer per dygn. Sedan tar reservfrågorna över tills nästa dygn (kl. 01.00 svensk vintertid). Med Cloudflares Workers Paid (5 dollar i månaden) fortsätter AI:n efter gratiskvoten, för ungefär 0,011 dollar per 1 000 neuroner. Modellen väljs i `wrangler.jsonc` (`AI_MODEL`), och reservmodellen i `BACKUP_MODEL`. Med `debug: true` i anropet till `/api/interview/turn` syns AI:ns fel, till exempel att kvoten är slut.

### Mejlen

Formuläret och självintervjun skickar via samma Google Apps Script som mejlar till `Nordvyuf@gmail.com`. Adressen står i `wrangler.jsonc` (`CONTACT_ENDPOINT`). Skriptet har en gräns på 30 mejl per dag, och en intervju blir 2–4 mejl. Höj `MAX_EMAILS_PER_DAY` i skriptet om det behövs.

## Testa lokalt

```
npm test
npm run preview
```

### Testa chattboten med påhittade kunder

```
node scripts/testa-chattboten.mjs https://<gren>-nordvy.nordvyuf.workers.dev
```

Skriptet låter sex påhittade kunder (`scripts/testkunder.mjs`) göra hela intervjun och skriver samtalen till `testresultat/`. Där syns varje fråga, vad som sparades, om svaret kom från AI:n eller reservfrågorna, och AI-fel som slut på kvoten. Inga mejl skickas. En hel intervju drar ungefär 1 000 av dagens 10 000 gratis AI-enheter, så kör helst mot en grens förhandsvisning och inte alla kunder flera gånger samma dag.

`npm run preview` startar sajten på `http://localhost:8788`. Där finns ingen AI, så intervjun använder reservfrågorna, och mejlen skrivs ut i terminalen i stället för att skickas.

## Publicera

Varje commit till `main` publiceras automatiskt av Cloudflare (`npx wrangler deploy`). Inställningarna finns i `wrangler.jsonc`. Workern använder tre saker som Cloudflare kopplar in själv vid publicering: filerna i `public/`, Workers AI och en begränsning på 30 anrop per minut och besökare.

Efter en publicering: öppna `/api/health`. Den ska svara `"ai": true, "mail": true`.

## Ändra innehåll

- **Text, priser, paket och frågor:** `public/index.html`.
- **Priser i självintervjuns paketförslag:** `PACKAGES` i `public/assets/shared/brief.js`. Ändrar du ett pris på hemsidan ska det ändras där också.
- **Bokningslänken:** sök efter `nordvy-zovyfw` (finns i `index.html` och `assets/cal.js`).

## Kvar att göra

- Lägg till företagets telefonnummer i `index.html` när det finns.
- Bilduppladdning i självintervjun och en adminsida med alla underlag finns inte än. Underlagen kommer i dag bara som mejl.

Typsnitten Fraunces och Inter ligger i `public/assets/fonts` (SIL Open Font License). Ikonerna i utkastet kommer från Lucide (ISC-licens).

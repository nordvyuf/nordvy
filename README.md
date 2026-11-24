# Nordvy UF

Hemsidan för Nordvy UF, självintervjun och fyra demosidor. Rena HTML-, CSS- och JavaScript-filer utan byggsteg. Sajten körs på Cloudflare Workers.

## Struktur

| Sökväg | Innehåll |
|---|---|
| `public/index.html` | Nordvys hemsida. All text, alla priser och alla frågor står direkt i filen. |
| `public/intervju.html` | Självintervjun (`/intervju`). |
| `public/assets/` | Stil, skript, typsnitt och bilder för de två sidorna ovan. |
| `public/assets/shared/brief.js` | Checklistan för intervjun, paketpriserna och logiken som projektbladet bygger på. Används av både webbläsaren och servern. |
| `public/demo/…` | Fyra demosidor med påhittade företag. De har `noindex`. |
| `public/kund/…` | Kundernas sidor, en mapp per kund. Byggs enligt `.claude/skills/kundsida/`. |
| `CLAUDE.md` | Fakta och regler för Claude när den arbetar i repot. |
| `src/worker.js` | Servern: säkerhetsrubriker, kontaktformulär och API:et för självintervjun. |
| `src/interview.js` | Reglerna för intervjun och anropen till Claude, Groq, Gemini och Workers AI. |
| `src/reviews.js` | Kontroll och mejl för omdömen från besökare på kundsidor (`POST /api/review`). |
| `public/assets/omdomen.js` | Rutan med omdömen och formulär som kundsidor lägger in. Se skillen `kundsida`. |
| `test/` | Tester. Kör med `npm test`. |
| `scripts/dev-server.mjs` | Lokal förhandsvisning. Kör med `npm run preview`. |

## Självintervjun

Kunden svarar på en fråga i taget i en chatt. Bredvid chatten växer ett projektblad fram (`public/assets/projektblad.js`): namnet i det typsnitt vi tänker använda, färgerna, sidan del för del med kundens eget innehåll och det vi behöver från dem. Färger och typsnitt visas först när kunden har sagt något om känslan. Ingen låtsassida längre: Nordvy bygger ett riktigt utkast efter intervjun och skickar en länk inom 2 vardagar. I slutet väljer kunden själv paket. Vi rekommenderar ett med en kort förklaring, och kundens val står i underlaget bredvid rekommendationen. När alla 20 punkter i checklistan har ett svar mejlas underlaget (svaren, det som ska följas upp och hela chatten ordagrant) till `Nordvyuf@gmail.com`. Kunden kan också välja att skicka det som finns efter de sex första punkterna, och kan sedan boka en genomgång via Cal.com.

Checklistan och reglerna kommer från dokumentet "Nordvy – intervjuchatten". Det här gäller:

- **Appen bestämmer, inte AI:n.** AI:n formulerar frågor och plockar ut svar. Koden avgör vad som sparas, räknar förloppet och stoppar intervjun från att avslutas för tidigt.
- **AI:n får inte hitta på.** Ett sparat värde måste innehålla ord som kunden faktiskt skrev. "Saknas" sparas bara för det som AI:n just frågade om.
- **Vaga svar** ger en följdfråga, högst en gång. Sedan sparas det kunden sa.
- **Intervjun fungerar utan AI.** Svarar inte Workers AI, eller är dagens gratiskvot slut, ställs checklistans färdiga frågor i stället.
- **Bilder och logga** laddas inte upp i chatten. Kunden mejlar dem, och det läggs som en uppföljningspunkt i underlaget.
- **Vet kunden inte** ("vet inte", "ingen aning", en motfråga) ställs en enklare fråga om samma sak, en gång (`altQuestion` i `brief.js`), till exempel "Vad brukar kunderna säga att de gillar hos er?". Vet de inte då heller sparas "saknas" och teamet får en punkt att ta i samtalet.
- **Ändra förra svaret:** knappen under svarsrutan tar bort det senaste svaret och lägger det i rutan igen, så att kunden kan rätta det. Upp till tolv steg bakåt.
- **Förloppet** visas som fyra delar ("Del 2 av 4: Hur sidan ska bli", `PHASES`), inte som antal punkter.
- **Intervjun tar slut av sig själv:** när allt för typen av företag är besvarat, när kunden säger att de vill sluta ("jag orkar inte mer", "sluta"), eller efter `MAX_ANSWERS` (36) svar. Det som saknas blir en punkt för teamet.
- **Fliken "Dina svar"** visar bara det kunden har svarat. Teamets uppföljningspunkter visas inte för kunden, de står i underlaget.
- **Frågorna beror på typen av företag.** Efter namnet frågar chatten vilken typ av företag det är (UF-företag, butik/café/salong, hantverk, säljer på nätet, säljer till andra företag eller annat). Står "UF" i namnet hoppas frågan över. Typen styr vilka fält som frågas (`SKIP`), hur frågorna och knapparna ser ut (`VIEW`) och vad som krävs innan svaret godtas (`FOLLOW_UPS` i `src/interview.js`, till exempel priser för den som säljer och adress för den som har en lokal). Ett UF-företag får 17 korta frågor med exempel, en salong 23.
- **Kontaktuppgifter skickas aldrig till AI:n.** Telefonnummer och mejladresser byts mot `[telefon]` och `[mejl]` innan prompten skickas (`redact` i `src/interview.js`). Koden sparar dem direkt ur kundens svar.

Vill du ändra frågorna, knapparna eller ordningen: se `FIELDS`, `SKIP` och `VIEW` i `public/assets/shared/brief.js`. Reglerna till AI:n står i `RULES` i `src/interview.js`.

### AI-modellen

Intervjun provar AI-tjänsterna i tur och ordning (`runClaude` och `PROVIDERS` i `src/interview.js`):

1. **Claude Haiku 5.5** (`ANTHROPIC_API_KEY`), högst 5 sekunder. Betalas per användning, ungefär 4 öre per intervju (se Vad det kostar). Svaret låses till samma JSON-schema som koden väntar sig, och reglerna (`RULES`) sparas i Claudes cache så att de blir billiga efter första frågan. `CLAUDE_MODEL` kan byta modell.

Sedan de andra, högst 7 sekunder totalt:

1. **Groq** (`GROQ_API_KEY`): `openai/gpt-oss-120b` och sedan `llama-3.3-70b-versatile`. Gratis utan betalkort och mycket snabb. Varje modell har en egen dygnskvot.
2. **Google Gemini** (`GEMINI_API_KEY`): `gemini-flash-lite-latest`, `gemini-flash-latest`, `gemini-3.8-flash` (`GEMINI_MODEL` kan lägga till en egen först). Gratisnivån var i november 2026 ofta överbelastad (503) eller slut (429). `gemini-2.5-flash` finns inte för nya konton.
3. **Egen server** (`LOCAL_AI_URL`, och `LOCAL_AI_MODEL` och `LOCAL_AI_KEY` om det behövs): en OpenAI-kompatibel adress (https) till en egen modell, till exempel Ollama med `qwen2.5:7b-instruct` på en dator med grafikkort, nådd via Cloudflare Tunnel. Utan grafikkort blir svaren för långsamma för en chatt.
4. **Workers AI**, som alltid finns, och sist checklistans färdiga frågor.

En tjänst används bara när dess nyckel finns. Svarar en modell 429 (kvoten slut) eller 503 (överbelastad) pausas den i 5–15 minuter, så att kunderna inte väntar på den vid varje fråga. `/api/health` visar `claude`, `groq` och `gemini`, och med `debug: true` i anropet till `/api/interview/turn` visar `provider` vilken AI som svarade, `usage` hur många tokens Claude använde och `errors` varför de före inte gjorde det.

Så lägger du in en nyckel (bara den som har kontot kan göra det):
1. **Claude:** logga in på https://platform.claude.com, köp krediter under Billing (till exempel 5 USD, utan automatisk påfyllning) och skapa en nyckel under API Keys. **Groq:** gå till https://console.groq.com/keys, logga in och klicka **Create API Key**. **Gemini:** https://aistudio.google.com/apikey → **Create API key**. Båda är gratis.
2. I Cloudflare: Workers & Pages → **nordvy** → Settings → **Runtime variables and secrets** (inte den under Builds) → **Add variable**. Välj typen **Secret** (inte Text, då försvinner den vid nästa publicering), namnet `ANTHROPIC_API_KEY`, `GROQ_API_KEY` eller `GEMINI_API_KEY`, och klistra in nyckeln. Klicka **Deploy**.
3. Kontrollera att `https://nordvyuf.se/api/health` visar `"claude": true` (eller `"groq"`, `"gemini"`).

Telefonnummer och mejladresser tas bort innan något skickas till någon AI. Googles gratisnivå får använda resten av texten för att förbättra Googles tjänster, och samtyckestexten i intervjun säger det.

### Vad det kostar

**Claude Haiku 5.5** (priser kollade 20 november 2026): 0,10 USD per miljon tokens in, 0,50 USD ut, och 0,01 USD för det som läses från cachen. En vanlig intervju är 10–14 AI-anrop och kostar ungefär 4 öre, och högst cirka 20 öre om alla svar går till AI:n. Antalet tokens är uppskattat (cirka 3 tecken per token på svenska); `usage` i `debug: true` visar de riktiga siffrorna. Köp krediter i små steg utan automatisk påfyllning: tar de slut svarar Claude med ett fel, och intervjun fortsätter med reserverna nedan.

Workers AI har 10 000 gratis "neuroner" per dygn, gemensamt för live-sidan och alla förhandsvisningar. En hel intervju drar ungefär 1 000 (de enkla frågorna från kontaktuppgifterna och framåt ställs utan AI, se `needsAi` i `src/interview.js`), så det räcker till cirka tio fullständiga intervjuer per dygn. Sedan tar reservfrågorna över tills nästa dygn (kl. 01.00 svensk vintertid). Med Cloudflares Workers Paid (5 dollar i månaden) fortsätter AI:n efter gratiskvoten, för ungefär 0,011 dollar per 1 000 neuroner. Modellen väljs i `wrangler.jsonc` (`AI_MODEL`), och reservmodellen i `BACKUP_MODEL`. Med `debug: true` i anropet till `/api/interview/turn` syns AI:ns fel, till exempel att kvoten är slut.

### Mejlen

Formuläret och självintervjun skickar via samma Google Apps Script som mejlar till `Nordvyuf@gmail.com`. Adressen står i `wrangler.jsonc` (`CONTACT_ENDPOINT`). Skriptet har en gräns på 30 mejl per dag. En intervju blir **ett** långt mejl (`MAIL_CHARS` i `src/worker.js`, 19 000 tecken). Det kräver att skriptet tar emot långa meddelanden: rad 18 i skriptet ska vara `const message = clean(input.message, 20000);` (var 2000 till 24 november 2026, då blev en intervju 2–4 mejl). Höj `MAX_EMAILS_PER_DAY` i skriptet om det behövs.

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

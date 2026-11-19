# Spiideo AB – designidé (utkast inför mötet 20 november)

Underlag: självintervjun 19 november (två mejl). Inga personuppgifter i den här filen.

## Vem och vad
Sidan är för performance-analytiker, ligakanslier och mediefolk på **klubbar, ligor och förbund** över hela världen (kundens egna ord). Besökaren ska **boka en demo** eller **begära en offert**. "Beställa" betyder offertförfrågan, inte webbshop. Ingen karta, inga öppettider ("Vi säljer bara online").

## Referenser
UXKIN används inte. Tittade i webbläsaren på tre sajter i samma bransch (B2B sportteknik):
- **Hudl:** mörk bakgrund, stor versalrubrik, en tydlig säljknapp. Jag tar: **en** huvudknapp högt upp, inget annat som tävlar med den.
- **Catapult:** svart med orangeröd accent och "Request a demo" i menyn. Jag tar: demoknappen syns hela tiden i sidhuvudet.
- **Veo:** mörk, kampanjtung, cookie-ruta täcker första skärmen. Jag tar inget härifrån, mer än att undvika det.

Alla tre är mörka med en enda skarp accent. Det är branschens standard och ett av AI-standardvalen i `design.md`. Kunden bad om "ren och modern", så **den här sidan är ljus**.

spiideo.com lästes för att förstå företaget. Inga texter, bilder eller loggor är tagna därifrån.

## Det enda djärva draget
Produkterna samlas kring **en stor bildyta**: man väljer Perform, Play, Replay eller Autodata i en lista, och ytan bredvid visar den produkten. Där ska Spiideos egna skärmbilder eller korta filmer ligga. Det är en riktig sak från kunden, inte en utritad idé. Kundtyperna (klubbar, ligor och förbund) har var sin länk "Begär offert som …" som fyller i offertformuläret.

## Granskning
Tre blinda rundor: 5, 5 och 6 av 10 med exempelbilder (4 av 10 utan). Målet 8 nåddes inte. Granskarna var överens om att det som saknas mest är kundens eget material: logga, skärmbilder från produkterna och riktiga foton. Det som ändrades efter varje runda står nedan.
- Runda 1: de tre kundtyperna var knappar i en stor mening, vilket granskaren kallade en gimmick. Produkterna var en tunn lista och kontakten ett smalt formulär. Nu är det spalter, en stor bildyta och kontakt i två delar. Typsnittet var Space Grotesk och Work Sans.
- Runda 2: "Boka demo" ledde till offertformuläret, fotona var kopplade till sporter i stället för kundtyper, och platshållarna såg olika ut. Nu öppnar "Boka demo" bokningen, offerten har egna länkar, kundtyperna har ett gemensamt foto och alla platshållare är gula.
- Runda 3: produktytan stack ut till höger, rubriken bröts dåligt och de gula markeringarna var för många. Nu är produktytan en mörk skärm, och det finns en gul markering per sektion i stället för en per rad.

## Ordning och varför
1. **Första skärmen:** kundens egna ord "Vi filmar sport med en AI-kamera", vem det är för och sedan 2012, plus knapparna Boka demo och Begär offert.
2. **Produkterna** i en lista med en stor bildyta, under kundens ord "Performance analytics och media streaming".
3. **Klubbar, ligor och förbund:** ett brett foto och tre spalter.
4. **Kunder:** en enkel rad med plats för logotyper och omdömen, tills de har kommit.
5. **Begär offert och boka demo:** formuläret till vänster och demobokningen till höger.

## Färger
| Namn | Värde | Roll |
|---|---|---|
| is | `#F4F6F6` | bakgrund |
| vit | `#FFFFFF` | formulär och listor |
| bläck | `#14222C` | text |
| grå | `#4F5D66` | sekundär text (7,0:1 på is) |
| linje | `#D6DDDF` | linjer och fältkanter |
| plan | `#0F6B47` | huvudknapp, länkar, fokus (6,4:1 på vit) |
| plan-ljus | `#E2EFE8` | vald organisationstyp |

## Typsnitt
- **Space Grotesk** för rubriker, produktnamn och knappar: teknisk och lite kantig.
- **Work Sans** för brödtext och formulär, lugnare att läsa.

## Bilder
Inga bilder eller logga har kommit in. Sidan visas för kunden med platshållare ("Foto kommer: …"). Med `?exempelbilder` visas två lånade Unsplash-foton (en fotbollsmatch i flodljus och en basketkorg i en arena), bara för att Nordvy ska kunna bedöma layouten. Inget av dem visar en kamera eller något som kan tas för Spiideos produkt.

Ordmärket är namnet "Spiideo" i Space Grotesk tills kundens logga kommer.

## Saknas från kunden
Logga, bilder, egna texter, omdömen (med tillstånd), beskrivning per produkt, vilken produkt som hör till vilket område, sociala länkar som adresser, Cal.com-länk för demo, språk (svenska eller engelska).

## Rörelse
Enligt `.claude/skills/kundsida/rorelse.md`: en start på första skärmen (rubrik, rad och knappar i tur och ordning, hero-fotot landar), avtäckning av produktytan och fotot för klubbar, ligor och förbund (två saker utanför första skärmen), knappar som svarar på klick, fält som skakar vid fel och ett svar som tonar in. Produktlistan har ingen egen rörelse, eftersom produktytan i samma sektion redan avtäcks.

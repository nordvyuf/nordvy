---
name: reklamfilm
description: Gör korta reklamfilmer (mp4) för Nordvy till Facebook, Instagram och TikTok, med riktiga skärmbilder från nordvyuf.se, demosidorna och självintervjun. Använd när någon vill ha en reklamfilm, en annons, en reel, en story, en lanseringsfilm, en "brag"-film eller fler varianter av en film vi redan gjort.
---

# Reklamfilm

Så gör Nordvy en reklamfilm: en animerad sida som spelas in bild för bild i Chrome och blir en mp4. Samma idé som verktyget brag (latent-spaces/brag), men byggd för oss: våra färger, typsnitt och sidor, och inga paket att installera.

Filerna:
- `mall/film.html`: mallen. Den läser en film-JSON och bygger scenerna. Ändra bara här om du vill ha en ny scentyp eller animation.
- `scripts/skarm.mjs`: tar skärmbilderna som filmen behöver.
- `scripts/rendera.mjs`: gör filmen i ett eller flera format, eller ett kontaktark för en snabb koll.
- `exempel/facebook-demosidor.json`: en färdig film om demosidorna. Kopiera den och ändra.

Kräver Node 22 eller nyare, Google Chrome och ffmpeg (`ffmpeg -version` ska fungera).

## Arbetsgång

1. **Bestäm budskapet.** En film säger en sak. Vem ska se den (lokala företag, UF-företag), och vad ska de göra efteråt (oftast: göra intervjun på nordvyuf.se)? De första 2–3 sekunderna avgör om någon stannar, så börja med en fråga eller ett problem, inte med vår logga.
2. **Skapa en mapp utanför repot**, till exempel `OneDrive/Dokument/Nordvy-anteckningar/Media/reklamfilm/<namn>/`, och kopiera exemplet dit som `film.json`. Filmer och skärmbilder hör inte hemma i repot.
3. **Skriv scenerna** i `film.json` (se Scentyper nedan). En scen är 2,5–4,5 sekunder. Hela filmen: 15–25 sekunder för Facebook och Instagram.
4. **Ta skärmbilderna:** `node .claude/skills/reklamfilm/scripts/skarm.mjs <mapp>/film.json`. Bilderna hamnar i mappen. Adresser som börjar med `/` tas från repots `public/`, så demosidorna och intervjun kan fotas utan att sajten är igång.
5. **Kolla snabbt:** `node .claude/skills/reklamfilm/scripts/rendera.mjs <mapp>/film.json 4x5 --test` ger ett kontaktark med en bild per sekund. Titta på det och rätta innan du gör hela filmen.
6. **Rendera:** `node .claude/skills/reklamfilm/scripts/rendera.mjs <mapp>/film.json` gör alla format i `"format"`. Det tar ett par minuter per format, så kör det i bakgrunden.
7. **Skriv annonstexterna** (se nedan) och spara dem i Obsidian bredvid filmen.
8. **Publicera inte själv.** Måns eller teamet lägger ut filmen och startar annonser. Det gäller både inlägg och betalda annonser.

## Format

| Format | Storlek | Används till |
|---|---|---|
| `9x16` | 1080 × 1920 | Reels, Stories, TikTok |
| `4x5` | 1080 × 1350 | Facebook- och Instagram-flödet (bäst för annonser i flödet) |
| `1x1` | 1080 × 1080 | Flödet, och annonser som visas på många ställen |

Mallen håller text borta från kanterna där Instagram och Facebook lägger knappar och bildtext. I 4:5 och 1:1 står rubriken till vänster och mobilen till höger i scenen `mobil`.

Filmerna har inget ljud. Lägg till musik i Instagram eller Facebook när ni publicerar, eftersom deras låtar är licensierade. Använd aldrig musik från annat håll.

## Scentyper

Alla scener har `"typ"` och `"langd"` (millisekunder). I texter blir `*så här*` isblå kursiv, `==så här==` får en markering som sveps fram, och `\n` är ny rad.

| typ | Fält | Vad som rör sig |
|---|---|---|
| `krok` | `rubrik`, `text`, `stjarna` (false för att dölja) | Stjärnan snurrar in, och rubriken kommer ord för ord. Bra som första scen. |
| `karusell` | `rubrik`, `bilder` (tre), `etiketter` | Tre mobiler fälls ut som en solfjäder, och sidorna rullar. |
| `mobil` | `rubrik`, `bild`, `etikett`, `chip`, `chipIkon` ("mikrofon") | Mobilen glider upp, och skärmbilden rullar. Chippet poppar upp och pulserar. |
| `webblasare` | `rubrik`, `bild` (datorbild), `adress` | Ett webbläsarfönster glider upp och sidan rullar. |
| `siffra` | `siffra`, `text`, `under` | En stor siffra poppar fram, med text under. |
| `lista` | `rubrik`, `punkter`: [{ `text`, `under` }] | Punkterna kommer en i taget, och bockarna ritas. |
| `uppmaning` | `rubrik`, `adress`, `knapp`, `text` | Adressen skrivs fram bokstav för bokstav, och knappen pulserar. Bra som sista scen. |

Skärmbilder i `"skarmbilder"`: `namn`, `url`, `typ` ("mobil" eller "dator"), `hojd` (en hög bild rullar längre, till exempel 2600), `rulla` (rulla ner först), `klicka` (en CSS-väljare att klicka på, till exempel `[data-view=preview]` för Planen i intervjun) och `intervju` (`brief` och `logg`, som fyller i intervjun innan bilden tas).

Vill du ha en ny scentyp: lägg till en funktion i `BUILD` i `mall/film.html` och nya `@keyframes` i dess stil. Allt som rör sig måste vara CSS-animationer som startar från t = 0 (funktionen `a()`), annars kan filmen inte spelas in bild för bild.

## Regler

- **Bara sant innehåll.** Priser, tider och löften ska stämma med `public/index.html`. Skriv aldrig "flest kunder", "bäst i Skåne" eller siffror vi inte kan visa.
- **Demosidor är exempel.** Demosidorna är påhittade företag, och varje sida har en remsa högst upp som säger det. Sätt `"etikett": "Exempelsida"` när de visas, och låt dem aldrig se ut som riktiga kunder.
- **Riktiga kunder bara med lov.** En riktig kunds sida (till exempel ReBoard UF) får bara vara med om kunden har sagt ja till att synas i reklam, och om Måns har bekräftat det.
- **Personuppgifter:** inga riktiga namn, telefonnummer eller mejladresser i skärmbilderna. Fyll i intervjun med påhittade svar (`intervju.brief` och `intervju.logg`).
- **Facebook-annonser:** Metas regler förbjuder annonser som påstår något om tittarens personliga egenskaper, till exempel hälsa, ekonomi, ålder eller religion ("Har du skulder?"). Prata om företaget i stället: "Har ditt företag ingen hemsida?" fungerar.

## Annonstexter

Skriv tre varianter till varje film, så att annonserna kan testas mot varandra:
- **Primär text** (högst 125 tecken innan "Visa mer"): problem, lösning och vad man gör sedan.
- **Rubrik** (högst 40 tecken): det tydligaste löftet, till exempel "Gratis utkast av din hemsida".
- **Beskrivning** (högst 30 tecken), och knappen "Läs mer" eller "Kom igång".
- **Länk:** `https://nordvyuf.se/intervju?utm_source=facebook&utm_medium=annons&utm_campaign=<filmens namn>`, så att ni ser vilken film som ger intervjuer.

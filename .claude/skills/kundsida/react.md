# React-vägen: shadcn/ui, Radix och Lucide

Måns beslutade 23 november 2026 att kundsidor får byggas med shadcn/ui, Radix och Lucide. ReBoard UF (`kundsidor/reboard/`) är den första och fungerar som mall: 68 KB JavaScript, förrenderad HTML och CSP-säker.

## När du väljer vilken väg
- **React-vägen:** sidor med något som besökaren gör: beställning i en dialog, storleksväljare, bokning, flera steg, filter. Det gäller de flesta UF-paket med beställning och alla Premium.
- **Rena HTML-filer** (resten av SKILL.md): mycket enkla sidor utan interaktion, eller när Måns ber om det.
- Välj en väg per sida och blanda inte.

## Godkända bibliotek
Använd bara de här utan att fråga Måns:

| Bibliotek | Till vad | Hur |
|---|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Knappar, dialoger, fält, flikar och dragspel | Kopiera komponenterna in i `src/components/ui/`. Det är inget paket att installera. Ge dem egna färger, typsnitt, rundning och skuggor, så att standardutseendet aldrig syns. |
| [Radix Primitives](https://github.com/radix-ui/primitives) | Det som shadcn bygger på: Dialog, Tabs, Accordion, Popover | `@radix-ui/react-<del>`. Ger tangentbord och skärmläsare rätt från början. |
| [Lucide](https://github.com/lucide-icons/lucide) | Ikoner | `lucide-react`. Bara de ikoner som behövs, eftersom de importeras en och en. |
| [Tailwind CSS 4](https://github.com/tailwindlabs/tailwindcss) | Stil | `@tailwindcss/vite`. Kundens färger och typsnitt läggs som variabler i `styles.css`. |
| [Magic UI](https://github.com/magicuidesign/magicui) | Högst **ett** inslag per sida, och bara om det tydligt tillför något | Kopiera en komponent. Den ska följa `rorelse.md` och stängas av vid `prefers-reduced-motion`. Många av effekterna ser AI-gjorda ut (glitter, partiklar, rullande loggor), så hellre ingen. |

Rörelse: använd Nordvys `/assets/kund/rorelse.css` och `rorelse.js`, eller samma tider i CSS. Installera inte Framer Motion eller annat som gör samma sak. Behövs ett annat bibliotek: fråga Måns först och skriv varför i `DESIGN.md`.

## Så startar du en ny kundsida
1. Kopiera `kundsidor/reboard/` till `kundsidor/<namn>/`, utan `node_modules` och `.ssr`.
2. Byt `reboard` mot `<namn>` på fyra ställen:
   - `package.json` (`name`)
   - `vite.config.js` (`base: '/kund/<namn>/'` och `outDir: '../../public/kund/<namn>'`)
   - `scripts/prerender.mjs` (sökvägen till `index.html`)
   - `index.html` (titel, beskrivning, `canonical` och delningsbild)
3. Ta bort ReBoards innehåll i `src/data.js` och `src/App.jsx`, och skriv kundens.
   - **Återanvänd byggdelarna** i `src/components/`:
     - `OrderDialog`: beställning i en dialog, med Swish-steget
     - `SizePicker`: val med pris
     - `StickyBar`: fast beställningsrad i mobilen
     - `Foto`: bild eller platshållare i rätt form
     - `Todo`: gul markering för det som saknas
   - Byt utseendet helt. Återanvänd tekniken, inte designen.
4. `npm install` och sedan `npm run build`. Bygget skriver den färdiga sidan till `public/kund/<namn>/` och förrenderar HTML:en, så att sidan syns direkt och fungerar för sökmotorer.
5. Checka in både `kundsidor/<namn>/` (utan `node_modules`) och `public/kund/<namn>/`. Cloudflare har inget byggsteg, så det byggda måste ligga i repot.
6. Vill Måns ha en kort adress, till exempel `nordvyuf.se/<namn>uf`: lägg till den i `SHORT_PATHS` i `src/worker.js`.

## Regler som alltid gäller
- **CSP:** inga inbäddade `<script>`. Det är därför `modulePreload: { polyfill: false }` står i `vite.config.js`. Strukturerad data för produkter skrivs som mikrodata i HTML, inte som JSON-LD i ett skript.
- **Typsnitt** kommer från `/assets/fonts/kund/typsnitt.css` och aldrig från Google. Bilder ligger på egen domän eller hos Unsplash.
- **Prestanda:** under 100 KB komprimerat JavaScript och 90+ i Lighthouse på mobil. Kolla med `gzip -c public/kund/<namn>/filer/*.js | wc -c`.
- **Tillgänglighet:** synlig fokusmarkering, och hela beställningen ska gå att göra med tangentbord och skärmläsare. Radix sköter det mesta, men kontrollera ändå.
- Allt i `design.md`, `rorelse.md`, `granskning.md` och `checklista.md` gäller precis som för rena HTML-sidor.

## Tid
Intervjun lovar kunden ett riktigt utkast inom 2 vardagar från att underlaget kom in. Bygg det första utkastet direkt med platshållare för det som saknas, och lista frågorna till kunden i rapporten till Måns.

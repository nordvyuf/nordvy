# Nordvy UF

Hemsidan för Nordvy UF och fyra demosidor. Rena HTML-filer utan byggsteg.

## Struktur

| Sökväg | Innehåll |
|---|---|
| `public/index.html` | Nordvys hemsida. Allt innehåll (priser, paket, FAQ, kontakt) ändras i `CONFIG` längst ner i filen. |
| `public/demo/salong-ask/` | Demo: frisörsalong med onlinebokning |
| `public/demo/fogen-snickeri/` | Demo: snickerifirma med offertförfrågan och ROT-kalkylator |
| `public/demo/solkorn/` | Demo: bageri med förbeställning och bordsbokning |
| `public/demo/havsglas-uf/` | Demo: UF-paketet |

Demosidorna visar påhittade företag. De är märkta som demo och har `noindex`, så att de inte dyker upp i Google.

## Publicera på Cloudflare

Allt i `public/` publiceras. Inställningarna finns i `wrangler.jsonc`.

1. Cloudflare → Workers & Pages → Create → Import a repository → välj `nordvyuf/nordvy`.
2. Project name: `nordvy` (samma som `name` i `wrangler.jsonc`). Build command: tomt. Deploy command: `npx wrangler deploy`. Path: `/`.
3. Deploy. Varje ny commit till `main` publiceras automatiskt.
4. Lägg till domänen `nordvyuf.se` under Settings → Domains & Routes.

## Kvar att fylla i (i `CONFIG` i `public/index.html`)

- `bookingUrl`: länk till Cal.com
- `formEndpoint`: mottagare för kontaktformuläret
- `nordvyUrl`: `https://nordvyuf.se` när domänen är kopplad
- `contact.phone`: företagets telefonnummer

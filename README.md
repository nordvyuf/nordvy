# Nordvy UF

Hemsidan för Nordvy UF och fyra demosidor. Rena HTML-filer utan byggsteg.

## Struktur

| Sökväg | Innehåll |
|---|---|
| `index.html` | Nordvys hemsida. Allt innehåll (priser, paket, FAQ, kontakt) ändras i `CONFIG` längst ner i filen. |
| `demo/salong-ask/` | Demo: frisörsalong med onlinebokning |
| `demo/fogen-snickeri/` | Demo: snickerifirma med offertförfrågan och ROT-kalkylator |
| `demo/solkorn/` | Demo: bageri med förbeställning och bordsbokning |
| `demo/havsglas-uf/` | Demo: UF-paketet |

Demosidorna visar påhittade företag. De är märkta som demo och har `noindex`, så att de inte dyker upp i Google.

## Publicera på Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → välj `nordvyuf/nordvy`.
2. Framework preset: **None**. Build command: lämna tomt. Build output directory: `/`.
3. Spara. Varje ny commit till `main` publiceras automatiskt.
4. Lägg till domänen `nordvyuf.se` under Custom domains.

## Kvar att fylla i (i `CONFIG` i `index.html`)

- `bookingUrl`: länk till Cal.com
- `formEndpoint`: mottagare för kontaktformuläret
- `nordvyUrl`: `https://nordvyuf.se` när domänen är kopplad
- `contact.phone`: företagets telefonnummer

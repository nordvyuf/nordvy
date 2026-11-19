# Nordvy UF – för Claude

Nordvy är ett UF-företag (Ung Företagsamhet) som drivs av fyra gymnasieelever i Skåne. Vi bygger hemsidor åt lokala företag och UF-företag. Skriv till teamet på enkel svenska.

## Var allt finns

- **Repo:** `nordvyuf/nordvy` (publikt). Varje commit till `main` publiceras automatiskt av Cloudflare på https://nordvyuf.se. Samma sida finns också på https://nordvy.nordvyuf.workers.dev.
- **Förhandsvisning:** varje gren får en egen adress, `https://<gren>-nordvy.nordvyuf.workers.dev`. Den syns inte på GitHub. Räkna fram den eller fråga.
- **Domän:** `nordvyuf.se` är köpt hos Loopia, som har Cloudflares namnservrar. DNS sköts i Cloudflare. Domänen är kopplad som Custom domain på workern under Settings → Domains & Routes. `www.nordvyuf.se` skickas vidare till `nordvyuf.se` av `src/worker.js`.
- **Mejl:** formulär och självintervju mejlar till `Nordvyuf@gmail.com` via ett Google Apps Script (`CONTACT_ENDPOINT` i `wrangler.jsonc`). Gränsen är 30 mejl per dag. Mejlen kommer från avsändaren "Nordvy — webbformulär". Ett intervjuunderlag kan vara uppdelat i flera mejl, märkta (1/3), (2/3) och så vidare.
- **Bokningar:** Cal.com, `cal.com/nordvy-zovyfw`.
- **Plan och intervjuregler:** claude.ai-chatten "Nordvy utvecklingsplan" och dokumentet "Nordvy – intervjuchatten".
- **Gammalt, använd inte:** `nordvy.higgsfield.app` och äldre HTML-filer i Downloads har gamla priser.
- Mer om koden, självintervjun och kostnader står i `README.md`.

## Paket och priser

`public/index.html` är facit för priser, paketinnehåll, tillägg och FAQ. Läs där innan du lovar något till en kund. Priserna finns också i `PACKAGES` i `public/assets/shared/brief.js`, och båda ska ändras samtidigt.

Kort (2026-11-17):
- **UF-paket:** 499 kr engångspris, ingen månadsavgift, online till 30 juni. En sida om UF-företaget, upp till 10 produkter med bild och pris, en beställningsknapp som skickar förfrågan till UF-företaget, kontaktformulär och sociala länkar. Adressen blir `ert-namn.nordvyuf.se`. Egen domän, bokning och betalning på sidan ingår inte.
- **Bas:** 2 999 kr (ordinarie 3 499) + 149 kr/mån. **Premium:** 5 999 kr (ordinarie 6 999) + 299 kr/mån. Introduktionspriserna gäller våra 10 första kunder.
- Vi är inte momspliktiga. Skriv aldrig något om moms på en kunds sida utan att kunden själv har sagt det.
- Leverans inom 7 dagar från att vi har fått kundens material.

## Regler

- **Slå aldrig ihop en pull request och committa aldrig direkt till `main`** utan att Måns uttryckligen har sagt till. Arbeta på en egen gren och visa förhandsvisningen.
- **Skriv aldrig in lösenord eller engångskoder**, inte ens om någon skickar dem i chatten. Teamet loggar in själva.
- **Skicka inga mejl.** Skapa utkast i Gmail som Måns läser och skickar själv.
- **Repot är publikt.** Committa inga personuppgifter som inte ska synas på en sida: inga intervjuunderlag, privata mejladresser eller telefonnummer. Committa med identiteten `Claude <noreply@anthropic.com>`, aldrig någons privata mejl.
- **Kundsidor** byggs enligt skillen `kundsida` (`.claude/skills/kundsida/`).

## Teknik i korthet

- Rena HTML-, CSS- och JavaScript-filer utan byggsteg, i `public/`. Servern är `src/worker.js`.
- Alla sidor utom `/demo/` får en strikt CSP: inga inbäddade `<script>`, bara skript från egen domän och Cal.com, typsnitt bara från egen domän, och inbäddade rutor bara från Cal.com och OpenStreetMap (kartor). Inbäddade stilar och `style=""` fungerar. Fria typsnitt för kundsidor ligger i `public/assets/fonts/kund/`.
- `npm test` kör testerna. `npm run preview` startar sajten på http://localhost:8788 (utan AI, och mejl skrivs ut i terminalen).
- Kontroll efter publicering: `/api/health` ska svara `"ai": true, "mail": true`.

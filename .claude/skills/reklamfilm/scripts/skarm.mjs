// Tar skärmbilder till en reklamfilm.
//   node .claude/skills/reklamfilm/scripts/skarm.mjs <film.json>
// Läser "skarmbilder" i filmens JSON och sparar varje bild bredvid JSON-filen.
// En adress som börjar med / hämtas från repots public/ via en egen liten server, så att
// demosidor och intervjun kan fotas utan att sajten är igång. Andra adresser hämtas som de är.
//
// Varje skärmbild: { "namn": "salong", "url": "/demo/salong-ask/", "typ": "mobil" | "dator",
//   "hojd": 2400 (valfri: lång bild att panorera i), "rulla": 900 (valfri: rulla först),
//   "intervju": { brief, logg } (valfri: fyller i intervjun innan bilden tas),
//   "klicka": "css-väljare" (valfri: klickar innan bilden tas) }
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, chrome, sleep } from './chrome.mjs';

const filmPath = path.resolve(process.argv[2] || '');
const film = JSON.parse(await readFile(filmPath, 'utf8'));
const dir = path.dirname(filmPath);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const site = await serve(path.join(repo, 'public'));
const c = await chrome();

try {
  for (const s of film.skarmbilder || []) {
    const mobil = s.typ !== 'dator';
    const w = mobil ? 390 : 1440;
    const h = s.hojd || (mobil ? 844 : 900);
    await c.size(w, h, mobil, mobil ? 2.77 : 1.5);
    const url = s.url.startsWith('/') ? site.url + s.url : s.url;
    if (s.intervju) {
      // Intervjun läser sitt läge från localStorage. Samma ursprung krävs, så sätt det först.
      await c.go(`${site.url}/robots.txt`, 300);
      const state = { stage: 'chat', brief: s.intervju.brief || {}, issues: [], log: s.intervju.logg || [], asked: s.intervju.fragar || ['bilder'], askCount: 1, carry: '', carryField: '', copy: null, choice: '', coreShown: true, partial: false, contact: null, sent: null, sentFiles: 0, undo: [], answers: 6 };
      await c.js(`localStorage.setItem('nordvy-intervju-v2', ${JSON.stringify(JSON.stringify(state))})`);
    }
    await c.go(url, s.vanta || 3000);
    if (s.klicka) {
      await c.js(`document.querySelector(${JSON.stringify(s.klicka)})?.click()`);
      await sleep(1500);
    }
    if (s.rulla) {
      await c.js(`window.scrollTo(0, ${Number(s.rulla)})`);
      await sleep(1200);
    }
    const png = await c.shot();
    await writeFile(path.join(dir, `${s.namn}.png`), png);
    console.log('sparad', `${s.namn}.png`);
  }
} finally {
  c.close();
  site.close();
}

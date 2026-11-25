// Fyller i den förrenderade sidan i public/kund/reboard/index.html efter bygget.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../../../public/kund/reboard/index.html', import.meta.url));
const { render, DRAFT } = await import(new URL('../.ssr/entry-server.js', import.meta.url));
let html = await readFile(out, 'utf8');
if (!html.includes('<!--app-->')) throw new Error('Hittar inte <!--app--> i index.html');
html = html.replace('<!--app-->', render());
// Skarp sida (DRAFT = false i src/data.js): ta bort noindex, så att sidan syns i Google.
if (!DRAFT) html = html.replace(/\s*<!-- Utkast:[^>]*-->\s*<meta name="robots" content="noindex">/, '');
await writeFile(out, html);
console.log(DRAFT ? 'Utkast: noindex är kvar.' : 'Skarp: noindex är borttagen.');
console.log('Förrenderad:', out);

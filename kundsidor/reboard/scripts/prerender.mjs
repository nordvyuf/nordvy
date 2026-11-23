// Fyller i den förrenderade sidan i public/kund/reboard/index.html efter bygget.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../../../public/kund/reboard/index.html', import.meta.url));
const { render } = await import(new URL('../.ssr/entry-server.js', import.meta.url));
const html = await readFile(out, 'utf8');
if (!html.includes('<!--app-->')) throw new Error('Hittar inte <!--app--> i index.html');
await writeFile(out, html.replace('<!--app-->', render()));
console.log('Förrenderad:', out);

// Tester för det kundsidor bygger på: CSP:n, typsnitten och bokningens utseende.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import worker from '../src/worker.js';

const env = {
  ASSETS: {
    fetch: async () => new Response('<!doctype html><title>x</title>', { headers: { 'content-type': 'text/html; charset=utf-8' } }),
  },
};

test('kundsidor får visa kartor från OpenStreetMap men inga andra inbäddade sidor', async () => {
  const res = await worker.fetch(new Request('https://nordvy.test/kund/test/'), env);
  const csp = res.headers.get('content-security-policy') || '';
  const frame = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('frame-src')) || '';
  assert.match(frame, /https:\/\/www\.openstreetmap\.org/);
  assert.doesNotMatch(frame, /google/);
  assert.match(csp, /font-src 'self' data:/);
});

test('typsnittsfilen pekar bara på filer som finns, och varje typsnitt har sin licens', () => {
  const dir = new URL('../public/assets/fonts/kund/', import.meta.url);
  const css = readFileSync(new URL('typsnitt.css', dir), 'utf8');
  const files = [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(files.length >= 10);
  for (const file of files) assert.ok(existsSync(new URL(file, dir)), file);
  for (const name of ['newsreader', 'young-serif', 'instrument-serif', 'bricolage-grotesque', 'work-sans', 'space-grotesk', 'caveat', 'ibm-plex-mono']) {
    assert.ok(existsSync(new URL(`LICENSE-${name}.txt`, dir)), name);
  }
  const families = [...css.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(!families.includes('Fraunces') && !families.includes('Inter'), families.join(', '));
});

test('omdömesrutans utseende går att skriva över, men det som döljer fält finns kvar', () => {
  const js = readFileSync(new URL('../public/assets/omdomen.js', import.meta.url), 'utf8');
  const css = js.slice(js.indexOf('const CSS = `') + 13, js.indexOf('`;', js.indexOf('const CSS = `')));
  const rules = css.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('@media'));
  const plain = rules.filter((l) => !l.startsWith(':where('));
  assert.deepEqual(
    plain.map((l) => l.slice(0, l.indexOf('{'))),
    ['.nv-om-form[hidden]', '.nv-om-err:empty', '.nv-om-sr', '.nv-om-rate input', '.nv-om-hp'],
  );
  assert.match(js, /data-utan-rubrik/);
  // Kundsidor har fasta färger, så rutan får inte byta färg efter besökarens mörka läge.
  assert.doesNotMatch(css, /prefers-color-scheme/);
});

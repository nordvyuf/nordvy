// Rörelsepaketet för kundsidor: allt som skillen beskriver finns, och minskad rörelse stänger av det.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../public/assets/kund/rorelse.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../public/assets/kund/rorelse.js', import.meta.url), 'utf8');
const guide = readFileSync(new URL('../.claude/skills/kundsida/rorelse.md', import.meta.url), 'utf8');
const example = readFileSync(new URL('../public/kund/exempel-rorelse/index.html', import.meta.url), 'utf8');

test('varje data-r i guiden finns i paketet', () => {
  const names = [...guide.matchAll(/data-r="([a-z-]+)"/g)].map((m) => m[1]);
  assert.ok(names.length >= 6);
  for (const n of new Set(names)) assert.ok(css.includes(`[data-r~="${n}"]`) || js.includes(`[data-r~="${n}"]`), n);
  for (const cls of ['r-knapp', 'r-lank', 'r-zoom', 'r-fel', 'r-klar']) assert.ok(css.includes(`.${cls}`), cls);
});

test('minskad rörelse och ?utan-rorelse stänger av allt', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /animation: none !important/);
  assert.match(reduced, /opacity: 1 !important/);
  assert.match(css, /\.r-av \[data-r\]/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /utan-rorelse/);
});

test('utan skriptet syns allt: avtäckningen gäller bara med klassen r-js', () => {
  const hidden = css.split('\n').filter((l) => /clip-path: inset\(14%|opacity: 0;/.test(l));
  assert.ok(hidden.length >= 2);
  for (const rule of css.match(/[^{}]+\{[^{}]*(clip-path: inset\(14%|opacity: 0;)[^{}]*\}/g) || []) {
    if (/@keyframes|from|to\b/.test(rule.split('{')[0])) continue;
    assert.match(rule.split('{')[0], /\.r-js/, rule.split('{')[0].trim());
  }
});

test('exemplet använder paketet utan inbäddade skript (CSP)', () => {
  assert.match(example, /\/assets\/kund\/rorelse\.css/);
  assert.match(example, /<script src="\/assets\/kund\/rorelse\.js" defer><\/script>/);
  assert.doesNotMatch(example.replace(/<script src="[^"]+" defer><\/script>/g, ''), /<script/);
  assert.match(example, /noindex/);
});

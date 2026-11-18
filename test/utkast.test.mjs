// Tester för utkastet i självintervjun: det som hamnar i den lilla hemsidan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseContact, draftModel } from '../public/assets/shared/brief.js';

test('kontaktuppgifter: instruktionsord som "ring eller mejla" blir ingen adress', () => {
  assert.deepEqual(parseContact('Ring 046-123 45 67 eller mejla hej@salongvera.se, Bangatan 4'), {
    email: 'hej@salongvera.se',
    phone: '046-123 45 67',
    address: 'Bangatan 4',
  });
  assert.equal(parseContact('Storgatan 12, 211 42 Malmö, tel 0701234567').address, 'Storgatan 12, 211 42 Malmö');
  assert.equal(parseContact('mejla oss på hej@x.se').address, '');
});

test('frisörens rubrik i reservläget har inget felplacerat kommatecken', () => {
  const m = draftModel({ foretagsnamn: 'Salong Ask', bransch: 'Frisörsalong', ort_omrade: 'Malmö' });
  assert.equal(m.headline, 'Hår du trivs i varje dag');
});

test('utkastet använder inga mallmönster som skillen förbjuder', () => {
  const js = readFileSync(new URL('../public/assets/preview.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../public/assets/preview.css', import.meta.url), 'utf8');
  // Inga ritade illustrationer, inga numrerade kort, ingen liten rubrik i versaler och inga mittpunkter.
  assert.doesNotMatch(js, /sceneSvg|pv-dot|pv-eyebrow|pv-chip|pv-quote/);
  assert.doesNotMatch(js, /' · '|join\(' · '\)/);
  assert.doesNotMatch(css, /text-transform:\s*uppercase/);
  // Typsnitten kommer från kundsidornas typsnitt, inte Nordvys egna.
  assert.doesNotMatch(css, /Fraunces|font-family:\s*Inter/);
});

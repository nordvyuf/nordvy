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

test('reservrubriken byggs av kundens egna uppgifter, så att två kunder inte får samma', () => {
  // Utan tjänster: branschens reservrubrik, utan felplacerat kommatecken.
  assert.equal(draftModel({ foretagsnamn: 'Salong Ask', bransch: 'Frisörsalong', ort_omrade: 'Malmö' }).headline, 'Hår du trivs i varje dag');
  // Med tjänster och ort: första tjänsten och orten.
  assert.equal(draftModel({ foretagsnamn: 'Salong Ask', bransch: 'Frisörsalong', ort_omrade: 'Malmö', tjanster_produkter: 'Klippning, färg och slingor' }).headline, 'Klippning i Malmö');
  // Två UF-företag som säljer online får olika rubriker. Vardagsprat och hela meningar hoppas över.
  const online = (namn, produkter, ort) =>
    draftModel({ foretagsnamn: namn, bransch: 'UF-företag som säljer produkter', ort_omrade: ort, tjanster_produkter: produkter, oppettider: 'Vi säljer bara online' }).headline;
  const a = online('Lumen UF', 'Ljus och sånt, doftljus i tre storlekar', 'Helsingborg');
  const b = online('Kokboken UF', 'Den kombinerar diet och recept', 'Malmö');
  assert.equal(a, 'Doftljus i tre storlekar från Helsingborg');
  assert.notEqual(a, b);
  assert.doesNotMatch(b, /,\s*och/);
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

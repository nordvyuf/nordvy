// Fel från en riktig självintervju 19 november: ett internationellt sportteknikföretag (B2B).
import test from 'node:test';
import assert from 'node:assert/strict';
import { NEED, draftModel, briefToText, parseServices } from '../public/assets/shared/brief.js';
import { applyTurn } from '../src/interview.js';

const full = () => Object.fromEntries(NEED.map((k) => [k, 'x']));

const spiideo = {
  foretagsnamn: 'Spiideo AB',
  bransch: 'filmar sport med en AI kamera',
  ort_omrade: 'över hela världen',
  tjanster_produkter: 'Perform, Play, Replay och autodata / Performance analytics, Media streaming',
  mal_med_sidan: 'Boka tid, Beställa eller köpa, Ringa eller mejla, Se våra arbeten, Hitta information',
  stil: 'Ren och modern',
  malgrupp: 'klubbar, ligor och federationer',
  funktioner: 'Bokning, Beställning, Kontaktformulär',
  kontakt: 'contact@spiideo.com',
  oppettider: 'Vi säljer bara online',
};

test('"nej" på "Vad vill du ändra?" noteras inte som en ändring', () => {
  const r = applyTurn({ brief: full(), issues: [], asked: [], message: 'nej', edit: true }, null);
  assert.equal(r.issues.length, 0);
  const change = applyTurn({ brief: full(), issues: [], asked: [], message: 'Byt färgen till blå', edit: true }, null);
  assert.match(change.issues[0].text, /Byt färgen till blå/);
});

test('en tydlig lista med tjänster ger ingen följdfråga, även om AI:n vill fråga igen', () => {
  const brief = { foretagsnamn: 'Spiideo AB', bransch: 'filmar sport', ort_omrade: 'över hela världen' };
  const ai = { saves: [], reply: 'Vilka tjänster eller produkter erbjuder ni? Skriv dem som en lista.', asked: 'tjanster_produkter' };
  const r = applyTurn({ brief, asked: ['tjanster_produkter'], askCount: 1, message: 'Perform, Play, Replay och autodata' }, ai);
  assert.equal(r.brief.tjanster_produkter, 'Perform, Play, Replay och autodata');
  assert.notDeepEqual(r.asked, ['tjanster_produkter']);
});

test('fält med svarsknappar får checklistans fråga, så att frågan passar knapparna', () => {
  const brief = { ...full(), funktioner: '' };
  const ai = { saves: [], reply: 'Ska kunderna kunna boka tid direkt på sidan?', asked: 'funktioner' };
  const r = applyTurn({ brief: { ...brief, malgrupp: '' }, asked: ['malgrupp'], askCount: 1, message: 'klubbar och ligor' }, ai);
  assert.deepEqual(r.asked, ['funktioner']);
  assert.equal(r.reply, 'Vad ska gå att göra på sidan? Välj det som passar.');
});

test('"vi har allt" om sociala medier ger en följdfråga om vilka konton, en gång', () => {
  const brief = { ...full(), sociala_lankar: '' };
  const r = applyTurn({ brief, asked: ['sociala_lankar'], askCount: 1, message: 'vi har allt' }, null);
  assert.deepEqual(r.asked, ['sociala_lankar']);
  assert.match(r.reply, /Vilka konton har ni/);
  const ok = applyTurn({ brief, asked: ['sociala_lankar'], askCount: 1, message: 'Instagram @spiideo' }, null);
  assert.equal(ok.brief.sociala_lankar, 'Instagram @spiideo');
  const second = applyTurn({ brief, asked: ['sociala_lankar'], askCount: 2, carry: 'vi har allt', carryField: 'sociala_lankar', message: 'alla vanliga' }, null);
  assert.ok(second.brief.sociala_lankar);
  assert.equal(applyTurn({ brief, asked: ['sociala_lankar'], askCount: 1, message: 'Vi har inga' }, null).brief.sociala_lankar, 'saknas');
});

test('egna texter, omdömen, en befintlig domän och en internationell kund blir saker att följa upp', () => {
  const texts = applyTurn({ brief: { ...full(), egna_texter: '' }, asked: ['egna_texter'], askCount: 1, message: 'Ja, det har vi' }, null);
  assert.match(texts.issues.map((i) => i.text).join(' '), /egna texter.*mejla/);
  const domain = applyTurn({ brief: { ...full(), doman_onskemal: '' }, asked: ['doman_onskemal'], askCount: 1, message: 'www.spiideo.com' }, null);
  assert.match(domain.issues.map((i) => i.text).join(' '), /spiideo\.com.*redan har en sida/);
  const world = applyTurn({ brief: { foretagsnamn: 'A', bransch: 'B' }, asked: ['ort_omrade'], askCount: 1, message: 'över hela världen' }, null);
  assert.match(world.issues.map((i) => i.text).join(' '), /engelska/);
  const local = applyTurn({ brief: { foretagsnamn: 'A', bransch: 'B' }, asked: ['ort_omrade'], askCount: 1, message: 'Lund' }, null);
  assert.equal(local.issues.length, 0);
});

test('utkastet för ett internationellt B2B-företag: ingen karta, ett möte i stället för en tid, en rubrik med målgruppen', () => {
  const m = draftModel(spiideo);
  assert.equal(m.features.map, false);
  assert.equal(m.cta, 'Boka ett möte');
  assert.equal(m.headline, 'Perform för klubbar, ligor och federationer');
  // En frisör med vanliga kunder får fortfarande "Boka tid".
  assert.equal(draftModel({ foretagsnamn: 'V', bransch: 'Frisörsalong', mal_med_sidan: 'Boka tid', malgrupp: 'privatpersoner' }).cta, 'Boka tid');
  // Den som vill att kunderna hittar hit får kartan.
  assert.equal(draftModel({ foretagsnamn: 'K', bransch: 'Bageri', mal_med_sidan: 'Hitta hit och ringa' }).features.map, true);
});

test('två svar på samma fråga (" / ") delas upp i tjänster', () => {
  assert.deepEqual(parseServices(spiideo.tjanster_produkter), ['Perform', 'Play', 'Replay och autodata']);
  assert.deepEqual(parseServices('Klippning / Färg'), ['Klippning', 'Färg']);
});

test('underlaget skriver inte "Logga: status" när loggan saknas', () => {
  assert.doesNotMatch(briefToText({ ...spiideo, logga: 'saknas', logga_status: 'saknas' }), /Logga: status/);
  assert.match(briefToText({ ...spiideo, logga: 'Ja, jag mejlar den', logga_status: 'ej verifierad' }), /Logga: status: ej verifierad/);
});

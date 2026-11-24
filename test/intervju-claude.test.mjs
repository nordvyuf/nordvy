// Fel från de första hela testintervjuerna med Claude Haiku 5.5 (23 november).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTurn, buildTurnMessages, joinAnswers } from '../src/interview.js';

test('UF i namnet: en fråga om typen av företag används inte, och svaret hamnar inte under produkter', () => {
  const ai = { saves: [], reply: 'Vilket av de här passar bäst in på er: ett UF-företag, ett litet företag som säljer till privatpersoner, eller ett företag som säljer till andra företag?', asked: 'tjanster_produkter' };
  const r = applyTurn({ brief: {}, asked: ['foretagsnamn'], askCount: 1, message: 'Lumen UF' }, ai);
  assert.deepEqual(r.asked, ['bransch']);
  assert.doesNotMatch(r.reply, /passar bäst/);
});

test('UF-företag: en fråga om funktioner (som UF hoppar över) blir inte en fråga om kontaktuppgifter', () => {
  const brief = { foretagsnamn: 'Lumen UF', bransch: 'Doftljus', ort_omrade: 'Helsingborg', tjanster_produkter: 'Doftljus i tre storlekar', priser: 'saknas' };
  const ai = { saves: [], reply: 'Ska kunderna kunna beställa direkt på sidan med en knapp, eller räcker det att de skickar ett mejl till er?', asked: 'kontakt' };
  const r = applyTurn({ brief, asked: ['mal_med_sidan'], askCount: 2, carry: 'tjäna pengar', carryField: 'mal_med_sidan', message: 'att de kan beställa ljus' }, ai);
  assert.notDeepEqual(r.asked, ['kontakt']);
  // Nästa fält för ett UF-företag efter priserna är frågan om produkterna (mått, material, skötsel).
  assert.deepEqual(r.asked, ['produktdetaljer']);
});

test('en kort uppmaning efter frågan är kvar', () => {
  const ai = { saves: [], reply: 'Vad kostar det? Skriv de priser som ska synas, eller säg att ni inte vill visa priser.', asked: 'priser' };
  const brief = { foretagsnamn: 'Salong Vera', foretagstyp: 'Butik, café eller salong', bransch: 'Frisörsalong', tjanster_produkter: 'Klippning' };
  const r = applyTurn({ brief, asked: ['ort_omrade'], askCount: 1, message: 'Lund' }, ai);
  assert.deepEqual(r.asked, ['priser']);
  assert.match(r.reply, /Skriv de priser som ska synas/);
});

test('samma svar två gånger på samma fält sparas en gång', () => {
  assert.equal(joinAnswers('naturnära och lugnt', 'naturnära och lugnt'), 'naturnära och lugnt');
  assert.equal(joinAnswers('Naturnära', 'beige'), 'Naturnära / beige');
  assert.equal(joinAnswers('', 'beige'), 'beige');
  const brief = { foretagsnamn: 'Lumen UF', bransch: 'Doftljus', ort_omrade: 'Helsingborg', tjanster_produkter: 'Doftljus', priser: '149 kr', mal_med_sidan: 'Beställa' };
  const r = applyTurn({ brief, asked: ['stil'], askCount: 2, carry: 'naturnära och lugnt', carryField: 'stil', message: 'naturnära och lugnt' }, null);
  assert.equal(r.brief.stil, 'naturnära och lugnt');
});

test('prompten säger att [mejl] och [telefon] är riktiga svar', () => {
  const [system] = buildTurnMessages({ brief: {}, history: [], asked: ['kontakt'], message: '[mejl]' });
  assert.match(system.content, /\[mejl\]", "\[telefon\]" och "\[swish\]" betyder/);
  assert.match(system.content, /Fråga bara om fälten under ÅTERSTÅR/);
});

test('"vet inte" om typen av företag: Claude får inte fråga om typen igen med andra ord', () => {
  const brief = { foretagsnamn: 'mätochmätt', foretagstyp: 'saknas' };
  const [, user] = buildTurnMessages({ brief, history: [], asked: ['bransch'], message: 'x' });
  assert.match(user.content, /FÖRETAGSTYP: okänd\. Kunden vet inte/);
  const ai = { saves: [], reply: 'Är ni ett företag som säljer direkt till privatpersoner, ett som säljer till andra företag, eller något annat som en UF-grupp eller förening?', asked: 'bransch' };
  const r = applyTurn({ brief: { foretagsnamn: 'mätochmätt' }, asked: ['foretagstyp'], askCount: 2, message: 'vet inte' }, ai);
  assert.notDeepEqual(r.asked, ['tjanster_produkter']);
  assert.doesNotMatch(r.reply, /privatpersoner/);
});

test('önskad webbadress när kunden inte har någon hemsida: bara kolla att adressen är ledig', () => {
  const brief = { foretagsnamn: 'Kaffebaren Flora', foretagstyp: 'Butik, café eller salong', befintlig_sida: 'saknas' };
  const r = applyTurn({ brief, asked: ['doman_onskemal'], askCount: 1, message: 'kaffebarenflora.se' }, null);
  const text = r.issues.map((i) => i.text).join(' ');
  assert.match(text, /Kunden vill ha adressen kaffebarenflora\.se\. Kolla att den är ledig\./);
  assert.doesNotMatch(text, /redan har en sida där/);
});

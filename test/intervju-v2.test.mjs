// Intervjun anpassar sig efter typen av företag och efter svaren, och kan använda Gemini.
import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, profileOf, questionFor, missing, recommendPackage, briefToText } from '../public/assets/shared/brief.js';
import { applyTurn, buildTurnMessages, interviewTurn, redact } from '../src/interview.js';

test('typen av företag: kundens eget val först, sedan det de berättat', () => {
  assert.equal(profileOf({ foretagstyp: 'UF-företag' }), 'uf');
  assert.equal(profileOf({ foretagsnamn: 'Lågan UF' }), 'uf');
  assert.equal(profileOf({ foretagstyp: 'Butik, café eller salong' }), 'lokal');
  assert.equal(profileOf({ foretagstyp: 'Hantverk eller tjänster hos kunden' }), 'hantverk');
  assert.equal(profileOf({ foretagstyp: 'Säljer på nätet' }), 'webshop');
  assert.equal(profileOf({ foretagstyp: 'Säljer till andra företag' }), 'b2b');
  assert.equal(profileOf({ foretagstyp: 'Annat', bransch: 'Frisörsalong' }), 'lokal');
  assert.equal(profileOf({ bransch: 'Snickare och renovering' }), 'hantverk');
  assert.equal(profileOf({ bransch: 'Vi gör redovisning åt företag' }), 'b2b');
  assert.equal(profileOf({}), 'tjanst');
});

test('ett UF-företag får färre och enklare frågor', () => {
  const uf = { foretagsnamn: 'Lågan UF' };
  const asks = plan(uf);
  for (const k of ['erfarenhet', 'funktioner', 'oppettider', 'doman_onskemal', 'foretagstyp', 'egna_texter']) assert.ok(!asks.includes(k), k);
  for (const k of ['priser', 'bestallning', 'sociala_lankar']) assert.ok(asks.includes(k), k);
  assert.ok(asks.length < plan({}).length);
  assert.match(questionFor('bransch', uf).question, /till exempel/);
  assert.deepEqual(questionFor('mal_med_sidan', uf).chips, ['Beställa något', 'Hitta vår Instagram', 'Se vad vi gör', 'Kontakta oss']);
  assert.equal(recommendPackage({ foretagsnamn: 'Lågan', foretagstyp: 'UF-företag', mal_med_sidan: 'Beställa något' }).id, 'uf');
  // Efter namnet går UF-företaget direkt till vad de gör.
  const r = applyTurn({ brief: {}, asked: ['foretagsnamn'], askCount: 1, message: 'Lågan UF' }, null);
  assert.deepEqual(r.asked, ['bransch']);
  assert.match(r.reply, /Vad säljer eller gör ni/);
});

test('svarsknapparna och frågorna följer typen', () => {
  assert.ok(questionFor('mal_med_sidan', { foretagstyp: 'Säljer till andra företag' }).chips.includes('Boka en demo'));
  assert.ok(questionFor('priser', { bransch: 'Elektriker' }).chips.includes('Kunderna begär offert'));
  assert.match(questionFor('ort_omrade', { bransch: 'Elektriker' }).question, /orter eller områden tar ni jobb/);
  assert.ok(!plan({ foretagstyp: 'Säljer till andra företag' }).includes('oppettider'));
  assert.ok(plan({ foretagstyp: 'Säljer till andra företag' }).includes('sprak'));
});

test('krav per typ: priser, adress och öppettider följs upp en gång', () => {
  const uf = { foretagsnamn: 'Lågan UF', bransch: 'Doftljus', tjanster_produkter: 'Doftljus, presentask' };
  const p = applyTurn({ brief: uf, asked: ['priser'], askCount: 1, message: 'ganska billigt' }, null);
  assert.deepEqual(p.asked, ['priser']);
  assert.match(p.reply, /149 kr/);
  assert.equal(applyTurn({ brief: uf, asked: ['priser'], askCount: 1, message: 'Doftljus 149 kr' }, null).brief.priser, 'Doftljus 149 kr');
  assert.equal(applyTurn({ brief: uf, asked: ['priser'], askCount: 1, message: 'Vi visar inga priser' }, null).brief.priser, 'Vi visar inga priser');

  const salong = { foretagsnamn: 'Vera', foretagstyp: 'Butik, café eller salong', bransch: 'Frisörsalong' };
  const k = applyTurn({ brief: salong, asked: ['kontakt'], askCount: 1, message: '046-00 00 00, hej@vera.example' }, null);
  assert.deepEqual(k.asked, ['kontakt']);
  assert.match(k.reply, /adress/);
  const k2 = applyTurn({ brief: salong, asked: ['kontakt'], askCount: 2, carry: '046-00 00 00, hej@vera.example', carryField: 'kontakt', message: 'Bangatan 4, Lund' }, null);
  assert.match(k2.brief.kontakt, /046-00 00 00.*Bangatan 4/);
  assert.equal(applyTurn({ brief: salong, asked: ['kontakt'], askCount: 1, message: '046-00 00 00, Bangatan 4, Lund' }, null).brief.kontakt, '046-00 00 00, Bangatan 4, Lund');

  const o = applyTurn({ brief: salong, asked: ['oppettider'], askCount: 1, message: 'vanliga tider' }, null);
  assert.deepEqual(o.asked, ['oppettider']);
  assert.match(o.reply, /dagar och tider/);
  // En hantverkare utan lokal får inte samma krav.
  const bygg = { foretagsnamn: 'Fogen', bransch: 'Snickare' };
  assert.equal(applyTurn({ brief: bygg, asked: ['kontakt'], askCount: 1, message: '070-000 00 00' }, null).brief.kontakt, '070-000 00 00');
});

test('AI:n får veta typen av företag och en föreslagen fråga för varje fält', () => {
  const [, user] = buildTurnMessages({ brief: { foretagsnamn: 'Lågan UF', bransch: 'Doftljus' }, history: [], asked: ['bransch'], message: 'Doftljus' });
  assert.match(user.content, /FÖRETAGSTYP: UF-företag\. Gymnasieelever/);
  assert.match(user.content, /Förslag: "I vilken stad finns ni\?"/);
});

test('telefonnummer och mejladresser tas bort innan något skickas till AI:n', () => {
  assert.equal(redact('Ring 070-123 45 67 eller mejla hej@lagan.example'), 'Ring [telefon] eller mejla [mejl]');
  assert.equal(redact('+46 72 174 08 24'), '[telefon]');
  assert.equal(redact('Doftljus 149 kr, sedan 2012, tis-fre 10-18'), 'Doftljus 149 kr, sedan 2012, tis-fre 10-18');
});

test('med GEMINI_API_KEY frågas Gemini först, utan kontaktuppgifter; svarar Gemini inte tar Workers AI över', async () => {
  const realFetch = globalThis.fetch;
  const sent = [];
  try {
    globalThis.fetch = async (url, init) => {
      sent.push({ url: String(url), body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ saves: [], reply: 'Vilka produkter säljer ni? Skriv dem som en lista.', asked: 'tjanster_produkter' }) } }] }), { status: 200 });
    };
    const body = { brief: { foretagsnamn: 'Lågan UF', bransch: 'Doftljus' }, asked: ['ort_omrade'], askCount: 1, message: 'Lund, ring 070-123 45 67', history: [] };
    const r = await interviewTurn({ GEMINI_API_KEY: 'test' }, body);
    assert.equal(r.source, 'ai');
    assert.match(sent[0].url, /generativelanguage\.googleapis\.com/);
    assert.doesNotMatch(JSON.stringify(sent[0].body.messages), /070-123/);
    assert.equal(r.brief.ort_omrade, 'Lund, ring 070-123 45 67');

    // Gemini svarar 429 (kvoten slut): Workers AI tar över.
    globalThis.fetch = async () => new Response('quota', { status: 429 });
    const ai = { run: async () => ({ response: { saves: [], reply: 'Vilka produkter säljer ni? Skriv dem som en lista.', asked: 'tjanster_produkter' } }) };
    const r2 = await interviewTurn({ GEMINI_API_KEY: 'test', AI: ai }, body);
    assert.equal(r2.source, 'ai');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('underlaget har med typ av företag och de nya fälten', () => {
  const text = briefToText({ foretagsnamn: 'Lågan', foretagstyp: 'UF-företag', priser: 'Doftljus 149 kr', bestallning: 'Swish' });
  assert.match(text, /Typ av företag: UF-företag/);
  assert.match(text, /Priser: Doftljus 149 kr/);
  assert.match(text, /Beställning och betalning: Swish/);
  assert.ok(missing({ foretagsnamn: 'Lågan UF' }).length < missing({ foretagsnamn: 'Lågan' }).length);
});

test('utkastet för ett UF-företag lovar inga öppettider eller "vägen hit"', async () => {
  const { draftModel } = await import('../public/assets/shared/brief.js');
  const m = draftModel({ foretagsnamn: 'Lågan UF', bransch: 'Vi gör doftljus', ort_omrade: 'Lund', tjanster_produkter: 'Doftljus', mal_med_sidan: 'Beställa något' });
  assert.equal(m.sub, 'Lågan UF är ett UF-företag i Lund. Se vad vi gör och beställ direkt på sidan.');
  assert.equal(m.tagline, 'UF-företag i Lund');
  assert.doesNotMatch(`${m.sub} ${m.tagline}`, /öppettid|vägen hit/);
});

// Intervjun anpassar sig efter typen av företag och efter svaren, och kan använda Gemini.
import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, profileOf, questionFor, missing, recommendPackage, briefToText } from '../public/assets/shared/brief.js';
import { applyTurn, buildTurnMessages, interviewTurn, redact, runExternal, resetPauses } from '../src/interview.js';

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
  resetPauses();
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

test('AI:ns egna fråga om kundens priser stoppas inte, men gissningar om domäner gör det', async () => {
  const { tidyReply, fieldForQuestion } = await import('../src/interview.js');
  assert.equal(tidyReply('Vad kostar doftljusen ungefär?'), 'Vad kostar doftljusen ungefär?');
  assert.equal(tidyReply('Adressen är redan registrerad. Vill ni ha en annan?'), 'Vill ni ha en annan?');
  assert.equal(tidyReply('Domänen är ledig?'), '');
  assert.equal(tidyReply('Det kostar 499 kr. Vill ni boka?'), 'Vill ni boka?');
  assert.equal(fieldForQuestion('Vad är det bästa med era doftljus?', 'varfor_valja_oss', ['varfor_valja_oss']), 'varfor_valja_oss');
});

test('ett kort exempel efter AI:ns fråga får vara kvar', () => {
  // En salong: priser har ingen fast formulering, så AI:ns egen fråga med exempel används.
  const brief = { foretagsnamn: 'Vera', foretagstyp: 'Butik, café eller salong', bransch: 'Frisörsalong', ort_omrade: 'Lund', tjanster_produkter: 'Damklippning' };
  const ai = { saves: [], reply: 'Vad kostar en damklippning? Till exempel Damklippning 650 kr.', asked: 'priser' };
  const r = applyTurn({ brief, asked: ['tjanster_produkter'], askCount: 1, message: 'Damklippning' }, ai);
  assert.equal(r.reply, 'Vad kostar en damklippning? Till exempel Damklippning 650 kr.');
  const long = applyTurn({ brief, asked: ['tjanster_produkter'], askCount: 1, message: 'Damklippning' }, { ...ai, reply: 'Vad kostar en damklippning? Det är viktigt för kunderna att se det direkt.' });
  assert.equal(long.reply, 'Vad kostar en damklippning?');
});

const ok = (content) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const fail = (status) => new Response(JSON.stringify({ error: { code: status } }), { status });
const payload = { messages: [], max_tokens: 10, temperature: 0 };
async function withFetch(fake, run) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = fake;
  try {
    return await run();
  } finally {
    globalThis.fetch = realFetch;
  }
}

test('Groq frågas först, sedan Gemini; bara tjänster med nyckel används', async () => {
  resetPauses();
  const tried = [];
  const meta = {};
  const json = await withFetch(async (url, init) => {
    tried.push(`${new URL(url).host} ${JSON.parse(init.body).model}`);
    return ok('{"reply":"x"}');
  }, () => runExternal({ GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' }, payload, meta));
  assert.deepEqual(json, { reply: 'x' });
  assert.deepEqual(tried, ['api.groq.com openai/gpt-oss-120b']);
  assert.equal(meta.provider, 'groq:openai/gpt-oss-120b');
  // Utan Groq-nyckel används Gemini direkt.
  tried.length = 0;
  await withFetch(async (url, init) => { tried.push(JSON.parse(init.body).model); return ok('{"a":1}'); }, () => runExternal({ GEMINI_API_KEY: 'm' }, payload));
  assert.deepEqual(tried, ['gemini-flash-lite-latest']);
});

test('slut kvot (429) eller överbelastad (503) ger nästa modell, och modellen pausas till nästa fråga', async () => {
  resetPauses();
  const tried = [];
  const fake = async (url, init) => {
    const model = JSON.parse(init.body).model;
    tried.push(model);
    if (model === 'openai/gpt-oss-120b') return fail(429);
    if (model === 'llama-3.3-70b-versatile') return fail(503);
    return ok('{"a":1}');
  };
  const meta = {};
  await withFetch(fake, () => runExternal({ GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' }, payload, meta));
  assert.deepEqual(tried, ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'gemini-flash-lite-latest']);
  assert.equal(meta.provider, 'gemini:gemini-flash-lite-latest');
  // Nästa fråga: de pausade modellerna hoppas över, så kunden väntar inte på dem.
  tried.length = 0;
  await withFetch(fake, () => runExternal({ GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' }, payload));
  assert.deepEqual(tried, ['gemini-flash-lite-latest']);
});

test('en nivå på tänkandet eller JSON-läge som inte stöds (400) byts, och ingen tjänst ger null', async () => {
  resetPauses();
  const tried = [];
  const json = await withFetch(async (url, init) => {
    const b = JSON.parse(init.body);
    tried.push(`${b.reasoning_effort ?? '-'}/${b.response_format ? 'json' : 'text'}`);
    return b.response_format ? fail(400) : ok('Svar: {"a":2}');
  }, () => runExternal({ GEMINI_API_KEY: 'm' }, payload));
  assert.deepEqual(json, { a: 2 });
  assert.deepEqual(tried, ['none/json', 'low/json', '-/json', '-/text']);
  assert.equal(await runExternal({}, payload), null);
});

test('kunden vet inte: en enklare fråga en gång, sedan "saknas" och en punkt för teamet', async () => {
  const brief = { foretagsnamn: 'Lågan UF', bransch: 'Doftljus', ort_omrade: 'Lund', tjanster_produkter: 'Doftljus', priser: '149 kr', mal_med_sidan: 'Beställa', stil: 'Lekfull' };
  const first = applyTurn({ brief, asked: ['varfor_valja_oss'], askCount: 1, message: 'vet inte' }, null);
  assert.deepEqual(first.asked, ['varfor_valja_oss']);
  assert.match(first.reply, /brukar kunderna säga/);
  assert.equal(first.brief.varfor_valja_oss, undefined);
  const ok = applyTurn({ brief, asked: ['varfor_valja_oss'], askCount: 2, carry: 'vet inte', carryField: 'varfor_valja_oss', message: 'Att de luktar gott länge' }, null);
  assert.equal(ok.brief.varfor_valja_oss, 'Att de luktar gott länge');
  const again = applyTurn({ brief, asked: ['varfor_valja_oss'], askCount: 2, message: 'ingen aning' }, null);
  assert.equal(again.brief.varfor_valja_oss, 'saknas');
  assert.match(again.issues.map((i) => i.text).join(' '), /visste inte: varför välja er/);
  // Ett nej till något kunden inte har är ett svar, ingen reservfråga.
  assert.equal(applyTurn({ brief, asked: ['logga'], askCount: 1, message: 'Nej, ingen logga' }, null).brief.logga, 'saknas');
});

test('kunden vill sluta: intervjun avslutas direkt och teamet får veta vad som saknas', () => {
  const r = applyTurn({ brief: { foretagsnamn: 'A', bransch: 'Frisör' }, asked: ['ort_omrade'], askCount: 1, message: 'Jag orkar inte mer' }, null);
  assert.equal(r.done, true);
  assert.equal(r.stopped, true);
  assert.match(r.issues[0].text, /ville avsluta.*Ort \/ område/);
  assert.equal(applyTurn({ brief: {}, asked: ['foretagsnamn'], askCount: 1, message: 'Sluta Snickeri' }, null).stopped, undefined);
});

test('förloppet visas som fyra delar, inte som antal punkter', async () => {
  const { progressOf } = await import('../public/assets/shared/brief.js');
  assert.deepEqual(progressOf({}), { part: 1, parts: 4, label: 'Om företaget', share: 0 });
  const p = progressOf({ foretagsnamn: 'Lågan UF', bransch: 'x', ort_omrade: 'x', tjanster_produkter: 'x', priser: 'x', produktdetaljer: 'x' });
  assert.equal(p.part, 2);
  assert.equal(p.label, 'Hur sidan ska bli');
  assert.ok(p.share > 0 && p.share < 1);
});

test('en egen AI-server används bara med en https-adress, och utan nyckel skickas inget lösenord', async () => {
  resetPauses();
  const sent = [];
  const json = await withFetch(async (url, init) => {
    sent.push({ url: String(url), auth: init.headers.authorization, model: JSON.parse(init.body).model });
    return ok('{"a":3}');
  }, () => runExternal({ LOCAL_AI_URL: 'https://ai.nordvy.example/v1/chat/completions', LOCAL_AI_MODEL: 'qwen2.5:7b' }, payload));
  assert.deepEqual(json, { a: 3 });
  assert.deepEqual(sent, [{ url: 'https://ai.nordvy.example/v1/chat/completions', auth: undefined, model: 'qwen2.5:7b' }]);
  sent.length = 0;
  assert.equal(await withFetch(async () => ok('{}'), () => runExternal({ LOCAL_AI_URL: 'http://192.168.1.5:11434/v1/chat/completions' }, payload)), null);
});

test('svar där koden själv bestämmer nästa fråga går utan AI, så att kunden slipper vänta', async () => {
  const { needsAi } = await import('../src/interview.js');
  const brief = { foretagsnamn: 'Lågan UF', bransch: 'Doftljus' };
  assert.equal(needsAi({ brief, asked: ['varfor_valja_oss'], askCount: 1, message: 'vet inte' }), false);
  assert.equal(needsAi({ brief, asked: ['ort_omrade'], askCount: 1, message: 'Jag orkar inte mer' }), false);
  assert.equal(needsAi({ brief, asked: ['tjanster_produkter'], askCount: 1, message: 'allt möjligt' }), false);
  assert.equal(needsAi({ brief, asked: ['tjanster_produkter'], askCount: 1, message: 'Doftljus och presentask' }), true);
});


// Från testintervjun 19 november (NordvyUF): färger och önskemål hamnade under "Undvik".
test('sista frågan heter Övriga önskemål och tar emot både önskemål och sådant de inte vill ha', async () => {
  const { FIELD } = await import('../public/assets/shared/brief.js');
  assert.equal(FIELD.undvik.label, 'Övriga önskemål');
  assert.match(FIELD.undvik.question, /något mer ni vill ha med/);
  const brief = { foretagsnamn: 'A', foretagstyp: 'Annat', bransch: 'B' };
  assert.equal(applyTurn({ brief, asked: ['undvik'], askCount: 1, message: 'Nej, inget mer' }, null).brief.undvik, 'Inget särskilt');
});

test('en stil utan färg ger en fråga om färgerna, en gång, och knappen följer med', () => {
  const brief = { foretagsnamn: 'NordvyUF', foretagstyp: 'UF-företag', bransch: 'Hemsidor', ort_omrade: 'Malmö', tjanster_produkter: 'Hemsidor', priser: '2999', mal_med_sidan: 'Kontakta oss' };
  const r = applyTurn({ brief, asked: ['stil'], askCount: 1, message: 'Exklusiv' }, null);
  assert.deepEqual(r.asked, ['stil']);
  assert.match(r.reply, /färger/);
  const two = applyTurn({ brief, asked: ['stil'], askCount: 2, carry: 'Exklusiv', carryField: 'stil', message: 'Blå och grå, lite gult' }, null);
  assert.equal(two.brief.stil, 'Exklusiv / Blå och grå, lite gult');
  const none = applyTurn({ brief, asked: ['stil'], askCount: 2, carry: 'Exklusiv', carryField: 'stil', message: 'Nej' }, null);
  assert.equal(none.brief.stil, 'Exklusiv');
  assert.equal(applyTurn({ brief, asked: ['stil'], askCount: 1, message: 'Varm och personlig, gärna grönt' }, null).brief.stil, 'Varm och personlig, gärna grönt');
});

test('önskemål som inte ryms i UF-paketet blir en punkt för teamet', () => {
  const brief = { foretagsnamn: 'NordvyUF', foretagstyp: 'UF-företag', bransch: 'Hemsidor' };
  const r = applyTurn({ brief, asked: ['undvik'], askCount: 1, message: 'Vi gillar inte när det endast är en sida, vill ha olika delar och animationer' }, null);
  assert.match(r.issues.map((i) => i.text).join(' '), /flera sidor, och det ingår inte i UF-paketet.*Bas eller Premium/);
  const ok = applyTurn({ brief, asked: ['undvik'], askCount: 1, message: 'Gärna blått' }, null);
  assert.equal(ok.issues.length, 0);
});

test('UF-frågan om vad de gör ställs exakt, med exemplet, även när AI:n föreslår en kortare', () => {
  const ai = { saves: [], reply: 'Vad gör ni?', asked: 'bransch' };
  const r = applyTurn({ brief: { foretagsnamn: 'NordvyUF' }, asked: ['foretagstyp'], askCount: 1, message: 'UF-företag' }, ai);
  assert.deepEqual(r.asked, ['bransch']);
  assert.match(r.reply, /till exempel "Vi gör doftljus/);
});

test('följdfrågan om färger har färgknappar, inte stilknapparna (ReBoard UF 23 november)', async () => {
  const { repeatChips, FIELD } = await import('../public/assets/shared/brief.js');
  const colours = repeatChips('stil');
  assert.ok(colours.length >= 3);
  for (const label of FIELD.stil.chips) assert.ok(!colours.includes(label), `${label} ska inte visas på färgfrågan`);
  assert.equal(repeatChips('bransch'), null);
  const brief = { foretagsnamn: 'ReBoard UF', foretagstyp: 'UF-företag', bransch: 'Skärbrädor av återvunnet virke', ort_omrade: 'Malmö', tjanster_produkter: 'Skärbrädor i tre storlekar', priser: 'Liten 500 kr', mal_med_sidan: 'Beställa något' };
  const first = applyTurn({ brief, asked: ['stil'], askCount: 1, message: 'Naturnära' }, null);
  assert.deepEqual(first.asked, ['stil']);
  const answer = applyTurn({ brief, asked: ['stil'], askCount: 2, carry: 'Naturnära', carryField: 'stil', message: 'Beige och brunt' }, null);
  assert.equal(answer.brief.stil, 'Naturnära / Beige och brunt');
});

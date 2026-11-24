// Intervju 2.0 (25 november): det vi fick fråga ReBoard UF om i ett långt mejl efteråt frågas nu i
// intervjun, logga och bilder laddas upp och följer med mejlet, och byggaren får ett JSON-underlag.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { readFiles } from '../src/worker.js';
import { applyTurn, redact, specFrom, cleanSpecAi, specMessages, transcribe, needsAi } from '../src/interview.js';
import { plan, missing } from '../public/assets/shared/brief.js';

const env = { ASSETS: { fetch: async () => new Response('<!doctype html><title>x</title>', { headers: { 'content-type': 'text/html' } }) } };
const uf = { foretagsnamn: 'ReBoard UF', foretagstyp: 'UF-företag', bransch: 'Skärbrädor av återvunnen ek', ort_omrade: 'Malmö', tjanster_produkter: 'Liten, mellan och stor skärbräda', priser: 'Liten 500 kr, mellan 750 kr, stor 1000 kr' };

test('UF-företag får frågor om produkterna, leveransen och vilka de är', () => {
  const asks = plan(uf);
  for (const k of ['produktdetaljer', 'leverans', 'om_oss']) assert.ok(asks.includes(k), k);
  // Frågan om produkterna kommer direkt efter priserna.
  assert.equal(missing(uf)[0], 'produktdetaljer');
});

test('en salong får inga frågor om produktmått eller frakt, men om vilka de är', () => {
  const salong = { foretagsnamn: 'Salong Vera', foretagstyp: 'Butik, café eller salong', bransch: 'Frisör' };
  const asks = plan(salong);
  assert.ok(!asks.includes('produktdetaljer'));
  assert.ok(!asks.includes('leverans'));
  assert.ok(asks.includes('om_oss'));
});

test('Swish-numret frågas bara när kunden vill ta betalt med Swish', () => {
  assert.ok(!plan({ ...uf, bestallning: 'Kontant' }).includes('swish'));
  assert.ok(plan({ ...uf, bestallning: 'Swish, Kontant' }).includes('swish'));
  const asks = plan({ ...uf, bestallning: 'Swish' });
  assert.ok(asks.indexOf('swish') > asks.indexOf('bestallning'));
});

test('Swish-nummer döljs för AI:n, och frågan behöver ingen AI', async () => {
  const { NEED } = await import('../public/assets/shared/brief.js');
  assert.equal(redact('Vårt nummer är 123 456 78 90'), 'Vårt nummer är [swish]');
  // Allt fram till Swish-numret är besvarat. Nästa fråga (kontakt) är också enkel, så ingen AI behövs.
  const before = NEED.slice(0, NEED.indexOf('swish'));
  const brief = { ...Object.fromEntries(before.map((k) => [k, 'x'])), ...uf, bestallning: 'Swish' };
  assert.equal(needsAi({ asked: ['swish'], message: '1234567890', brief }), false);
});

test('"Ja, det har vi" om omdömen ger en fråga om att klistra in dem, och svaret sparas ihop', () => {
  const brief = { ...uf };
  const first = applyTurn({ brief, asked: ['omdomen'], askCount: 1, message: 'Ja, det har vi' }, null);
  assert.deepEqual(first.asked, ['omdomen']);
  assert.match(first.reply, /Klistra/);
  const second = applyTurn({ brief, asked: ['omdomen'], askCount: 2, carry: 'Ja, det har vi', carryField: 'omdomen', message: '"Jättefin bräda!" – Anna' }, null);
  assert.match(second.brief.omdomen, /Jättefin bräda/);
  // Inklistrade omdömen behöver ingen uppföljning.
  assert.ok(!second.issues.some((i) => /omdömen som får visas/.test(i.text)));
});

test('"Vi skickar" om leveransen ger en fråga om frakt och tid', () => {
  const r = applyTurn({ brief: uf, asked: ['leverans'], askCount: 1, message: 'Vi skickar' }, null);
  assert.deepEqual(r.asked, ['leverans']);
  assert.match(r.reply, /frakten/);
  const full = applyTurn({ brief: uf, asked: ['leverans'], askCount: 1, message: 'Man hämtar i Limhamn eller så skickar vi för 79 kr, klar på 3 dagar' }, null);
  assert.match(full.brief.leverans, /79 kr/);
});

test('en uppladdad logga ger ingen uppföljning, "jag mejlar den senare" gör det', () => {
  const brief = { ...uf };
  const up = applyTurn({ brief, asked: ['logga'], askCount: 1, message: 'Laddade upp loggan (logga.png)' }, null);
  assert.ok(!up.issues.some((i) => i.topic === 'logga'));
  const later = applyTurn({ brief, asked: ['logga'], askCount: 1, message: 'Jag mejlar den senare' }, null);
  assert.ok(later.issues.some((i) => i.topic === 'logga'));
});

const png = 'iVBORw0KGgo' + 'A'.repeat(200);

test('bara bilder i rimlig storlek tas emot, med loggan först', () => {
  const { files, dropped } = readFiles([
    { kind: 'photo', type: 'image/jpeg', name: 'bräda 1.jpg', data: png },
    { kind: 'logo', type: 'image/png', name: 'logga.png', data: png },
    { kind: 'photo', type: 'text/html', name: 'x.html', data: png },
    { kind: 'photo', type: 'image/svg+xml', name: 'x.svg', data: png }, // SVG bara som logga
    { kind: 'photo', type: 'image/jpeg', name: 'trasig.jpg', data: 'inte base64!' },
  ]);
  assert.equal(files.length, 2);
  assert.equal(dropped, 3);
  assert.equal(files[0].kind, 'logo');
  assert.match(files[0].name, /^logga-logga\.png$/);
  assert.match(files[1].name, /^bild-1-br.*\.jpg$/);
});

test('underlaget mejlas med bilder och byggunderlaget som bilagor', async () => {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
  };
  try {
    const { NEED } = await import('../public/assets/shared/brief.js');
    const brief = { ...Object.fromEntries(NEED.map((k) => [k, `Svar om ${k}`])), ...uf, logga: 'Laddade upp loggan (logga.png)', bilder: 'Laddade upp 2 bilder', kontakt: 'hej@reboard.se', swish: '123 456 78 90' };
    const files = [
      { kind: 'logo', type: 'image/png', name: 'logga.png', data: png },
      { kind: 'photo', type: 'image/jpeg', name: 'a.jpg', data: png },
      { kind: 'photo', type: 'image/jpeg', name: 'b.jpg', data: png },
    ];
    const res = await worker.fetch(
      new Request('https://nordvyuf.se/api/interview/finish', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://nordvyuf.se' },
        body: JSON.stringify({ brief, issues: [], log: [], contact: { name: 'Max', email: 'max@example.com' }, choice: 'uf', files }),
      }),
      { ...env, CONTACT_ENDPOINT: 'https://script.google.com/macros/s/test/exec' },
    );
    const out = await res.json();
    assert.equal(out.ok, true);
    assert.equal(out.files, 3);
    assert.equal(sent.length, 1);
    const att = sent[0].attachments;
    assert.equal(att.length, 4);
    assert.equal(att[0].type, 'application/json');
    const spec = JSON.parse(Buffer.from(att[0].data, 'base64').toString('utf8'));
    assert.equal(spec.foretag.namn, 'ReBoard UF');
    assert.equal(spec.pa_sidan.swish, '123 456 78 90');
    assert.equal(spec.material.logga, 'bifogad');
    assert.equal(spec.material.bilder, 2);
    assert.match(sent[0].message, /BIFOGADE FILER/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('sa kunden att bilder laddades upp men inga kom med, följer teamet upp', async () => {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
  };
  try {
    const { NEED } = await import('../public/assets/shared/brief.js');
    const brief = { ...Object.fromEntries(NEED.map((k) => [k, `Svar om ${k}`])), ...uf, bilder: 'Laddade upp 3 bilder' };
    await worker.fetch(
      new Request('https://nordvyuf.se/api/interview/finish', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://nordvyuf.se' },
        body: JSON.stringify({ brief, issues: [], log: [], contact: { name: 'Max', email: 'max@example.com' }, choice: 'uf' }),
      }),
      { ...env, CONTACT_ENDPOINT: 'https://script.google.com/macros/s/test/exec' },
    );
    assert.match(sent[0].message, /laddade upp bilder, men de kom inte med/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('byggunderlaget: kontaktuppgifter skickas aldrig till AI:n, och AI:ns del städas', () => {
  const content = specMessages({ ...uf, kontakt: 'hej@reboard.se 070-123 45 67', swish: '1234567890' })[1].content;
  assert.doesNotMatch(content, /reboard\.se|070|1234567890/);
  const ai = cleanSpecAi({ erbjudande: [{ namn: 'Liten bräda', pris: '500 kr', beskrivning: 'Ek' }, { namn: '' }], mal_med_sidan: ['Beställa'], sektioner: ['Produkter'], funktioner: [], stil: { kansla: 'Varm', farger: ['beige'], undvik: [] } });
  assert.equal(ai.erbjudande.length, 1);
  const spec = specFrom(uf, { choice: 'uf' }, ai);
  assert.equal(spec.ordnat_av, 'claude');
  assert.equal(spec.erbjudande[0].pris, '500 kr');
  // Utan AI gör koden en enklare lista själv.
  const plain = specFrom(uf, {}, null);
  assert.equal(plain.ordnat_av, 'koden');
  assert.deepEqual(plain.erbjudande.map((e) => e.namn), ['Liten', 'mellan och stor skärbräda']);
});

test('mikrofonen: Whisper får ljudet, och utan Workers AI svarar servern tydligt', async () => {
  let got = null;
  const ok = await transcribe({ AI: { run: async (model, input) => ((got = { model, input }), { text: ' Vi säljer  skärbrädor. ' }) } }, { audio: 'UklGRg' + 'A'.repeat(100) });
  assert.deepEqual(ok, { ok: true, text: 'Vi säljer skärbrädor.' });
  assert.match(got.model, /whisper/);
  assert.equal(got.input.language, 'sv');
  assert.equal((await transcribe({}, { audio: 'UklGRg' + 'A'.repeat(100) })).error, 'not_configured');
  assert.equal((await transcribe({ AI: {} }, { audio: '<script>' })).error, 'invalid_audio');
});

test('mikrofonen är tillåten på intervjun men inte på andra sidor', async () => {
  const intervju = await worker.fetch(new Request('https://nordvyuf.se/intervju'), env);
  assert.match(intervju.headers.get('permissions-policy'), /microphone=\(self\)/);
  const start = await worker.fetch(new Request('https://nordvyuf.se/'), env);
  assert.match(start.headers.get('permissions-policy'), /microphone=\(\)/);
});

// Tester för omdömen på kundsidor: kontrollen av ett omdöme, mejlet och API:et.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readReview, reviewMail, reviewLine, SLUG } from '../src/reviews.js';
import worker from '../src/worker.js';

const good = { site: 'matochmatt', name: 'Anna', rating: 5, text: 'Receptboken är tydlig och maten blev jättegod.', consent: true, elapsed: 8000 };

test('ett riktigt omdöme godkänns och rensas', () => {
  const r = readReview({ ...good, name: '  Anna  ', text: 'Bra   och  tydlig bok.' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.review, { site: 'matochmatt', name: 'Anna', rating: 5, text: 'Bra och tydlig bok.' });
  assert.equal(readReview({ ...good, name: 'Åsa-Lena', site: 'Salong-Ask' }).review.site, 'salong-ask');
});

test('ett omdöme som inte följer reglerna nekas, med en kod som sidan kan översätta', () => {
  const cases = [
    [{ site: '../x' }, 'invalid_site'],
    [{ site: 'a' }, 'invalid_site'],
    [{ name: 'A' }, 'invalid_name'],
    [{ name: 'Anna123' }, 'invalid_name'],
    [{ name: 'www.spam.se' }, 'invalid_name'],
    [{ rating: 0 }, 'invalid_rating'],
    [{ rating: 6 }, 'invalid_rating'],
    [{ rating: 4.5 }, 'invalid_rating'],
    [{ rating: 'fem' }, 'invalid_rating'],
    [{ text: 'Bra' }, 'invalid_text'],
    [{ text: 'x'.repeat(601) }, 'invalid_text'],
    [{ text: 'Köp billigt på https://spam.example nu' }, 'no_links'],
    [{ text: 'Skriv till mig på spam@example.com så får du' }, 'no_links'],
    [{ text: 'Gå in på bästa-priset.se för mer information' }, 'no_links'],
    [{ consent: false }, 'consent_required'],
    [{ consent: 'true' }, 'consent_required'],
    [{ elapsed: 500 }, 'too_fast'],
    [{ elapsed: undefined }, 'too_fast'],
  ];
  for (const [patch, error] of cases) {
    const r = readReview({ ...good, ...patch });
    assert.equal(r.ok, false, JSON.stringify(patch));
    assert.equal(r.error, error, JSON.stringify(patch));
  }
  assert.equal(readReview(null).ok, false);
  assert.ok(SLUG.test('matochmatt') && !SLUG.test('Mat Och Mätt'));
});

test('mejlet innehåller omdömet och en färdig rad som kunden kan godkänna', () => {
  const { review } = readReview(good);
  const mail = reviewMail(review, '2026-11-18');
  assert.equal(mail.company, 'matochmatt');
  assert.equal(mail.package, 'Omdöme');
  assert.match(mail.message, /NYTT OMDÖME TILL matochmatt/);
  assert.match(mail.message, /★★★★★ \(5 av 5\)/);
  assert.match(mail.message, /public\/kund\/matochmatt\/omdomen\.json/);
  const line = mail.message.split('\n').at(-1);
  assert.deepEqual(JSON.parse(line), { namn: 'Anna', betyg: 5, text: good.text, datum: '2026-11-18' });
  assert.equal(line, reviewLine(review, '2026-11-18'));
});

/* ------------------------------------------------------------- API */

const json = { 'content-type': 'application/json' };
const enabled = (path) => path === '/kund/matochmatt/omdomen.json';
function makeEnv() {
  const probed = [];
  return {
    probed,
    ASSETS: {
      async fetch(request) {
        const path = new URL(request.url).pathname;
        probed.push(path);
        return enabled(path)
          ? new Response('{"reviews":[]}', { headers: { 'content-type': 'application/json' } })
          : new Response('<html>404</html>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
      },
    },
    CONTACT_ENDPOINT: 'https://script.google.com/test',
  };
}
const post = (body, origin = 'https://nordvy.test') =>
  new Request('https://nordvy.test/api/review', { method: 'POST', headers: { origin, ...json }, body: JSON.stringify(body) });

async function withMail(fn) {
  const real = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.startsWith('https://script.google.com/')) {
      sent.push(JSON.parse(init.body));
      return Response.json({ ok: true });
    }
    return real(input, init);
  };
  try {
    return await fn(sent);
  } finally {
    globalThis.fetch = real;
  }
}

test('API: ett riktigt omdöme mejlas till Nordvy', async () => {
  await withMail(async (sent) => {
    const env = makeEnv();
    const res = await worker.fetch(post(good), env);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].company, 'matochmatt');
    assert.match(sent[0].message, /Receptboken är tydlig/);
    assert.deepEqual(env.probed, ['/kund/matochmatt/omdomen.json']);
  });
});

test('API: bara kunder som slagit på omdömen tar emot dem', async () => {
  await withMail(async (sent) => {
    const res = await worker.fetch(post({ ...good, site: 'finnsinte' }), makeEnv());
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, 'unknown_site');
    assert.equal(sent.length, 0);
  });
});

test('API: fel avsändare, dolt fält och ogiltiga omdömen skickar inget mejl', async () => {
  await withMail(async (sent) => {
    assert.equal((await worker.fetch(post(good, 'https://evil.example'), makeEnv())).status, 403);
    const bot = await worker.fetch(post({ ...good, website: 'spam' }), makeEnv());
    assert.equal(bot.status, 200); // roboten ska inte få veta att den blev stoppad
    for (const patch of [{ rating: 9 }, { consent: false }, { elapsed: 10 }, { text: 'kort' }]) {
      const res = await worker.fetch(post({ ...good, ...patch }), makeEnv());
      assert.equal(res.status, 400, JSON.stringify(patch));
    }
    const notJson = await worker.fetch(new Request('https://nordvy.test/api/review', { method: 'POST', headers: { origin: 'https://nordvy.test' }, body: 'x' }), makeEnv());
    assert.equal(notJson.status, 400);
    assert.equal((await worker.fetch(new Request('https://nordvy.test/api/review'), makeEnv())).status, 405);
    assert.equal(sent.length, 0);
  });
});

test('API: ett 200-svar som inte är JSON räknas inte som en omdömesfil', async () => {
  const env = { ...makeEnv(), ASSETS: { fetch: async () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } }) } };
  const res = await worker.fetch(post(good), env);
  assert.equal(res.status, 404);
});

test('API: utan mejlkoppling blir det ett tydligt fel', async () => {
  const res = await worker.fetch(post(good), { ...makeEnv(), CONTACT_ENDPOINT: '' });
  assert.equal(res.status, 503);
});

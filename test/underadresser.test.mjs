// Tester för UF-kundernas egna adresser, till exempel reboard.nordvyuf.se.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { SUBDOMAINS } from '../src/worker.js';

// En låtsas-ASSETS som minns vilka sökvägar som hämtades och svarar som Cloudflare.
function makeEnv() {
  const asked = [];
  const page = '<!doctype html><link rel="canonical" href="__ORIGIN__/kund/reboard/"><meta property="og:image" content="__ORIGIN__/kund/reboard/dela.png"><script type="module" src="/kund/reboard/filer/app.js"></script>ReBoard';
  const env = {
    SITE_URL: 'https://nordvyuf.se',
    ASSETS: {
      fetch: async (req) => {
        const path = new URL(req.url).pathname;
        asked.push(path);
        if (path === '/kund/reboard/' || path === '/kund/reboard/index.html') return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' } });
        if (path === '/kund/reboard/filer/app.js') return new Response('console.log(1)', { headers: { 'content-type': 'text/javascript' } });
        if (path === '/kund/reboard/dela.png') return new Response('png', { headers: { 'content-type': 'image/png' } });
        if (path === '/assets/kund/rorelse.css') return new Response('a{}', { headers: { 'content-type': 'text/css' } });
        if (path === '/') return new Response('<!doctype html><link rel="canonical" href="__ORIGIN__/">Nordvy', { headers: { 'content-type': 'text/html; charset=utf-8' } });
        return new Response('<!doctype html>Sidan finns inte', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
      },
    },
  };
  return { env, asked };
}
const get = (url, env) => worker.fetch(new Request(url), env);

// Sätter live tillfälligt, så att testerna inte påverkar varandra.
async function withLive(value, fn) {
  const before = SUBDOMAINS.reboard.live;
  SUBDOMAINS.reboard.live = value;
  try {
    await fn();
  } finally {
    SUBDOMAINS.reboard.live = before;
  }
}

test('reboard.nordvyuf.se visar ReBoards sida utan att byta adress, med CSP', async () => {
  const { env, asked } = makeEnv();
  const res = await get('https://reboard.nordvyuf.se/', env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('location'), null);
  assert.match(await res.text(), /ReBoard/);
  assert.match(res.headers.get('content-security-policy') || '', /script-src 'self'/);
  assert.deepEqual(asked, ['/kund/reboard/']);
});

test('sidans filer laddas på underadressen: /kund/reboard/…, /assets/… och delningsbilden', async () => {
  const { env, asked } = makeEnv();
  for (const path of ['/kund/reboard/filer/app.js', '/assets/kund/rorelse.css', '/dela.png']) {
    const res = await get(`https://reboard.nordvyuf.se${path}`, env);
    assert.equal(res.status, 200, path);
  }
  assert.deepEqual(asked, ['/kund/reboard/filer/app.js', '/assets/kund/rorelse.css', '/kund/reboard/dela.png']);
});

test('underadressen har egen robots.txt och sitemap, och visar inte andra kunders sidor', async () => {
  const { env } = makeEnv();
  const robots = await (await get('https://reboard.nordvyuf.se/robots.txt', env)).text();
  assert.match(robots, /Sitemap: https:\/\/reboard\.nordvyuf\.se\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Disallow: \/\n/);
  const map = await (await get('https://reboard.nordvyuf.se/sitemap.xml', env)).text();
  assert.match(map, /<loc>https:\/\/reboard\.nordvyuf\.se\/<\/loc>/);
  const other = await get('https://reboard.nordvyuf.se/kund/annan/', env);
  assert.equal(other.status, 302);
  assert.equal(other.headers.get('location'), 'https://reboard.nordvyuf.se/');
  const missing = await get('https://reboard.nordvyuf.se/finns-inte', env);
  assert.equal(missing.status, 404);
});

test('okänd underadress skickas till nordvyuf.se, inte till en tom sida', async () => {
  const { env } = makeEnv();
  const res = await get('https://finnsinte.nordvyuf.se/', env);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), 'https://nordvyuf.se/');
});

test('innan underadressen är live: gamla adresserna fungerar som förut och canonical är oförändrad', async () => {
  const { env } = makeEnv();
  await withLive(false, async () => {
    for (const path of ['/kund/reboard/', '/reboarduf']) {
      const res = await get(`https://nordvyuf.se${path}`, env);
      assert.equal(res.status, 200, path);
      assert.match(await res.text(), /href="https:\/\/nordvyuf\.se\/kund\/reboard\/"/, path);
    }
  });
});

test('när underadressen är live: 301 från gamla adresserna, och canonical och delningsbild pekar dit', async () => {
  const { env } = makeEnv();
  await withLive(true, async () => {
    for (const path of ['/kund/reboard/', '/kund/reboard', '/kund/reboard/index.html', '/reboarduf', '/ReBoardUF/']) {
      const res = await get(`https://nordvyuf.se${path}`, env);
      assert.equal(res.status, 301, path);
      assert.equal(res.headers.get('location'), 'https://reboard.nordvyuf.se/', path);
    }
    // Sökparametrar följer med.
    const q = await get('https://nordvyuf.se/kund/reboard/?utan-foton', env);
    assert.equal(q.headers.get('location'), 'https://reboard.nordvyuf.se/?utan-foton');
    // Sidans filer på nordvyuf.se skickas inte vidare.
    assert.equal((await get('https://nordvyuf.se/kund/reboard/filer/app.js', env)).status, 200);
    const html = await (await get('https://reboard.nordvyuf.se/', env)).text();
    assert.match(html, /rel="canonical" href="https:\/\/reboard\.nordvyuf\.se\/"/);
    assert.match(html, /content="https:\/\/reboard\.nordvyuf\.se\/dela\.png"/);
    // Förhandsvisningar på workers.dev skickas inte vidare.
    assert.equal((await get('https://nordvy.nordvyuf.workers.dev/kund/reboard/', env)).status, 200);
  });
});

test('nordvyuf.se och www fungerar som förut', async () => {
  const { env } = makeEnv();
  const home = await get('https://nordvyuf.se/', env);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /href="https:\/\/nordvyuf\.se\/"/);
  const www = await get('https://www.nordvyuf.se/intervju', env);
  assert.equal(www.status, 301);
  assert.equal(www.headers.get('location'), 'https://nordvyuf.se/intervju');
  const robots = await (await get('https://nordvyuf.se/robots.txt', env)).text();
  assert.match(robots, /Sitemap: https:\/\/nordvyuf\.se\/sitemap\.xml/);
});

// Tester för domänen nordvyuf.se.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const env = {
  SITE_URL: 'https://nordvyuf.se',
  ASSETS: {
    fetch: async () => new Response('<!doctype html><link rel="canonical" href="__ORIGIN__/">', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
  },
};

test('www.nordvyuf.se skickas vidare till nordvyuf.se med samma sökväg', async () => {
  const res = await worker.fetch(new Request('https://www.nordvyuf.se/intervju?a=1'), env);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), 'https://nordvyuf.se/intervju?a=1');
});

test('nordvyuf.se och workers.dev visar sidan, med nordvyuf.se som canonical', async () => {
  for (const host of ['https://nordvyuf.se/', 'https://nordvy.nordvyuf.workers.dev/']) {
    const res = await worker.fetch(new Request(host), env);
    assert.equal(res.status, 200, host);
    assert.match(await res.text(), /href="https:\/\/nordvyuf\.se\/"/, host);
  }
});

test('nordvyuf.se/reboarduf skickas till ReBoards egen adress, reboard.nordvyuf.se', async () => {
  // ReBoard har live: true i SUBDOMAINS (26/11), så den korta adressen skickas vidare med 301.
  // Hur korta adresser visas när underadressen inte är live testas i underadresser.test.mjs.
  for (const path of ['/reboarduf', '/reboarduf/', '/ReBoardUF']) {
    const res = await worker.fetch(new Request(`https://nordvyuf.se${path}`), env);
    assert.equal(res.status, 301, path);
    assert.equal(res.headers.get('location'), 'https://reboard.nordvyuf.se/', path);
  }
  const www = await worker.fetch(new Request('https://www.nordvyuf.se/reboarduf'), env);
  assert.equal(www.status, 301);
  assert.equal(www.headers.get('location'), 'https://nordvyuf.se/reboarduf');
});

test('intervjuunderlaget skickas som ett enda mejl', async () => {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)); return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }); };
  try {
    const { NEED } = await import('../public/assets/shared/brief.js');
    const brief = Object.fromEntries(NEED.map((k) => [k, `Ett ganska långt svar om ${k} som kunden skrev med egna ord`]));
    const log = Array.from({ length: 50 }, (_, i) => ({ who: i % 2 ? 'me' : 'ai', text: `Meddelande nummer ${i} i chatten, med lite text så att det blir långt.` }));
    const res = await worker.fetch(new Request('https://nordvyuf.se/api/interview/finish', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://nordvyuf.se' }, body: JSON.stringify({ brief, issues: [], log, contact: { name: 'Test', email: 'test@example.com' }, choice: 'bas' }) }), { ...env, CONTACT_ENDPOINT: 'https://script.google.com/macros/s/test/exec' });
    const out = await res.json();
    assert.equal(out.ok, true);
    assert.equal(sent.length, 1);
    assert.doesNotMatch(sent[0].message, /^\(1\//);
    assert.match(sent[0].message, /ORDAGRANN CHATT/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

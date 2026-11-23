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

test('nordvyuf.se/reboarduf visar ReBoards utkast utan att byta adress', async () => {
  const asked = [];
  const local = { ...env, ASSETS: { fetch: async (req) => { asked.push(new URL(req.url).pathname); return new Response('<!doctype html>ReBoard', { headers: { 'content-type': 'text/html; charset=utf-8' } }); } } };
  for (const path of ['/reboarduf', '/reboarduf/', '/ReBoardUF']) {
    const res = await worker.fetch(new Request(`https://nordvyuf.se${path}`), local);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /ReBoard/);
  }
  assert.deepEqual(asked, ['/kund/reboard/', '/kund/reboard/', '/kund/reboard/']);
  const www = await worker.fetch(new Request('https://www.nordvyuf.se/reboarduf'), local);
  assert.equal(www.status, 301);
  assert.equal(www.headers.get('location'), 'https://nordvyuf.se/reboarduf');
});

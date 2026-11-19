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

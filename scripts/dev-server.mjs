// Lokal förhandsvisning utan Cloudflare-konto: node scripts/dev-server.mjs
//
// Kör samma Worker-kod som i drift, men:
//  - filerna i public/ läses från disk,
//  - Workers AI finns inte, så intervjun använder checklistans färdiga frågor
//    (sätt MOCK_AI=1 för en låtsas-AI som testar AI-vägen i koden),
//  - mejl skickas aldrig: de skrivs ut i terminalen i stället.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const port = Number(process.env.PORT || 8788);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function file(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? p : null;
  } catch {
    return null;
  }
}

// Samma regler som Cloudflare: /intervju -> intervju.html, /demo/x/ -> index.html, annars 404.html.
const ASSETS = {
  async fetch(request) {
    const url = new URL(request.url);
    const clean = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const base = path.join(root, clean);
    if (!base.startsWith(root)) return new Response('Forbidden', { status: 403 });
    const hit = (await file(base)) || (await file(`${base}.html`)) || (await file(path.join(base, 'index.html')));
    const target = hit || path.join(root, '404.html');
    const body = await readFile(target);
    return new Response(body, {
      status: hit ? 200 : 404,
      headers: { 'content-type': TYPES[path.extname(target)] || 'application/octet-stream' },
    });
  },
};

// Låtsas-AI: sparar svaret på det senast frågade fältet och ställer nästa fråga.
const MOCK_AI = {
  async run(model, payload) {
    // Mikrofonknappen: låtsas att talet blev den här texten.
    if (payload.audio) return { text: 'Vi säljer skärbrädor av gammal ek från rivna hus.' };
    const text = payload.messages.at(-1).content;
    if (!text.includes('KUNDENS SVAR')) {
      return { response: { headline: 'Låtsasrubrik skriven av test-AI:n', sub: 'En underrubrik som visar att AI-vägen i koden fungerar som den ska.', tagline: 'Test i Malmö', cta: 'Boka nu', services: [{ title: 'Tjänst ett', text: 'Kort text.' }, { title: 'Tjänst två', text: 'Kort text.' }, { title: 'Tjänst tre', text: 'Kort text.' }], about: '' } };
    }
    const answer = (text.match(/KUNDENS SVAR: «([\s\S]*)»/) || [])[1] || '';
    const asked = ((text.match(/Du frågade senast om: ([a-z_]+)/) || [])[1] || '').trim();
    const left = [...text.matchAll(/^- ([a-z_]+): /gm)].map((m) => m[1]);
    const todo = text.slice(text.indexOf('ÅTERSTÅR'), text.indexOf('SENASTE SAMTALET'));
    const next = [...todo.matchAll(/^- ([a-z_]+): /gm)].map((m) => m[1]).filter((k) => k !== asked);
    return {
      response: {
        saves: asked ? [{ field: asked, value: /^(nej|inga|vet inte)/i.test(answer) ? 'saknas' : answer }] : [],
        reply: next.length ? `Test-AI: tack för svaret. Berätta om ${next[0]}?` : 'Klart.',
        asked: next[0] || left[0] || '',
      },
    };
  },
};

const env = {
  ASSETS,
  AI: process.env.MOCK_AI ? MOCK_AI : undefined,
  CONTACT_ENDPOINT: 'https://script.google.com/dev-server',
  SITE_URL: '',
};

// Inga riktiga mejl från den lokala servern.
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('https://script.google.com/')) {
    const mail = JSON.parse(init.body);
    // Bilagorna skrivs som namn och storlek. Byggunderlaget (JSON) skrivs ut i sin helhet.
    const files = (mail.attachments || []).map((f) =>
      f.type === 'application/json' ? `${f.name}:\n${Buffer.from(f.data, 'base64').toString('utf8')}` : `${f.name} (${f.type}, ${Math.round((f.data.length * 3) / 4 / 1024)} kB)`,
    );
    console.log('\n--- MEJL (skickas inte lokalt) ---\n', { ...mail, attachments: files.length }, '\n', files.join('\n'), '\n');
    return Response.json({ ok: true });
  }
  return realFetch(input, init);
};

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env);
    const headers = Object.fromEntries(response.headers);
    delete headers['strict-transport-security'];
    headers['cache-control'] = 'no-store'; // alltid färska filer lokalt
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  })
  .listen(port, () => console.log(`Nordvy lokalt: http://localhost:${port}  (AI: ${env.AI ? 'låtsas' : 'av, reservfrågor'})`));

// Nordvy – Cloudflare Worker.
// Serverar sajten i /public och några små API:er:
//   POST /api/interview/turn    ett steg i självintervjun (Workers AI)
//   POST /api/interview/draft   textförslag till utkastet (Workers AI)
//   POST /api/interview/finish  mejlar underlaget till Nordvy
//   POST /api/contact           mejlar kontaktformuläret till Nordvy
//   POST /api/review            mejlar ett omdöme från en besökare till Nordvy (visas först när kunden godkänt)

import { interviewTurn, draftCopy, packageFor } from './interview.js';
import { readReview, reviewMail } from './reviews.js';
import {
  PACKAGES,
  cleanText,
  cleanBrief,
  cleanIssues,
  cleanLog,
  missing,
  coreDone,
  briefToText,
  logToText,
  mailParts,
} from '../public/assets/shared/brief.js';

const MAX_BODY = 40_000;
// Så långt får ett mejl med intervjuunderlaget vara. Google-skriptet kapar vid 20 000 tecken.
const MAIL_CHARS = 19_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gäller Nordvys egna sidor. Demosidorna under /demo/ har egna inbäddade stilar och skript.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://app.cal.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://app.cal.com https://cal.com",
  // OpenStreetMap för kartan på kundsidor (Bas och Premium). Gratis och utan konto.
  "frame-src 'self' https://app.cal.com https://cal.com https://www.openstreetmap.org",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join('; ');

function secure(response, { csp = false } = {}) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  if (csp) headers.set('Content-Security-Policy', CSP);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data, status = 200) {
  return secure(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    }),
  );
}

function siteOrigin(request, env) {
  const fixed = String(env.SITE_URL || '').replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9.-]+$/i.test(fixed) ? fixed : new URL(request.url).origin;
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const data = JSON.parse(text);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function limited(request, env, bucket) {
  if (!env.RATE_LIMITER) return false;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  try {
    const { success } = await env.RATE_LIMITER.limit({ key: `${bucket}:${ip}` });
    return !success;
  } catch {
    return false;
  }
}

// Skickar ett mejl till Nordvys Gmail via Google Apps Script (se README).
async function sendMail(env, payload) {
  const endpoint = String(env.CONTACT_ENDPOINT || '');
  if (!endpoint.startsWith('https://script.google.com/')) return { ok: false, error: 'not_configured' };
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, website: '' }),
      redirect: 'follow',
    });
    const result = await upstream.json().catch(() => null);
    return upstream.ok && result?.ok ? { ok: true } : { ok: false, error: result?.error || 'send_failed' };
  } catch {
    return { ok: false, error: 'send_failed' };
  }
}

function readContact(input) {
  return {
    name: cleanText(input?.name, 100).replace(/\s+/g, ' '),
    email: cleanText(input?.email, 254),
    phone: cleanText(input?.phone, 40),
  };
}

async function handleContact(request, env) {
  const input = await readJson(request);
  if (!input) return json({ ok: false, error: 'invalid_request' }, 400);
  if (cleanText(input.website, 200)) return json({ ok: true }); // dolt fält som bara robotar fyller i
  const contact = readContact(input);
  if (!contact.name || !EMAIL.test(contact.email)) return json({ ok: false, error: 'invalid_request' }, 400);
  const result = await sendMail(env, {
    ...contact,
    company: cleanText(input.company, 120).replace(/\s+/g, ' '),
    package: cleanText(input.package, 40),
    message: cleanText(input.message, 1900),
  });
  return json(result, result.ok ? 200 : result.error === 'not_configured' ? 503 : 502);
}

// Bara kunder som har en omdomen.json i sin mapp tar emot omdömen. Det är så en kund "slår på" funktionen.
async function reviewsEnabled(env, url, site) {
  try {
    const probe = await env.ASSETS.fetch(new Request(new URL(`/kund/${site}/omdomen.json`, url.origin)));
    return probe.ok && (probe.headers.get('content-type') || '').includes('json');
  } catch {
    return false;
  }
}

async function handleReview(request, env, url) {
  const input = await readJson(request);
  if (!input) return json({ ok: false, error: 'invalid_request' }, 400);
  if (cleanText(input.website, 200)) return json({ ok: true }); // dolt fält som bara robotar fyller i
  const parsed = readReview(input);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  if (!(await reviewsEnabled(env, url, parsed.review.site))) return json({ ok: false, error: 'unknown_site' }, 404);
  const result = await sendMail(env, reviewMail(parsed.review));
  return json(result, result.ok ? 200 : result.error === 'not_configured' ? 503 : 502);
}

async function handleFinish(request, env) {
  const input = await readJson(request);
  if (!input) return json({ ok: false, error: 'invalid_request' }, 400);
  const contact = readContact(input.contact);
  if (!contact.name || !EMAIL.test(contact.email)) return json({ ok: false, error: 'invalid_contact' }, 400);
  const brief = cleanBrief(input.brief);
  const issues = cleanIssues(input.issues);
  const left = missing(brief);
  // Hela checklistan krävs, om inte kunden själv valt att skicka det som finns så här långt.
  if (left.length && !(input.partial === true && coreDone(brief))) {
    return json({ ok: false, error: 'incomplete', missing: left }, 400);
  }
  const pkg = packageFor(brief);
  const choice = ['uf', 'bas', 'premium', 'osaker'].includes(input.choice) ? input.choice : '';
  const head = left.length ? `OBS: Intervjun är inte komplett (${left.length} punkter saknas).\n\n` : '';
  const text = `${head}${briefToText(brief, issues, contact, choice)}\n\nORDAGRANN CHATT\n${logToText(cleanLog(input.log))}`;
  // Ett enda långt mejl. Kräver att Google-skriptet tar emot långa meddelanden
  // (clean(input.message, 20000) i stället för 2000, se README). Bara extremt långa chattar delas i två.
  const parts = mailParts(text, MAIL_CHARS, 2);
  let sent = 0;
  let error = '';
  for (const message of parts) {
    const result = await sendMail(env, {
      ...contact,
      company: brief.foretagsnamn || '',
      package: PACKAGES[choice]?.name || (choice === 'osaker' ? 'Vet inte än' : PACKAGES[pkg.id].name),
      message,
    });
    if (!result.ok) {
      error = result.error;
      break;
    }
    sent += 1;
  }
  if (!sent) return json({ ok: false, error: error || 'send_failed' }, error === 'not_configured' ? 503 : 502);
  return json({ ok: true, sent, parts: parts.length, package: pkg });
}

async function handleApi(request, env, url) {
  const path = url.pathname;
  if (path === '/api/health' && request.method === 'GET') {
    return json({ ok: true, ai: Boolean(env.AI), claude: Boolean(env.ANTHROPIC_API_KEY), groq: Boolean(env.GROQ_API_KEY), gemini: Boolean(env.GEMINI_API_KEY), egen: String(env.LOCAL_AI_URL || '').startsWith('https://'), mail: String(env.CONTACT_ENDPOINT || '').startsWith('https://') });
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!sameOrigin(request)) return json({ ok: false, error: 'forbidden' }, 403);

  if (path === '/api/contact' || path === '/api/interview/finish' || path === '/api/review') {
    if (await limited(request, env, 'mail')) return json({ ok: false, error: 'rate_limited' }, 429);
    if (path === '/api/review') return handleReview(request, env, url);
    return path === '/api/contact' ? handleContact(request, env) : handleFinish(request, env);
  }
  if (path === '/api/interview/turn' || path === '/api/interview/draft') {
    if (await limited(request, env, 'interview')) return json({ ok: false, error: 'rate_limited' }, 429);
    const body = await readJson(request);
    if (!body) return json({ ok: false, error: 'invalid_request' }, 400);
    const result = path.endsWith('/turn') ? await interviewTurn(env, body) : await draftCopy(env, body);
    return json(result, result.ok ? 200 : 400);
  }
  return json({ ok: false, error: 'not_found' }, 404);
}

function robots(origin) {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /demo/\n\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

function sitemap(origin) {
  const urls = ['/', '/intervju'].map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

async function handleAsset(request, env, url) {
  const response = await env.ASSETS.fetch(request);
  const type = response.headers.get('content-type') || '';
  const isDemo = url.pathname.startsWith('/demo/');
  if (!type.includes('text/html')) {
    const out = secure(response);
    if (response.ok && url.pathname.startsWith('/assets/')) {
      const long = /\.(woff2|webp|jpg|png|svg)$/.test(url.pathname);
      out.headers.set('Cache-Control', long ? 'public, max-age=2592000' : 'public, max-age=300, must-revalidate');
    }
    return out;
  }
  if (isDemo || !response.body || response.status === 304) return secure(response, { csp: !isDemo });
  // HTML-filerna innehåller __ORIGIN__ där en fullständig adress behövs (delningsbild, canonical).
  const html = (await response.text()).replaceAll('__ORIGIN__', siteOrigin(request, env));
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return secure(new Response(html, { status: response.status, headers }), { csp: true });
}

// Korta adresser till kundsidor, till exempel nordvyuf.se/reboarduf. Sidan visas på den korta
// adressen (adressfältet ändras inte), och dess filer hämtas som vanligt från /kund/<namn>/.
export const SHORT_PATHS = {
  reboarduf: '/kund/reboard/',
};

export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    const short = SHORT_PATHS[url.pathname.replace(/^\/|\/$/g, '').toLowerCase()];
    if (short && url.hostname !== 'www.nordvyuf.se') {
      url = new URL(short + url.search, url);
      request = new Request(url, request);
    }
    // www.nordvyuf.se skickas vidare till nordvyuf.se, med samma sökväg.
    if (url.hostname === 'www.nordvyuf.se') {
      url.hostname = 'nordvyuf.se';
      return Response.redirect(url.toString(), 301);
    }
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, url);
      if (url.pathname === '/robots.txt') return secure(robots(siteOrigin(request, env)));
      if (url.pathname === '/sitemap.xml') return secure(sitemap(siteOrigin(request, env)));
      return await handleAsset(request, env, url);
    } catch (error) {
      console.error('worker error', error?.stack || error);
      return json({ ok: false, error: 'server_error' }, 500);
    }
  },
};

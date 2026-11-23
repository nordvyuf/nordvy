// Projektbladet: det kunden ser bredvid chatten medan de svarar.
//
// I stället för en färdig låtsassida (som såg ut som en mall och lovade fel sak) visar bladet
// hur Nordvy har förstått företaget: namnet i det typsnitt vi tänker använda, färgerna, sidan
// del för del med kundens eget innehåll, och det vi behöver från dem. Det riktiga utkastet
// bygger Nordvy efter intervjun. Samma kod används i startsidans demo.

import { draftModel, hasValue, isSaknas, sellsOnlineOnly, recommendPackage } from './shared/brief.js';

// Typsnitt och färger per känsla. Samma val som utkasten använder, så att bladet visar riktningen.
const VIBES = {
  varm: { font: 'Young Serif', stack: '"Young Serif", Georgia, serif', bg: '#ffffff', soft: '#f1ebe4', ink: '#261c15', acc: '#7d3b22', words: 'Varm och personlig' },
  natur: { font: 'Newsreader', stack: '"Newsreader", Georgia, serif', bg: '#fbfbf8', soft: '#e7ece3', ink: '#1f2a22', acc: '#355e3f', words: 'Naturnära och lugn' },
  modern: { font: 'Space Grotesk', stack: '"Space Grotesk", system-ui, sans-serif', bg: '#ffffff', soft: '#eef0f4', ink: '#15181d', acc: '#2341c9', words: 'Ren och modern' },
  exklusiv: { font: 'Instrument Serif', stack: '"Instrument Serif", Georgia, serif', bg: '#f7f6f3', soft: '#e8e4de', ink: '#1c1a1a', acc: '#1c1a1a', words: 'Exklusiv' },
  lekfull: { font: 'Bricolage Grotesque', stack: '"Bricolage Grotesque", system-ui, sans-serif', bg: '#ffffff', soft: '#ffe58a', ink: '#1f1b3a', acc: '#5b34d6', words: 'Lekfull' },
};

const said = (b, k) => hasValue(b, k) && !isSaknas(b[k]);
const shorten = (s, n = 90) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
const has = (s, re) => re.test(String(s || '').toLocaleLowerCase('sv-SE'));

// Sidans delar i den ordning de troligen kommer, med kundens eget innehåll. Bara det vi vet visas.
export function sheetModel(brief = {}) {
  const b = brief;
  const m = draftModel(b);
  const vibe = VIBES[m.vibe] || VIBES.varm;
  const accent = m.accent?.acc && m.accent.acc !== vibe.acc ? m.accent.acc : vibe.acc;
  const online = sellsOnlineOnly(b);
  const parts = [];

  if (said(b, 'bransch') || said(b, 'mal_med_sidan')) {
    const what = said(b, 'mal_med_sidan') ? `Vad ni gör, och knappen "${m.cta}" direkt.` : 'Vad ni gör, sagt med en mening.';
    parts.push({ key: 'topp', name: 'Toppen', text: what });
  }
  const services = (m.services || []).map((s) => s.title).filter(Boolean);
  if (services.length) {
    const menu = has(b.bransch, /café|kafé|bageri|restaurang|meny/);
    const label = menu ? 'Menyn' : has(b.bransch, /frisör|salong|massage|klinik|behandling|tränare|pt\b/) ? 'Behandlingar och priser' : 'Det ni erbjuder';
    // "Damklippning 450 kr, herrklippning 350 kr" blir en prislista. Annars tjänsterna och priserna för sig.
    const priced = said(b, 'priser') ? String(b.priser).split(/[,;\n]|\soch\s/).map((t) => t.trim()).filter((t) => /\d/.test(t) && /[a-zåäö]{3}/i.test(t)) : [];
    if (priced.length >= 2) parts.push({ key: 'utbud', name: label, items: priced.slice(0, 5).map((t) => t.charAt(0).toUpperCase() + t.slice(1)) });
    else parts.push({ key: 'utbud', name: label, items: services.slice(0, 5), text: said(b, 'priser') ? `Priser: ${shorten(b.priser, 70)}` : '' });
  }
  if (m.features?.booking) parts.push({ key: 'boka', name: 'Bokning', text: 'Kunderna bokar tid direkt på sidan.' });
  else if (m.features?.shop || m.features?.payments || has(b.bestallning, /swish|kort|beställ/)) parts.push({ key: 'bestall', name: 'Beställning', text: said(b, 'bestallning') ? `Beställ direkt på sidan. Betalning: ${shorten(b.bestallning, 40)}.` : 'Beställ direkt på sidan.' });
  if (said(b, 'varfor_valja_oss')) parts.push({ key: 'varfor', name: 'Varför just ni', quote: shorten(b.varfor_valja_oss, 120) });
  if (!online && (m.city || said(b, 'oppettider'))) {
    const hours = (m.hours || []).slice(0, 2).join(', ');
    parts.push({ key: 'hitta', name: 'Hitta hit', text: [m.contact?.address || m.city, hours].filter(Boolean).join('. ') });
  }
  if (said(b, 'omdomen')) parts.push({ key: 'omdomen', name: 'Omdömen', text: 'Riktiga omdömen från era kunder.' });
  if (said(b, 'kontakt') || said(b, 'sociala_lankar')) {
    const ways = [m.contact?.phone && 'telefon', m.contact?.email && 'mejl', said(b, 'sociala_lankar') && shorten(b.sociala_lankar, 40)].filter(Boolean);
    parts.push({ key: 'kontakt', name: 'Kontakt', text: ways.length ? `Så når kunderna er: ${ways.join(', ')}.` : 'Så når kunderna er.' });
  }

  const need = [
    { key: 'logga', label: 'Er logga' },
    { key: 'bilder', label: 'Bilder på det ni gör' },
  ].map((n) => {
    if (!hasValue(b, n.key)) return { ...n, state: 'open', note: 'Frågar vi om snart' };
    if (isSaknas(b[n.key]) || has(b[n.key], /^(nej|inte än|inga)/)) return { ...n, state: 'gap', note: 'Vi hjälper er med det' };
    return { ...n, state: 'ok', note: 'Mejla till Nordvyuf@gmail.com' };
  });

  // Färger och typsnitt visas först när kunden har sagt något om känslan, så att inget ser bestämt ut i förväg.
  const chosen = said(b, 'stil');
  return {
    chosen,
    name: b.foretagsnamn || '',
    line: m.tagline || (said(b, 'bransch') ? shorten(b.bransch, 60) : ''),
    vibe: m.vibe || '',
    font: vibe.font,
    stack: vibe.stack,
    swatches: [
      { role: 'Accent', hex: chosen ? accent : '' },
      { role: 'Yta', hex: chosen ? vibe.soft : '' },
      { role: 'Text', hex: chosen ? vibe.ink : '' },
    ],
    mood: said(b, 'stil') ? shorten(b.stil, 70) : '',
    parts,
    need,
    pkg: recommendPackage(b).id,
  };
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

// Skapar bladet i container. update(brief) ritar om det, och det som är nytt eller ändrat
// sedan förra gången får en kort markering, så att kunden ser att svaret hamnade någonstans.
export function createSheet(container, { label = 'Projektblad' } = {}) {
  const root = el('article', 'pb');
  root.setAttribute('aria-label', label);
  container.append(root);
  let prev = new Map();
  let first = true;

  function update(brief, { animate = true, done = false } = {}) {
    const s = sheetModel(brief);
    const next = new Map();
    const mark = (node, key, value) => {
      next.set(key, value);
      if (animate && !first && prev.get(key) !== value) node.classList.add('pb-new');
      return node;
    };

    root.replaceChildren();
    root.dataset.vibe = s.vibe;
    // Kantlinjen och punkterna får kundens färg först när de har sagt något om känslan.
    if (s.chosen) root.style.setProperty('--pb-accent', s.swatches[0].hex);
    else root.style.removeProperty('--pb-accent');
    root.classList.toggle('pb-done', done);

    const top = el('header', 'pb-top');
    top.append(el('span', 'pb-label', label), el('span', `pb-status${done ? ' ok' : ''}`, done ? 'Redo att byggas' : 'Planeras just nu'));

    const head = el('div', 'pb-head');
    const name = el('h2', 'pb-name', s.name || 'Ert företag');
    // Namnet byter till det planerade typsnittet när känslan är vald. Det är bladets stora ögonblick.
    if (s.chosen) name.style.fontFamily = s.stack;
    if (!s.name) name.classList.add('pb-ghost');
    mark(name, 'name', `${s.name}|${s.chosen ? s.font : ''}`);
    head.append(name, mark(el('p', 'pb-line', s.line || 'Vad ni gör fylls i när ni svarar.'), 'line', s.line));
    if (!s.line) head.lastChild.classList.add('pb-ghost');

    const look = el('section', 'pb-look');
    const sw = el('div', 'pb-swatches');
    s.swatches.forEach((c, i) => {
      const chip = el('div', 'pb-swatch');
      if (c.hex) chip.style.setProperty('--c', c.hex);
      else chip.classList.add('pb-empty');
      chip.style.setProperty('--i', i);
      chip.append(el('i'), el('span', '', c.role), el('code', '', c.hex ? c.hex.toUpperCase() : 'Väljs snart'));
      sw.append(mark(chip, `sw${i}`, c.hex));
    });
    const type = el('div', `pb-type${s.chosen ? '' : ' pb-ghost'}`);
    const aa = el('span', 'pb-aa', 'Aa');
    if (s.chosen) aa.style.fontFamily = s.stack;
    type.append(aa, el('span', '', s.chosen ? s.font : 'Typsnittet väljer vi efter känslan'));
    mark(type, 'font', s.chosen ? s.font : '');
    const mood = el('p', `pb-mood${s.mood ? '' : ' pb-ghost'}`, s.mood ? `"${s.mood}"` : 'Känslan väljer ni längre fram.');
    look.append(el('h3', 'pb-h', 'Känslan'), sw, type, mark(mood, 'mood', s.mood));

    const plan = el('section', 'pb-plan');
    plan.append(el('h3', 'pb-h', 'Er sida, del för del'));
    const ol = el('ol', 'pb-parts');
    s.parts.forEach((p, i) => {
      const li = el('li', 'pb-part');
      li.style.setProperty('--i', i);
      const body = el('div', 'pb-body');
      body.append(el('b', '', p.name));
      if (p.items?.length) {
        const ul = el('ul', 'pb-items');
        p.items.forEach((t) => ul.append(el('li', '', t)));
        body.append(ul);
      }
      if (p.quote) body.append(el('q', '', p.quote));
      if (p.text) body.append(el('p', '', p.text));
      li.append(el('span', 'pb-n', String(i + 1)), body);
      ol.append(mark(li, `part:${p.key}`, JSON.stringify(p)));
    });
    // Platser för delarna som kommer, så att planen ser ut att växa och inte är tom.
    const ghosts = Math.max(0, 3 - s.parts.length);
    for (let i = 0; i < ghosts; i++) {
      const li = el('li', 'pb-part pb-slot');
      li.append(el('span', 'pb-n', String(s.parts.length + i + 1)), el('div', 'pb-body', 'Fylls i när du svarar'));
      ol.append(li);
    }
    plan.append(ol);

    const need = el('section', 'pb-need');
    need.append(el('h3', 'pb-h', 'Det vi behöver från er'));
    const nl = el('ul');
    s.need.forEach((n) => {
      const li = el('li', `pb-${n.state}`);
      li.append(el('i'), el('b', '', n.label), el('span', '', n.note));
      nl.append(mark(li, `need:${n.key}`, n.state));
    });
    need.append(nl);

    const foot = el('footer', 'pb-foot');
    foot.append(el('b', '', 'Nästa steg'), el('p', '', 'När intervjun är klar bygger vi ett riktigt utkast av er sida, för hand. Ni får en länk inom 2 vardagar.'));

    root.append(top, head, look, plan, need, foot);
    prev = next;
    first = false;
    // Markeringen tas bort efteråt, så att den spelas igen nästa gång samma del ändras.
    if (animate) setTimeout(() => root.querySelectorAll('.pb-new').forEach((n) => n.classList.remove('pb-new')), 2600);
  }

  return { root, update };
}

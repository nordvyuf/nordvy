// Ritar utkastet: en liten hemsida i ett webbläsarfönster.
// All text sätts med textContent, så inget kunden eller AI:n skriver kan bli HTML.
//
// Utkastet ska se ut som en riktig första skiss av kundens sida, inte som en mall:
// kundens egna tjänster, tider och kontaktuppgifter, typografi som följer stilen
// (data-vibe) och en tydlig plats för kundens egna bilder. Inga ritade illustrationer,
// inga numrerade kort och inga påhittade siffror (se .claude/skills/kundsida/design.md).

import { INDUSTRIES, slugify, capitalize } from './shared/brief.js';

function el(tag, cls, ...children) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  for (const child of children) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

const sk = (width) => {
  const s = el('span', 'pv-sk');
  s.style.width = width;
  return s;
};

// Text eller grå väntrader om texten saknas.
function slot(tag, cls, text, widths) {
  const node = el(tag, cls);
  if (text) node.textContent = text;
  else {
    node.classList.add('pv-wait');
    for (const w of widths) node.append(sk(w));
  }
  return node;
}

// Vad sektionen med tjänster heter, och vilken bild som hör hemma i toppen.
const LIST_TITLE = { frisor: 'Behandlingar', cafe: 'Meny', hantverk: 'Det här gör vi', butik: 'Sortiment', halsa: 'Det här erbjuder vi', tjanst: 'Tjänster' };
const PHOTO = {
  frisor: 'salongen och era kunders frisyrer',
  cafe: 'fikat, disken och lokalen',
  hantverk: 'era arbeten, före och efter',
  butik: 'produkterna, nära och i rätt ljus',
  halsa: 'lokalen och personerna bakom',
  tjanst: 'personerna bakom företaget',
};

// Säljer kunden saker heter listan "Sortiment", oavsett bransch.
// Ett café har alltid en meny, även om man kan beställa tårta.
const sellsThings = (m) => Boolean((m.online || m.features?.shop) && m.industry !== 'cafe');
const listTitle = (m) => (sellsThings(m) ? 'Sortiment' : LIST_TITLE[m.industry] || 'Tjänster');

function navLinks(m) {
  const links = [];
  if (m.services?.length) links.push(listTitle(m));
  if (m.hours?.length) links.push('Öppettider');
  links.push('Kontakt');
  return links;
}

// Det besökaren ska kunna göra, visat i liten skala så att kunden ser sidan arbeta:
// tider att boka, en beställning, ett offertformulär eller ett kontaktformulär.
// Betalning visas bara om kunden bett om det. Inga påhittade priser.
const field = (label, wide) => el('span', `pv-field${wide ? ' wide' : ''}`, label);

function actionBlock(m) {
  const f = m.features || {};
  const first = (m.services || [])[0]?.title;
  let title;
  let text;
  let demo;
  if (f.booking) {
    title = m.industry === 'cafe' ? 'Boka bord' : 'Boka tid';
    text = f.payments ? 'Välj en tid och betala med Swish när du bokar.' : 'Välj en tid. Bekräftelsen kommer på mejl.';
    const times = el('div', 'pv-times');
    ['09.00', '10.30', '13.00', '15.30'].forEach((t, i) => times.append(el('span', i === 1 ? 'on' : '', t)));
    demo = el('div', 'pv-demo', el('p', 'pv-demo-h', `${first || 'Tid'}, torsdag`), times);
  } else if (f.shop) {
    title = f.payments ? 'Handla direkt på sidan' : 'Beställ direkt på sidan';
    text = f.payments ? 'Välj det du vill ha och betala med Swish.' : 'Välj det du vill ha, så bekräftar vi beställningen på mejl.';
    const rows = el('div', 'pv-order');
    for (const s of (m.services || []).slice(0, 2)) rows.append(el('p', '', el('span', '', s.title), el('b', '', '1 st')));
    demo = el('div', 'pv-demo', rows, field('Din e-post', true));
  } else if (m.industry === 'hantverk') {
    title = 'Begär offert';
    text = 'Beskriv jobbet med några rader, så hör vi av oss.';
    demo = el('div', 'pv-demo pv-form', field('Namn'), field('Telefon'), field('Vad gäller jobbet?', true));
  } else {
    title = 'Hör av dig';
    text = 'Ring, mejla eller skriv direkt här.';
    demo = el('div', 'pv-demo pv-form', field('Namn'), field('E-post'), field('Meddelande', true));
  }
  // Knappen sitter i formuläret. Samma knapp finns redan i toppen, så den upprepas inte som en egen rad.
  demo.append(el('span', 'pv-btn', title));
  return el('div', 'pv-act', el('div', '', el('h3', 'pv-h2', title), el('p', 'pv-mut', text)), demo);
}

function serviceList(m) {
  const list = el('ul', 'pv-list');
  const items = m.services?.length ? m.services.slice(0, 5) : [null, null, null];
  for (const s of items) {
    const li = el('li', '');
    li.append(slot('b', '', s?.title, ['9em']));
    // Beskrivning bara när den finns. Vi hittar aldrig på en.
    if (!s) li.append(slot('span', 'pv-mut', '', ['14em']));
    else if (s.text) li.append(el('span', 'pv-mut', s.text));
    list.append(li);
  }
  return list;
}

// Produkter: en bildplats och namnet för varje, upp till fyra.
function productGrid(m) {
  const grid = el('div', 'pv-products');
  const items = m.services?.length ? m.services.slice(0, 4) : [null, null, null];
  for (const s of items) grid.append(el('div', 'pv-product', el('div', 'pv-thumb'), slot('b', '', s?.title, ['8em']), s?.text ? el('span', 'pv-mut', s.text) : null));
  return el('div', 'pv-sec', el('h3', 'pv-h2 pv-gap', listTitle(m)), grid);
}

// Hantverkare visar sina arbeten: en plats för före och en för efter.
function beforeAfter() {
  const pair = el('div', 'pv-pair', el('div', 'pv-thumb', el('span', '', 'Före')), el('div', 'pv-thumb', el('span', '', 'Efter')));
  return el('div', 'pv-sec', el('h3', 'pv-h2 pv-gap', 'Före och efter'), pair, el('p', 'pv-mut pv-small', 'Här kommer bilder från era egna jobb.'));
}

function infoBlock(m) {
  const c = m.contact || {};
  const wrap = el('div', 'pv-info');
  // Utan öppettider står kundens egna ord bredvid kontakten, så att halva raden inte blir tom.
  if (!m.hours?.length && m.about) wrap.append(el('p', 'pv-about-side', m.about));
  const contact = el('div', '', el('h4', '', 'Kontakt'));
  for (const v of [c.phone, c.email, c.address, m.instagram]) if (v) contact.append(el('p', '', v));
  wrap.append(contact);
  if (m.hours?.length) {
    const table = el('div', 'pv-hours', el('h4', '', 'Öppettider'));
    for (const h of m.hours) {
      const parts = h.match(/^(\D+?)\s+(\d.*)$/);
      const t = (x) => x.replace(/(\d)\s*-\s*(\d)/g, '$1–$2').replace(/([a-zåäö])-([a-zåäö])/gi, '$1–$2');
      table.append(parts ? el('p', '', el('span', '', t(capitalize(parts[1].trim()))), el('b', '', t(parts[2].trim()))) : el('p', '', capitalize(h)));
    }
    wrap.append(table);
  }
  return wrap;
}

/**
 * Ritar utkastet i `frame` (elementet med klassen pv-frame).
 * Fält som saknas i `model` visas som grå väntrader, så samma funktion
 * används både under intervjun och för det färdiga utkastet.
 */
export function renderPreview(frame, model, { animate = true } = {}) {
  const m = model || {};
  const prev = frame._pvModel || {};
  const fresh = (key) => animate && m[key] && JSON.stringify(m[key]) !== JSON.stringify(prev[key]);
  const mark = (node, ...keys) => {
    if (keys.some(fresh)) node.classList.add('pv-new');
    return node;
  };
  const industry = m.industry && INDUSTRIES[m.industry] ? m.industry : null;

  const root = el('div', 'pv');
  root.dataset.vibe = m.vibe || 'varm';
  // Färgen som kunden själv nämnde blir accentfärgen.
  if (m.accent?.acc) {
    root.style.setProperty('--pv-acc', m.accent.acc);
    root.style.setProperty('--pv-acc-ink', m.accent.ink || '#fff');
  }
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', m.company ? `Utkast till hemsida för ${m.company}` : 'Utkast till hemsida');

  // Sidhuvud: namnet som ordmärke, länkar efter innehållet och en knapp.
  const nav = el('div', 'pv-nav', mark(slot('span', 'pv-name', m.company, ['7em']), 'company'));
  const links = el('div', 'pv-links');
  for (const l of navLinks(m)) links.append(el('span', '', l));
  nav.append(links, m.cta ? mark(el('span', 'pv-btn', m.cta), 'cta') : sk('6em'));

  // Toppen: rubrik och text till vänster, plats för kundens bild till höger.
  const copy = el(
    'div',
    'pv-copy',
    mark(slot('div', 'pv-h1', m.headline, ['92%', '64%']), 'headline'),
    mark(slot('p', 'pv-sub', m.sub, ['100%', '80%']), 'sub'),
  );
  const cta = el('div', 'pv-cta');
  if (m.cta) cta.append(mark(el('span', 'pv-btn', m.cta), 'cta'));
  else cta.append(sk('8em'));
  copy.append(cta);
  // En siffra utan sammanhang ("3 år") säger inget. Visa bara erfarenhet som går att förstå.
  const since = m.since && !/^\d+\s*(år|månader|veckor)$/i.test(m.since) ? m.since : '';
  // Tankstreck i tidsintervall: 10–18, inte 10-18.
  const dash = (t) => String(t).replace(/(\d)\s*-\s*(\d)/g, '$1–$2').replace(/([a-zåäö])-([a-zåäö])/gi, '$1–$2');
  const facts = [m.city, since, m.hours?.[0] && dash(m.hours[0])].filter(Boolean);
  if (facts.length > 1) copy.append(mark(el('p', 'pv-facts', ...facts.slice(0, 3).map((t) => el('span', '', t))), 'since', 'city', 'hours'));

  // Tills kundens bilder finns: en bildram som säger vilken bild som ska dit.
  const photo = el(
    'div',
    'pv-photo',
    el('span', 'pv-note', el('b', '', 'Här kommer era egna bilder'), industry ? PHOTO[industry] : ''),
  );
  if (fresh('industry') || fresh('vibe')) photo.classList.add('pv-new');
  root.append(nav, el('div', 'pv-hero', copy, photo));

  // Sektionerna. Ordningen och formen beror på vad kunden säljer, så att ett café,
  // en snickare och en butik inte får samma sida med nya färger.
  const sells = sellsThings(m);
  const sections = {
    // Tjänster som en lista. Säljer kunden saker blir det produkter med en bildplats var.
    list: () => mark(sells ? productGrid(m) : el('div', 'pv-sec pv-split', el('h3', 'pv-h2', listTitle(m)), serviceList(m)), 'services'),
    action: () => m.features && mark(el('div', 'pv-sec', actionBlock(m)), 'features'),
    about: () => m.about && (m.hours?.length || !m.contact) && mark(el('div', 'pv-sec pv-about', el('p', '', m.about)), 'about'),
    info: () => (m.contact || m.hours) && mark(el('div', 'pv-sec', infoBlock(m)), 'contact', 'hours', 'about'),
    work: () => beforeAfter(),
  };
  const ORDER = {
    cafe: ['info', 'list', 'action', 'about'],
    hantverk: ['list', 'work', 'action', 'about', 'info'],
    halsa: ['about', 'list', 'action', 'info'],
  };
  for (const key of ORDER[industry] || ['list', 'action', 'about', 'info']) {
    const node = sections[key]();
    if (node) root.append(node);
  }

  const foot = el('div', 'pv-foot', el('span', '', m.company || 'Ditt företag'));
  if (m.city) foot.append(el('span', '', m.city));
  foot.append(el('span', 'pv-mark', 'Utkast från Nordvys självintervju'));
  root.append(foot);

  frame._pvModel = JSON.parse(JSON.stringify(m));
  frame.replaceChildren(root);
  return root;
}

// Webbläsarfönstret runt utkastet. Returnerar { window, frame, setUrl }.
export function createWindow(company) {
  const url = el('span', 'pv-url');
  const frame = el('div', 'pv-frame');
  const win = el('div', 'pv-window', el('div', 'pv-chrome', el('i'), el('i'), el('i'), url), frame);
  const setUrl = (name) => {
    url.textContent = `${slugify(name)}.se`;
  };
  setUrl(company);
  return { window: win, frame, setUrl };
}

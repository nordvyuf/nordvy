// Ritar utkastet: en liten hemsida i ett webbläsarfönster.
// All text sätts med textContent, så inget kunden eller AI:n skriver kan bli HTML.

import { INDUSTRIES, slugify, capitalize } from './shared/brief.js';
import { sceneSvg } from './scenes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Ikoner från Lucide (ISC-licens), förenklade till rena former.
const ICONS = {
  frisor: [['circle', { cx: 6, cy: 6, r: 3 }], ['path', { d: 'M8.12 8.12 12 12' }], ['path', { d: 'M20 4 8.12 15.88' }], ['circle', { cx: 6, cy: 18, r: 3 }], ['path', { d: 'M14.8 14.8 20 20' }]],
  cafe: [['path', { d: 'M10 2v2' }], ['path', { d: 'M14 2v2' }], ['path', { d: 'M6 2v2' }], ['path', { d: 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1' }]],
  hantverk: [['path', { d: 'm15 12-8.373 8.373a1 1 0 1 1-3-3L12 9' }], ['path', { d: 'm18 15 4-4' }], ['path', { d: 'm21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5' }]],
  butik: [['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' }], ['path', { d: 'M3 6h18' }], ['path', { d: 'M16 10a4 4 0 0 1-8 0' }]],
  halsa: [['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' }], ['path', { d: 'M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27' }]],
  tjanst: [['path', { d: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }], ['rect', { width: 20, height: 14, x: 2, y: 6, rx: 2 }]],
  calendar: [['path', { d: 'M8 2v4' }], ['path', { d: 'M16 2v4' }], ['rect', { width: 18, height: 18, x: 3, y: 4, rx: 2 }], ['path', { d: 'M3 10h18' }]],
  card: [['rect', { width: 20, height: 14, x: 2, y: 5, rx: 2 }], ['path', { d: 'M2 10h20' }]],
  pin: [['path', { d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' }], ['circle', { cx: 12, cy: 10, r: 3 }]],
  phone: [['path', { d: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384' }]],
  check: [['path', { d: 'M20 6 9 17l-5-5' }]],
  mail: [['rect', { width: 20, height: 16, x: 2, y: 4, rx: 2 }], ['path', { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 6v6l4 2' }]],
  star: [['path', { d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' }]],
  insta: [['rect', { width: 20, height: 20, x: 2, y: 2, rx: 5 }], ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37' }], ['path', { d: 'M17.5 6.5h.01' }]],
  bag: [['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' }], ['path', { d: 'M3 6h18' }], ['path', { d: 'M16 10a4 4 0 0 1-8 0' }]],
};

export function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of ICONS[name] || ICONS.tjanst) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svg.append(node);
  }
  return svg;
}

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

// Text eller en grå väntrad om texten saknas.
function slot(tag, cls, text, widths) {
  const node = el(tag, cls);
  if (text) node.textContent = text;
  else {
    node.style.display = 'grid';
    node.style.gap = '0.5em';
    for (const w of widths) node.append(sk(w));
  }
  return node;
}

function featureBand(m) {
  const f = m.features || {};
  const title = el('div');
  const widget = el('div', 'pv-widget');
  if (f.booking) {
    title.append(el('h3', 'pv-h2', m.industry === 'cafe' ? 'Boka bord' : 'Boka direkt'), el('p', '', f.payments ? 'Välj en tid och betala när du bokar.' : 'Välj en tid som passar. Bekräftelsen kommer på mejl.'));
    const days = el('div', 'pv-row');
    ['Mån', 'Tis', 'Ons', 'Tor', 'Fre'].forEach((d, i) => days.append(el('span', `pv-pill${i === 2 ? ' on' : ''}`, d)));
    const times = el('div', 'pv-row');
    ['09:00', '10:30', '13:00', '15:30'].forEach((t, i) => times.append(el('span', `pv-pill${i === 1 ? ' on' : ''}`, t)));
    widget.append(days, times);
    if (f.payments) widget.append(el('div', 'pv-pay', icon('card'), 'Betala med Swish eller kort'));
  } else if (f.shop) {
    // Betalning visas bara om kunden bett om det. Annars är det en beställning som bekräftas på mejl.
    title.append(
      el('h3', 'pv-h2', f.payments ? 'Handla online' : 'Beställ direkt'),
      el('p', '', f.payments ? 'Lägg i varukorgen och betala tryggt direkt på sidan.' : 'Välj det du vill ha och skicka beställningen direkt från sidan.'),
    );
    const list = el('div', 'pv-menu');
    (m.services || []).slice(0, 3).forEach((s) => list.append(el('div', '', s.title, el('small', '', f.payments ? 'Lägg i korg' : 'Beställ'))));
    widget.append(list, f.payments ? el('div', 'pv-pay', icon('card'), 'Betala med Swish eller kort') : el('div', 'pv-pay', icon('mail'), 'Bekräftelse på mejl'));
  } else if (f.menu) {
    title.append(el('h3', 'pv-h2', m.industry === 'cafe' ? 'Dagens meny' : 'Priser'), el('p', '', 'Alltid uppdaterad, lätt att läsa i mobilen.'));
    const list = el('div', 'pv-menu');
    (m.services || []).slice(0, 3).forEach((s) => list.append(el('div', '', s.title, el('small', '', 'Se pris'))));
    widget.append(list);
    if (f.map) widget.append(el('div', 'pv-pay', icon('pin'), m.city ? `Hitta till oss i ${m.city}` : 'Hitta hit'));
  } else {
    title.append(el('h3', 'pv-h2', m.industry === 'hantverk' ? 'Begär offert' : 'Hör av dig'), el('p', '', 'Skriv några rader så återkommer vi snabbt.'));
    const rows = el('div', 'pv-row');
    rows.append(el('span', 'pv-pill on', 'Ring oss'), el('span', 'pv-pill', 'Skicka mejl'));
    widget.append(rows, el('div', 'pv-pay', icon(f.map ? 'pin' : 'phone'), f.map && m.city ? `Hitta till oss i ${m.city}` : 'Svar inom en arbetsdag'));
  }
  return el('div', 'pv-band', title, widget);
}

function chips(m) {
  const f = m.features || {};
  const a = f.booking ? ['calendar', 'Boka online'] : f.shop ? ['bag', f.payments ? 'Handla online' : 'Beställ online'] : f.menu ? ['check', 'Meny och priser'] : ['phone', 'Lätt att nå'];
  const b = f.payments ? ['card', 'Swish och kort'] : m.city && !m.online ? ['pin', m.city] : ['check', 'Fungerar i mobilen'];
  return [el('span', 'pv-chip a', icon(a[0]), a[1]), el('span', 'pv-chip b', icon(b[0]), b[1])];
}

const SECTION_TITLE = {
  frisor: 'Behandlingar',
  cafe: 'Det här bjuder vi på',
  hantverk: 'Det här gör vi',
  butik: 'Ur sortimentet',
  halsa: 'Så hjälper vi dig',
  tjanst: 'Det här hjälper vi dig med',
};

function contactBlock(m) {
  const c = m.contact || {};
  const card = el('div', 'pv-info');
  card.append(el('h4', '', 'Kontakt'));
  const rows = el('div', 'pv-rows');
  if (c.phone) rows.append(el('div', 'pv-row2', icon('phone'), c.phone));
  if (c.email) rows.append(el('div', 'pv-row2', icon('mail'), c.email));
  if (c.address) rows.append(el('div', 'pv-row2', icon('pin'), c.address));
  if (m.instagram) rows.append(el('div', 'pv-row2', icon('insta'), m.instagram));
  card.append(rows);
  return card;
}

function hoursBlock(m) {
  const card = el('div', 'pv-info');
  card.append(el('h4', '', 'Öppettider'));
  const rows = el('div', 'pv-rows');
  for (const h of m.hours) {
    const parts = h.match(/^(\D+?)\s+(\d.*)$/);
    if (parts) rows.append(el('div', 'pv-hour', el('span', '', capitalize(parts[1].trim())), el('b', '', parts[2].trim())));
    else rows.append(el('div', 'pv-hour', el('span', '', capitalize(h))));
  }
  card.append(rows);
  return card;
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
  const mark = (node, key) => {
    if (fresh(key)) node.classList.add('pv-new');
    return node;
  };
  const industry = m.industry && INDUSTRIES[m.industry] ? m.industry : null;

  const root = el('div', 'pv');
  root.dataset.vibe = m.vibe || 'varm';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', m.company ? `Utkast till hemsida för ${m.company}` : 'Utkast till hemsida');

  const logo = el('div', 'pv-logo', el('span', 'pv-mark', icon(industry || 'tjanst')));
  logo.append(mark(slot('span', '', m.company, ['7em']), 'company'));
  const nav = el('div', 'pv-nav', logo, el('div', 'pv-links', el('span', '', 'Tjänster'), el('span', '', 'Om oss'), el('span', '', 'Kontakt')));
  nav.append(m.cta ? mark(el('span', 'pv-btn', m.cta), 'cta') : sk('6em'));

  const copy = el(
    'div',
    'pv-copy',
    mark(slot('div', 'pv-eyebrow', m.tagline, ['9em']), 'tagline'),
    mark(slot('div', 'pv-h1', m.headline, ['92%', '64%']), 'headline'),
    mark(slot('div', 'pv-sub', m.sub, ['100%', '86%']), 'sub'),
  );
  const cta = el('div', 'pv-cta');
  if (m.cta) cta.append(mark(el('span', 'pv-btn', m.cta), 'cta'), el('span', 'pv-btn ghost', 'Läs mer'));
  else cta.append(sk('8em'));
  copy.append(cta);

  const facts = [];
  if (m.since) facts.push(['star', m.since]);
  if (m.city) facts.push(['pin', m.city]);
  if (m.hours?.[0]) facts.push(['clock', m.hours[0]]);
  if (facts.length) {
    const row = el('div', 'pv-facts');
    for (const [ic, text] of facts.slice(0, 3)) row.append(el('span', '', icon(ic), text));
    copy.append(mark(row, 'since'));
  }

  const art = el('div', 'pv-art');
  art.insertAdjacentHTML('beforeend', sceneSvg(industry || 'tjanst'));
  if (m.features) art.append(...chips(m));
  if (fresh('industry') || fresh('vibe')) art.classList.add('pv-new');

  root.append(nav, el('div', 'pv-hero', copy, art));

  const cards = el('div', 'pv-cards');
  const services = m.services?.length ? m.services : [null, null, null];
  services.slice(0, 3).forEach((s, i) => {
    const card = el('div', 'pv-card', el('div', 'pv-dot', String(i + 1)));
    card.append(slot('h4', '', s?.title, ['70%']), slot('p', '', s?.text, ['100%', '60%']));
    if (s && fresh('services')) {
      card.classList.add('pv-new');
      card.style.animationDelay = `${i * 90}ms`;
    }
    cards.append(card);
  });
  root.append(el('div', 'pv-sec', el('h3', 'pv-h2', SECTION_TITLE[industry || 'tjanst']), cards));

  if (m.features) root.append(mark(el('div', 'pv-sec', featureBand(m)), 'features'));
  if (m.about) {
    const quote = el('div', 'pv-quote', m.about, el('small', '', `Därför ${m.company || 'vi'}`));
    root.append(mark(el('div', 'pv-sec', quote), 'about'));
  }
  if (m.contact || m.hours) {
    const grid = el('div', 'pv-infos');
    if (m.contact) grid.append(contactBlock(m));
    if (m.hours) grid.append(hoursBlock(m));
    const sec = el('div', 'pv-sec', el('h3', 'pv-h2', m.online || !(m.hours || m.contact?.address) ? 'Hör av dig' : 'Hitta hit och hör av dig'), grid);
    root.append(mark(sec, m.contact ? 'contact' : 'hours'));
  }
  root.append(el('div', 'pv-foot', el('span', '', [m.company || 'Ditt företag', m.city].filter(Boolean).join(' · ')), el('span', '', 'Utkast från Nordvys självintervju')));

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

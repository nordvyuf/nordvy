// Startsidan: meny, animationer, demon i toppen, demominiatyrerna och kontaktformuläret.

import { createSheet } from './projektblad.js';
import { FIELD } from './shared/brief.js';
import { bindBookingLinks } from './cal.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Tre påhittade intervjuer som spelas upp i toppen. Projektbladet ritas av samma kod
// som i den riktiga självintervjun, så det som visas är det kunden faktiskt ser.
const DEMOS = [
  { foretagsnamn: 'Salong Ask', foretagstyp: 'Butik, café eller salong', bransch: 'Frisörsalong', ort_omrade: 'Malmö', tjanster_produkter: 'Klippning, färg och slingor, bryn och fransar', priser: 'Klippning 520 kr, färg från 950 kr, bryn och fransar 350 kr', mal_med_sidan: 'Boka tid', stil: 'Exklusiv' },
  { foretagsnamn: 'Bageri Solkorn', foretagstyp: 'Butik, café eller salong', bransch: 'Surdegsbageri och kafé', ort_omrade: 'Malmö', tjanster_produkter: 'Surdegsbröd, bullar, lunch', priser: 'Surdegslimpa 65 kr, kardemummabulle 35 kr, lunch 115 kr', mal_med_sidan: 'Hitta information, se meny', stil: 'Varm och personlig' },
  { foretagsnamn: 'Fogen Snickeri', bransch: 'Snickerifirma', ort_omrade: 'Skåne', tjanster_produkter: 'Kök, badrum, altaner', mal_med_sidan: 'Ringa eller mejla, begära offert', stil: 'Ren och modern' },
];

/* ------------------------------------------------------------ sidhuvud */

const head = $('#head');
const nav = $('#nav');
const burger = $('.burger');
const closeNav = () => {
  nav.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
};
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', String(nav.classList.toggle('open'))));
nav.addEventListener('click', (e) => e.target.closest('a') && closeNav());
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    closeNav();
    burger.focus();
  }
});

const navLinks = $$('.nav a');
const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${entry.target.id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('main section[id]').forEach((s) => spy.observe(s));

/* --------------------------------------------------------- animationer */

if (!reduced) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  $$('.rv').forEach((el) => io.observe(el));
}

const heroImg = $('.hero-media img');
const hero = $('.hero');
const tl = $('#tl');
const tlItems = $$('.tl li');
const mbar = $('#mbar');
const contact = $('#kontakt');
let ticking = false;

function frame() {
  ticking = false;
  const y = scrollY;
  head.classList.toggle('solid', y > 24);

  if (!reduced && y < hero.offsetHeight) {
    heroImg.style.setProperty('--hy', `${Math.round(y * 0.18)}px`);
    heroImg.style.setProperty('--hs', (1.04 + y / 9000).toFixed(4));
  }

  const r = tl.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.62 - r.top) / r.height));
  tl.style.setProperty('--p', reduced ? 1 : p.toFixed(3));
  const line = r.top + r.height * (reduced ? 1 : p);
  for (const li of tlItems) li.classList.toggle('lit', li.getBoundingClientRect().top + 20 <= line);

  const c = contact.getBoundingClientRect();
  mbar.classList.toggle('show', y > hero.offsetHeight * 0.7 && c.top > innerHeight * 0.6);
}
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  },
  { passive: true },
);
addEventListener('resize', frame);
frame();

// Ljuset på korten följer pekaren.
document.addEventListener(
  'pointermove',
  (e) => {
    const card = e.target.closest?.('.glow');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  },
  { passive: true },
);

/* ------------------------------------------------------ demon i toppen */

async function heroDemo() {
  const stage = $('#demo-stage');
  const chat = $('#demo-chat');
  const site = $('#demo-site');
  const label = $('#demo-label');
  if (!stage) return;
  const sheet = createSheet(site);

  if (reduced) {
    sheet.update(DEMOS[0], { animate: false });
    stage.classList.add('show-site');
    label.textContent = `Planen för ${DEMOS[0].foretagsnamn}`;
    return;
  }

  let onScreen = false;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.2 }).observe(stage);
  const whenVisible = async () => {
    while (!onScreen || document.hidden) await sleep(400);
  };
  const say = async (text) => {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text;
    chat.append(b);
    await sleep(900);
  };
  const type = async (text) => {
    const b = document.createElement('div');
    b.className = 'bubble me caret';
    chat.append(b);
    for (const ch of text) {
      b.textContent += ch;
      await sleep(38 + Math.random() * 40);
    }
    b.classList.remove('caret');
    await sleep(650);
  };

  for (let i = 0; ; i++) {
    const d = DEMOS[i % DEMOS.length];
    await whenVisible();
    stage.classList.remove('show-site');
    await sleep(500);
    chat.replaceChildren();
    label.textContent = 'Du svarar. Planen tar form.';
    await say(FIELD.foretagsnamn.question);
    await type(d.foretagsnamn);
    await say(FIELD.bransch.question);
    await type(`${d.bransch} i ${d.ort_omrade}`);
    // Först det kunden har sagt om företaget, sedan känslan: färgerna och typsnittet byts in.
    const { stil, ...early } = d;
    sheet.update(early, { animate: false });
    stage.classList.add('show-site');
    label.textContent = 'Planen tar form';
    await sleep(1800);
    sheet.update(d, { animate: true });
    label.textContent = `Planen för ${d.foretagsnamn}`;
    await sleep(5200);
  }
}
heroDemo();

/* ------------------------------------------------------ demominiatyrer */

// Demosidorna visas i förminskade fönster. De ritas i 1280 px bredd och skalas ner.
const fit = new ResizeObserver((entries) => {
  for (const entry of entries) entry.target.style.setProperty('--s', (entry.contentRect.width / 1280).toFixed(4));
});
$$('.shot-frame').forEach((el) => fit.observe(el));

/* ---------------------------------------------------- kontaktformulär */

$$('[data-pkg]').forEach((a) =>
  a.addEventListener('click', () => {
    $('#f-package').value = a.dataset.pkg;
  }),
);

const form = $('#contact-form');
const status = $('#contact-status');

function mailFallback(text) {
  const body = encodeURIComponent(
    `Namn: ${form.name.value}\nFöretag: ${form.company.value}\nTelefon: ${form.phone.value}\nPaket: ${form.package.value}\n\n${form.message.value}`,
  );
  const a = document.createElement('a');
  a.href = `mailto:Nordvyuf@gmail.com?subject=${encodeURIComponent('Förfrågan via nordvy')}&body=${body}`;
  a.textContent = 'Öppna ett färdigt mejl';
  status.replaceChildren(`${text} `, a, '.');
  status.classList.add('bad');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.replaceChildren();
  status.classList.remove('bad');
  const checks = [
    ['name', 'Skriv ditt namn.', (v) => v.length > 0],
    ['email', 'Skriv en giltig e-postadress.', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)],
    ['message', 'Skriv några rader om vad du behöver.', (v) => v.length > 0],
  ];
  let firstBad = null;
  for (const [id, message, ok] of checks) {
    const input = $(`#f-${id}`);
    const bad = !ok(input.value.trim());
    input.setAttribute('aria-invalid', String(bad));
    $(`#e-${id}`).textContent = bad ? message : '';
    if (bad && !firstBad) firstBad = input;
  }
  if (firstBad) return firstBad.focus();

  const button = $('button[type=submit]', form);
  button.disabled = true;
  status.textContent = 'Skickar…';
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.ok) {
      status.textContent = 'Tack! Vi har tagit emot ditt meddelande och hör av oss.';
      form.reset();
    } else {
      mailFallback('Det gick inte att skicka just nu, så inget har skickats.');
    }
  } catch {
    mailFallback('Det gick inte att skicka just nu, så inget har skickats.');
  } finally {
    button.disabled = false;
  }
});

bindBookingLinks();

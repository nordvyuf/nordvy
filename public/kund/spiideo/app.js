// Spiideo (utkast) – exempelbilder, meny, produktval, kundtyp till offerten, demobokning och offertförfrågan.
//
// Bilder: sidan visas med platshållare. ?exempelbilder visar lånade Unsplash-foton, bara för att
// Nordvy ska kunna bedöma layouten. Kundens egna foton ersätter dem.
// Bokning: skarp sida kopplar kundens eget Cal.com-konto med kundens färg. I utkastet öppnas en ruta.
// Offert: skarp sida öppnar ett färdigskrivet mejl till contact@spiideo.com. I utkastet skickas inget.

import { bindBookingLinks } from '/assets/cal.js';

const DRAFT = true;
const EMAIL = 'contact@spiideo.com';
const BRAND = '#0F6B47';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/* ---------------------------------------------------------------- exempelbilder */

if (new URLSearchParams(location.search).has('exempelbilder')) document.body.classList.remove('no-photos');

/* ---------------------------------------------------------------- meny (mobil) */

const menuBtn = $('.menu-btn');
const menuLabel = $('.menu-label');
const nav = $('#meny');
const mobile = matchMedia('(max-width:760px)');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? 'Stäng' : 'Meny';
  nav.hidden = mobile.matches && !open;
}
setMenu(false);
mobile.addEventListener('change', () => setMenu(false));
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a') && mobile.matches) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
});

/* ---------------------------------------------------------------- produktval */

for (const btn of $$('.plist button')) {
  btn.addEventListener('click', () => {
    for (const b of $$('.plist button')) b.setAttribute('aria-pressed', String(b === btn));
    $('#screenName').textContent = btn.dataset.prod;
  });
}

/* ---------------------------------------------------------------- kundtyp till offerten */

for (const pick of $$('.pick')) {
  pick.addEventListener('click', () => {
    const radio = $(`input[name="org"][value="${pick.dataset.org}"]`);
    radio.checked = true;
    clearError('eOrg');
    $('#kontakt').scrollIntoView({ behavior: smooth() });
    radio.focus({ preventScroll: true });
  });
}

/* ---------------------------------------------------------------- demobokning */

if (DRAFT) {
  const dlg = $('#booking');
  let opener = null;
  for (const link of $$('a[data-cal]')) {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      if (mobile.matches) setMenu(false);
      opener = link.offsetParent ? link : menuBtn;
      dlg.showModal();
    });
  }
  $('#bClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => opener?.focus());
} else {
  bindBookingLinks(document, { theme: 'light', brand: BRAND });
}

/* ---------------------------------------------------------------- offertförfrågan */

const form = $('#offert');
const result = $('#fResult');

// Startar om en rörelse från rörelsepaketet (/assets/kund/rorelse.css), till exempel skakningen vid varje nytt försök.
function nudge(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

function setError(id, input, text) {
  $(`#${id}`).textContent = text;
  if (input) input.setAttribute('aria-invalid', 'true');
  nudge(input || $(`#${id}`).previousElementSibling, 'r-fel');
}
function clearError(id, input) {
  $(`#${id}`).textContent = '';
  if (input) input.removeAttribute('aria-invalid');
}

const checks = [
  { id: 'eName', input: () => $('#fName'), test: (v) => v.trim().length > 0, msg: () => 'Skriv ditt namn.' },
  {
    id: 'eMail',
    input: () => $('#fMail'),
    test: (v) => validEmail(v),
    msg: (v) => (v.trim() ? 'Adressen ser inte rätt ut. Kontrollera den.' : 'Skriv din e-postadress, så att vi kan svara.'),
  },
  { id: 'eOrgName', input: () => $('#fOrg'), test: (v) => v.trim().length > 0, msg: () => 'Skriv namnet på klubben, ligan eller förbundet.' },
  { id: 'eMsg', input: () => $('#fMsg'), test: (v) => v.trim().length > 0, msg: () => 'Skriv kort vad ni vill ha en offert på.' },
];

// Felet försvinner så fort fältet blir rätt.
for (const c of checks) {
  c.input().addEventListener('input', (e) => { if (c.test(e.target.value)) clearError(c.id, e.target); });
}
$$('input[name="org"]').forEach((r) => r.addEventListener('change', () => clearError('eOrg')));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let first = null;
  const org = $('input[name="org"]:checked');
  if (!org) { setError('eOrg', null, 'Välj om ni är en klubb, liga eller ett förbund.'); first = $('input[name="org"]'); }
  else clearError('eOrg');
  for (const c of checks) {
    const input = c.input();
    if (c.test(input.value)) clearError(c.id, input);
    else { setError(c.id, input, c.msg(input.value)); first ||= input; }
  }
  if (first) { result.textContent = ''; return first.focus(); }

  const products = $$('input[name="prod"]:checked').map((i) => i.value);
  const lines = [
    `Namn: ${$('#fName').value.trim()}`,
    `E-post: ${$('#fMail').value.trim()}`,
    `Organisation: ${$('#fOrg').value.trim()} (${org.value})`,
    `Land: ${$('#fCountry').value.trim() || 'inte angivet'}`,
    `Intresserad av: ${products.join(', ') || 'inte angivet'}`,
    '',
    $('#fMsg').value.trim(),
  ];
  if (DRAFT) {
    result.textContent = `Utkast: inget skickades. På den färdiga sidan öppnas ett färdigt mejl till ${EMAIL}.`;
    nudge(result, 'r-klar');
    return;
  }
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Offertförfrågan: ${$('#fOrg').value.trim()}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
  result.textContent = `Nu öppnas ett mejl med er förfrågan. Skicka det, så hör vi av oss. Öppnades inget mejl? Skriv till ${EMAIL}.`;
  nudge(result, 'r-klar');
});

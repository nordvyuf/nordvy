// mätochmätt UF – beställning och kontakt.
//
// UF-paketet: beställningsknappen skickar förfrågan till UF-företaget. Det görs med ett
// färdigskrivet mejl till företagets adress, så att inget extra system behövs.
// Så länge sidan är ett utkast (DRAFT) skickas ingenting.

const DRAFT = true;
const SHOP = {
  email: '', // fylls i när mätochmätt har skickat sin adress
  product: 'mätochmätt – kokboken',
  price: 0, // kronor, fylls i när priset är bestämt
  maxQty: 10,
};

const $ = (s, r = document) => r.querySelector(s);
const kr = (n) => `${new Intl.NumberFormat('sv-SE').format(n)} kr`;
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) if (c != null) n.append(c);
  return n;
}

function mailto(subject, lines) {
  return `mailto:${SHOP.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

/* ---------------------------------------------------------------- beställning */

const dlg = $('#order');
const body = $('#oBody');
let qty = 1;
let opener = null;

function header(title) {
  const close = el('button', { class: 'x', type: 'button', 'aria-label': 'Stäng', text: '×' });
  close.addEventListener('click', () => dlg.close());
  const left = el('div', {}, el('p', { class: 'eyebrow', text: 'Beställ' }), el('h3', { id: 'oTitle', text: title }));
  return el('div', { class: 'dh' }, left, close);
}

function field(id, label, type = 'text', auto = '') {
  const input = el('input', { id, type, autocomplete: auto });
  const err = el('span', { class: 'err', id: `e${id}` });
  return [el('div', { class: 'field' }, el('label', { for: id, text: label }), input, err), input, err];
}

function renderForm() {
  qty = 1;
  const [nameField, name, eName] = field('oName', 'Namn', 'text', 'name');
  const [mailField, mail, eMail] = field('oMail', 'E-post', 'email', 'email');
  const out = el('output', { text: String(qty) });
  const minus = el('button', { type: 'button', 'aria-label': 'Färre', text: '−' });
  const plus = el('button', { type: 'button', 'aria-label': 'Fler', text: '+' });
  const total = el('span');
  const update = () => {
    out.textContent = String(qty);
    minus.disabled = qty <= 1;
    plus.disabled = qty >= SHOP.maxQty;
    total.textContent = SHOP.price ? kr(qty * SHOP.price) : 'Pris kommer';
  };
  minus.addEventListener('click', () => { if (qty > 1) { qty--; update(); } });
  plus.addEventListener('click', () => { if (qty < SHOP.maxQty) { qty++; update(); } });

  const send = el('button', { class: 'btn btn-p', type: 'button', text: 'Skicka beställning' });
  const note = el('p', {
    class: 'small',
    text: DRAFT
      ? 'Utkast: ingenting skickas än. På den färdiga sidan öppnas ett färdigt mejl till mätochmätt.'
      : 'Beställningen öppnas som ett färdigt mejl till oss. Vi svarar med hur du betalar och får boken.',
  });

  send.addEventListener('click', () => {
    let ok = true;
    eName.textContent = name.value.trim() ? '' : ((ok = false), 'Skriv ditt namn.');
    eMail.textContent = validEmail(mail.value) ? '' : ((ok = false), 'Skriv en e-postadress så att vi kan svara.');
    if (!ok) return (name.value.trim() ? mail : name).focus();
    if (!DRAFT && SHOP.email) {
      location.href = mailto(`Beställning: ${SHOP.product}`, [
        `Namn: ${name.value.trim()}`,
        `E-post: ${mail.value.trim()}`,
        `Antal: ${qty}`,
        SHOP.price ? `Summa: ${kr(qty * SHOP.price)}` : '',
      ]);
    }
    renderDone(qty);
  });

  const qtyField = el('div', { class: 'field' }, el('span', { class: 'lbl', text: 'Antal' }), el('div', { class: 'qty' }, minus, out, plus));
  body.replaceChildren(header(SHOP.product), qtyField, nameField, mailField, el('div', { class: 'tot' }, el('span', { text: 'Summa' }), total), note, send);
  update();
  requestAnimationFrame(() => name.focus());
}

function renderDone(n) {
  const ok = el('button', { class: 'btn btn-p', type: 'button', text: 'Klar' });
  ok.addEventListener('click', () => dlg.close());
  const done = el(
    'div',
    { class: 'done' },
    el('span', { class: 'tick', 'aria-hidden': 'true', text: '✓' }),
    el('h3', { id: 'oTitle', text: 'Tack för din beställning' }),
    el('p', { text: `${n} × ${SHOP.product}` }),
    el('p', { class: 'mut', text: 'Vi hör av oss om betalning och leverans så snart vi kan.' }),
    DRAFT ? el('p', { class: 'small', text: 'Utkast: ingenting har skickats.' }) : null,
    ok,
  );
  body.replaceChildren(done);
  requestAnimationFrame(() => ok.focus());
}

document.querySelectorAll('[data-order]').forEach((b) =>
  b.addEventListener('click', () => {
    opener = b;
    renderForm();
    dlg.showModal();
  }),
);
dlg.addEventListener('close', () => opener?.focus());
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

/* ---------------------------------------------------------------- kontakt */

const form = $('#contact');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const checks = [
    ['cName', 'Skriv ditt namn.', (v) => v.trim().length > 0],
    ['cMail', 'Skriv en giltig e-postadress.', validEmail],
    ['cMsg', 'Skriv några rader.', (v) => v.trim().length > 0],
  ];
  let first = null;
  for (const [id, msg, ok] of checks) {
    const input = $(`#${id}`);
    const bad = !ok(input.value);
    input.setAttribute('aria-invalid', String(bad));
    $(`#e${id}`).textContent = bad ? msg : '';
    if (bad && !first) first = input;
  }
  if (first) return first.focus();
  const status = $('#cStatus');
  if (DRAFT || !SHOP.email) {
    status.textContent = 'Utkast: ingenting skickas än. På den färdiga sidan öppnas ett färdigt mejl till mätochmätt.';
    return;
  }
  location.href = mailto('Fråga via hemsidan', [`Namn: ${$('#cName').value.trim()}`, `E-post: ${$('#cMail').value.trim()}`, '', $('#cMsg').value.trim()]);
  status.textContent = 'Ditt mejlprogram öppnas med meddelandet. Skicka det därifrån.';
});

/* ---------------------------------------------------------------- animationer */

if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }),
    { threshold: 0.12 },
  );
  document.querySelectorAll('.rv').forEach((n) => io.observe(n));
} else {
  document.querySelectorAll('.rv').forEach((n) => n.classList.add('in'));
}

// Omdömen för kundsidor (Premium). Visar godkända omdömen och låter besökare skriva ett nytt.
//
// Så här används den på en kundsida. Inget annat skript behövs, och inget inbäddat skript, så den
// fungerar med sidornas CSP:
//
//   <div data-nv-omdomen data-site="matochmatt"></div>
//   <script type="module" src="/assets/omdomen.js"></script>
//
//   data-site    kundens mappnamn under /kund/. Utan det visas bara omdömena, inget formulär.
//   data-src     var omdomen.json ligger. Standard: omdomen.json bredvid sidan.
//   data-demo    visar formuläret men skickar ingenting (för demosidor och utkast).
//   data-utan-rubrik   visar ingen egen rubrik. Använd när sidan redan har en rubrik ovanför rutan.
//   data-rubrik-niva   rubriknivå 2–4 för rutans rubrik (standard 3), så den passar sidans rubriker.
//
// Färgen sätts med CSS-variabeln --nv-accent på sidan, till exempel `--nv-accent: #D9583B`.
// Texten, typsnittet och bakgrunden ärvs från sidan. Rutan byter inte färger efter besökarens mörka
// läge, eftersom kundsidor har fasta färger. Felmeddelanden är mörkröda: på en mörk sida, sätt
// till exempel `.nv-om-err { color: #ffb3a6 }` i sidans CSS.
//
// Eget utseende: rutans standardstil har noll specificitet (:where), så sidans egen CSS vinner alltid.
// Klasser att styla: .nv-om (hela rutan), .nv-om-head, .nv-om-title, .nv-om-avg, .nv-om-list,
// .nv-om-card (ett omdöme: figure med .nv-om-stars, blockquote, figcaption), .nv-om-empty, .nv-om-note,
// .nv-om-open (knappen "Skriv ett omdöme"), .nv-om-form, .nv-om-field, .nv-om-rate, .nv-om-consent,
// .nv-om-send, .nv-om-err och .nv-om-status.
//
// omdomen.json:
//   { "rubrik": "Det säger kunderna", "notis": "valfri liten text",
//     "reviews": [ { "namn": "Anna", "betyg": 5, "text": "…", "datum": "2026-11-18" } ] }
// Ett omdöme visas först när någon har lagt raden där. Ingenting skickas direkt till sidan.

const STYLE_ID = 'nv-om-style';
// Allt utseende ligger i :where() så att kundsidans egen CSS alltid går före.
// Bara det som krävs för att rutan ska fungera (dolda fält, skärmläsartext) har vanlig specificitet.
const CSS = `
:where(.nv-om){--a:var(--nv-accent,#2f6b4a);--star:var(--nv-star,#b9852a);--line:rgba(127,127,127,.35);display:grid;gap:18px;max-width:760px;font:inherit;color:inherit}
:where(.nv-om) *{box-sizing:border-box}
:where(.nv-om-head){display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px}
:where(.nv-om-title){margin:0}
:where(.nv-om-avg){opacity:.75;font-size:.95em}
:where(.nv-om-list){display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))}
:where(.nv-om-card){margin:0;padding:16px;border:1px solid var(--line);border-radius:14px;display:grid;gap:8px;align-content:start;min-width:0}
:where(.nv-om-card) blockquote{margin:0;overflow-wrap:anywhere}
:where(.nv-om-card) figcaption{font-size:.9em;opacity:.75}
:where(.nv-om-stars){color:var(--star);letter-spacing:.1em;line-height:1}
:where(.nv-om-empty,.nv-om-note){margin:0;opacity:.75;font-size:.95em}
:where(.nv-om-open){justify-self:start;font:inherit;font-weight:600;padding:11px 20px;border-radius:999px;border:1px solid var(--a);background:transparent;color:var(--a);cursor:pointer}
:where(.nv-om-open:hover){background:var(--a);color:#fff}
:where(.nv-om-form){display:grid;gap:14px;padding:18px;border:1px solid var(--line);border-radius:16px}
:where(.nv-om-field){display:grid;gap:6px;border:0;margin:0;padding:0;min-width:0}
:where(.nv-om-field) :where(label,legend){font-size:.9em;font-weight:600;padding:0}
:where(.nv-om-field) :where(input[type=text],textarea){width:100%;font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:10px;padding:11px 12px}
:where(.nv-om-field) :where(textarea){min-height:110px;resize:vertical}
:where(.nv-om-field input:focus-visible,.nv-om-field textarea:focus-visible,.nv-om-open:focus-visible,.nv-om-send:focus-visible){outline:2px solid var(--a);outline-offset:2px}
:where(.nv-om-rate){display:flex;gap:4px}
:where(.nv-om-rate) :where(label){position:relative;font-size:1.9rem;line-height:1;cursor:pointer;color:var(--line);padding:2px}
:where(.nv-om-rate label.on){color:var(--star)}
:where(.nv-om-rate label:has(input:focus-visible)){outline:2px solid var(--a);border-radius:6px}
:where(.nv-om-consent){display:flex;gap:10px;align-items:flex-start;font-size:.92em}
:where(.nv-om-consent) :where(input){margin-top:.25em;flex:none}
:where(.nv-om-send){justify-self:start;font:inherit;font-weight:600;padding:12px 24px;border-radius:999px;border:0;background:var(--a);color:#fff;cursor:pointer}
:where(.nv-om-send:disabled){opacity:.5;cursor:not-allowed}
:where(.nv-om-err){color:#b3321f;font-size:.88em;min-height:1.2em}
:where(.nv-om-status:not(:empty)){padding:12px 14px;border:1px solid var(--line);border-radius:12px}
.nv-om-form[hidden]{display:none}
.nv-om-err:empty{display:none}
.nv-om-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.nv-om-rate input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.nv-om-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
`;

let counter = 0;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
const sv = (n) => n.toLocaleString('sv-SE', { maximumFractionDigits: 1 });

function cleanReviews(list) {
  return (Array.isArray(list) ? list : [])
    .filter((r) => r && typeof r.namn === 'string' && typeof r.text === 'string' && Number.isInteger(r.betyg) && r.betyg >= 1 && r.betyg <= 5)
    .map((r) => ({ namn: r.namn.slice(0, 40), text: r.text.slice(0, 600), betyg: r.betyg, datum: typeof r.datum === 'string' ? r.datum.slice(0, 10) : '' }))
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .slice(0, 60);
}

async function load(src) {
  try {
    const res = await fetch(src, { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function errorText(res, data) {
  const e = data?.error;
  if (res.status === 429) return 'Det blev för många försök. Vänta en stund och försök igen.';
  if (e === 'consent_required') return 'Kryssa i rutan så vet vi att vi får visa ditt omdöme.';
  if (e === 'too_fast') return 'Det gick för fort. Vänta några sekunder och skicka igen.';
  if (e === 'no_links') return 'Skriv utan länkar och mejladresser.';
  if (e === 'invalid_name') return 'Skriv bara ditt förnamn, utan siffror eller länkar.';
  if (e === 'invalid_text') return 'Skriv mellan 10 och 600 tecken.';
  return 'Det gick inte att skicka just nu. Försök igen om en stund.';
}

function renderList(root, data, { heading, level }) {
  const reviews = cleanReviews(data.reviews);
  const head = el('div', 'nv-om-head');
  if (heading) head.append(el(`h${level}`, 'nv-om-title', typeof data.rubrik === 'string' && data.rubrik ? data.rubrik.slice(0, 80) : 'Omdömen'));
  if (reviews.length >= 3) {
    const avg = reviews.reduce((s, r) => s + r.betyg, 0) / reviews.length;
    head.append(el('span', 'nv-om-avg', `Snittbetyg ${sv(avg)} av 5 (${reviews.length} omdömen)`));
  }
  if (head.childElementCount) root.append(head);
  if (!reviews.length) {
    root.append(el('p', 'nv-om-empty', 'Inga omdömen än. Du kan bli först.'));
    return;
  }
  const list = el('div', 'nv-om-list');
  for (const r of reviews) {
    const card = el('figure', 'nv-om-card');
    const s = el('div', 'nv-om-stars', stars(r.betyg));
    s.setAttribute('aria-hidden', 'true');
    card.append(s, el('span', 'nv-om-sr', `Betyg ${r.betyg} av 5`), el('blockquote', '', r.text), el('figcaption', '', r.namn));
    list.append(card);
  }
  root.append(list);
  if (typeof data.notis === 'string' && data.notis) root.append(el('p', 'nv-om-note', data.notis.slice(0, 200)));
}

function renderForm(root, { site, demo }) {
  const id = `nv-om-${++counter}`;
  const open = el('button', 'nv-om-open', 'Skriv ett omdöme');
  open.type = 'button';
  open.setAttribute('aria-expanded', 'false');
  open.setAttribute('aria-controls', `${id}-form`);

  const form = el('form', 'nv-om-form');
  form.id = `${id}-form`;
  form.hidden = true;
  form.noValidate = true;
  let shown = 0;

  // Betyg
  const rate = el('fieldset', 'nv-om-field');
  rate.append(el('legend', '', 'Betyg'));
  const row = el('div', 'nv-om-rate');
  const radios = [];
  for (let n = 1; n <= 5; n += 1) {
    const label = el('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `${id}-betyg`;
    input.value = String(n);
    input.setAttribute('aria-label', `${n} av 5`);
    label.append(input, '★');
    row.append(label);
    radios.push({ input, label });
  }
  rate.append(row);
  const eRate = el('div', 'nv-om-err');
  eRate.setAttribute('role', 'alert');
  rate.append(eRate);
  const paint = () => {
    const value = Number(radios.find((r) => r.input.checked)?.input.value || 0);
    radios.forEach((r, i) => r.label.classList.toggle('on', i < value));
  };
  radios.forEach((r) => r.input.addEventListener('change', paint));

  // Namn och text
  const nameField = el('div', 'nv-om-field');
  const nameLabel = el('label', '', 'Ditt förnamn');
  nameLabel.htmlFor = `${id}-namn`;
  const name = document.createElement('input');
  name.type = 'text';
  name.id = `${id}-namn`;
  name.maxLength = 40;
  name.autocomplete = 'given-name';
  const eName = el('div', 'nv-om-err');
  eName.setAttribute('role', 'alert');
  nameField.append(nameLabel, name, eName);

  const textField = el('div', 'nv-om-field');
  const textLabel = el('label', '', 'Ditt omdöme');
  textLabel.htmlFor = `${id}-text`;
  const text = document.createElement('textarea');
  text.id = `${id}-text`;
  text.maxLength = 600;
  text.rows = 4;
  const eText = el('div', 'nv-om-err');
  eText.setAttribute('role', 'alert');
  textField.append(textLabel, text, eText);

  // Samtycke
  const consent = el('div', 'nv-om-consent');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = `${id}-ok`;
  const boxLabel = el('label', '', 'Jag godkänner att mitt förnamn och mitt omdöme visas på sidan om det godkänns. Inga andra uppgifter sparas.');
  boxLabel.htmlFor = box.id;
  consent.append(box, boxLabel);
  const eConsent = el('div', 'nv-om-err');
  eConsent.setAttribute('role', 'alert');

  // Dolt fält som bara robotar fyller i
  const hp = el('div', 'nv-om-hp');
  hp.setAttribute('aria-hidden', 'true');
  const hpInput = document.createElement('input');
  hpInput.type = 'text';
  hpInput.name = 'website';
  hpInput.tabIndex = -1;
  hpInput.autocomplete = 'off';
  hp.append(hpInput);

  const send = el('button', 'nv-om-send', 'Skicka omdömet');
  send.type = 'submit';
  const status = el('div', 'nv-om-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  form.append(rate, nameField, textField, consent, eConsent, hp, send, status);

  open.addEventListener('click', () => {
    form.hidden = !form.hidden;
    open.setAttribute('aria-expanded', String(!form.hidden));
    if (!form.hidden) {
      shown = shown || Date.now();
      name.focus();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const rating = Number(radios.find((r) => r.input.checked)?.input.value || 0);
    const who = name.value.trim();
    const said = text.value.trim();
    eRate.textContent = rating ? '' : 'Välj ett betyg.';
    eName.textContent = who.length >= 2 ? '' : 'Skriv ditt förnamn.';
    eText.textContent = said.length >= 10 ? '' : 'Skriv minst en mening (10 tecken).';
    eConsent.textContent = box.checked ? '' : 'Kryssa i rutan för att skicka.';
    if (!rating || who.length < 2 || said.length < 10 || !box.checked) {
      (!rating ? radios[0].input : who.length < 2 ? name : said.length < 10 ? text : box).focus();
      return;
    }

    send.disabled = true;
    status.textContent = '';
    if (demo) {
      status.textContent = 'Demo: inget skickades. På en riktig sida kommer omdömet till oss och visas först när det är godkänt.';
      send.disabled = false;
      return;
    }
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ site, name: who, rating, text: said, consent: true, website: hpInput.value, elapsed: Date.now() - (shown || Date.now()) }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        status.textContent = 'Tack! Ditt omdöme visas på sidan när det har godkänts.';
        form.reset();
        paint();
        send.hidden = true;
        return;
      }
      status.textContent = errorText(res, data);
    } catch {
      status.textContent = 'Det gick inte att skicka just nu. Försök igen om en stund.';
    }
    send.disabled = false;
  });

  root.append(open, form);
}

async function mount(root) {
  if (root.dataset.nvMounted) return;
  root.dataset.nvMounted = '1';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.append(style);
  }
  root.classList.add('nv-om');
  const demo = root.hasAttribute('data-demo');
  const site = String(root.dataset.site || '').toLowerCase();
  const data = await load(root.dataset.src || 'omdomen.json');
  const level = Math.min(4, Math.max(2, Number(root.dataset.rubrikNiva) || 3));
  renderList(root, data, { heading: !root.hasAttribute('data-utan-rubrik'), level });
  if (site || demo) renderForm(root, { site, demo });
}

document.querySelectorAll('[data-nv-omdomen]').forEach(mount);

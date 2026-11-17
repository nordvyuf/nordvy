// Självintervjun i webbläsaren.
//
// Kunden svarar på en fråga i taget. Servern (Workers AI) formulerar frågorna och
// plockar ut svaren, men det är den här sidan som håller reda på checklistan,
// räknar förloppet och ritar utkastet. Svarar inte servern ställs checklistans
// färdiga frågor i stället, så intervjun går alltid att slutföra.

import {
  FIELDS,
  FIELD,
  NEED,
  PACKAGES,
  LIMITS,
  MAIL_TO,
  cleanBrief,
  cleanIssues,
  cleanLog,
  hasValue,
  isSaknas,
  isNegative,
  missing,
  coreDone,
  draftModel,
  fallbackQuestion,
  recommendPackage,
  briefToText,
} from './shared/brief.js';
import { renderPreview, createWindow } from './preview.js';
import { openBooking, CAL_ACCOUNT } from './cal.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(pointer: coarse)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STORE = 'nordvy-intervju-v2';
const kr = (n) => `${new Intl.NumberFormat('sv-SE').format(n)} kr`;
const GREETING =
  'Hej! Jag är Nordvys intervjuassistent. Jag ställer några frågor om ditt företag, en i taget, och bygger ett första utkast av din sida medan du svarar. Vet du inte något svar säger du bara det.';

const state = {
  stage: 'start', // start, chat, edit, summary, contact, done
  brief: {},
  issues: [],
  log: [],
  asked: [],
  askCount: 1,
  carry: '',
  carryField: '',
  copy: null,
  coreShown: false,
  partial: false,
  contact: null,
  sent: null,
};

const log = $('#log');
const composer = $('#composer');
const input = $('#answer');
const chipsBox = $('#chips');
const hint = $('#hint');
const early = $('#early');
const sendBtn = $('.iv-send');
const stage = $('#stage');
const list = $('#list');
const bar = $('#bar');
const stepLabel = $('#step-label');
const pstatus = $('#pstatus');
const legal = $('.iv-legal');

const win = createWindow('');
stage.append(win.window);

/* ----------------------------------------------------------- lagring */

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch {
    /* lagring är en bekvämlighet, inte ett krav */
  }
}
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (!saved || !Array.isArray(saved.log) || !saved.log.length) return false;
    Object.assign(state, {
      stage: ['chat', 'edit', 'summary', 'contact', 'done'].includes(saved.stage) ? saved.stage : 'chat',
      brief: cleanBrief(saved.brief),
      issues: cleanIssues(saved.issues),
      log: cleanLog(saved.log),
      asked: Array.isArray(saved.asked) ? saved.asked.filter((k) => NEED.includes(k)).slice(0, 2) : [],
      askCount: Number(saved.askCount) || 1,
      carry: String(saved.carry || '').slice(0, LIMITS.value),
      carryField: NEED.includes(saved.carryField) ? saved.carryField : '',
      copy: saved.copy && typeof saved.copy === 'object' ? saved.copy : null,
      coreShown: Boolean(saved.coreShown),
      partial: Boolean(saved.partial),
      contact: saved.contact || null,
      sent: saved.sent ?? null,
    });
    return true;
  } catch {
    return false;
  }
}
function startOver() {
  try {
    localStorage.removeItem(STORE);
  } catch {
    /* inget att rensa */
  }
  location.href = '/intervju';
}

/* ------------------------------------------------------------ chatten */

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function useIcon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}
function scrollDown() {
  log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
}
function avatar() {
  const a = node('span', 'who');
  a.append(useIcon('i-star'));
  return a;
}
function bubble(who, text) {
  const row = node('div', `msg ${who}`);
  if (who === 'guide') row.append(avatar());
  const p = node('p', '', text);
  row.append(p);
  log.append(row);
  scrollDown();
  return p;
}
function noteLine(text) {
  log.append(node('div', 'note-line', text));
  scrollDown();
}
function showTyping() {
  const row = node('div', 'msg guide typing');
  const p = node('p');
  p.append(node('i'), node('i'), node('i'));
  row.append(avatar(), p);
  row.setAttribute('aria-label', 'Assistenten skriver');
  log.append(row);
  scrollDown();
  return row;
}

// Skriver ut assistentens text tecken för tecken. Ett klick i chatten visar allt direkt.
async function guideSays(text) {
  state.log.push({ who: 'guide', text });
  save();
  const p = bubble('guide', '');
  if (reduced) {
    p.textContent = text;
    return;
  }
  let skipTyping = false;
  const stop = () => (skipTyping = true);
  log.addEventListener('click', stop, { once: true });
  const delay = Math.max(5, Math.min(16, 1400 / text.length));
  for (let i = 1; i <= text.length && !skipTyping; i++) {
    p.textContent = text.slice(0, i);
    if (i % 3 === 0) log.scrollTop = log.scrollHeight;
    await sleep(delay);
  }
  log.removeEventListener('click', stop);
  p.textContent = text;
  scrollDown();
}
function userSays(text) {
  state.log.push({ who: 'me', text });
  bubble('me', text);
}

/* ------------------------------------------- utkast, förlopp, checklista */

function updatePreview(animate = true) {
  const m = draftModel(state.brief, state.copy);
  win.setUrl(m.company || '');
  renderPreview(win.frame, m, { animate: animate && !reduced });
  if (document.body.dataset.view !== 'preview') $('#tab-preview .dot').classList.add('on');
}

function renderChecklist() {
  const left = missing(state.brief);
  const done = NEED.length - left.length;
  bar.style.setProperty('--p', (done / NEED.length).toFixed(3));
  bar.setAttribute('aria-valuenow', String(done));
  stepLabel.textContent = state.stage === 'done' ? 'Underlaget är skickat' : `${done} av ${NEED.length} punkter`;

  const dl = $('#fields');
  dl.replaceChildren();
  for (const f of FIELDS) {
    if (f.level === 0 && !hasValue(state.brief, f.key)) continue;
    const v = String(state.brief[f.key] || '').trim();
    const row = node('div', `f${v ? (isSaknas(v) ? ' gap' : ' has') : ''}${f.level === 1 ? ' req' : ''}`);
    row.append(node('i'), node('dt', '', f.label), node('dd', v ? '' : 'none', v ? (isSaknas(v) ? 'Saknas' : v) : 'Inte frågat än'));
    dl.append(row);
  }
  $('#issue-box').hidden = !state.issues.length;
  $('#issues').replaceChildren(...state.issues.map((i) => node('li', '', i.text)));
}

/* -------------------------------------------------------- svarsrutan */

function autosize() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(140, input.scrollHeight)}px`;
}
function setHint(text, bad = false) {
  hint.textContent = text;
  hint.classList.toggle('bad', bad);
}
function hideComposer() {
  composer.hidden = true;
  legal.hidden = true;
}

function setupComposer() {
  const field = FIELD[state.asked[0]];
  composer.hidden = false;
  legal.hidden = false;
  input.value = '';
  input.maxLength = LIMITS.message;
  chipsBox.replaceChildren();
  const chips = state.stage === 'edit' ? null : field?.chips;
  chipsBox.hidden = !chips;
  if (chips) {
    for (const label of chips) {
      const chip = node('button', 'chip', label);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        if (!field.multi) {
          input.value = label;
          return submitAnswer();
        }
        chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
        setHint('Välj en eller flera och tryck på pilen.');
      });
      chipsBox.append(chip);
    }
  }
  if (state.stage === 'edit') {
    input.placeholder = 'Skriv vad som ska ändras';
    setHint('Till exempel: "Telefonnumret ska vara 040-12 34 56".');
  } else {
    input.placeholder = chips ? (field.multi ? 'Något mer? (valfritt)' : 'Eller skriv ett eget svar') : 'Skriv ditt svar';
    setHint(chips && field.multi ? 'Välj en eller flera och tryck på pilen.' : 'Tryck Enter för att skicka.');
  }
  early.hidden = !(state.stage === 'chat' && coreDone(state.brief));
  autosize();
  sendBtn.disabled = false;
  // På pekskärm öppnar vi inte tangentbordet automatiskt när det finns val att trycka på.
  if (!(chips && touch)) input.focus({ preventScroll: true });
  // Svarsrutan kan ha blivit högre (knappar): håll senaste frågan synlig.
  requestAnimationFrame(scrollDown);
}

async function post(path, payload, ms = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    return response.ok && data?.ok ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Samma regler som servern, för när servern inte går att nå alls.
function offlineTurn(message) {
  const brief = { ...state.brief };
  const field = state.asked[0];
  if (field && !hasValue(brief, field)) {
    brief[field] = isNegative(message) ? (field === 'referens_ok' ? 'Nej' : 'saknas') : message.slice(0, LIMITS.value);
    if (field === 'logga') brief.logga_status = isSaknas(brief.logga) ? 'saknas' : 'ej verifierad';
  }
  const left = missing(brief);
  return {
    brief,
    issues: state.issues,
    reply: left.length ? fallbackQuestion(left[0], NEED.length - left.length, state.brief) : null,
    asked: left.length ? [left[0]] : [],
    done: !left.length,
  };
}

async function submitAnswer() {
  if (sendBtn.disabled || composer.hidden) return;
  const picked = $$('.chip[aria-pressed="true"]', chipsBox).map((c) => c.textContent);
  const typed = input.value.trim();
  const message = [picked.join(', '), typed].filter(Boolean).join(picked.length && typed ? '. ' : '').slice(0, LIMITS.message);
  if (!message) return setHint('Skriv ett svar, eller säg att du inte vet.', true);

  const editing = state.stage === 'edit';
  const previousAsked = state.asked[0];
  userSays(message);
  sendBtn.disabled = true;
  hideComposer();
  const typing = showTyping();
  const started = Date.now();

  const data = await post('/api/interview/turn', {
    brief: state.brief,
    issues: state.issues,
    history: state.log.slice(-14),
    asked: state.asked,
    askCount: state.askCount,
    carry: state.carry,
    carryField: state.carryField,
    message,
    edit: editing,
  });
  const turn = data || (editing ? { brief: state.brief, issues: cleanIssues([...state.issues, { topic: 'annat', text: `Kunden vill ändra: ${message}` }]), reply: null, asked: [], done: true } : offlineTurn(message));
  const wait = 600 - (Date.now() - started);
  if (wait > 0) await sleep(wait);
  typing.remove();

  state.brief = cleanBrief(turn.brief);
  state.issues = cleanIssues(turn.issues);
  renderChecklist();
  updatePreview();

  if (editing) {
    await guideSays('Tack, jag har noterat ändringen.');
    return showSummary();
  }
  // Följdfråga på samma fält: spara det kunden redan sagt så att det inte tappas.
  // En fråga till oss (turn.skip) var inget svar: den följer inte med, men räknas som ett försök
  // så att intervjun går vidare om kunden frågar igen.
  const sameField = turn.asked?.[0] && turn.asked[0] === previousAsked && !hasValue(state.brief, previousAsked);
  if (!turn.skip) {
    state.carry = sameField ? [state.carry, message].filter(Boolean).join(' / ').slice(0, LIMITS.value) : '';
    state.carryField = sameField ? previousAsked : '';
  }
  state.askCount = sameField ? state.askCount + 1 : 1;
  state.asked = turn.asked || [];
  save();

  if (!state.coreShown && coreDone(state.brief)) firstDraftReady();
  if (turn.done || !turn.reply) return showSummary();
  await guideSays(turn.reply);
  setupComposer();
}

// De sex första punkterna är klara: nu finns ett första utkast att visa.
// Texten putsas av AI:n i bakgrunden, intervjun väntar inte på den.
function firstDraftReady() {
  state.coreShown = true;
  save();
  stage.classList.add('done');
  pstatus.textContent = 'Första utkastet är klart';
  noteLine(touch ? 'Ditt första utkast är klart. Se det under fliken Utkast.' : 'Ditt första utkast är klart. Du ser det här bredvid.');
  noteLine('Några frågor till, så har teamet allt de behöver.');
  stage.classList.add('polish');
  post('/api/interview/draft', { brief: state.brief }, 25000).then((data) => {
    stage.classList.remove('polish');
    if (!data?.copy) return;
    state.copy = data.copy;
    updatePreview();
    save();
  });
}

composer.addEventListener('submit', (e) => {
  e.preventDefault();
  submitAnswer();
});
input.addEventListener('input', autosize);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    submitAnswer();
  }
});
early.addEventListener('click', () => {
  state.partial = true;
  userSays('Skicka det jag har så här långt');
  showContact();
});

/* -------------------------------------- start, sammanfattning, kontakt */

function showStart() {
  hideComposer();
  const card = node('div', 'card start');
  const eyebrow = node('p', 'eyebrow');
  eyebrow.append(useIcon('i-star'), 'Självintervjun');
  eyebrow.firstChild.classList.add('star');
  const ul = node('ul');
  for (const t of [
    'En fråga i taget, i din egen takt. Vet du inte något säger du bara det.',
    'Efter ungefär sex frågor ser du ett första utkast av din sida.',
    'Hela intervjun tar cirka tio minuter. Sedan har vi allt vi behöver för att bygga.',
  ])
    ul.append(node('li', '', t));
  const consent = node('label', 'consent');
  const box = node('input');
  box.type = 'checkbox';
  const text = node('span');
  text.append(
    node('b', '', 'Jag godkänner att mina svar behandlas. '),
    'Svaren tolkas av en AI-tjänst hos Cloudflare och mejlas till Nordvy när du skickar in dem. Vi använder dem bara för att ta fram ett förslag på din hemsida och raderar dem om du ber oss. Skriv inga personnummer, lösenord eller betaluppgifter.',
  );
  consent.append(box, text);
  const error = node('span', 'err');
  error.setAttribute('role', 'alert');
  const go = node('button', 'btn btn-p btn-lg', 'Starta intervjun');
  go.type = 'button';
  card.append(eyebrow, node('h1', '', 'Berätta om din nya hemsida'), ul, consent, error, go, node('p', 'fine', 'Gratis och utan köpkrav.'));
  log.append(card);
  go.addEventListener('click', async () => {
    if (!box.checked) {
      error.textContent = 'Kryssa i rutan för att starta.';
      return box.focus();
    }
    card.remove();
    state.stage = 'chat';
    await guideSays(GREETING);
    await sleep(reduced ? 0 : 300);
    await guideSays(FIELD.foretagsnamn.question);
    state.asked = ['foretagsnamn'];
    state.askCount = 1;
    save();
    setupComposer();
  });
}

function showSummary() {
  state.stage = 'summary';
  save();
  hideComposer();
  const card = node('div', 'card sum');
  const dl = node('dl');
  for (const f of FIELDS) {
    if (f.level === 0 || !hasValue(state.brief, f.key)) continue;
    const item = node('div');
    item.append(node('dt', '', f.label), node('dd', '', isSaknas(state.brief[f.key]) ? 'Saknas' : state.brief[f.key]));
    dl.append(item);
  }
  const yes = node('button', 'btn btn-p btn-lg', 'Ja, det stämmer');
  yes.type = 'button';
  const change = node('button', 'textlink', 'Jag vill ändra något');
  change.type = 'button';
  card.append(node('h2', '', 'Stämmer det här?'), dl, yes, change);
  log.append(card);
  scrollDown();
  yes.addEventListener('click', () => {
    card.remove();
    userSays('Ja, det stämmer');
    showContact();
  });
  change.addEventListener('click', async () => {
    card.remove();
    state.stage = 'edit';
    state.asked = [];
    save();
    await guideSays('Vad vill du ändra?');
    setupComposer();
  });
}

function field(labelText, attrs) {
  const label = node('label', '', labelText);
  const inp = node('input');
  Object.assign(inp, attrs);
  label.append(inp);
  return [label, inp];
}

function showContact() {
  state.stage = 'contact';
  save();
  hideComposer();
  const card = node('div', 'card');
  const form = node('form');
  form.noValidate = true;
  const known = String(state.brief.kontakt || '').match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/);
  const [l1, name] = field('Ditt namn', { name: 'name', autocomplete: 'name', maxLength: 100 });
  const [l2, email] = field('E-post', { name: 'email', type: 'email', autocomplete: 'email', maxLength: 254, value: known ? known[0] : '' });
  const [l3, phone] = field('Telefon (valfritt)', { name: 'phone', type: 'tel', autocomplete: 'tel', maxLength: 40 });
  const error = node('span', 'err');
  error.setAttribute('role', 'alert');
  const go = node('button', 'btn btn-p btn-lg', 'Skicka till Nordvy');
  go.type = 'submit';
  const left = missing(state.brief);
  const lead = state.partial && left.length ? `Vi skickar det du hunnit svara på. ${left.length} punkter återstår, dem tar vi tillsammans.` : 'Sista steget: vem ska vi höra av oss till?';
  form.append(l1, l2, l3, error, go, node('p', 'fine', 'Underlaget mejlas till Nordvy. Vi hör av oss med ett förslag, utan köpkrav.'));
  card.append(node('h2', '', 'Vart ska vi höra av oss?'), node('p', 'fine', lead), form);
  if (state.partial && left.length) {
    const back = node('button', 'textlink', 'Fortsätt intervjun i stället');
    back.type = 'button';
    back.addEventListener('click', () => {
      card.remove();
      state.partial = false;
      state.stage = 'chat';
      save();
      resumeQuestion();
    });
    card.append(back);
  }
  log.append(card);
  scrollDown();
  if (!touch) name.focus({ preventScroll: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = name.value.trim();
    const m = email.value.trim();
    const badName = !n;
    const badMail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
    name.setAttribute('aria-invalid', String(badName));
    email.setAttribute('aria-invalid', String(badMail));
    if (badName || badMail) {
      error.textContent = badName ? 'Skriv ditt namn.' : 'Skriv en giltig e-postadress.';
      return (badName ? name : email).focus();
    }
    go.disabled = true;
    go.textContent = 'Skickar…';
    state.contact = { name: n, email: m, phone: phone.value.trim() };
    const result = await post('/api/interview/finish', { brief: state.brief, issues: state.issues, log: state.log, contact: state.contact, partial: state.partial }, 45000);
    state.sent = Boolean(result);
    card.remove();
    showResult(true);
  });
}

function mailLink(label) {
  const a = node('a', '', label);
  const body = briefToText(state.brief, state.issues, state.contact);
  a.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(`Självintervju: ${state.brief.foretagsnamn || ''}`)}&body=${encodeURIComponent(body.slice(0, 1700))}`;
  return a;
}

function showResult(fresh) {
  state.stage = 'done';
  save();
  hideComposer();
  renderChecklist();
  stage.classList.add('done');
  const company = state.brief.foretagsnamn || 'ditt företag';
  pstatus.textContent = `Utkast för ${company}`;

  const rec = recommendPackage(state.brief);
  const pkg = PACKAGES[rec.id];
  const card = node('div', 'card result');
  const eyebrow = node('p', 'eyebrow');
  eyebrow.append(useIcon('i-star'), state.sent ? 'Skickat' : 'Nästan klart');
  eyebrow.firstChild.classList.add('star');

  const status = node('p');
  if (state.sent) status.textContent = 'Underlaget är skickat till Nordvy. Vi läser igenom det och hör av oss på mejl.';
  else status.append('Det gick inte att skicka underlaget automatiskt. Du kan ', mailLink('mejla det till oss'), ' eller boka en genomgång här nedanför.');

  const recBox = node('div', 'rec');
  const price = node('b', '', pkg.name);
  price.append(node('span', '', pkg.monthly ? `${kr(pkg.oneTime)} + ${kr(pkg.monthly)}/mån` : kr(pkg.oneTime)));
  recBox.append(node('small', '', 'Paket som verkar passa'), price, node('p', '', rec.reason));

  const actions = node('div', 'actions');
  const book = node('button', 'btn btn-p btn-lg', 'Boka en genomgång av utkastet');
  book.type = 'button';
  book.addEventListener('click', async () => {
    book.disabled = true;
    await openBooking(`${CAL_ACCOUNT}/30min`, {
      name: state.contact?.name,
      email: state.contact?.email,
      // Bara en kort rad följer med till Cal.com. Underlaget går via mejl.
      notes: `Självintervju gjord för ${company}. ${state.sent ? 'Underlaget är mejlat till Nordvy.' : 'Underlaget kunde inte mejlas automatiskt.'}`,
    });
    book.disabled = false;
  });
  const plans = node('a', 'btn btn-g', 'Se vad som ingår i paketen');
  plans.href = '/#paket';
  actions.append(book, plans);

  const next = node('p', 'fine');
  next.append('Har du logga och bilder? Mejla dem till ');
  const mail = node('a', '', MAIL_TO);
  mail.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(`Bilder: ${company}`)}`;
  next.append(mail, ' så använder vi dem när vi bygger.');

  const again = node('button', 'textlink', 'Gör en ny intervju');
  again.type = 'button';
  again.addEventListener('click', startOver);

  card.append(eyebrow, node('h2', '', `Tack! Nu vet vi vad ${company} behöver.`), status, recBox, actions, next, again);
  log.append(card);
  scrollDown();
  if (fresh && touch) setView('chat');
}

async function resumeQuestion() {
  const left = missing(state.brief);
  if (!left.length) return showSummary();
  if (!state.asked.length || hasValue(state.brief, state.asked[0])) {
    state.asked = [left[0]];
    state.askCount = 1;
    await guideSays(fallbackQuestion(left[0], NEED.length - left.length, state.brief));
  }
  setupComposer();
}

/* ------------------------------------------------------- vy och start */

function setView(view) {
  document.body.dataset.view = view;
  $$('.iv-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
  if (view === 'preview') $('#tab-preview .dot').classList.remove('on');
  if (matchMedia('(max-width: 860px)').matches) {
    stage.hidden = view === 'list';
    list.hidden = view !== 'list';
  }
  if (view === 'chat') scrollDown();
}
$$('.iv-tabs button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$$('.iv-device button').forEach((b) =>
  b.addEventListener('click', () => {
    $$('.iv-device button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const panel = b.dataset.panel;
    stage.hidden = panel === 'list';
    list.hidden = panel !== 'list';
    stage.classList.toggle('mobile', panel === 'mobile');
  }),
);

function start() {
  const restored = restore();
  renderChecklist();
  updatePreview(false);
  $('#tab-preview .dot').classList.remove('on');
  if (!restored) return showStart();

  for (const m of state.log) bubble(m.who === 'me' ? 'me' : 'guide', m.text);
  if (state.coreShown) {
    stage.classList.add('done');
    pstatus.textContent = 'Första utkastet är klart';
  }
  if (state.stage === 'done') showResult(false);
  else if (state.stage === 'contact') showContact();
  else if (state.stage === 'summary' || state.stage === 'edit') showSummary();
  else resumeQuestion();
}
start();

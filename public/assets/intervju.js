// Självintervjun i webbläsaren.
//
// Kunden svarar på en fråga i taget. Servern (Workers AI) formulerar frågorna och
// plockar ut svaren, men det är den här sidan som håller reda på checklistan,
// räknar förloppet och ritar projektbladet. Svarar inte servern ställs checklistans
// färdiga frågor i stället, så intervjun går alltid att slutföra.

import {
  repeatChips,
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
  fallbackQuestion,
  recommendPackage,
  briefToText,
  plan,
  questionFor,
  progressOf,
  isUF,
  MAX_ANSWERS,
} from './shared/brief.js';
import { createSheet } from './projektblad.js';
import { openBooking, CAL_ACCOUNT } from './cal.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(pointer: coarse)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STORE = 'nordvy-intervju-v2';
const UNDO_MAX = 12;
const kr = (n) => `${new Intl.NumberFormat('sv-SE').format(n)} kr`;
const GREETING =
  'Hej! Jag är Nordvys intervjuassistent. Jag ställer några frågor om ditt företag, en i taget, och medan du svarar ser du hur vi planerar din sida. Efter intervjun bygger vi ett riktigt utkast åt dig. Vet du inte något svar säger du bara det.';

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
  choice: '', // paketet kunden själv valde: uf, bas, premium eller osaker
  coreShown: false,
  partial: false,
  contact: null,
  sent: null,
  undo: [], // ögonblicksbilder före varje svar, så att kunden kan ändra förra svaret
  answers: 0, // antal svar i chatten, för taket MAX_ANSWERS
};

const log = $('#log');
const composer = $('#composer');
const input = $('#answer');
const chipsBox = $('#chips');
const hint = $('#hint');
const early = $('#early');
const undoBtn = $('#undo');
const sendBtn = $('.iv-send');
const stage = $('#stage');
const list = $('#list');
const bar = $('#bar');
const stepLabel = $('#step-label');
const pstatus = $('#pstatus');
const legal = $('.iv-legal');

const sheet = createSheet(stage);

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
      stage: ['chat', 'edit', 'summary', 'packages', 'contact', 'done'].includes(saved.stage) ? saved.stage : 'chat',
      brief: cleanBrief(saved.brief),
      issues: cleanIssues(saved.issues),
      log: cleanLog(saved.log),
      asked: Array.isArray(saved.asked) ? saved.asked.filter((k) => NEED.includes(k)).slice(0, 2) : [],
      askCount: Number(saved.askCount) || 1,
      carry: String(saved.carry || '').slice(0, LIMITS.value),
      carryField: NEED.includes(saved.carryField) ? saved.carryField : '',
      copy: saved.copy && typeof saved.copy === 'object' ? saved.copy : null,
      choice: ['uf', 'bas', 'premium', 'osaker'].includes(saved.choice) ? saved.choice : '',
      coreShown: Boolean(saved.coreShown),
      partial: Boolean(saved.partial),
      contact: saved.contact || null,
      sent: saved.sent ?? null,
      undo: Array.isArray(saved.undo) ? saved.undo.slice(-UNDO_MAX) : [],
      answers: Number(saved.answers) || 0,
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
  sheet.update(state.brief, { animate: animate && !reduced, done: state.stage === 'done' });
  if (document.body.dataset.view !== 'preview') $('#tab-preview .dot').classList.add('on');
}

function renderChecklist() {
  // Förloppet visas som fyra delar, inte som "0 av 23 punkter". Antalet frågor beror på typen av företag.
  const asks = plan(state.brief);
  const p = progressOf(state.brief);
  const finished = ['summary', 'edit', 'contact', 'done'].includes(state.stage);
  const share = finished ? 1 : p.share;
  bar.style.setProperty('--p', share.toFixed(3));
  bar.setAttribute('aria-valuenow', String(Math.round(share * 100)));
  bar.setAttribute('aria-valuetext', finished ? 'Klart' : `Del ${p.part} av ${p.parts}: ${p.label}`);
  stepLabel.textContent = state.stage === 'done' ? 'Underlaget är skickat' : finished ? 'Snart klart' : `Del ${p.part} av ${p.parts}: ${p.label}`;

  const dl = $('#fields');
  dl.replaceChildren();
  // Bara det kunden har svarat visas. En lång lista med "Inte frågat än" kändes som ett formulär.
  // Teamets uppföljningspunkter visas inte för kunden: de står i underlaget.
  for (const f of FIELDS) {
    if (f.level === 0 || !asks.includes(f.key) || !hasValue(state.brief, f.key)) continue;
    const v = String(state.brief[f.key]).trim();
    const row = node('div', `f${isSaknas(v) ? ' gap' : ' has'}`);
    row.append(node('i'), node('dt', '', f.label), node('dd', '', isSaknas(v) ? 'Vet inte än' : v));
    dl.append(row);
  }
  if (!dl.children.length) dl.append(node('p', 'fine', 'Dina svar visas här medan du svarar.'));
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
  // Svarsknapparna beror på typen av företag (ett UF-företag får andra val än en salong).
  const field = questionFor(state.asked[0], state.brief);
  composer.hidden = false;
  legal.hidden = false;
  input.value = '';
  input.maxLength = LIMITS.message;
  chipsBox.replaceChildren();
  // En följdfråga om samma fält (färger efter stilen, en enklare fråga efter "vet inte") får egna
  // knappar eller inga alls, så att kunden inte svarar på förra frågan igen.
  const repeat = state.askCount > 1;
  const chips = state.stage === 'edit' ? null : repeat ? repeatChips(state.asked[0]) : field?.chips;
  const multi = !repeat && Boolean(field?.multi);
  chipsBox.hidden = !chips;
  if (chips) {
    for (const label of chips) {
      const chip = node('button', 'chip', label);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        if (!multi) {
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
    input.placeholder = chips ? (multi ? 'Något mer? (valfritt)' : 'Eller skriv ett eget svar') : 'Skriv ditt svar';
    setHint(chips && multi ? 'Välj en eller flera och tryck på pilen.' : touch ? 'Tryck på pilen för att skicka.' : 'Tryck Enter för att skicka.');
  }
  early.hidden = !(state.stage === 'chat' && coreDone(state.brief));
  undoBtn.hidden = !(state.stage === 'chat' && state.undo.length);
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
    brief[field] = isNegative(message) ? (field === 'referens_ok' ? 'Nej' : field === 'undvik' && /^\s*(nej|nä|inget|ingenting)(?![a-zåäö])(?!.*vet inte)/i.test(message) ? 'Inget särskilt' : 'saknas') : message.slice(0, LIMITS.value);
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
  if (!editing) remember(message);
  userSays(message);
  sendBtn.disabled = true;
  hideComposer();
  // "Nej" på "Vad vill du ändra?" betyder att allt stämmer. Det är ingen ändring att notera.
  if (editing && isNegative(message)) {
    await guideSays('Okej, då låter vi allt vara som det är.');
    return showSummary();
  }
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
    const repeat = String(state.carry || '').toLocaleLowerCase('sv-SE').split(' / ').includes(message.trim().toLocaleLowerCase('sv-SE'));
    state.carry = sameField ? (repeat ? state.carry : [state.carry, message].filter(Boolean).join(' / ')).slice(0, LIMITS.value) : '';
    state.carryField = sameField ? previousAsked : '';
  }
  state.askCount = sameField ? state.askCount + 1 : 1;
  state.asked = turn.asked || [];
  state.answers += 1;
  save();

  if (!state.coreShown && coreDone(state.brief)) firstDraftReady();
  // Kunden ville sluta: inga fler frågor, teamet tar resten.
  if (turn.stopped) {
    await guideSays('Inga problem. Det du har berättat räcker för att börja, och resten tar vi tillsammans när vi hörs.');
    return showSummary();
  }
  // Intervjun håller inte på i evighet. Efter MAX_ANSWERS svar avslutas den med det som finns.
  if (!turn.done && turn.reply && state.answers >= MAX_ANSWERS) {
    const left = missing(state.brief);
    if (left.length) state.issues = cleanIssues([...state.issues, { topic: 'annat', text: `Intervjun avslutades efter ${MAX_ANSWERS} svar. Saknar: ${left.map((k) => FIELD[k].label).join(', ')}.` }]);
    await guideSays('Tack, nu har jag det jag behöver för att teamet ska kunna börja. Resten tar vi tillsammans när vi hörs.');
    return showSummary();
  }
  if (turn.done || !turn.reply) return showSummary();
  await guideSays(turn.reply);
  setupComposer();
}

// De sex första punkterna är klara: nu har planen för sidan tagit form.
// Ingen låtsassida längre: det riktiga utkastet bygger Nordvy efter intervjun.
function firstDraftReady() {
  state.coreShown = true;
  save();
  pstatus.textContent = 'Planen för din sida har tagit form';
  noteLine(touch ? 'Planen för din sida har tagit form. Se den under fliken Planen.' : 'Planen för din sida har tagit form. Du ser den här bredvid.');
  noteLine('Några frågor till, så har vi allt vi behöver för att bygga.');
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
// Sparar läget före varje svar, så att kunden kan gå tillbaka och ändra ett svar som blev fel.
function remember(message) {
  const { brief, issues, asked, askCount, carry, carryField, coreShown, answers } = state;
  state.undo.push({ brief, issues, asked, askCount, carry, carryField, coreShown, answers, logLen: state.log.length, message });
  if (state.undo.length > UNDO_MAX) state.undo.shift();
}

undoBtn.addEventListener('click', () => {
  const snap = state.undo.pop();
  if (!snap || state.stage !== 'chat' || sendBtn.disabled) return;
  const { logLen, message, ...rest } = snap;
  Object.assign(state, rest);
  state.log.length = Math.min(state.log.length, logLen);
  save();
  log.replaceChildren();
  for (const m of state.log) bubble(m.who === 'me' ? 'me' : 'guide', m.text);
  renderChecklist();
  updatePreview(false);
  setupComposer();
  // Det förra svaret står kvar i rutan, så att kunden bara behöver rätta det.
  input.value = message;
  autosize();
  setHint('Ändra svaret och skicka igen.');
  input.focus({ preventScroll: true });
});

early.addEventListener('click', () => {
  state.partial = true;
  userSays('Skicka det jag har så här långt');
  showPackages();
});

/* -------------------------------------- start, sammanfattning, kontakt */

// Länk till integritetspolicyn i samtycket. Öppnas i en ny flik, så att intervjun ligger kvar.
function policyLink() {
  const a = node('a', '', 'Läs integritetspolicyn');
  a.href = '/integritet';
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}

function showStart() {
  hideComposer();
  const card = node('div', 'card start');
  const eyebrow = node('p', 'eyebrow');
  eyebrow.append(useIcon('i-star'), 'Självintervjun');
  eyebrow.firstChild.classList.add('star');
  const ul = node('ul');
  for (const t of [
    'En fråga i taget, i din egen takt. Vet du inte något säger du bara det, så får du en enklare fråga.',
    'Medan du svarar ser du hur vi planerar din sida. Efter intervjun bygger vi ett riktigt utkast åt dig, och du får en länk inom 2 vardagar.',
    'Skrev du fel kan du alltid ändra förra svaret. Hela intervjun tar cirka tio minuter.',
  ])
    ul.append(node('li', '', t));
  const consent = node('label', 'consent');
  const box = node('input');
  box.type = 'checkbox';
  const text = node('span');
  text.append(
    node('b', '', 'Jag godkänner att mina svar behandlas. '),
    'Svaren tolkas av en AI-tjänst (Claude från Anthropic, med Cloudflare Workers AI som reserv) och mejlas till Nordvy när du skickar in dem. Telefonnummer och mejladresser tas bort innan något skickas till AI:n. Vi använder dem bara för att ta fram ett förslag på din hemsida och raderar dem om du ber oss. Skriv inga personnummer, lösenord eller betaluppgifter. ',
    policyLink(),
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
  renderChecklist();
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
    showPackages();
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

// Kunden väljer själv paket. Vi rekommenderar ett, med en kort förklaring, och säger kort när de andra passar.
const FITS = {
  uf: 'För UF-företag som vill visa sina produkter och ta emot beställningar under läsåret. Ingen månadsavgift.',
  bas: 'När ni vill synas på Google och att kunderna ringer, mejlar eller hittar hit.',
  premium: 'När kunderna ska kunna boka tid, beställa eller betala direkt på sidan.',
};
const priceLine = (p) => (p.monthly ? `${kr(p.oneTime)} + ${kr(p.monthly)}/mån` : `${kr(p.oneTime)}, ingen månadsavgift`);

function showPackages() {
  state.stage = 'packages';
  save();
  hideComposer();
  renderChecklist();
  const rec = recommendPackage(state.brief);
  // UF-paketet är bara för UF-företag. Andra väljer mellan Bas och Premium.
  const ids = rec.id === 'uf' || isUF(state.brief) ? ['uf', 'bas', 'premium'] : ['bas', 'premium'];
  const all = [...ids, 'osaker'];

  const card = node('div', 'card pkgs');
  const group = node('div', 'pkg-list');
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Paket');
  const options = [];
  const pick = (id) => {
    state.choice = id;
    save();
    for (const o of options) {
      const on = o.dataset.id === id;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    }
  };
  for (const id of all) {
    const o = node('button', `pkg-opt${id === rec.id ? ' rec' : ''}`);
    o.type = 'button';
    o.dataset.id = id;
    o.setAttribute('role', 'radio');
    o.append(node('i', 'pkg-dot'));
    const text = node('span', 'pkg-text');
    if (id === 'osaker') {
      text.append(node('b', '', 'Vet inte än'), node('span', 'pkg-fit', 'Vi går igenom paketen tillsammans när vi visar utkastet.'));
    } else {
      const p = PACKAGES[id];
      const top = node('span', 'pkg-top');
      top.append(node('b', '', p.name), node('span', 'pkg-price', priceLine(p)));
      text.append(top);
      if (id === rec.id) text.append(node('span', 'pkg-why', `Vår rekommendation. ${rec.reason}`));
      else text.append(node('span', 'pkg-fit', FITS[id]));
    }
    o.append(text);
    o.addEventListener('click', () => pick(id));
    o.addEventListener('keydown', (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const i = (options.indexOf(o) + step + options.length) % options.length;
      pick(options[i].dataset.id);
      options[i].focus();
    });
    options.push(o);
    group.append(o);
  }
  pick(all.includes(state.choice) ? state.choice : rec.id);

  const go = node('button', 'btn btn-p btn-lg', 'Fortsätt');
  go.type = 'button';
  go.addEventListener('click', () => {
    card.remove();
    userSays(state.choice === 'osaker' ? 'Jag vet inte än vilket paket' : `Jag väljer ${PACKAGES[state.choice].name}`);
    showContact();
  });
  const more = node('a', 'textlink', 'Se allt som ingår i paketen');
  more.href = '/#paket';
  more.target = '_blank';
  more.rel = 'noopener';
  card.append(
    node('h2', '', 'Vilket paket vill ni ha?'),
    node('p', 'fine', 'Välj det som känns rätt. Inget är bestämt förrän ni har sett utkastet, och ni kan byta då.'),
    group,
    go,
    more,
  );
  log.append(card);
  scrollDown();
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
  renderChecklist();
  const card = node('div', 'card');
  const form = node('form');
  form.noValidate = true;
  const known = String(state.brief.kontakt || '').match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/);
  const [l1, name] = field('Ditt namn', { name: 'name', autocomplete: 'name', maxLength: 100 });
  const [l2, email] = field('E-post', { name: 'email', type: 'email', autocomplete: 'email', maxLength: 254, value: known ? known[0] : '' });
  // Telefonnumret från intervjun fylls i också, så att kunden slipper skriva det två gånger.
  const knownPhone = String(state.brief.kontakt || '').match(/(?:\+46|0)[\d\s-]{6,14}\d/);
  const [l3, phone] = field('Telefon (valfritt)', { name: 'phone', type: 'tel', autocomplete: 'tel', maxLength: 40, value: knownPhone ? knownPhone[0].replace(/\s+/g, ' ').trim() : '' });
  const error = node('span', 'err');
  error.setAttribute('role', 'alert');
  const go = node('button', 'btn btn-p btn-lg', 'Skicka till Nordvy');
  go.type = 'submit';
  const left = missing(state.brief);
  const lead = state.partial && left.length ? 'Vi skickar det du hunnit svara på. Resten tar vi tillsammans när vi hörs.' : 'Sista steget: vem ska vi höra av oss till?';
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
    const result = await post('/api/interview/finish', { brief: state.brief, issues: state.issues, log: state.log, contact: state.contact, partial: state.partial, choice: state.choice }, 45000);
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
  const company = state.brief.foretagsnamn || 'ditt företag';
  pstatus.textContent = `Planen för ${company} är klar`;
  updatePreview(false);

  const card = node('div', 'card result');
  const eyebrow = node('p', 'eyebrow');
  eyebrow.append(useIcon('i-star'), state.sent ? 'Skickat' : 'Nästan klart');
  eyebrow.firstChild.classList.add('star');

  const status = node('p');
  if (state.sent) status.textContent = 'Underlaget är skickat. Nu bygger vi ett riktigt utkast av din sida, och du får en länk på mejl inom 2 vardagar.';
  else status.append('Det gick inte att skicka underlaget automatiskt. Du kan ', mailLink('mejla det till oss'), ' eller boka en genomgång här nedanför.');

  const recBox = node('div', 'rec');
  const chosen = PACKAGES[state.choice];
  if (chosen) {
    const price = node('b', '', chosen.name);
    price.append(node('span', '', priceLine(chosen)));
    recBox.append(node('small', '', 'Ditt val'), price, node('p', '', 'Ni kan byta paket när ni har sett utkastet.'));
  } else {
    recBox.append(node('small', '', 'Paket'), node('b', '', 'Vi väljer tillsammans'), node('p', '', 'Vi går igenom paketen när vi visar utkastet.'));
  }

  const actions = node('div', 'actions');
  const book = node('button', 'btn btn-p btn-lg', 'Boka ett samtal om sidan');
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
  if (state.coreShown) pstatus.textContent = 'Planen för din sida har tagit form';
  if (state.stage === 'done') showResult(false);
  else if (state.stage === 'packages') showPackages();
  else if (state.stage === 'contact') showContact();
  else if (state.stage === 'summary' || state.stage === 'edit') showSummary();
  else resumeQuestion();
}
start();

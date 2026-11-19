// Korn & Kaka (provsida v4) – "öppet nu" som rubrik och tårtbeställning.
// Bas-paketet: formuläret blir ett färdigskrivet mejl (mailto:) till bageriet.
// Så länge sidan är ett utkast (DRAFT) öppnas inget mejl.

const DRAFT = true;
const BAKERY_EMAIL = 'tarta@kornochkaka.example'; // påhittad adress för provsidan
const OPEN = { days: [2, 3, 4, 5, 6], from: 7, to: 15 }; // tis–lör 7–15
const DAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];

const $ = (s) => document.querySelector(s);
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/* ---------------------------------------------------------------- öppet nu */

// Tid i Malmö, oavsett var besökaren är.
const parts = Object.fromEntries(
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', weekday: 'short', hour: 'numeric', hour12: false })
    .formatToParts(new Date()).map((p) => [p.type, p.value]),
);
const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
const hour = Number(parts.hour) % 24;
const openToday = OPEN.days.includes(day);
let text;
if (openToday && hour >= OPEN.from && hour < OPEN.to) text = `Öppet nu, till klockan ${OPEN.to}`;
else if (openToday && hour < OPEN.from) text = `Stängt nu. Vi öppnar i dag klockan ${OPEN.from}`;
else {
  let next = (day + 1) % 7;
  while (!OPEN.days.includes(next)) next = (next + 1) % 7;
  text = `Stängt nu. Vi öppnar ${next === (day + 1) % 7 ? 'i morgon' : 'på ' + DAYS[next]} klockan ${OPEN.from}`;
}
// Rubriken blir det korta beskedet, och raden under säger när.
const [head, ...rest] = text.replace('Öppet nu, ', 'Öppet nu. ').split('. ');
$('#nu').textContent = `${head}.`;
const when = rest.join('. ');
$('#nuNar').textContent = when.charAt(0).toUpperCase() + when.slice(1) + '.';
$('#status').dataset.open = String(text.startsWith('Öppet'));

/* ---------------------------------------------------------------- tårtbeställning */

// Tidigaste hämtdag räknas i svensk tid, samma som "öppet nu".
const earliest = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm' }).format(new Date(Date.now() + 2 * 864e5));
$('#cDate').min = earliest;
const weekday = (value) => new Date(`${value}T12:00:00`).getDay();

$('#contact').addEventListener('submit', (e) => {
  e.preventDefault();
  const checks = [
    ['cName', 'Skriv ditt namn.', (v) => v.trim().length > 0],
    ['cMail', 'Skriv en e-postadress så att vi kan bekräfta beställningen.', validEmail],
    ['cDate', 'Välj en dag minst två dagar fram.', (v) => Boolean(v) && v >= earliest],
    ['cMsg', 'Skriv vilken tårta du vill ha.', (v) => v.trim().length > 0],
  ];
  let first = null;
  for (const [id, msg, ok] of checks) {
    const input = $(`#${id}`);
    let bad = !ok(input.value);
    let message = msg;
    if (!bad && id === 'cDate' && !OPEN.days.includes(weekday(input.value))) {
      bad = true;
      message = 'Vi har stängt söndag och måndag. Välj en dag mellan tisdag och lördag.';
    }
    input.setAttribute('aria-invalid', String(bad));
    $(`#e${id}`).textContent = bad ? message : '';
    if (bad && !first) first = input;
  }
  const status = $('#cStatus');
  if (first) {
    status.textContent = '';
    nudge(first.closest('.field'), 'r-fel');
    return first.focus();
  }
  setTimeout(() => nudge(status, 'r-klar'));

  const lines = [
    `Namn: ${$('#cName').value.trim()}`,
    `E-post: ${$('#cMail').value.trim()}`,
    `Hämtas: ${$('#cDate').value}`,
    `Storlek: ${$('#cSize').value}`,
    '',
    $('#cMsg').value.trim(),
  ];
  if (DRAFT) {
    status.textContent = `Provsida: inget mejl öppnas. På en riktig sida öppnas ett färdigt mejl till ${BAKERY_EMAIL}.`;
    return;
  }
  location.href = `mailto:${BAKERY_EMAIL}?subject=${encodeURIComponent('Tårtbeställning')}&body=${encodeURIComponent(lines.join('\n'))}`;
  status.textContent = `Nu öppnas ett mejl med din beställning. Skicka det, så hör vi av oss och bekräftar. Öppnades inget mejl? Skriv till ${BAKERY_EMAIL}.`;
});

// Startar en rörelse från rorelse.css om igen, även om klassen redan sitter kvar från förra gången.
function nudge(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/* ---------------------------------------------------------------- testläge */
// ?utan-foton visar platshållare i stället för fotona, så att vi kan jämföra.
if (new URLSearchParams(location.search).has('utan-foton')) document.documentElement.classList.add('nophoto');

// Bokning via Cal.com. Länkar med data-cal="konto/händelse" öppnar kalendern i en ruta
// ovanpå sidan. Cal.coms skript hämtas först när någon visar intresse för en bokningsknapp.
// Går det inte att ladda öppnas den vanliga Cal.com-sidan i stället.

export const CAL_ACCOUNT = 'nordvy-zovyfw';
const SCRIPT = 'https://app.cal.com/embed/embed.js';
const ORIGIN = 'https://app.cal.com';
const NS = 'nordvy';

let loading = null;

function load() {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const w = window;
    const push = (target, args) => target.q.push(args);
    // Samma kö som Cal.coms egen kodsnutt: anrop sparas tills embed.js har laddats.
    w.Cal =
      w.Cal ||
      function () {
        const cal = w.Cal;
        const args = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          cal.loaded = true;
        }
        if (args[0] === 'init') {
          const api = function () {
            push(api, arguments);
          };
          const namespace = args[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            push(cal.ns[namespace], args);
            push(cal, ['initNamespace', namespace]);
          } else push(cal, args);
          return;
        }
        push(cal, args);
      };
    w.Cal('init', NS, { origin: ORIGIN });
    w.Cal.ns[NS]('ui', {
      theme: 'dark',
      cssVarsPerTheme: { dark: { 'cal-brand': '#5BC0EB' }, light: { 'cal-brand': '#0B1F3A' } },
      hideEventTypeDetails: false,
      layout: 'month_view',
    });
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve(w.Cal.ns[NS]);
    script.onerror = () => {
      loading = null;
      reject(new Error('cal embed failed'));
    };
    document.head.append(script);
  });
  return loading;
}

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

/**
 * Öppnar bokningen. `prefill` kan innehålla name, email och notes.
 * Returnerar true om rutan öppnades, annars false (då har vi gått till Cal.com direkt).
 */
export async function openBooking(calLink = CAL_ACCOUNT, prefill = {}) {
  const config = { layout: 'month_view', theme: 'dark' };
  for (const key of ['name', 'email', 'notes']) {
    if (prefill[key]) config[key] = String(prefill[key]).slice(0, key === 'notes' ? 1800 : 120);
  }
  try {
    const api = await Promise.race([load(), timeout(4500)]);
    api('modal', { calLink, config });
    return true;
  } catch {
    const url = new URL(`https://cal.com/${calLink}`);
    for (const key of ['name', 'email', 'notes']) if (config[key]) url.searchParams.set(key, config[key]);
    window.location.assign(url.toString());
    return false;
  }
}

// Kopplar alla länkar med data-cal. Utan JavaScript fungerar de som vanliga länkar.
export function bindBookingLinks(root = document) {
  const warm = () => load().catch(() => {});
  for (const link of root.querySelectorAll('a[data-cal]')) {
    if (link.dataset.calBound) continue;
    link.dataset.calBound = '1';
    link.addEventListener('pointerenter', warm, { once: true });
    link.addEventListener('focus', warm, { once: true });
    link.addEventListener('touchstart', warm, { once: true, passive: true });
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      link.setAttribute('aria-busy', 'true');
      openBooking(link.dataset.cal).finally(() => link.removeAttribute('aria-busy'));
    });
  }
}

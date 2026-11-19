// Rörelse för kundsidor: avtäckning när man scrollar, listor i tur och ordning, parallax och sidhuvud.
// Används med rorelse.css och data-r. Regler i .claude/skills/kundsida/rorelse.md.
// Länka med <script src="/assets/kund/rorelse.js" defer></script>.
(() => {
  const root = document.documentElement;
  const off = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('utan-rorelse');
  if (off) {
    root.classList.add('r-av');
    return;
  }

  const reveal = [...document.querySelectorAll('[data-r~="bild"], [data-r~="lista"]')];
  for (const list of document.querySelectorAll('[data-r~="lista"]')) {
    [...list.children].forEach((child, n) => child.style.setProperty('--n', String(Math.min(n, 12))));
  }
  // Det som redan syns när sidan laddas avtäcks inte: det skulle se ut som att sidan blinkar.
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.92 && r.bottom > 0;
  };
  for (const el of reveal) if (inView(el)) el.classList.add('r-syns');
  root.classList.add('r-js');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('r-syns');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    for (const el of reveal) if (!el.classList.contains('r-syns')) io.observe(el);
  } else {
    for (const el of reveal) el.classList.add('r-syns');
  }

  // Parallax och sidhuvud delar en enda lyssnare som bara räknar när sidan faktiskt ritas om.
  const layers = [...document.querySelectorAll('[data-r~="parallax"]')];
  const heads = [...document.querySelectorAll('[data-r~="huvud"]')];
  if (!layers.length && !heads.length) return;
  let queued = false;
  const update = () => {
    queued = false;
    const y = scrollY;
    for (const el of heads) el.classList.toggle('r-ner', y > 40);
    for (const el of layers) {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) continue;
      // Högst 60 px åt något håll, så att bilden aldrig glider ur sin ram.
      const shift = Math.max(-60, Math.min(60, -box.top * 0.18));
      el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    }
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
})();

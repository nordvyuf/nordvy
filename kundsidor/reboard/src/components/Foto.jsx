import { PHOTOS } from '../data.js';

// Ett foto i rätt form. Finns inget foto (src: null i data.js) visas reserven i stället (fallback),
// eller ingenting. Så ser sidan färdig ut innan fotona har kommit, och ett foto som läggs in i data.js
// hamnar på rätt plats utan andra ändringar.
// ?utan-foton visar reserven även när fotot finns (klassen nophoto på <html>), för att jämföra.
export function Foto({ id, ratio = '4 / 5', dark = false, eager = false, reveal = false, intro = false, className = '', sizes = '100vw', fallback = null }) {
  const p = PHOTOS[id];
  if (!p.src) return fallback;
  return (
    <>
      <div
        className={`foto har-bild${dark ? ' mork' : ''} ${className}`}
        style={ratio ? { aspectRatio: ratio } : undefined}
        data-r={intro ? 'intro-bild' : reveal ? 'bild' : undefined}
      >
        <img
          src={p.src}
          width={p.w}
          height={p.h}
          alt={p.alt}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          fetchpriority={eager ? 'high' : undefined}
          decoding="async"
        />
      </div>
      {fallback && <div className="foto-reserv">{fallback}</div>}
    </>
  );
}

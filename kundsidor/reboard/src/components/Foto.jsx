import { PHOTOS } from '../data.js';

// Ett foto i rätt form. Saknas bilden visas en platshållare som säger vad bilden ska visa.
// ?utan-foton visar platshållarna även när fotona finns (klassen nophoto på <html>).
export function Foto({ id, ratio = '4 / 5', dark = false, eager = false, reveal = false, className = '', sizes = '100vw' }) {
  const p = PHOTOS[id];
  const cls = `foto${dark ? ' mork' : ''}${p.src ? ' har-bild' : ''} ${className}`;
  return (
    <div className={cls} style={ratio ? { aspectRatio: ratio } : undefined} data-r={reveal ? 'bild' : undefined}>
      {p.src && (
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
      )}
      <div className="foto-plats" role={p.src ? undefined : 'img'} aria-label={p.src ? undefined : `Foto kommer: ${p.wanted}`}>
        <span aria-hidden="true">
          <b>Foto kommer</b>
          <span className="vad">: {p.wanted}</span>
        </span>
      </div>
    </div>
  );
}

// Sidans enda djärva drag: brädorna i skala på ett rutnät med 5 cm-rutor.
// Den valda brädan växer eller krymper mjukt, och priset och knappen byts ut.
// "Egna mått": besökaren skriver längd och bredd, brädan ritas i rutnätet om den får plats.
import { useRef } from 'react';
import { CUSTOM, GRID, SIZES, customDims, dimText, findSize, isCustom, kr } from '../data.js';
import { Button } from './ui/button.jsx';
import { CustomDims } from './CustomDims.jsx';

const pct = (cm, total) => `${(cm / total) * 100}%`;
const cmText = (n) => String(n).replace('.', ',');

export function SizePicker({ sizeId, setSizeId, custom, setCustom, onOrder }) {
  const size = findSize(sizeId);
  const egna = isCustom(sizeId);
  const dimsRef = useRef(null);

  // Det som ritas i rutnätet. Egna mått vänds så att den längsta sidan ligger ner, och visas bara om de får plats.
  let board = egna ? null : size;
  let hint = '';
  if (egna) {
    const d = customDims(custom);
    if (!d) hint = 'Skriv längd och bredd, så visas brädan här.';
    else {
      const w = Math.max(d.w, d.h);
      const h = Math.min(d.w, d.h);
      if (w <= GRID.w && h <= GRID.h) board = { w, h, t: d.t };
      else hint = `Brädan är större än rutnätet (${GRID.w} × ${GRID.h} cm). Du kan ändå skicka en förfrågan.`;
    }
  }
  const matLabel = board
    ? `${egna ? 'Egna mått' : `${size.name} skärbräda`}, ${cmText(board.w)} × ${cmText(board.h)} cm, jämförd med de andra storlekarna.`
    : `Rutnät med storlekarna liten och stor. ${hint}`;

  const orderClick = () => {
    if (egna && !dimsRef.current?.validate()) return;
    onOrder();
  };

  return (
    <section id="storlekar" aria-labelledby="storlekar-rubrik" className="ram pb-20 pt-12 md:pb-28 md:pt-16">
      {/* Produkten och priserna för sökmotorer (schema.org-mikrodata, eftersom CSP:n stoppar inbäddade skript). */}
      <div itemScope itemType="https://schema.org/Product" hidden>
        <meta itemProp="name" content="Skärbräda av spillvirke" />
        <meta itemProp="description" content="Handgjord skärbräda av spillvirke från lokala finsnickerier, från ReBoard UF i Malmö. Två storlekar, eller egna mått." />
        <meta itemProp="material" content="Spillvirke från lokala finsnickerier" />
        <div itemProp="brand" itemScope itemType="https://schema.org/Brand">
          <meta itemProp="name" content="ReBoard UF" />
        </div>
        <div itemProp="offers" itemScope itemType="https://schema.org/AggregateOffer">
          <meta itemProp="priceCurrency" content="SEK" />
          <meta itemProp="lowPrice" content={String(SIZES[0].price)} />
          <meta itemProp="highPrice" content={String(SIZES[SIZES.length - 1].price)} />
          <meta itemProp="offerCount" content={String(SIZES.length)} />
          {SIZES.map((s) => (
            <div key={s.id} itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <meta itemProp="name" content={`${s.name} skärbräda`} />
              <meta itemProp="price" content={String(s.price)} />
              <meta itemProp="priceCurrency" content="SEK" />
            </div>
          ))}
        </div>
      </div>
      <div className="valjare grid gap-x-12 gap-y-8">
        <div style={{ gridArea: 'rubrik' }}>
          <h2 id="storlekar-rubrik" className="text-[44px] md:text-[64px]">Hur stor ska den vara?</h2>
          <p className="mt-3 max-w-[46ch] text-black/80">
            Båda storlekarna i samma skala, eller dina egna mått. Varje ruta är 5 × 5 cm, och den ifyllda är den du har valt.
          </p>
        </div>

        <div style={{ gridArea: 'matta' }}>
          {/* Mattan med konturerna. Den är bara en bild av storlekarna, valet görs med knapparna. */}
          <div
            className="matta w-full"
            style={{
              aspectRatio: `${GRID.w} / ${GRID.h}`,
              '--ruta-x': pct(GRID.step, GRID.w),
              '--ruta-y': pct(GRID.step, GRID.h),
              // Rutorna räknas från brädornas hörn nere till vänster, så att kanterna hamnar på linjerna.
              backgroundPosition: '0 100%',
            }}
            role="img"
            aria-label={matLabel}
          >
            {SIZES.map((s) => (
              <div key={s.id} className="kontur" style={{ width: pct(s.w, GRID.w), height: pct(s.h, GRID.h) }} aria-hidden="true">
                <span>{s.name.toLowerCase()}</span>
              </div>
            ))}
            {/* Brädan finns alltid kvar, så att den kan växa mjukt. Utan mått krymper den till ingenting. */}
            <div
              className="bradan"
              style={{ width: board ? pct(board.w, GRID.w) : 0, height: board ? pct(board.h, GRID.h) : 0, opacity: board ? 1 : 0 }}
              aria-hidden="true"
            >
              {board && size.photo && <img src={size.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              {board && (
                <span className="absolute bottom-2.5 left-3 whitespace-nowrap font-rubrik text-[22px] leading-none text-black md:bottom-3 md:left-4 md:text-[28px]">
                  {dimText(board)}
                </span>
              )}
            </div>
            {hint && (
              <p className="absolute inset-x-0 top-0 z-[3] m-3 bg-span/90 px-3 py-2 text-[14px] text-black md:max-w-[60%]" aria-hidden="true">
                {hint}
              </p>
            )}
          </div>
        </div>

        <fieldset style={{ gridArea: 'val' }} className="md:self-end">
            <legend className="mb-3 text-[15px] font-medium">Välj storlek</legend>
            <div className="segment">
              {[...SIZES, CUSTOM].map((s) => (
                <label key={s.id}>
                  <input type="radio" name="storlek" value={s.id} checked={s.id === sizeId} onChange={() => setSizeId(s.id)} />
                  <span className="seg">
                    <span className="text-[17px] font-medium">{s.name}</span>
                    <small>{s.price ? kr(s.price) : 'offert'}</small>
                  </span>
                </label>
              ))}
            </div>
        </fieldset>

        <div style={{ gridArea: 'pris' }}>
          {egna ? (
            <>
              <CustomDims ref={dimsRef} idPrefix="valj" custom={custom} setCustom={setCustom} />
              <div aria-live="polite" className="mt-6">
                <p className="font-rubrik text-[44px] leading-none md:text-[52px]">Pris efter offert</p>
                <p className="mt-3 max-w-[44ch] text-[16px]">
                  Skicka en förfrågan med dina mått, så granskar vi den och återkommer med en offert. Egna mått hinns inte före jul.
                </p>
              </div>
            </>
          ) : (
            <div aria-live="polite">
              <p className="font-rubrik text-[72px] leading-none tabular-nums md:text-[88px]">{kr(size.price)}</p>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[16px]">
                <dt className="text-black/70">Mått</dt>
                <dd className="tabular-nums">
                  {dimText(size)}
                  <span className="block text-[13px] text-black/80">längd × bredd × tjocklek</span>
                </dd>
                <dt className="text-black/70">Trä</dt>
                <dd>Spillvirke från lokala finsnickerier</dd>
              </dl>
            </div>
          )}

          <Button size="stor" className="mt-8 w-full" onClick={orderClick} id="valjare-knapp">
            {egna ? 'Skicka förfrågan om egna mått' : `Beställ ${size.name.toLowerCase()}, ${kr(size.price)}`}
          </Button>
          {/* Det man undrar precis innan man trycker: betalning, leverans och tid. */}
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-t-[1.5px] border-oliv/25 pt-4 text-[15px]">
            <dt className="text-black/70">Betalning</dt>
            <dd>{egna ? 'Swish, när du har fått offerten' : 'Swish, efter beställningen'}</dd>
            <dt className="text-black/70">Leverans</dt>
            <dd>Hämta i Malmö eller få den skickad. Vi bekräftar plats och frakt när vi har fått din beställning.</dd>
            <dt className="text-black/70">Klar</dt>
            <dd>1–2 veckor efter beställningen</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}

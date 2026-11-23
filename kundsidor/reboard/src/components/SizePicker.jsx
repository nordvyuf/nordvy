// Sidans enda djärva drag: de tre brädorna i skala på ett rutnät med 5 cm-rutor.
// Den valda brädan växer eller krymper mjukt, och priset och knappen byts ut.
import { GRID, SIZES, kr } from '../data.js';
import { Button } from './ui/button.jsx';
import { Todo } from './Todo.jsx';

const pct = (cm, total) => `${(cm / total) * 100}%`;

export function SizePicker({ sizeId, setSizeId, onOrder }) {
  const size = SIZES.find((s) => s.id === sizeId);
  const preliminary = SIZES.some((s) => !s.confirmed);

  return (
    <section id="storlekar" aria-labelledby="storlekar-rubrik" className="ram py-20 md:py-28">
      {/* Produkten och priserna för sökmotorer (schema.org-mikrodata, eftersom CSP:n stoppar inbäddade skript). */}
      <div itemScope itemType="https://schema.org/Product" hidden>
        <meta itemProp="name" content="Skärbräda av återvunnen ek" />
        <meta itemProp="description" content="Handgjord skärbräda av återvunnen ek från ReBoard UF i Malmö. Tre storlekar." />
        <meta itemProp="material" content="Återvunnen ek" />
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
            Alla tre i samma skala. Varje ruta är 5 × 5 cm, och den ifyllda är den du har valt.
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
            }}
            role="img"
            aria-label={`${size.name} skärbräda, ungefär ${size.w} × ${size.h} cm, jämförd med de andra storlekarna.`}
          >
            {SIZES.map((s) => (
              <div key={s.id} className="kontur" style={{ width: pct(s.w, GRID.w), height: pct(s.h, GRID.h) }} aria-hidden="true">
                <span>{s.name.toLowerCase()}</span>
              </div>
            ))}
            <div className="bradan" style={{ width: pct(size.w, GRID.w), height: pct(size.h, GRID.h) }} aria-hidden="true">
              <span className="absolute bottom-2.5 left-3 font-rubrik text-[22px] leading-none text-black md:bottom-3 md:left-4 md:text-[28px]">
                {size.w} × {size.h} cm
              </span>
            </div>
          </div>
          {preliminary && (
            <p className="mt-3 text-[15px] text-black/75">
              <Todo>Måtten är preliminära. Vilka mått har era brädor?</Todo>
            </p>
          )}
        </div>

        <fieldset style={{ gridArea: 'val' }} className="md:self-end">
            <legend className="mb-3 text-[15px] font-medium">Välj storlek</legend>
            <div className="segment">
              {SIZES.map((s) => (
                <label key={s.id}>
                  <input type="radio" name="storlek" value={s.id} checked={s.id === sizeId} onChange={() => setSizeId(s.id)} />
                  <span className="seg">
                    <span className="text-[17px] font-medium">{s.name}</span>
                    <small>{kr(s.price)}</small>
                  </span>
                </label>
              ))}
            </div>
        </fieldset>

        <div style={{ gridArea: 'pris' }}>
          <div aria-live="polite">
            <p className="font-rubrik text-[72px] leading-none tabular-nums md:text-[88px]">{kr(size.price)}</p>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[16px]">
              <dt className="text-black/70">Mått</dt>
              <dd>
                {size.w} × {size.h} cm{!size.confirmed && <> <Todo>bekräfta</Todo></>}
              </dd>
              <dt className="text-black/70">Passar till</dt>
              <dd>
                <Todo>Vad passar {size.name.toLowerCase()} till?</Todo>
              </dd>
              <dt className="text-black/70">Trä</dt>
              <dd>Återvunnen ek</dd>
            </dl>
          </div>

          <Button size="stor" className="mt-8 w-full" onClick={onOrder} id="valjare-knapp">
            Beställ {size.name.toLowerCase()}, {kr(size.price)}
          </Button>
          <p className="mt-3 text-[15px] text-black/75">Du betalar med Swish efter beställningen.</p>

          <p className="mt-8 border-t-[1.5px] border-oliv/25 pt-5 text-[16px]">
            <span className="font-rubrik text-[24px] leading-none">Till jul?</span>{' '}
            Skriv det i beställningen. <Todo>Sista dag att beställa för att hinna före jul?</Todo>
          </p>
        </div>
      </div>
    </section>
  );
}

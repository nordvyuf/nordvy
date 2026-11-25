import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Instagram } from './components/InstagramIcon.jsx';
import { DRAFT, INSTAGRAM, ORDER_EMAIL, REVIEWS, SIZES, TEAM, kr } from './data.js';
import { Button, buttonVariants } from './components/ui/button.jsx';
import { Foto } from './components/Foto.jsx';
import { SizePicker } from './components/SizePicker.jsx';
import { OrderDialog } from './components/OrderDialog.jsx';
import { StickyBar } from './components/StickyBar.jsx';

// Hur de gör, med Max ord (25/11). Inga detaljer om slipning eller olja som Max inte har sagt.
const STEPS = [
  ['virket', 'Spillvirket', 'Vi hämtar spillvirke från lokala leverantörer och samarbetspartners.'],
  ['arbete', 'För hand', 'Sedan bearbetar vi det råa materialet för hand.'],
  ['klar', 'Skärbrädan', 'Från spillvirke till skärbräda. Varje bräda är individuell och unik.'],
];

const FAQ = [
  {
    q: 'Hur får jag min bräda?',
    a: <>Du kan hämta den i Malmö eller få den skickad. Vi bekräftar plats och frakt när vi har fått din beställning.</>,
  },
  {
    q: 'Hur betalar jag?',
    a: <>Med Swish. När du har beställt ser du vårt Swish-nummer, beloppet och ett ordernummer som du skriver som meddelande.</>,
  },
  {
    q: 'Hur lång tid tar det?',
    a: <>1–2 veckor tills brädan är redo för leverans. Beställer du senast en vecka före jul hinner du hämta den, i mån av tillgång.</>,
  },
  {
    q: 'Hur sköter jag brädan?',
    a: (
      <>
        Diska den för hand, aldrig i diskmaskin. Torka den ordentligt efter att du har sköljt eller diskat den. Olja den varannan vecka om du använder den
        mycket, annars när den behöver.
      </>
    ),
  },
  {
    q: 'Ser alla brädor likadana ut?',
    a: <>Nej. Varje bräda är individuell och unik.</>,
  },
  {
    q: 'Kan jag få en bräda i egna mått?',
    a: (
      <>
        Ja. Välj Egna mått, skriv längd och bredd och skicka en förfrågan, så granskar vi den och återkommer med en offert. Egna mått hinns inte före jul.
      </>
    ),
  },
];

// ReBoards logga, urklippt ur en skärmbild som Max skickade (805 × 353 px, genomskinlig bakgrund).
// Den mörka versionen på ljus botten, den ljusa på oliv.
function Logga({ light = false, className = '', lazy = false, alt = 'ReBoard UF' }) {
  return (
    <img
      src={`/kund/reboard/logga-reboard-${light ? 'ljus' : 'mork'}.png`}
      width="805"
      height="353"
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      decoding="async"
      className={`block h-auto ${className}`}
    />
  );
}

const HIT = "relative after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']";

export default function App() {
  const [sizeId, setSizeId] = useState('liten');
  // Egna mått som besökaren skriver, delade mellan väljaren och beställningsrutan.
  const [custom, setCustom] = useState({ l: '', b: '' });
  const [open, setOpen] = useState(false);
  // Knappen som öppnade rutan får fokus tillbaka när den stängs.
  const opener = useRef(null);
  const order = () => {
    opener.current = document.activeElement;
    setOpen(true);
  };

  return (
    <>
      {DRAFT && (
        <div className="bg-black px-4 py-2 text-center text-[14px] text-span">
          Utkast från <b>Nordvy UF</b> till ReBoard UF. Inga beställningar skickas än.
        </div>
      )}

      <header data-r="huvud" className="huvud top-0 z-30 bg-sand md:sticky">
        <div className="ram flex flex-wrap items-center justify-between gap-x-6 pb-2 pt-3 md:h-[72px] md:flex-nowrap md:py-0">
          <a href="#" className="block rounded-[2px]">
            <Logga className="w-[110px] md:w-[124px]" />
          </a>
          <nav aria-label="Sidan" className="order-3 flex w-full gap-6 py-2 text-[15px] md:order-none md:ml-auto md:w-auto md:gap-7 md:py-0 md:text-[16px]">
            <a className={`r-lank ${HIT}`} href="#storlekar">Storlekar</a>
            <a className={`r-lank ${HIT}`} href="#hantverket">Hantverket</a>
            <a className={`r-lank ${HIT}`} href="#fragor">Frågor</a>
          </nav>
          <Button size="liten" onClick={order}>
            Beställ
          </Button>
        </div>
      </header>

      <main>
        {/* Toppen: text till vänster, fotot (eller loggan på oliv) går ut i högerkanten. */}
        <section aria-labelledby="topp-rubrik" className="relative">
          <div className="ram grid grid-cols-[minmax(0,1fr)] items-center gap-10 pb-16 pt-8 md:grid-cols-12 md:gap-0 md:pb-12 md:pt-6">
            <div className="md:col-span-6 md:pr-10">
              <h1 id="topp-rubrik" data-r="intro" style={{ '--i': 1 }} className="text-[46px] text-oliv sm:text-[64px] lg:text-[80px]">
                Skärbrädor av trä som förtjänar en andra chans
              </h1>
              <p data-r="intro" style={{ '--i': 2 }} className="mt-5 max-w-[36ch] text-[18px] md:mt-7 md:text-[20px]">
                Eget hantverk från Malmö. Vi gör skärbrädor för hand av spillvirke från lokala finsnickerier, i två storlekar eller efter dina egna mått.
              </p>
              <div data-r="intro" style={{ '--i': 3 }} className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-10">
                <p className="font-rubrik text-[40px] leading-none text-black md:text-[48px]">Från {kr(SIZES[0].price)}</p>
                <a id="topp-knapp" href="#storlekar" className={buttonVariants({ size: 'stor' })}>
                  Välj storlek
                </a>
              </div>
              <p data-r="intro" style={{ '--i': 4 }} className="mt-6 max-w-[44ch] text-[16px]">
                <span className="font-medium">Till jul?</span> Beställ senast en vecka före jul, så hinner du hämta den (i mån av tillgång). Egna mått hinns
                inte före jul.
              </p>
              <a data-r="intro" style={{ '--i': 5 }} href="#hantverket" className={`r-lank ${HIT} mt-6 inline-block text-[16px] text-oliv`}>
                Så gör vi dem
              </a>
            </div>
            <div className="-mx-[20px] md:col-span-6 md:mx-0 md:mr-[calc(min(0px,(1200px-100vw)/2)-40px)]">
              {/* Ramen klipper, bilden inuti landar. Annars blir sidan bredare under starten. */}
              <div className="overflow-hidden">
                <Foto
                  id="hero"
                  ratio={null}
                  eager
                  intro
                  dark
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="aspect-[4/5] max-h-[70svh] w-full md:aspect-auto md:h-[min(calc(100svh-150px),760px)] md:max-h-none"
                  fallback={
                    // Utan foto: loggan på loggans egen oliv, som en skylt.
                    <div
                      data-r="intro-bild"
                      className="pa-oliv grid aspect-[4/3] w-full place-items-center bg-oliv md:aspect-auto md:h-[min(calc(100svh-150px),760px)]"
                    >
                      <Logga light alt="" className="w-[62%] max-w-[420px]" />
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <div className="bg-sand">
          <SizePicker sizeId={sizeId} setSizeId={setSizeId} custom={custom} setCustom={setCustom} onOrder={order} />
        </div>

        {/* Hantverket: Max egna ord om virket, och hur de gör. */}
        <section id="hantverket" aria-labelledby="hantverk-rubrik" className="bg-sand-mork/50 py-20 md:py-28">
          <div className="ram">
            <div className="grid gap-6 md:grid-cols-12 md:gap-x-0">
              <h2 id="hantverk-rubrik" className="text-[44px] md:col-span-5 md:text-[64px]">
                Från spillvirke till skärbräda
              </h2>
              <p className="max-w-[52ch] text-[19px] leading-[1.6] md:col-span-5 md:col-start-8 md:self-end md:text-[20px]">
                Varje skärbräda börjar med en bit trä som förtjänar en andra chans. Vi samarbetar med lokala finsnickerier och träindustrier för att ta hand om
                deras spillvirke – vackra, massiva träbitar som annars hade gått till spillo. Genom att ge nytt liv åt detta överskottsmaterial skapar vi unika
                skärbrädor med historia, karaktär och minimal klimatpåverkan.
              </p>
            </div>
            <ol className="mt-14 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-5">
              {STEPS.map(([id, title, text]) => (
                <li key={id} className="border-t-[1.5px] border-oliv/30 pt-5">
                  <Foto id={id} reveal ratio={null} className="mb-5 aspect-[3/2] md:aspect-[4/5]" sizes="(min-width: 768px) 33vw, 100vw" />
                  <h3 className="text-[30px] md:text-[34px]">{title}</h3>
                  <p className="mt-2 max-w-[34ch] text-[17px]">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Vilka vi är: loggans oliv som yta, och alla sex med Max beskrivning. */}
        <section aria-labelledby="vi-rubrik" className="pa-oliv bg-oliv text-span">
          <div className="ram py-20 md:py-28">
            <Foto id="team" reveal dark ratio="16 / 9" className="mb-12" sizes="(min-width: 1200px) 1120px, 100vw" />
            <div className="grid gap-10 md:grid-cols-12 md:gap-x-0">
              <div className="md:col-span-6 md:pr-10">
                <h2 id="vi-rubrik" className="text-[40px] md:text-[52px]">
                  Ett UF-företag från Malmö
                </h2>
                <p className="mt-6 max-w-[40ch] text-[19px] leading-[1.55]">
                  Vi skapar stilrena skärbrädor av återvunnet trä, med fokus på hållbarhet, kvalitet och tidlös design.
                </p>
                <a href={INSTAGRAM} className={`r-lank ${HIT} mt-8 inline-flex items-center gap-2 text-[17px] text-span`}>
                  <Instagram size={20} aria-hidden="true" />
                  Följ oss på Instagram
                </a>
              </div>
              <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 md:col-span-5 md:col-start-8" aria-label="Vi som driver ReBoard UF">
                {TEAM.map((p) => (
                  <li key={p.name} className="border-t-[1.5px] border-salvia/40 pt-4">
                    <p className="font-rubrik text-[26px] leading-tight">{p.name}</p>
                    <p className="mt-1 text-[16px] text-span/85">{p.role}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Frågor innan köpet. Omdömena syns först när REVIEWS i data.js har riktiga omdömen. */}
        <section id="fragor" aria-labelledby="fragor-rubrik" className="ram py-20 md:py-28">
          <div className="grid gap-8 md:grid-cols-12 md:gap-x-0">
            <div className="md:col-span-6 md:pr-14">
              <h2 id="fragor-rubrik" className="text-[40px] md:text-[48px]">
                Innan du beställer
              </h2>
              <p className="mt-4 max-w-[32ch] text-[17px]">
                Hittar du inte svaret? Skriv till{' '}
                <a href={`mailto:${ORDER_EMAIL}`} className="underline decoration-oliv/40 underline-offset-4 hover:decoration-oliv">
                  {ORDER_EMAIL}
                </a>
                .
              </p>
              {REVIEWS.length > 0 && (
                <div className="mt-10 border-l-[3px] border-honung pl-5">
                  <h3 className="text-[28px]">Från dem som har köpt</h3>
                  {REVIEWS.map((r) => (
                    <figure key={r.name + r.text} className="mt-4">
                      <blockquote className="text-[17px]">”{r.text}”</blockquote>
                      <figcaption className="mt-1 text-[15px] text-black/75">{r.name}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-5 md:col-start-8">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="fraga">
                  <summary>
                    {q}
                    <Plus className="plus" size={22} aria-hidden="true" />
                  </summary>
                  <div className="svar">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="kontakt" className="pa-oliv bg-oliv-mork text-span">
        <div className="ram grid gap-10 pb-28 pt-20 md:grid-cols-12 md:gap-x-0 md:pb-14 md:pt-24">
          <div className="md:col-span-7">
            <h2 className="text-[44px] md:text-[64px]">Hör av dig</h2>
            <p className="mt-5 max-w-[40ch] text-[18px]">
              Skriv till oss på{' '}
              <a href={`mailto:${ORDER_EMAIL}`} className="underline decoration-salvia underline-offset-4 hover:decoration-span">
                {ORDER_EMAIL}
              </a>{' '}
              eller i ett meddelande på Instagram.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href={INSTAGRAM} className={`${buttonVariants({ size: 'stor' })} border-[1.5px] border-span/60 bg-transparent hover:bg-span/10`}>
                <Instagram size={20} aria-hidden="true" />
                @reboarduf
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-2 text-[15px] text-span/75 md:col-span-5 md:col-start-8">
            <Logga light lazy className="w-[150px]" />
            <p>Ett UF-företag i Malmö.</p>
            <p>Sidan är gjord av Nordvy UF.</p>
          </div>
        </div>
      </footer>

      <StickyBar onOrder={order} sizeId={sizeId} />
      <OrderDialog open={open} onOpenChange={setOpen} sizeId={sizeId} setSizeId={setSizeId} custom={custom} setCustom={setCustom} opener={opener} />
    </>
  );
}

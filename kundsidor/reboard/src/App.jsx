import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Instagram } from './components/InstagramIcon.jsx';
import { DRAFT, INSTAGRAM, SIZES, kr } from './data.js';
import { Button, buttonVariants } from './components/ui/button.jsx';
import { Foto } from './components/Foto.jsx';
import { Todo } from './components/Todo.jsx';
import { SizePicker } from './components/SizePicker.jsx';
import { OrderDialog } from './components/OrderDialog.jsx';
import { StickyBar } from './components/StickyBar.jsx';

const STEPS = [
  ['virket', 'Virket'],
  ['slipning', 'Slipningen'],
  ['olja', 'Oljan'],
  ['klar', 'Klar för köket'],
];

const FAQ = [
  {
    q: 'Hur får jag min bräda?',
    a: (
      <>
        Du väljer i beställningen om du vill hämta den i Malmö eller få den skickad. <Todo>Var hämtar man, och vad kostar frakten?</Todo>
      </>
    ),
  },
  {
    q: 'Hur betalar jag?',
    a: <>Med Swish. När du har beställt ser du vårt Swish-nummer, beloppet och ett ordernummer som du skriver som meddelande.</>,
  },
  {
    q: 'Hur sköter jag brädan?',
    a: <Todo>Hur ska brädan diskas och oljas, och vad ska man undvika?</Todo>,
  },
  {
    q: 'Hur lång tid tar det?',
    a: <Todo>Hur snart efter beställningen är brädan klar att hämta eller skickas?</Todo>,
  },
  {
    q: 'Ser alla brädor likadana ut?',
    a: <Todo>Skiljer sig ådringen och färgen mellan brädorna, eftersom virket är återvunnet?</Todo>,
  },
];

function Wordmark({ light = false }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${light ? 'text-span' : 'text-oliv'}`}>
      <span className="font-rubrik text-[30px] leading-none tracking-[-0.01em]">ReBoard</span>
      <span className="text-[13px] font-semibold tracking-[0.12em]">UF</span>
    </span>
  );
}

export default function App() {
  const [sizeId, setSizeId] = useState('mellan');
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
          Utkast från <b>Nordvy UF</b> till ReBoard UF. <mark className="todo">Gult</mark> = uppgift vi väntar på. Inga beställningar skickas.
        </div>
      )}

      <header data-r="huvud" className="huvud top-0 z-30 bg-sand md:sticky">
        <div className="ram flex flex-wrap items-center justify-between gap-x-6 pb-2 pt-3 md:h-[72px] md:flex-nowrap md:py-0">
          <div className="flex items-center gap-2">
            <a href="#" className="rounded-[2px]">
              <Wordmark />
            </a>
            <Todo>
              <span className="text-[12px]">logga</span>
            </Todo>
          </div>
          <nav aria-label="Sidan" className="order-3 flex w-full gap-6 py-2 text-[15px] md:order-none md:ml-auto md:w-auto md:gap-7 md:py-0 md:text-[16px]">
            <a className="r-lank relative after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']" href="#storlekar">Storlekar</a>
            <a className="r-lank relative after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']" href="#hantverket">Hantverket</a>
            <a className="r-lank relative after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']" href="#fragor">Frågor</a>
          </nav>
          <Button size="liten" onClick={order}>
            Beställ
          </Button>
        </div>
      </header>

      <main>
        {/* Toppen: text till vänster, fotot går ut i högerkanten. */}
        <section aria-labelledby="topp-rubrik" className="relative">
          <div className="ram grid grid-cols-[minmax(0,1fr)] items-center gap-10 pb-16 pt-8 md:grid-cols-12 md:gap-0 md:pb-24 md:pt-6">
            <div className="md:col-span-6 md:pr-10">
              <h1 id="topp-rubrik" data-r="intro" style={{ '--i': 1 }} className="text-[50px] text-oliv sm:text-[72px] lg:text-[96px]">
                Skärbrädor av återvunnen ek
              </h1>
              <p data-r="intro" style={{ '--i': 2 }} className="mt-5 max-w-[34ch] text-[18px] md:mt-7 md:text-[20px]">
                Eget hantverk från Malmö. Vi tar tillvara gammal ek och gör skärbrädor av den, i tre storlekar.
              </p>
              <div data-r="intro" style={{ '--i': 3 }} className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-10">
                <p className="font-rubrik text-[40px] leading-none text-black md:text-[48px]">
                  Från {kr(SIZES[0].price)}
                </p>
                <a id="topp-knapp" href="#storlekar" className={buttonVariants({ size: 'stor' })}>
                  Välj storlek
                </a>
              </div>
              <p data-r="intro" style={{ '--i': 4 }} className="mt-6 text-[16px]">
                <span className="font-medium">Till jul?</span> Skriv det i beställningen. <Todo>Sista dag att beställa för att hinna före jul?</Todo>
              </p>
              <a data-r="intro" style={{ '--i': 5 }} href="#hantverket" className="r-lank relative after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] mt-6 inline-block text-[16px] text-oliv">
                Så gör vi dem
              </a>
            </div>
            <div className="-mx-[20px] md:col-span-6 md:mx-0 md:mr-[calc(min(0px,(1200px-100vw)/2)-40px)]">
              {/* Ramen klipper, bilden inuti landar. Annars blir sidan bredare under starten. */}
              <div className="overflow-hidden">
                <Foto id="hero" ratio={null} eager intro dark sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] max-h-[70svh] w-full md:aspect-auto md:h-[min(calc(100svh-150px),760px)] md:max-h-none" />
              </div>
            </div>
          </div>
        </section>

        <div className="bg-sand">
          <SizePicker sizeId={sizeId} setSizeId={setSizeId} onOrder={order} />
        </div>

        {/* Hantverket: en riktig ordning, visad som en fotorad. */}
        <section id="hantverket" aria-labelledby="hantverk-rubrik" className="bg-sand-mork/50 py-20 md:py-28">
          <div className="ram">
            <h2 id="hantverk-rubrik" className="max-w-[15ch] text-[44px] md:text-[64px]">
              Från gammalt virke till färdig bräda
            </h2>
            <p className="mt-5 max-w-[48ch] text-[18px]">
              Vi börjar med ek som redan har använts till något annat. <Todo>Vad var virket innan, och var hittar ni det?</Todo>
            </p>
            {/* Tre steg i stående format, och den färdiga brädan liggande i full bredd: en bräda är bred. */}
            {/* Mobil: stegen under varandra, liggande, så att fotona blir stora nog att se något på. */}
            <ol className="mt-12 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-12">
              {STEPS.map(([id, title], n) => (
                <li key={id} className={n === STEPS.length - 1 ? 'md:col-span-3' : undefined}>
                  <Foto
                    id={id}
                    reveal
                    ratio={null}
                    className={n === STEPS.length - 1 ? 'aspect-[3/2] md:aspect-[16/7]' : 'aspect-[3/2] md:aspect-[4/5]'}
                    sizes={n === STEPS.length - 1 ? '(min-width: 1200px) 1120px, 100vw' : '(min-width: 768px) 33vw, 100vw'}
                  />
                  <h3 className="mt-3 font-text text-[15px] font-medium md:text-[17px]">{title}</h3>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[15px]">
              <Todo>En mening per steg om hur ni gör, med era egna ord.</Todo>
            </p>
          </div>
        </section>

        {/* Vilka vi är: loggans oliv som yta. */}
        <section aria-labelledby="vi-rubrik" className="pa-oliv bg-oliv text-span">
          <div className="ram grid gap-10 py-20 md:grid-cols-12 md:gap-0 md:py-28">
            <div className="md:col-span-5">
              <Foto id="team" reveal dark ratio="4 / 5" sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
            <div className="md:col-span-6 md:col-start-7 md:self-center">
              <h2 id="vi-rubrik" className="text-[44px] md:text-[64px]">
                Ett UF-företag från Malmö
              </h2>
              <p className="mt-6 max-w-[40ch] text-[20px] leading-[1.5]">
                Vi skapar stilrena skärbrädor <Todo>och charkbrickor?</Todo> av återvunnet trä, med fokus på hållbarhet, kvalitet och tidlös design.
              </p>
              <p className="mt-5 max-w-[40ch] text-span/85">
                <Todo>Vilka är ni? Namn, skola och vem som gör vad.</Todo>
              </p>
              <a href={INSTAGRAM} className="r-lank relative after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] mt-8 inline-flex items-center gap-2 text-[17px] text-span">
                <Instagram size={20} aria-hidden="true" />
                Följ oss på Instagram
              </a>
            </div>
          </div>
        </section>

        {/* Frågor innan köpet, med omdömena bredvid. ReBoard har omdömen men har inte skickat dem: inga påhittade. */}
        <section id="fragor" aria-labelledby="fragor-rubrik" className="ram py-20 md:py-28">
          <div className="grid gap-8 md:grid-cols-12 md:gap-x-0">
            <div className="md:col-span-5 md:pr-14">
              <h2 id="fragor-rubrik" className="text-[44px] md:text-[64px]">
                Innan du beställer
              </h2>
              <div className="mt-10 border-l-[3px] border-honung pl-5">
                <h3 className="text-[28px]">Från dem som har köpt</h3>
                <p className="mt-2 text-[16px]">
                  <Todo>Här kommer era riktiga omdömen. Skicka dem med namn eller förnamn, och säg att de får visas.</Todo>
                </p>
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-7">
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
              Skriv till oss på <Todo>ReBoards e-post</Todo> eller i ett meddelande på Instagram.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button variant="ljus" size="stor" onClick={order}>
                Beställ en bräda
              </Button>
              <a href={INSTAGRAM} className={`${buttonVariants({ size: 'stor' })} border-[1.5px] border-span/60 bg-transparent hover:bg-span/10`}>
                <Instagram size={20} aria-hidden="true" />
                @reboarduf
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-2 text-[15px] text-span/75 md:col-span-5 md:col-start-8">
            <Wordmark light />
            <p>Ett UF-företag i Malmö.</p>
            <p>Sidan är gjord av Nordvy UF.</p>
          </div>
        </div>
      </footer>

      <StickyBar onOrder={order} />
      <OrderDialog open={open} onOpenChange={setOpen} sizeId={sizeId} setSizeId={setSizeId} opener={opener} />
    </>
  );
}

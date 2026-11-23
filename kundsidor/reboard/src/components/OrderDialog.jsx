// Beställningen: storlek, antal, namn, kontakt och hämtning eller frakt.
// På den skarpa sidan öppnas ett färdigskrivet mejl till ReBoard, och besökaren ser hur den betalar med Swish.
// Beställningen är inte skickad förrän besökaren skickar mejlet, så vi skriver aldrig "Tack för din beställning".
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { DRAFT, ORDER_EMAIL, SIZES, SWISH_NUMBER, kr } from '../data.js';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Todo } from './Todo.jsx';
import { nudge } from '../lib.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s-]{7,}$/;
const newOrderNo = () => `RB-${Date.now().toString(36).slice(-5).toUpperCase()}`;

export function OrderDialog({ open, onOpenChange, sizeId, setSizeId, opener }) {
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [delivery, setDelivery] = useState('hamtning');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const refs = { name: useRef(null), contact: useRef(null) };
  const doneRef = useRef(null);

  // Ny ruta börjar alltid på formuläret.
  useEffect(() => {
    if (open) {
      setDone(null);
      setErrors({});
    }
  }, [open]);
  useEffect(() => {
    if (done) {
      nudge(doneRef.current, 'r-klar');
      doneRef.current?.focus();
    }
  }, [done]);

  const size = SIZES.find((s) => s.id === sizeId);
  const total = size.price * qty;

  const check = (field, value) => {
    if (field === 'name') return value.trim() ? '' : 'Skriv ditt namn.';
    if (field === 'contact') {
      const v = value.trim();
      if (!v) return 'Skriv din e-post eller ditt telefonnummer, så att vi kan bekräfta.';
      if (v.includes('@') ? !EMAIL.test(v) : !PHONE.test(v)) return 'Det ser inte ut som en e-post eller ett telefonnummer.';
    }
    return '';
  };
  // Felet försvinner så fort fältet blir rätt.
  const onField = (field, setter) => (e) => {
    setter(e.target.value);
    if (errors[field]) setErrors((old) => ({ ...old, [field]: check(field, e.target.value) }));
  };

  const submit = (e) => {
    e.preventDefault();
    const next = { name: check('name', name), contact: check('contact', contact) };
    setErrors(next);
    const first = ['name', 'contact'].find((f) => next[f]);
    if (first) {
      nudge(refs[first].current?.parentElement, 'r-fel');
      refs[first].current?.focus();
      return;
    }
    const orderNo = newOrderNo();
    const lines = [
      `Beställning ${orderNo}`,
      '',
      `Storlek: ${size.name} (${kr(size.price)})`,
      `Antal: ${qty}`,
      `Summa: ${kr(total)}`,
      `Leverans: ${delivery === 'hamtning' ? 'Hämtning i Malmö' : 'Frakt'}`,
      '',
      `Namn: ${name.trim()}`,
      `Kontakt: ${contact.trim()}`,
      note.trim() ? `\nMeddelande: ${note.trim()}` : '',
    ];
    if (!DRAFT && ORDER_EMAIL) {
      location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(`Beställning ${orderNo}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    }
    setDone({ orderNo, total });
  };

  const swishHref =
    SWISH_NUMBER && done
      ? `https://app.swish.nu/1/p/sw/?sw=${encodeURIComponent(SWISH_NUMBER)}&amt=${done.total}&cur=SEK&msg=${encodeURIComponent(done.orderNo)}&src=qr`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="bestall-besk"
        onCloseAutoFocus={(e) => {
          const el = opener?.current;
          if (el && el.isConnected && el !== document.body) {
            e.preventDefault();
            el.focus();
          }
        }}
      >
        {!done ? (
          <form onSubmit={submit} noValidate className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
            <DialogTitle className="pr-12 font-rubrik text-[38px] leading-none">Beställ en skärbräda</DialogTitle>
            <DialogDescription id="bestall-besk" className="mt-2 text-[15px] text-black/75">
              Det tar en halv minut. Du betalar med Swish efteråt.
            </DialogDescription>

            <fieldset className="mt-6">
              <legend className="mb-2 text-[15px] font-medium">Storlek</legend>
              <div className="segment">
                {SIZES.map((s) => (
                  <label key={s.id}>
                    <input type="radio" name="bestall-storlek" value={s.id} checked={s.id === sizeId} onChange={() => setSizeId(s.id)} />
                    <span className="seg">
                      <span className="text-[16px] font-medium">{s.name}</span>
                      <small>{kr(s.price)}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5">
              <span className="mb-1.5 block text-[15px] font-medium" id="antal-etikett">
                Antal
              </span>
              <div className="flex items-center gap-4" role="group" aria-labelledby="antal-etikett">
                <div className="inline-flex items-center border-[1.5px] border-andtra/50 bg-span">
                  <button type="button" className="grid h-12 w-12 place-items-center text-oliv disabled:opacity-35" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                    <Minus size={18} aria-hidden="true" />
                    <span className="sr-only">En färre</span>
                  </button>
                  <output className="w-10 text-center text-[18px] tabular-nums" aria-live="polite">
                    {qty}
                  </output>
                  <button type="button" className="grid h-12 w-12 place-items-center text-oliv disabled:opacity-35" onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10}>
                    <Plus size={18} aria-hidden="true" />
                    <span className="sr-only">En till</span>
                  </button>
                </div>
                <p className="text-[16px]">
                  Summa <span className="font-rubrik text-[30px] leading-none tabular-nums">{kr(total)}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="b-namn">Namn</Label>
                <Input ref={refs.name} id="b-namn" autoComplete="name" value={name} onChange={onField('name', setName)} aria-invalid={Boolean(errors.name)} aria-describedby="b-namn-fel" />
                <p id="b-namn-fel" className="falt-fel">{errors.name}</p>
              </div>
              <div>
                <Label htmlFor="b-kontakt">E-post eller telefon</Label>
                <Input ref={refs.contact} id="b-kontakt" autoComplete="email" inputMode="email" value={contact} onChange={onField('contact', setContact)} aria-invalid={Boolean(errors.contact)} aria-describedby="b-kontakt-fel" />
                <p id="b-kontakt-fel" className="falt-fel">{errors.contact}</p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-[15px] font-medium">Hur vill du få den?</legend>
              <div className="grid gap-2">
                {[
                  ['hamtning', 'Hämta i Malmö', <Todo key="t">Var hämtar man?</Todo>],
                  ['frakt', 'Skicka med post', <Todo key="t">Vad kostar frakten?</Todo>],
                ].map(([value, label, extra]) => (
                  <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 border-[1.5px] border-andtra/35 px-3 py-2 has-[:checked]:border-oliv has-[:checked]:bg-oliv/5">
                    <input type="radio" name="leverans" value={value} checked={delivery === value} onChange={() => setDelivery(value)} className="h-5 w-5 accent-[#434831]" />
                    <span className="text-[16px]">
                      {label} <span className="text-[14px]">{extra}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5">
              <Label htmlFor="b-medd">
                Meddelande <span className="font-normal text-black/65">(frivilligt, till exempel att den är en julklapp)</span>
              </Label>
              <textarea id="b-medd" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-[2px] border-[1.5px] border-andtra/50 bg-span px-3 py-2.5 text-base hover:border-andtra focus-visible:border-oliv" />
            </div>

            <Button type="submit" size="stor" className="mt-6 w-full">
              Gå vidare till betalning
            </Button>
            {DRAFT && <p className="mt-3 text-[14px] text-black/70">Utkast: inget skickas härifrån än.</p>}
          </form>
        ) : (
          <div ref={doneRef} tabIndex={-1} className="px-5 pb-6 pt-6 outline-none sm:px-8 sm:pb-8 sm:pt-8">
            <DialogTitle className="pr-12 font-rubrik text-[38px] leading-none">Ett steg kvar</DialogTitle>
            <DialogDescription id="bestall-besk" className="mt-3 text-[16px]">
              {DRAFT ? (
                <>
                  <Todo>Utkast:</Todo> på den riktiga sidan öppnas nu ett färdigskrivet mejl till ReBoard med din beställning. Skicka det, så är beställningen klar. Öppnades inget mejl? Skriv till{' '}
                  <Todo>ReBoards e-post</Todo> och ange ordernumret.
                </>
              ) : (
                <>
                  Nu öppnas ett mejl med din beställning. Skicka det, så är beställningen klar. Öppnades inget mejl? Skriv till <a className="underline" href={`mailto:${ORDER_EMAIL}`}>{ORDER_EMAIL}</a> och ange ordernumret.
                </>
              )}
            </DialogDescription>

            <div className="mt-6 bg-oliv px-5 py-5 text-span pa-oliv">
              <p className="font-rubrik text-[28px] leading-none">Betala med Swish</p>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[16px]">
                <dt className="text-span/75">Nummer</dt>
                <dd className="tabular-nums">{SWISH_NUMBER || <Todo>Swish Företag-nummer</Todo>}</dd>
                <dt className="text-span/75">Belopp</dt>
                <dd className="tabular-nums">{kr(done.total)}</dd>
                <dt className="text-span/75">Meddelande</dt>
                <dd className="font-medium tracking-wide">{done.orderNo}</dd>
              </dl>
              {swishHref ? (
                <a href={swishHref} className="r-knapp mt-5 flex h-12 items-center justify-center bg-span font-medium text-oliv md:hidden">
                  Öppna Swish med allt ifyllt
                </a>
              ) : (
                <p className="mt-4 text-[14px] text-span/80 md:hidden">På mobilen kommer här en knapp som öppnar Swish med allt ifyllt.</p>
              )}
            </div>
            <p className="mt-4 text-[15px] text-black/80">När vi har sett betalningen hör vi av oss och bekräftar din beställning.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

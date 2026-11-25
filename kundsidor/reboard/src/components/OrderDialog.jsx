// Beställningen: storlek (eller egna mått), antal, namn, kontakt och hämtning eller frakt.
// Egna mått blir en förfrågan utan pris: ReBoard granskar den och återkommer med en offert, och först då betalar man.
// På den skarpa sidan öppnas ett färdigskrivet mejl till ReBoard, och besökaren ser hur den betalar med Swish.
// Beställningen är inte skickad förrän besökaren skickar mejlet, så vi skriver aldrig "Tack för din beställning".
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { CUSTOM, DRAFT, ORDER_EMAIL, SIZES, SWISH_DISPLAY, SWISH_NUMBER, customDims, dimText, findSize, isCustom, kr } from '../data.js';
import { CustomDims } from './CustomDims.jsx';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { nudge } from '../lib.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s-]{7,}$/;
const newOrderNo = () => `RB-${Date.now().toString(36).slice(-5).toUpperCase()}`;

export function OrderDialog({ open, onOpenChange, sizeId, setSizeId, custom, setCustom, opener }) {
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [delivery, setDelivery] = useState('hamtning');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const refs = { name: useRef(null), contact: useRef(null) };
  const doneRef = useRef(null);
  const dimsRef = useRef(null);

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

  const size = findSize(sizeId);
  const egna = isCustom(sizeId);
  const total = egna ? null : size.price * qty;

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
    // Måtten står först i rutan, så de kontrolleras först.
    if (egna && !dimsRef.current?.validate()) return;
    const next = { name: check('name', name), contact: check('contact', contact) };
    setErrors(next);
    const first = ['name', 'contact'].find((f) => next[f]);
    if (first) {
      const field = refs[first].current;
      nudge(field?.parentElement, 'r-fel');
      // Fältet och dess etikett hamnar mitt i rutan, inte dolda under kanten.
      field?.scrollIntoView({ block: 'center' });
      field?.focus({ preventScroll: true });
      return;
    }
    const orderNo = newOrderNo();
    const kind = egna ? 'Förfrågan om egna mått' : 'Beställning';
    const lines = [
      `${kind} ${orderNo}`,
      '',
      egna ? `Egna mått: ${dimText(customDims(custom))} (längd × bredd × tjocklek)` : `Storlek: ${size.name}, ${dimText(size)} (${kr(size.price)})`,
      `Antal: ${qty}`,
      egna ? 'Pris: offert' : `Summa: ${kr(total)}`,
      `Leverans: ${delivery === 'hamtning' ? 'Hämtning i Malmö' : 'Frakt'}`,
      '',
      `Namn: ${name.trim()}`,
      `Kontakt: ${contact.trim()}`,
      note.trim() ? `\nMeddelande: ${note.trim()}` : '',
    ];
    if (!DRAFT && ORDER_EMAIL) {
      location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(`${kind} ${orderNo}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    }
    setDone({ orderNo, total, egna });
  };

  const swishHref =
    // I utkastet finns ingen Swish-knapp, så att ingen betalar på riktigt för en beställning som aldrig skickades.
    !DRAFT && SWISH_NUMBER && done && done.total
      ? `https://app.swish.nu/1/p/sw/?sw=${encodeURIComponent(SWISH_NUMBER)}&amt=${done.total}&cur=SEK&msg=${encodeURIComponent(done.orderNo)}&src=qr`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="bestall-besk"
        // Fokus börjar på den valda storleken, inte på stäng-knappen.
        onOpenAutoFocus={(e) => {
          const checked = e.currentTarget?.querySelector?.('input[name=bestall-storlek]:checked');
          if (checked) {
            e.preventDefault();
            checked.focus();
          }
        }}
        onCloseAutoFocus={(e) => {
          const el = opener?.current;
          if (el && el.isConnected && el !== document.body) {
            e.preventDefault();
            el.focus();
          }
        }}
      >
        {!done ? (
          <form onSubmit={submit} noValidate className="px-5 pb-6 sm:px-8 sm:pb-8">
            <DialogTitle className="pr-12 font-rubrik text-[38px] leading-none">{egna ? 'Fråga om egna mått' : 'Beställ en skärbräda'}</DialogTitle>
            <DialogDescription id="bestall-besk" className="mt-2 text-[15px] text-black/75">
              {egna
                ? 'I nästa steg skickar du förfrågan. Du får en offert innan du betalar något.'
                : 'I nästa steg skickar du beställningen och ser hur du betalar med Swish.'}
            </DialogDescription>

            <fieldset className="mt-6">
              <legend className="mb-2 text-[15px] font-medium">Storlek</legend>
              <div className="segment">
                {[...SIZES, CUSTOM].map((s) => (
                  <label key={s.id}>
                    <input type="radio" name="bestall-storlek" value={s.id} checked={s.id === sizeId} onChange={() => setSizeId(s.id)} />
                    <span className="seg">
                      <span className="text-[16px] font-medium">{s.name}</span>
                      <small>{s.price ? kr(s.price) : 'offert'}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {egna && (
              <div className="mt-5">
                <CustomDims ref={dimsRef} idPrefix="bestall" custom={custom} setCustom={setCustom} />
              </div>
            )}

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
                {egna ? (
                  <p className="text-[16px]">Pris efter offert</p>
                ) : (
                  <p className="text-[16px]">
                    Summa <span className="font-rubrik text-[30px] leading-none tabular-nums">{kr(total)}</span>
                  </p>
                )}
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
                  ['hamtning', 'Hämta i Malmö'],
                  ['frakt', 'Få den skickad'],
                ].map(([value, label]) => (
                  <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 border-[1.5px] border-andtra/35 px-3 py-2 has-[:checked]:border-oliv has-[:checked]:bg-oliv/5">
                    <input type="radio" name="leverans" value={value} checked={delivery === value} onChange={() => setDelivery(value)} className="h-5 w-5 accent-[#434831]" />
                    <span className="text-[16px]">{label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[14px] text-black/80">Vi bekräftar plats och frakt när vi har fått din beställning.</p>
            </fieldset>

            <div className="mt-5">
              <Label htmlFor="b-medd">
                Meddelande{' '}
                <span className="font-normal text-black/80">
                  {egna ? '(frivilligt, till exempel en annan tjocklek än 3 cm)' : '(frivilligt, till exempel att den är en julklapp)'}
                </span>
              </Label>
              <textarea id="b-medd" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-[2px] border-[1.5px] border-andtra/50 bg-span px-3 py-2.5 text-base hover:border-andtra focus-visible:border-oliv" />
            </div>

            <Button type="submit" size="stor" className="mt-6 w-full">
              Fortsätt
            </Button>
            {DRAFT && <p className="mt-3 text-[14px] text-black/70">Utkast: inget skickas härifrån än.</p>}
          </form>
        ) : (
          <div ref={doneRef} tabIndex={-1} className="px-5 pb-6 outline-none sm:px-8 sm:pb-8">
            <DialogTitle className="pr-12 font-rubrik text-[38px] leading-none">Ett steg kvar</DialogTitle>
            <DialogDescription id="bestall-besk" className="mt-3 text-[16px]">
              {DRAFT ? (
                <>
                  <b>Utkast:</b> på den riktiga sidan öppnas nu ett färdigskrivet mejl till ReBoard med din {done.egna ? 'förfrågan' : 'beställning'}. Skicka
                  det, så är {done.egna ? 'förfrågan' : 'beställningen'} klar. Öppnades inget mejl? Skriv till {ORDER_EMAIL} och ange ordernumret.
                </>
              ) : (
                <>
                  Nu öppnas ett mejl med din {done.egna ? 'förfrågan' : 'beställning'}. Skicka det, så är {done.egna ? 'förfrågan' : 'beställningen'} klar. Öppnades inget mejl? Skriv till <a className="underline" href={`mailto:${ORDER_EMAIL}`}>{ORDER_EMAIL}</a> och ange ordernumret.
                </>
              )}
            </DialogDescription>

            {done.egna ? (
              <p className="mt-6 text-[16px]">
                Vi granskar förfrågan och återkommer med en offert. Du betalar med Swish först när du har fått offerten och vill ha brädan. Egna mått hinns
                inte före jul.
              </p>
            ) : (
            <>
            <div className="mt-6 bg-oliv px-5 py-5 text-span pa-oliv">
              <p className="font-rubrik text-[28px] leading-none">Betala med Swish</p>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[16px]">
                <dt className="text-span/75">Nummer</dt>
                <dd className="tabular-nums">{SWISH_DISPLAY}</dd>
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
                <p className="mt-4 text-[14px] text-span/80 md:hidden">Utkast: på den riktiga sidan öppnar en knapp här Swish med allt ifyllt.</p>
              )}
            </div>
            <p className="mt-4 text-[15px] text-black/80">När vi har sett betalningen hör vi av oss och bekräftar din beställning.</p>
            </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

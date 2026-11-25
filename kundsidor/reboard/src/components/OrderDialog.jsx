// Beställningen: storlek (eller egna mått), antal, namn, kontakt och hämtning eller frakt.
// Egna mått blir en förfrågan utan pris: ReBoard granskar den och återkommer med en offert, och först då betalar man.
// Efter formuläret kommer två tydliga steg: 1) skicka beställningen som ett färdigskrivet mejl till ReBoard,
// 2) betala med Swish (på mobilen öppnar en knapp Swish-appen med nummer, belopp och ordernummer ifyllda).
// Beställningen är inte skickad förrän besökaren skickar mejlet, så vi skriver aldrig "Tack för din beställning".
import { useEffect, useRef, useState } from 'react';
import { Mail, Minus, Plus } from 'lucide-react';
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
      // Stegen börjar alltid överst i rutan, även om formuläret var nerscrollat (mobil).
      const box = doneRef.current?.closest('[role=dialog]');
      if (box) box.scrollTop = 0;
      nudge(doneRef.current, 'r-klar');
      doneRef.current?.focus({ preventScroll: true });
    }
  }, [done?.orderNo]);

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
    // Mejlet öppnas inte av sig självt: besökaren trycker på en tydlig knapp i nästa steg (steg 1),
    // och betalar sedan med Swish (steg 2). Så lämnar ingen sidan innan den vet vad som händer.
    const mailHref = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(`${kind} ${orderNo}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    const summary = egna ? `${qty} st i egna mått, ${dimText(customDims(custom))}` : `${size.name} skärbräda × ${qty}`;
    setDone({ orderNo, total, egna, mailHref, summary, mailOpened: false });
  };

  // Swish med nummer, belopp och ordernummer ifyllda och låsta. Öppnar Swish-appen direkt på mobilen.
  // I utkastet finns ingen Swish-knapp, så att ingen betalar på riktigt för en beställning som aldrig skickades.
  const swishHref =
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
            <DialogTitle className="pr-12 font-rubrik text-[38px] leading-none">{done.egna ? 'Ett steg kvar' : 'Två steg kvar'}</DialogTitle>
            <DialogDescription id="bestall-besk" className="mt-3 text-[16px]">
              {done.summary}
              {!done.egna && <> – {kr(done.total)}</>}. Ordernummer <b className="tracking-wide">{done.orderNo}</b>.
            </DialogDescription>
            {DRAFT && (
              <p className="mt-3 text-[14px] text-black/80">
                <b>Utkast:</b> knapparna nedan öppnar inget mejl och ingen Swish förrän sidan är skarp.
              </p>
            )}

            <ol className="mt-6 grid gap-4">
              {/* Steg 1: skicka beställningen (eller förfrågan) som ett färdigskrivet mejl. */}
              <li className="border-[1.5px] border-oliv/30 px-4 py-4 sm:px-5">
                <p className="flex items-baseline gap-3 font-rubrik text-[26px] leading-none">
                  <span className="text-[17px] font-text font-semibold text-oliv">1</span>
                  {done.egna ? 'Skicka förfrågan' : 'Skicka beställningen'}
                </p>
                <p className="mt-2 text-[15px]">
                  Ditt mejlprogram öppnas med allt färdigskrivet. Tryck på skicka{done.egna ? '' : ' och kom sedan tillbaka hit'}.
                </p>
                <a
                  href={DRAFT ? undefined : done.mailHref}
                  role={DRAFT ? 'button' : undefined}
                  aria-disabled={DRAFT || undefined}
                  onClick={(e) => {
                    if (DRAFT) e.preventDefault();
                    setDone((d) => ({ ...d, mailOpened: true }));
                  }}
                  className="r-knapp mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 bg-oliv px-5 font-medium text-span hover:bg-oliv-mork"
                >
                  <Mail size={18} aria-hidden="true" />
                  {done.egna ? 'Skicka förfrågan' : 'Skicka beställningen'}
                </a>
                <p className="mt-2 text-[14px] text-black/80" aria-live="polite">
                  {done.mailOpened ? 'Öppnades inget mejl? ' : 'Fungerar det inte? '}
                  Mejla{' '}
                  <a className="underline underline-offset-2" href={`mailto:${ORDER_EMAIL}`}>
                    {ORDER_EMAIL}
                  </a>{' '}
                  och skriv ordernumret {done.orderNo}.
                </p>
              </li>

              {done.egna ? null : (
                /* Steg 2: betala med Swish. På mobilen öppnar knappen Swish-appen med allt ifyllt. */
                <li className="pa-oliv bg-oliv px-4 py-4 text-span sm:px-5">
                  <p className="flex items-baseline gap-3 font-rubrik text-[26px] leading-none">
                    <span className="text-[17px] font-text font-semibold text-salvia">2</span>
                    Betala med Swish
                  </p>
                  {swishHref ? (
                    <>
                      <a
                        href={swishHref}
                        className="r-knapp mt-4 flex h-12 items-center justify-center gap-2 bg-span px-5 font-medium text-oliv hover:bg-white md:hidden"
                      >
                        Betala {kr(done.total)} med Swish
                      </a>
                      <p className="mt-2 text-[14px] text-span/85 md:hidden">Swish öppnas med nummer, belopp och ordernummer ifyllda. Godkänn med BankID.</p>
                    </>
                  ) : (
                    DRAFT && (
                      <p className="mt-3 text-[14px] text-span/85 md:hidden">På den skarpa sidan finns här en knapp som öppnar Swish med allt ifyllt.</p>
                    )
                  )}
                  <p className="mt-4 hidden text-[15px] text-span/85 md:block">Öppna Swish i mobilen och fyll i:</p>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[16px] md:mt-2">
                    <dt className="text-span/75">Nummer</dt>
                    <dd className="tabular-nums">{SWISH_DISPLAY}</dd>
                    <dt className="text-span/75">Belopp</dt>
                    <dd className="tabular-nums">{kr(done.total)}</dd>
                    <dt className="text-span/75">Meddelande</dt>
                    <dd className="font-medium tracking-wide">{done.orderNo}</dd>
                  </dl>
                </li>
              )}
            </ol>

            <p className="mt-5 text-[15px] text-black/80">
              {done.egna
                ? 'Vi granskar förfrågan och återkommer med en offert. Du betalar med Swish först när du har fått offerten och vill ha brädan. Egna mått hinns inte före jul.'
                : 'När vi har fått mejlet och betalningen bekräftar vi beställningen och hör av oss om hämtning eller frakt.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

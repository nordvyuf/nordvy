// Fälten för egna mått: längd och bredd i cm. Tjockleken är 3 cm om kunden inte skriver något annat.
// Används både i storleksväljaren och i beställningsrutan, med samma värden (de ligger i App).
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CUSTOM, checkDim } from '../data.js';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { nudge } from '../lib.js';

const FIELDS = [
  ['l', 'Längd', 'längd'],
  ['b', 'Bredd', 'bredd'],
];

export const CustomDims = forwardRef(function CustomDims({ idPrefix, custom, setCustom, note = true }, ref) {
  const [errors, setErrors] = useState({});
  const inputs = { l: useRef(null), b: useRef(null) };

  // validate() visar felen, flyttar fokus till det första felaktiga fältet och svarar true om allt stämmer.
  useImperativeHandle(ref, () => ({
    validate() {
      const next = Object.fromEntries(FIELDS.map(([k, , what]) => [k, checkDim(custom[k], what)]));
      setErrors(next);
      const first = FIELDS.find(([k]) => next[k]);
      if (!first) return true;
      const el = inputs[first[0]].current;
      nudge(el?.parentElement, 'r-fel');
      el?.scrollIntoView({ block: 'center' });
      el?.focus({ preventScroll: true });
      return false;
    },
  }));

  const onChange = (k, what) => (e) => {
    const value = e.target.value;
    setCustom((old) => ({ ...old, [k]: value }));
    // Felet försvinner så fort fältet blir rätt.
    if (errors[k]) setErrors((old) => ({ ...old, [k]: checkDim(value, what) }));
  };
  const onBlur = (k, what) => () => {
    if (String(custom[k]).trim()) setErrors((old) => ({ ...old, [k]: checkDim(custom[k], what) }));
  };

  return (
    <fieldset>
      <legend className="mb-2 text-[15px] font-medium">Dina mått</legend>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([k, label, what]) => {
          const id = `${idPrefix}-${k}`;
          return (
            <div key={k}>
              <Label htmlFor={id}>{label} (cm)</Label>
              <Input
                ref={inputs[k]}
                id={id}
                inputMode="decimal"
                autoComplete="off"
                placeholder={k === 'l' ? 'till exempel 40' : 'till exempel 25'}
                value={custom[k]}
                onChange={onChange(k, what)}
                onBlur={onBlur(k, what)}
                aria-invalid={Boolean(errors[k])}
                aria-describedby={`${id}-fel`}
              />
              <p id={`${id}-fel`} className="falt-fel">
                {errors[k]}
              </p>
            </div>
          );
        })}
      </div>
      {note && (
        <p className="mt-2 text-[14px] text-black/75">
          Tjockleken är {CUSTOM.t} cm. Vill du ha en annan, skriv det i meddelandet när du skickar förfrågan.
        </p>
      )}
    </fieldset>
  );
});

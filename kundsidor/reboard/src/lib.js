// Samma hjälpare som shadcn/ui använder, utan tailwind-merge (sparar ~7 kB).
import { clsx } from 'clsx';
export const cn = (...inputs) => clsx(inputs);

// Startar en rörelse från rorelse.css om igen, även om klassen redan sitter kvar.
export function nudge(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

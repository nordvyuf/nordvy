// Fast Beställ-rad längst ner på mobil. Den syns när toppens knapp har scrollats förbi,
// och döljs medan storleksväljaren syns, så att den inte täcker brädorna.
import { useEffect, useState } from 'react';
import { Button } from './ui/button.jsx';
import { SIZES, kr } from '../data.js';

export function StickyBar({ onOrder, sizeId }) {
  const size = SIZES.find((s) => s.id === sizeId);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const state = { past: false, blocked: new Set() };
    const update = () => setShow(state.past && state.blocked.size === 0);
    const hero = document.getElementById('topp-knapp');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) state.past = !e.isIntersecting && e.boundingClientRect.top < 0;
        else if (e.isIntersecting) state.blocked.add(e.target);
        else state.blocked.delete(e.target);
      }
      update();
    });
    for (const el of [hero, document.getElementById('storlekar')]) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className="fast-rad fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-oliv/20 bg-sand/95 backdrop-blur-sm md:hidden"
      data-syns={String(show)}
      aria-hidden={!show}
      inert={show ? undefined : ''}
    >
      <div className="ram flex items-center justify-between gap-4 py-3">
        <p className="text-[15px] leading-tight">
          {size.name} skärbräda
          <br />
          <span className="font-rubrik text-[22px]">{kr(size.price)}</span>
        </p>
        <Button onClick={onOrder}>Beställ</Button>
      </div>
    </div>
  );
}

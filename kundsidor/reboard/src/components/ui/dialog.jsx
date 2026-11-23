// Dialog i shadcn-stil, byggd på Radix: fokus stannar i rutan, Esc stänger och fokus går tillbaka efteråt.
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-bakgrund fixed inset-0 z-50 bg-[#1b1d13]/60" />
      <DialogPrimitive.Content
        className={cn(
          'dialog-ruta fixed z-50 bg-span text-black shadow-[0_30px_80px_-30px_rgba(20,22,12,0.6)]',
          // Mobil: rutan kommer underifrån och fyller bredden. Dator: mitt på skärmen.
          'inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[6px]',
          'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(560px,calc(100vw-48px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[3px]',
          className,
        )}
        {...props}
      >
        {/* Stäng-knappen följer med när rutan scrollas på mobil. */}
        <div className="sticky top-0 z-10 flex h-0 justify-end">
          <DialogPrimitive.Close className="r-knapp mr-3 mt-3 grid h-11 w-11 place-items-center rounded-[2px] bg-span text-oliv hover:bg-oliv/10">
            <X size={22} aria-hidden="true" />
            <span className="sr-only">Stäng</span>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

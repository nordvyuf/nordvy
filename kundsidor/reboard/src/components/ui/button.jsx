// Knapp i shadcn-stil, med ReBoards egna värden: rak kant (2 px), oliv och ingen skugga.
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib.js';

export const buttonVariants = cva(
  'r-knapp inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium select-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primar: 'bg-oliv text-span hover:bg-oliv-mork',
        ljus: 'bg-span text-oliv hover:bg-white',
        kontur: 'border-[1.5px] border-oliv text-oliv hover:bg-oliv/10',
        lank: 'r-lank px-0 text-oliv underline-offset-4',
      },
      size: {
        stor: 'h-14 px-7 text-[17px]',
        normal: 'h-12 px-5 text-base',
        liten: 'h-10 px-4 text-[15px]',
      },
    },
    defaultVariants: { variant: 'primar', size: 'normal' },
  },
);

export const Button = forwardRef(function Button({ className, variant, size, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

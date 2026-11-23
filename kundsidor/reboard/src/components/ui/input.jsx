import { forwardRef } from 'react';
import { cn } from '../../lib.js';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-[2px] border-[1.5px] border-andtra/50 bg-span px-3 text-base text-black',
        'placeholder:text-andtra/70 hover:border-andtra focus-visible:border-oliv',
        'aria-[invalid=true]:border-[#8a2c1a]',
        className,
      )}
      {...props}
    />
  );
});

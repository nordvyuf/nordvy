import { cn } from '../../lib.js';

export function Label({ className, ...props }) {
  return <label className={cn('mb-1.5 block text-[15px] font-medium text-black', className)} {...props} />;
}

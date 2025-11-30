import { cn } from '../../lib/cn.js';

export const Label = ({ className = '', ...props }) => (
  <label className={cn('text-sm font-medium leading-6 text-foreground', className)} {...props} />
);

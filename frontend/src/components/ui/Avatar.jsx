import { cn } from '../../lib/cn.js';

export const Avatar = ({ src, alt = '', children, className = '' }) => (
  <div
    className={cn(
      'h-10 w-10 overflow-hidden rounded-full bg-secondary text-secondary-foreground flex items-center justify-center',
      className
    )}
  >
    {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : children}
  </div>
);

export const AvatarFallback = ({ children, className = '' }) => (
  <div className={cn('h-full w-full flex items-center justify-center', className)}>{children}</div>
);

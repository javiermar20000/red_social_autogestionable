import { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/cn.js';

const TabsContext = createContext(null);

export const Tabs = ({ defaultValue, value, onValueChange, children, className = '' }) => {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const setValue = onValueChange ?? setInternal;
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }) => (
  <div
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
  >
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className = '' }) => {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active ? 'bg-card text-foreground shadow-soft' : '',
        className
      )}
      onClick={() => ctx?.setValue?.(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }) => {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className={cn('mt-4', className)}>{children}</div>;
};

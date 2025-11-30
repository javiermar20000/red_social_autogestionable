import { createContext, useContext } from 'react';
import { cn } from '../../lib/cn.js';

const DialogContext = createContext({ onClose: () => {} });

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  const handleClose = () => onOpenChange?.(false);
  return (
    <DialogContext.Provider value={{ onClose: handleClose }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onMouseDown={handleClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-3xl overflow-y-auto"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
};

export const DialogContent = ({ children, className = '' }) => {
  const { onClose } = useContext(DialogContext);
  return (
    <div className={cn('relative w-full rounded-2xl bg-card text-card-foreground shadow-hover p-6', className)}>
      <button
        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        onClick={onClose}
        aria-label="Cerrar"
        type="button"
      >
        ×
      </button>
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className = '' }) => (
  <div className={cn('space-y-2 text-center', className)}>{children}</div>
);

export const DialogTitle = ({ children, className = '' }) => (
  <h3 className={cn('text-2xl font-bold leading-6', className)}>{children}</h3>
);

export const DialogDescription = ({ children, className = '' }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
);

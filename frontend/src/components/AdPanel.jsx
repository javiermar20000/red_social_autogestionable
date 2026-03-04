import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { cn } from '../lib/cn.js';

const isVideoCover = (publication) => {
  const mediaSrc = publication?.coverUrl || '';
  return (
    publication?.coverType === 'VIDEO' ||
    (typeof mediaSrc === 'string' && (mediaSrc.startsWith('data:video') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaSrc)))
  );
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `$${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numeric)}`;
};

const AdRail = ({ open, publications = [], loading = false, onSelect }) => {
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const hasPublications = publications.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!open || paused || reduceMotion || !publications.length) return undefined;
    const container = scrollRef.current;
    if (!container) return undefined;
    const interval = setInterval(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const next = container.scrollTop + 1;
      container.scrollTop = next >= maxScroll ? 0 : next;
    }, 45);
    return () => clearInterval(interval);
  }, [open, paused, reduceMotion, publications]);

  if (!open || (!loading && !hasPublications)) return null;

  return (
    <aside className="w-16 rounded-2xl border border-border bg-card/95 p-2 shadow-soft backdrop-blur">
      <div
        ref={scrollRef}
        className="flex max-h-[50vh] flex-col gap-2 overflow-x-hidden overflow-y-auto scrollbar-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {loading && !hasPublications && (
          <div className="rounded-lg border border-dashed border-border p-2 text-center text-[10px] text-muted-foreground">
            Cargando...
          </div>
        )}
        {hasPublications &&
          publications.map((publication) => {
            const mediaSrc = publication.coverUrl || publication.placeholder || '';
            const showVideo = isVideoCover(publication);
            return (
              <button
                key={publication.id}
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background/80 shadow-soft transition hover:border-primary/40"
                onClick={() => onSelect?.(publication)}
                title={publication.titulo || 'Publicidad'}
              >
                {showVideo ? (
                  <video src={mediaSrc} className="h-full w-full object-cover" muted loop playsInline />
                ) : (
                  <img
                    src={mediaSrc}
                    alt={publication.titulo || 'Publicidad'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
      </div>
    </aside>
  );
};

const AdPanel = ({ open, floating = false, publications = [], loading = false, onToggle, onSelect }) => {
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!open || paused || reduceMotion || !publications.length) return undefined;
    const container = scrollRef.current;
    if (!container) return undefined;
    const interval = setInterval(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const next = container.scrollTop + 1;
      container.scrollTop = next >= maxScroll ? 0 : next;
    }, 40);
    return () => clearInterval(interval);
  }, [open, paused, reduceMotion, publications]);

  if (!open) return null;

  return (
    <aside
      className={cn(
        'rounded-2xl border border-border bg-card p-3 shadow-soft',
        floating
          ? 'fixed right-4 top-20 z-50 w-[min(80vw,320px)] 2xl:right-[calc((100vw-1400px)/2+1rem)]'
          : 'sticky top-24'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recomendados para usted</p>
          <p className="text-sm font-semibold">Destacados</p>
        </div>
        {onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Cerrar espacio publicitario">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'mt-3 space-y-3 overflow-y-auto pr-1',
          floating ? 'max-h-[60vh]' : 'max-h-[70vh]'
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {loading && publications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Cargando publicidad...
          </div>
        )}
        {!loading && publications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Aún no hay publicaciones destacadas.
          </div>
        )}
        {!loading &&
          publications.map((publication) => {
            const mediaSrc = publication.coverUrl || publication.placeholder || '';
            const showVideo = isVideoCover(publication);
            const priceLabel = formatPrice(publication.precio) || 'Sin precio';
            return (
              <button
                key={publication.id}
                type="button"
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-background p-2 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40"
                onClick={() => onSelect?.(publication)}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {showVideo ? (
                    <video src={mediaSrc} className="h-full w-full object-cover" muted loop playsInline />
                  ) : (
                    <img src={mediaSrc} alt={publication.titulo} className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {publication.business?.name || 'GastroHub'}
                  </p>
                  <p className="text-sm font-semibold line-clamp-2">{publication.titulo}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{priceLabel}</p>
                </div>
              </button>
            );
          })}
      </div>
    </aside>
  );
};

export { AdRail };
export default AdPanel;

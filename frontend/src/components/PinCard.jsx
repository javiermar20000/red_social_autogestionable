import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import placeholderImg from '../assets/pin2.jpg';

const formatCategoryLabel = (cat) => {
  const type = cat?.type;
  const name = cat?.name || type || cat;
  return type && name && type !== name ? `${type} · ${name}` : name;
};

const PinCard = ({ publication, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const mediaSrc = publication.coverUrl || publication.placeholder || placeholderImg;
  const categories = publication.categories || [];
  const isVideo =
    publication.coverType === 'VIDEO' ||
    (typeof mediaSrc === 'string' && (mediaSrc.startsWith('data:video') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaSrc)));
  const formattedPrice =
    publication.precio === null || publication.precio === undefined || Number.isNaN(Number(publication.precio))
      ? null
      : `$${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
          Number(publication.precio)
        )}`;
  const mainCategoryLabel = categories.length ? formatCategoryLabel(categories[0]) : null;
  const displayPrice = formattedPrice || 'Sin precio';
  const visitsValue = publication.visitas ?? publication.visits ?? publication.visitCount;
  const visitsNumber = visitsValue === null || visitsValue === undefined ? 0 : Number(visitsValue);
  const formattedVisits = Number.isFinite(visitsNumber)
    ? new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(visitsNumber)
    : '0';
  const normalize = (val) => (val || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const promoKeywords = ['EN_PROMOCION', 'PROMOCION', 'PROMO'];
  const isPromoCategory = categories.some((cat) => {
    const label = normalize(cat?.slug || cat?.type || cat?.name || cat);
    return promoKeywords.some((keyword) => label.includes(keyword));
  });
  const showOfferBadge = isPromoCategory && publication.estado !== 'AVISO_GENERAL';

  return (
    <div
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-card shadow-soft transition duration-300 hover:scale-[1.02]"
      style={{ boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-soft)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(publication)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(publication)}
    >
      <div className="relative">
        {isVideo ? (
          <video
            src={mediaSrc}
            className="h-auto w-full object-cover"
            muted
            loop
            playsInline
            controls={isHovered}
            preload="metadata"
          />
        ) : (
          <img src={mediaSrc} alt={publication.titulo} className="h-auto w-full object-cover" loading="lazy" />
        )}

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-90'
          }`}
        >
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="text-white">
              <h3 className="line-clamp-1 text-sm font-semibold">{formattedVisits} visitas</h3>
              <p className="text-xs opacity-90">{publication.business?.name || publication.authorName || 'GastroHub'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
          {showOfferBadge && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">Oferta</span>
          )}
        </div>

        {publication.business?.type && (
          <div className="pointer-events-none absolute right-3 top-3 z-20">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
              {publication.business.type}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center bg-red-600 px-4 py-3 text-center text-white">
        <p className="text-sm font-semibold">{publication.titulo}</p>
        <p className="text-xs opacity-90">{displayPrice}</p>
      </div>
    </div>
  );
};

export default PinCard;

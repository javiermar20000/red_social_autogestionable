import { useState } from 'react';
import { Heart, Share2, Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import placeholderImg from '../assets/pin2.jpg';

const formatCategoryLabel = (cat) => {
  const type = cat?.type;
  const name = cat?.name || type || cat;
  return type && name && type !== name ? `${type} · ${name}` : name;
};

const formatCompactLikes = (value) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  if (safeValue <= 999) return String(safeValue);
  if (safeValue < 1000000) {
    const compact = safeValue / 1000;
    const decimals = compact < 10 ? 1 : 0;
    const formatted = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(
      compact
    );
    return `${formatted} mil`;
  }
  const compact = safeValue / 1000000;
  const decimals = compact < 10 ? 1 : 0;
  const formatted = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(
    compact
  );
  return `${formatted} mill`;
};

const PinCard = ({ publication, likesCount = 0, liked = false, onLike, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
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
  const likesNumber = Number(likesCount);
  const safeLikesNumber = Number.isFinite(likesNumber) ? likesNumber : 0;
  const formattedLikes = formatCompactLikes(safeLikesNumber);
  const normalize = (val) => (val || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const promoKeywords = ['EN_PROMOCION', 'PROMOCION', 'PROMO'];
  const isPromoCategory = categories.some((cat) => {
    const label = normalize(cat?.slug || cat?.type || cat?.name || cat);
    return promoKeywords.some((keyword) => label.includes(keyword));
  });
  const showOfferBadge = isPromoCategory && publication.estado !== 'AVISO_GENERAL';
  const likeButtonClassName = liked
    ? 'h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600'
    : 'h-8 w-8 rounded-full text-white hover:bg-white/20';
  const likeButtonLabel = liked ? 'Me gusta marcado' : 'Dar me gusta';
  const businessName = publication.business?.name || publication.authorName || 'GastroHub';
  const locationParts = [publication.business?.address, publication.business?.city, publication.business?.region].filter(Boolean);
  const locationLabel = locationParts.length ? locationParts.join(', ') : '';
  const shareTitle = publication.titulo || 'Oferta para comer';
  const sharePrice = displayPrice;
  const shareTextBase = `Mira que buena oferta para comer. ${shareTitle} en ${businessName}${
    locationLabel ? ` (${locationLabel})` : ''
  }. Precio: ${sharePrice}.`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTextWithUrl = shareUrl ? `${shareTextBase} ${shareUrl}` : shareTextBase;
  const shareUrlEncoded = encodeURIComponent(shareUrl || '');
  const shareTextEncoded = encodeURIComponent(shareTextBase);
  const shareTextWithUrlEncoded = encodeURIComponent(shareTextWithUrl);
  const whatsappHref = `https://wa.me/?text=${shareTextWithUrlEncoded}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}&quote=${shareTextEncoded}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${shareTextEncoded}${
    shareUrl ? `&url=${shareUrlEncoded}` : ''
  }`;
  const handleShareToggle = (event) => {
    event.stopPropagation();
    setIsShareOpen((prev) => !prev);
  };
  const handleShareLinkClick = (event) => {
    event.stopPropagation();
    setIsShareOpen(false);
  };
  const handleInstagramShare = (event) => {
    event.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareTextWithUrl).catch(() => {});
    }
    setIsShareOpen(false);
  };

  return (
    <div
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-card shadow-soft transition duration-300 hover:scale-[1.02]"
      style={{ boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-soft)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsShareOpen(false);
      }}
      onClick={() => {
        setIsShareOpen(false);
        onSelect?.(publication);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setIsShareOpen(false);
          return;
        }
        if (e.key === 'Enter' && e.currentTarget === e.target) {
          onSelect?.(publication);
        }
      }}
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
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className={likeButtonClassName}
                  aria-pressed={liked}
                  aria-label={likeButtonLabel}
                  title={likeButtonLabel}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (liked) return;
                    onLike?.(publication);
                  }}
                >
                  <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
                </Button>
                <span className="text-xs font-semibold text-white tabular-nums">{formattedLikes}</span>
              </div>
              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                  aria-label="Compartir"
                  aria-expanded={isShareOpen}
                  onClick={handleShareToggle}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {isShareOpen && (
                  <div
                    className="absolute right-0 top-full z-30 mt-2 flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-soft backdrop-blur"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <a
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en WhatsApp"
                      title="Compartir en WhatsApp"
                      onClick={handleShareLinkClick}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                    <a
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      href={facebookHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en Facebook"
                      title="Compartir en Facebook"
                      onClick={handleShareLinkClick}
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                    <a
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en Instagram (copia el mensaje)"
                      title="Compartir en Instagram (copia el mensaje)"
                      onClick={handleInstagramShare}
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      href={twitterHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en X"
                      title="Compartir en X"
                      onClick={handleShareLinkClick}
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
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

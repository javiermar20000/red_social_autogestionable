import { useState } from 'react';
import { Heart, Share2, Facebook, Instagram, Twitter, MessageCircle, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { MarqueeText } from './ui/MarqueeText.jsx';
import { cn } from '../lib/cn.js';
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

const PinCard = ({
  publication,
  likesCount = 0,
  liked = false,
  onLike,
  onSelect,
  compact = false,
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isCompact = Boolean(compact);
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
  const ratingAverageRaw =
    publication.ratingAverage ??
    publication.ratingAvg ??
    publication.calificacionPromedio ??
    publication.promedioCalificacion ??
    publication.rating ??
    null;
  const ratingCountRaw =
    publication.ratingCount ??
    publication.calificacionCount ??
    publication.totalCalificaciones ??
    0;
  const ratingAverageNumber = Number(ratingAverageRaw);
  const ratingCountNumber = Number(ratingCountRaw);
  const hasRating =
    Number.isFinite(ratingAverageNumber) &&
    (Number.isFinite(ratingCountNumber) ? ratingCountNumber > 0 : ratingAverageNumber > 0);
  const normalizedRating = hasRating ? Math.max(1, Math.min(5, ratingAverageNumber)) : null;
  const formattedRating = hasRating
    ? new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: normalizedRating % 1 ? 1 : 0,
        maximumFractionDigits: 1,
      }).format(normalizedRating)
    : '';
  const normalize = (val) => (val || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const promoKeywords = ['EN_PROMOCION', 'PROMOCION', 'PROMO'];
  const isPromoCategory = categories.some((cat) => {
    const label = normalize(cat?.slug || cat?.type || cat?.name || cat);
    return promoKeywords.some((keyword) => label.includes(keyword));
  });
  const showOfferBadge = isPromoCategory && publication.estado !== 'AVISO_GENERAL';
  const actionButtonSize = isCompact ? 'h-7 w-7' : 'h-8 w-8';
  const actionIconClass = isCompact ? '!h-3.5 !w-3.5' : 'h-4 w-4';
  const shareBubbleSize = isCompact ? 'h-8 w-8' : 'h-9 w-9';
  const shareBubbleBaseClass = cn(
    'flex items-center justify-center rounded-full text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
    shareBubbleSize
  );
  const likeButtonClassName = cn(
    actionButtonSize,
    'rounded-full text-white',
    liked ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-white/20'
  );
  const likeButtonLabel = liked ? 'Me gusta marcado' : 'Dar me gusta';
  const businessName = publication.business?.name || publication.authorName || 'GastroHub';
  const normalizeBusinessType = (value) => String(value || '').trim().toUpperCase();
  const businessTypeLabel = (() => {
    const directTag = normalizeBusinessType(publication.businessTypeTag || publication.businessType);
    if (directTag) return directTag;
    const tags = Array.isArray(publication.business?.typeTags) ? publication.business.typeTags : [];
    const normalizedTags = tags.map(normalizeBusinessType).filter(Boolean);
    const primary = normalizeBusinessType(publication.business?.type);
    if (primary && !normalizedTags.includes(primary)) {
      normalizedTags.unshift(primary);
    }
    return normalizedTags[0] || '';
  })();
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
  const visitsClassName = cn('line-clamp-1 font-semibold', isCompact ? 'text-xs' : 'text-sm');
  const businessNameClassName = cn('opacity-90', isCompact ? 'text-[0.7rem]' : 'text-xs');
  const likeCountClassName = cn('font-semibold text-white tabular-nums', isCompact ? 'text-[0.7rem]' : 'text-xs');
  const offerBadgeClassName = cn(
    'rounded-full bg-orange-500 font-semibold text-white',
    isCompact ? 'px-2.5 py-0.5 text-[0.7rem]' : 'px-3 py-1 text-xs'
  );
  const ratingBadgeClassName = cn(
    'inline-flex items-center gap-1 rounded-full bg-white/90 font-semibold text-slate-900 shadow-sm',
    isCompact ? 'px-2 py-0.5 text-[0.7rem]' : 'px-2.5 py-1 text-xs'
  );
  const ratingIconClassName = isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const businessTypeBadgeClassName = cn(
    'rounded-full bg-white/90 font-semibold text-slate-800',
    isCompact ? 'px-2.5 py-0.5 text-[0.7rem]' : 'px-3 py-1 text-xs'
  );
  const footerTitleClassName = cn('font-semibold', isCompact ? 'text-xs' : 'text-sm');
  const footerPriceClassName = cn('opacity-90', isCompact ? 'text-[0.7rem]' : 'text-xs');
  const showFooterActions = Boolean(showActions);
  const actionButtonBaseClass =
    'pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80';
  const editButtonClassName = cn(actionButtonBaseClass, 'bg-sky-500 hover:bg-sky-600');
  const deleteButtonClassName = cn(actionButtonBaseClass, 'bg-orange-500 hover:bg-orange-600');

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
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <div className="min-w-0 text-white">
              <h3 className={visitsClassName}>{formattedVisits} visitas</h3>
              <MarqueeText text={businessName} wordLimit={13} className={cn(businessNameClassName, 'min-w-0')} />
            </div>
            <div className="flex shrink-0 gap-2">
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
                  <Heart className={actionIconClass} fill={liked ? 'currentColor' : 'none'} />
                </Button>
                <span className={likeCountClassName}>{formattedLikes}</span>
              </div>
              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(actionButtonSize, 'rounded-full text-white hover:bg-white/20')}
                  aria-label="Compartir"
                  aria-expanded={isShareOpen}
                  onClick={handleShareToggle}
                >
                  <Share2 className={actionIconClass} />
                </Button>
                {isShareOpen && (
                  <div
                    className="absolute right-0 top-full z-30 mt-2 flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-soft backdrop-blur"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <a
                      className={cn(shareBubbleBaseClass, 'bg-[#25D366]')}
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en WhatsApp"
                      title="Compartir en WhatsApp"
                      onClick={handleShareLinkClick}
                    >
                      <MessageCircle className={actionIconClass} />
                    </a>
                    <a
                      className={cn(shareBubbleBaseClass, 'bg-[#1877F2]')}
                      href={facebookHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en Facebook"
                      title="Compartir en Facebook"
                      onClick={handleShareLinkClick}
                    >
                      <Facebook className={actionIconClass} />
                    </a>
                    <a
                      className={cn(
                        shareBubbleBaseClass,
                        'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4]'
                      )}
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en Instagram (copia el mensaje)"
                      title="Compartir en Instagram (copia el mensaje)"
                      onClick={handleInstagramShare}
                    >
                      <Instagram className={actionIconClass} />
                    </a>
                    <a
                      className={cn(shareBubbleBaseClass, 'bg-black')}
                      href={twitterHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Compartir en X"
                      title="Compartir en X"
                      onClick={handleShareLinkClick}
                    >
                      <Twitter className={actionIconClass} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
          {hasRating && (
            <span className={ratingBadgeClassName}>
              <Star className={cn(ratingIconClassName, 'text-amber-500')} fill="currentColor" />
              {formattedRating}
            </span>
          )}
          {showOfferBadge && (
            <span className={offerBadgeClassName}>Oferta</span>
          )}
        </div>

        {businessTypeLabel && (
          <div className="pointer-events-none absolute right-3 top-3 z-20">
            <span className={businessTypeBadgeClassName}>{businessTypeLabel}</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          'bg-red-600 px-4 py-3 text-white',
          showFooterActions
            ? 'grid grid-cols-[auto,1fr,auto] items-center gap-3'
            : 'flex flex-col items-center justify-center text-center'
        )}
      >
        {showFooterActions ? (
          <>
            <button
              type="button"
              className={editButtonClassName}
              aria-label="Editar publicación"
              title="Editar publicación"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(publication);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 flex-col items-center justify-center text-center">
              <p className={cn(footerTitleClassName, 'w-full truncate')}>{publication.titulo}</p>
              <p className={footerPriceClassName}>{displayPrice}</p>
            </div>
            <button
              type="button"
              className={deleteButtonClassName}
              aria-label="Eliminar publicación"
              title="Eliminar publicación"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(publication.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <p className={footerTitleClassName}>{publication.titulo}</p>
            <p className={footerPriceClassName}>{displayPrice}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PinCard;

import { useEffect, useRef, useState } from 'react';
import { Heart, Share2, Download, MoreHorizontal, Facebook, Instagram, Twitter, MessageCircle, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog.jsx';
import { Button } from './ui/Button.jsx';
import { Avatar, AvatarFallback } from './ui/Avatar.jsx';
import placeholderImg from '../assets/pin1.jpg';

const formatCategoryLabel = (cat) => {
  const type = cat?.type;
  const name = cat?.name || type || cat;
  return type && name && type !== name ? `${type} · ${name}` : name;
};

const PinDetailDialog = ({
  open,
  onOpenChange,
  publication,
  onRegisterVisit,
  onEdit,
  onDelete,
  currentUser,
  onLike,
  liked = false,
  businessLogoUrl = '',
}) => {
  const lastVisitedId = useRef(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const publicationId = publication?.id ? String(publication.id) : null;

  useEffect(() => {
    if (!open) {
      lastVisitedId.current = null;
      setIsShareOpen(false);
      return;
    }
    if (!publicationId || !onRegisterVisit) return;
    if (lastVisitedId.current === publicationId) return;
    lastVisitedId.current = publicationId;
    onRegisterVisit(publication);
  }, [open, publication, publicationId, onRegisterVisit]);

  if (!publication) return null;
  const {
    titulo,
    contenido,
    authorName,
    business,
    tipo,
    estado,
    visitas,
    categories = [],
    coverUrl,
    coverType,
    precio,
    placeholder,
  } = publication;
  const mediaSrc = coverUrl || placeholder || placeholderImg;
  const canManage =
    (currentUser?.rol === 'OFERENTE' && publication.authorId && publication.authorId === currentUser.id) ||
    currentUser?.role === 'admin';
  const isVideo =
    coverType === 'VIDEO' ||
    (typeof mediaSrc === 'string' && (mediaSrc.startsWith('data:video') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaSrc)));
  const formattedPrice =
    precio === null || precio === undefined || Number.isNaN(Number(precio))
      ? null
      : `$${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(precio))}`;
  const displayPrice = formattedPrice || 'Sin precio';
  const businessName = business?.name || authorName || 'GastroHub';
  const locationParts = [business?.address, business?.city, business?.region].filter(Boolean);
  const locationLabel = locationParts.length ? locationParts.join(', ') : '';
  const shareTitle = titulo || 'Oferta para comer';
  const shareTextBase = `Mira que buena oferta para comer. ${shareTitle} en ${businessName}${
    locationLabel ? ` (${locationLabel})` : ''
  }. Precio: ${displayPrice}.`;
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
  const businessAvatarSrc = businessLogoUrl || business?.imageUrl || business?.logoUrl || '';
  const mapQuery = locationLabel || business?.address || business?.city || business?.region || '';
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : '';
  const likeButtonClassName = liked
    ? 'rounded-full bg-red-500 text-white hover:bg-red-600'
    : 'rounded-full text-muted-foreground';
  const likeButtonLabel = liked ? 'Me gusta marcado' : 'Dar me gusta';
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
  const handleDownload = (event) => {
    event.stopPropagation();
    if (typeof document === 'undefined' || !mediaSrc) return;
    const safeTitle = String(titulo || 'archivo')
      .trim()
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '');
    const defaultExtension = isVideo ? 'mp4' : 'jpg';
    let extension = defaultExtension;
    if (typeof mediaSrc === 'string') {
      const dataMatch = mediaSrc.match(/^data:(image|video)\/([a-z0-9.+-]+);/i);
      if (dataMatch?.[2]) {
        extension = dataMatch[2];
      } else {
        const cleanUrl = mediaSrc.split('?')[0].split('#')[0];
        const extMatch = cleanUrl.match(/\.([a-z0-9]+)$/i);
        if (extMatch?.[1]) extension = extMatch[1];
      }
    }
    const filename = `${safeTitle || 'archivo'}.${extension}`;
    const link = document.createElement('a');
    link.href = mediaSrc;
    link.download = filename;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const handleOpenMap = (event) => {
    event.stopPropagation();
    setIsShareOpen(false);
    if (typeof window === 'undefined' || !mapUrl) return;
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative bg-muted">
            {isVideo ? (
              <video src={mediaSrc} controls className="w-full h-full object-cover" />
            ) : (
              <img src={mediaSrc} alt={titulo} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => onEdit?.(publication)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete?.(publication.id)}>
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>

            <DialogHeader className="items-start text-left">
              <DialogTitle className="text-2xl font-bold">{titulo}</DialogTitle>
              <DialogDescription className="text-sm">
                {business ? `${business.name} · ${business.type}` : 'Publicación destacada'}
              </DialogDescription>
            </DialogHeader>

            {formattedPrice && <p className="mt-2 text-center text-xl font-bold text-emerald-700">{formattedPrice}</p>}
            <p className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">{contenido}</p>

            {categories.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de alimento</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span key={cat.id || cat} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                      {formatCategoryLabel(cat)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Avatar src={businessAvatarSrc} alt={`Logo de ${businessName}`}>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {businessName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{businessName}</p>
                <p className="text-sm text-muted-foreground">{visitas} visitas</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className={likeButtonClassName}
                aria-pressed={liked}
                aria-label={likeButtonLabel}
                title={likeButtonLabel}
                onClick={(event) => {
                  event.stopPropagation();
                  if (liked) return;
                  onLike?.(publication);
                }}
              >
                <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
              </Button>
              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  aria-label="Compartir"
                  aria-expanded={isShareOpen}
                  onClick={handleShareToggle}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                {isShareOpen && (
                  <div
                    className="absolute bottom-full left-1/2 z-30 mb-2 flex items-center gap-2 rounded-full bg-white/95 p-2 shadow-soft backdrop-blur -translate-x-1/2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <a
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label="Descargar"
                title="Descargar"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label="Abrir en Google Maps"
                title={mapUrl ? 'Abrir en Google Maps' : 'Dirección no disponible'}
                onClick={handleOpenMap}
                disabled={!mapUrl}
              >
                <MapPin className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDetailDialog;

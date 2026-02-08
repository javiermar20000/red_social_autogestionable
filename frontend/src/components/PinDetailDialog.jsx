import { useEffect, useRef, useState } from 'react';
import { Heart, Share2, Download, MoreHorizontal, Facebook, Instagram, Twitter, MessageCircle, MapPin, Star } from 'lucide-react';
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
  onViewBusiness,
  businessLogoUrl = '',
  comments = [],
  commentsLoading = false,
  commentSubmitting = false,
  onLoadComments,
  onSubmitComment,
  onEnsureCommentAccess,
  onSubmitRating,
  ratingSubmitting = false,
  onSave,
  saved = false,
}) => {
  const lastVisitedId = useRef(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingText, setRatingText] = useState('');
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

  useEffect(() => {
    if (!open) {
      setCommentsOpen(false);
      setCommentText('');
      setReplyTarget(null);
      setRatingOpen(false);
      setRatingValue(0);
      setRatingHover(0);
      setRatingText('');
      return;
    }
    setCommentText('');
    setReplyTarget(null);
    setCommentsOpen(false);
    setRatingOpen(false);
    setRatingValue(0);
    setRatingHover(0);
    setRatingText('');
  }, [open, publicationId]);

  useEffect(() => {
    if (!open || !commentsOpen || !publicationId) return;
    onLoadComments?.(publicationId);
  }, [open, commentsOpen, publicationId, onLoadComments]);

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
  const userRatingRaw = publication.userRating;
  const userRatingValue = userRatingRaw === null || userRatingRaw === undefined ? null : Number(userRatingRaw);
  const hasUserRating = Number.isFinite(userRatingValue ?? NaN);
  const canRatePublication = estado === 'PUBLICADA';
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
  const handleSavePublication = (event) => {
    event.stopPropagation();
    onSave?.(publication);
  };
  const handleOpenMap = (event) => {
    event.stopPropagation();
    setIsShareOpen(false);
    if (typeof window === 'undefined' || !mapUrl) return;
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };
  const businessId = business?.id || publication?.businessId;
  const canOpenBusiness = Boolean(businessId && onViewBusiness);
  const handleOpenBusinessProfile = (event) => {
    event.stopPropagation();
    if (!canOpenBusiness) return;
    onViewBusiness?.({
      ...business,
      id: businessId,
      name: business?.name || businessName,
      imageUrl: business?.imageUrl || businessAvatarSrc,
    });
  };
  const commentsList = Array.isArray(comments) ? comments : [];
  const commentsByParent = commentsList.reduce((acc, comment) => {
    const key = comment.parentId ? String(comment.parentId) : 'root';
    acc[key] = acc[key] || [];
    acc[key].push(comment);
    return acc;
  }, {});
  const rootComments = commentsByParent.root || [];
  const formatCommentDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const handleToggleComments = (event) => {
    event.stopPropagation();
    setCommentsOpen((prev) => !prev);
  };
  const handleReplyStart = (comment) => {
    if (onEnsureCommentAccess && !onEnsureCommentAccess()) return;
    setCommentsOpen(true);
    setReplyTarget(comment);
  };
  const handleCancelReply = () => setReplyTarget(null);
  const handleSubmitComment = async (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    if (onEnsureCommentAccess && !onEnsureCommentAccess()) return;
    const result = await onSubmitComment?.({
      publicationId,
      contenido: text,
      parentId: replyTarget?.id ?? null,
    });
    if (result !== false) {
      setCommentText('');
      setReplyTarget(null);
    }
  };

  const handleOpenRating = (event) => {
    event.stopPropagation();
    if (!canRatePublication || hasUserRating) return;
    if (onEnsureCommentAccess && !onEnsureCommentAccess()) return;
    setRatingOpen(true);
  };

  const handleSubmitRating = async (event) => {
    event.preventDefault();
    if (!publicationId) return;
    if (!ratingValue || ratingValue < 1) return;
    const text = ratingText.trim();
    if (!text) return;
    if (onEnsureCommentAccess && !onEnsureCommentAccess()) return;
    const result = await onSubmitRating?.({
      publicationId,
      contenido: text,
      calificacion: ratingValue,
    });
    if (result !== false) {
      setRatingOpen(false);
      setRatingValue(0);
      setRatingHover(0);
      setRatingText('');
      setCommentsOpen(true);
    }
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

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={`flex items-center gap-3 text-left ${canOpenBusiness ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                onClick={handleOpenBusinessProfile}
                disabled={!canOpenBusiness}
                aria-label={`Ver perfil de ${businessName}`}
              >
                <Avatar src={businessAvatarSrc} alt={`Logo de ${businessName}`}>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {businessName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{businessName}</p>
                  <p className="text-sm text-muted-foreground">{visitas} visitas</p>
                </div>
              </button>
              <div className="flex flex-col items-end gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenRating}
                  disabled={!canRatePublication || hasUserRating}
                  title={
                    !canRatePublication
                      ? 'Solo publicaciones publicadas pueden calificarse'
                      : hasUserRating
                      ? 'Ya calificaste esta publicación'
                      : 'Calificar publicación'
                  }
                >
                  ¿Desea calificar?
                </Button>
                {hasUserRating && (
                  <span className="text-[0.7rem] text-muted-foreground">
                    Ya calificaste con {userRatingValue} estrellas.
                  </span>
                )}
              </div>
            </div>

            <br></br>
            <div className="flex flex-wrap justify-between">
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
                className={saved ? 'rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'rounded-full'}
                aria-pressed={saved}
                aria-label={saved ? 'Publicación guardada' : 'Guardar publicación'}
                title={saved ? 'Publicación guardada' : 'Guardar publicación'}
                onClick={handleSavePublication}
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
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label={commentsOpen ? 'Ocultar comentarios' : 'Ver comentarios'}
                title={commentsOpen ? 'Ocultar comentarios' : 'Ver comentarios'}
                onClick={handleToggleComments}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>

            {commentsOpen && (
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Comentarios públicos</h4>
                  <span className="text-xs text-muted-foreground">{commentsList.length} en total</span>
                </div>

                <form onSubmit={handleSubmitComment} className="mt-3 space-y-2">
                  {replyTarget && (
                    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <span>Respondiendo a {replyTarget.userName || 'usuario'}</span>
                      <button type="button" className="text-primary hover:underline" onClick={handleCancelReply}>
                        Cancelar
                      </button>
                    </div>
                  )}
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Escribe tu comentario..."
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.rol === 'CLIENTE'
                        ? 'Comparte tu opinión con la comunidad.'
                        : 'Para comentar debes iniciar sesión como cliente.'}
                    </p>
                    <Button type="submit" size="sm" disabled={commentSubmitting || !commentText.trim()}>
                      {commentSubmitting ? 'Enviando...' : 'Comentar'}
                    </Button>
                  </div>
                </form>

                <div className="mt-4 space-y-4">
                  {commentsLoading && <p className="text-sm text-muted-foreground">Cargando comentarios...</p>}
                  {!commentsLoading && rootComments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no hay comentarios. ¡Sé el primero en comentar!</p>
                  )}
                  {!commentsLoading &&
                    rootComments.map((comment) => {
                      const ratingValue = Number(comment.calificacion);
                      const hasRatingValue = Number.isFinite(ratingValue) && ratingValue >= 1;
                      const isRatingComment = Boolean(comment.esCalificacion) && hasRatingValue;
                      const ratingDisplay = hasRatingValue ? ratingValue : null;
                      return (
                        <div
                          key={comment.id}
                          className={`rounded-lg border p-3 shadow-soft ${
                            isRatingComment ? 'border-amber-200 bg-amber-50/80' : 'border-border/60 bg-background/80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{comment.userName || 'Usuario'}</span>
                              {isRatingComment && ratingDisplay !== null && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700">
                                  <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
                                  {ratingDisplay}
                                </span>
                              )}
                            </div>
                            <span>{formatCommentDate(comment.fechaCreacion)}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground/90">{comment.contenido}</p>
                          <button
                            type="button"
                            className="mt-2 text-xs font-semibold text-primary hover:underline"
                            onClick={() => handleReplyStart(comment)}
                          >
                            Responder
                          </button>
                          {(commentsByParent[String(comment.id)] || []).length > 0 && (
                            <div className="mt-3 space-y-2 border-l border-primary/20 pl-3">
                              {commentsByParent[String(comment.id)].map((reply) => (
                                <div key={reply.id} className="rounded-md bg-muted/40 px-3 py-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">{reply.userName || 'Usuario'}</span>
                                    <span>{formatCommentDate(reply.fechaCreacion)}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-foreground/90">{reply.contenido}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="items-start text-left">
            <DialogTitle>Califica esta publicación</DialogTitle>
            <DialogDescription>
              Comparte tu opinión sobre {titulo || 'este alimento'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRating} className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-semibold">Tu calificación</p>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = (ratingHover || ratingValue) >= value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className="rounded-full p-1 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      onClick={() => setRatingValue(value)}
                      onMouseEnter={() => setRatingHover(value)}
                      onMouseLeave={() => setRatingHover(0)}
                      aria-label={`Calificar con ${value} estrellas`}
                    >
                      <Star className={`h-6 w-6 ${active ? 'text-amber-500' : 'text-muted-foreground'}`} fill="currentColor" />
                    </button>
                  );
                })}
                <span className="text-xs text-muted-foreground">
                  {ratingValue ? `${ratingValue} de 5` : 'Selecciona una calificación'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Tu opinión</p>
              <textarea
                className="mt-2 min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Escribe tu opinión sobre esta publicación..."
                value={ratingText}
                onChange={(event) => setRatingText(event.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRatingOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={ratingSubmitting || !ratingText.trim() || ratingValue < 1}>
                {ratingSubmitting ? 'Enviando...' : 'Confirmar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PinDetailDialog;

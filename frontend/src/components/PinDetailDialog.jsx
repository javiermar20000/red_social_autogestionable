import { useEffect, useRef } from 'react';
import { Heart, Share2, Download, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog.jsx';
import { Button } from './ui/Button.jsx';
import { Avatar, AvatarFallback } from './ui/Avatar.jsx';
import placeholderImg from '../assets/pin1.jpg';

const formatCategoryLabel = (cat) => {
  const type = cat?.type;
  const name = cat?.name || type || cat;
  return type && name && type !== name ? `${type} · ${name}` : name;
};

const PinDetailDialog = ({ open, onOpenChange, publication, onRegisterVisit, onEdit, onDelete, currentUser }) => {
  const lastVisitedId = useRef(null);
  const publicationId = publication?.id ? String(publication.id) : null;

  useEffect(() => {
    if (!open) {
      lastVisitedId.current = null;
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
  } = publication;
  const canManage =
    (currentUser?.rol === 'OFERENTE' && publication.authorId && publication.authorId === currentUser.id) ||
    currentUser?.role === 'admin';
  const isVideo =
    coverType === 'VIDEO' ||
    (typeof coverUrl === 'string' && (coverUrl.startsWith('data:video') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(coverUrl)));
  const formattedPrice =
    precio === null || precio === undefined || Number.isNaN(Number(precio))
      ? null
      : `$${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(precio))}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative bg-muted">
            {isVideo ? (
              <video src={coverUrl || placeholderImg} controls className="w-full h-full object-cover" />
            ) : (
              <img src={coverUrl || placeholderImg} alt={titulo} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {tipo || 'AVISO'}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {estado}
                </span>
                {formattedPrice && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formattedPrice}
                  </span>
                )}
              </div>
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
                <Button size="icon" variant="ghost" className="rounded-full">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <DialogHeader className="items-start text-left">
              <DialogTitle className="text-2xl font-bold">{titulo}</DialogTitle>
              <DialogDescription className="text-sm">
                {business ? `${business.name} · ${business.type}` : 'Publicación destacada'}
              </DialogDescription>
            </DialogHeader>

            {formattedPrice && <p className="mt-2 text-sm font-semibold text-emerald-700">{formattedPrice}</p>}
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
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(authorName || business?.name || 'G')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{authorName || business?.name || 'GastroHub'}</p>
                <p className="text-sm text-muted-foreground">{visitas} visitas</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button size="icon" variant="ghost" className="rounded-full">
                <Heart className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDetailDialog;

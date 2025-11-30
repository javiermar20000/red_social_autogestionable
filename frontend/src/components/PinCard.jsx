import { useState } from 'react';
import { Heart, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import placeholderImg from '../assets/pin2.jpg';

const statusClasses = {
  PUBLICADA: 'bg-emerald-500 text-white',
  PENDIENTE_VALIDACION: 'bg-amber-500 text-white',
  RECHAZADA: 'bg-rose-500 text-white',
  INACTIVA: 'bg-slate-400 text-white',
};

const PinCard = ({ publication, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const image = publication.coverUrl || publication.placeholder || placeholderImg;
  const statusClass = statusClasses[publication.estado] || 'bg-slate-700 text-white';

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
        <img src={image} alt={publication.titulo} className="h-auto w-full object-cover" loading="lazy" />

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{publication.estado}</span>
            {publication.business?.type && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
                {publication.business.type}
              </span>
            )}
          </div>

          <div className="absolute right-3 top-3 flex gap-2">
            <Button size="sm" variant="secondary" className="h-9 rounded-full px-4 font-semibold" onClick={(e) => e.stopPropagation()}>
              Ver más
            </Button>
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="text-white">
              <h3 className="line-clamp-1 text-sm font-semibold">{publication.titulo}</h3>
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
      </div>
    </div>
  );
};

export default PinCard;

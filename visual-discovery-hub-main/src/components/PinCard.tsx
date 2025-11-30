import { Heart, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import PinDetailDialog from "./PinDetailDialog";

interface PinCardProps {
  image: string;
  title: string;
  author: string;
}

const PinCard = ({ image, title, author }: PinCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        className="group relative break-inside-avoid mb-4 rounded-2xl overflow-hidden bg-card cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{ boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-soft)' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setDetailOpen(true)}
      >
        <div className="relative">
          <img
            src={image}
            alt={title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant={isSaved ? "default" : "secondary"}
              className="rounded-full h-9 px-4 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                setIsSaved(!isSaved);
              }}
            >
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full h-9 w-9"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
              <p className="text-xs opacity-90">{author}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-8 w-8 text-white hover:bg-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-8 w-8 text-white hover:bg-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <PinDetailDialog 
        open={detailOpen} 
        onOpenChange={setDetailOpen}
        image={image}
        title={title}
        author={author}
      />
    </>
  );
};

export default PinCard;

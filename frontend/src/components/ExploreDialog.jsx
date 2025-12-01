import { Coffee, UtensilsCrossed, ShoppingBag, Camera, Palette, Plane, Compass } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog.jsx';
import { Button } from './ui/Button.jsx';

const typeIcon = {
  CAFETERIA: Coffee,
  RESTAURANTE: UtensilsCrossed,
  TIENDA: ShoppingBag,
  FOTOGRAFIA: Camera,
  ARTE: Palette,
  VIAJE: Plane,
};

const ExploreDialog = ({ open, onOpenChange, categories = [], selectedCategoryId, onSelect, onClear }) => {
  const categoryList = categories.length
    ? categories
    : [
        { id: 'CAFETERIA', name: 'Cafeterías', type: 'CAFETERIA' },
        { id: 'RESTAURANTE', name: 'Restaurantes', type: 'RESTAURANTE' },
        { id: 'TIENDA', name: 'Filtrar', type: 'TIENDA' },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="mb-2 text-center text-2xl font-bold">Explorar categorías</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            key="all"
            variant={selectedCategoryId ? 'outline' : 'default'}
            className="h-24 flex-col gap-2"
            onClick={() => {
              onClear?.();
              onOpenChange(false);
            }}
          >
            <Compass className="h-8 w-8" />
            <span className="text-sm font-medium">Todo</span>
          </Button>
          {categoryList.map((category) => {
            const Icon = typeIcon[category.type] || Coffee;
            const active = selectedCategoryId === category.id;
            return (
              <Button
                key={category.id}
                variant={active ? 'default' : 'outline'}
                className="h-24 flex-col gap-2 transition-all hover:scale-105"
                onClick={() => {
                  onSelect?.(category.id);
                  onOpenChange(false);
                }}
              >
                <Icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{category.name}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreDialog;

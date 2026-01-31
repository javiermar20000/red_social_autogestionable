import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Coffee, UtensilsCrossed, ShoppingBag, Camera, Palette, Plane } from "lucide-react";

interface ExploreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExploreDialog = ({ open, onOpenChange }: ExploreDialogProps) => {
  const categories = [
    { icon: Coffee, label: "Cafeterías", color: "text-amber-600" },
    { icon: UtensilsCrossed, label: "Restaurantes", color: "text-orange-600" },
    { icon: ShoppingBag, label: "Tiendas", color: "text-pink-600" },
    { icon: Camera, label: "Fotografía", color: "text-blue-600" },
    { icon: Palette, label: "Arte y Diseño", color: "text-purple-600" },
    { icon: Plane, label: "Viajes", color: "text-teal-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            ¿Qué buscas?
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.label}
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-accent hover:scale-105 transition-all"
                onClick={() => {
                  // Aquí iría la lógica de filtrado
                  console.log(`Categoría seleccionada: ${category.label}`);
                  onOpenChange(false);
                }}
              >
                <Icon className={`h-8 w-8 ${category.color}`} />
                <span className="text-sm font-medium">{category.label}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreDialog;

import { Coffee, UtensilsCrossed, ShoppingBag, Camera, Palette, Plane, Compass, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog.jsx';
import { Button } from './ui/Button.jsx';

const typeIcon = {
  CAFETERIA: Coffee,
  RESTAURANTE: UtensilsCrossed,
  TIENDA: ShoppingBag,
  FOTOGRAFIA: Camera,
  ARTE: Palette,
  VIAJE: Plane,
};

const formatLabel = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const ExploreDialog = ({
  open,
  onOpenChange,
  categories = [],
  businessTypes = [],
  priceRanges = [],
  filters = {},
  onChange,
  onClear,
}) => {
  const { categoryId = '', businessType = '', priceRange = '', sortBy = '', sortDir = 'desc' } = filters || {};
  const categoryList = categories.length
    ? categories
    : [
        { id: 'CAFETERIA', name: 'Cafeterías', type: 'CAFETERIA' },
        { id: 'RESTAURANTE', name: 'Restaurantes', type: 'RESTAURANTE' },
        { id: 'TIENDA', name: 'Filtrar', type: 'TIENDA' },
      ];
  const priceRangeList = priceRanges.length ? priceRanges : ['BAJO', 'MEDIO', 'ALTO'];
  const sortValue = sortBy ? `${sortBy}-${sortDir}` : '';

  const handleSortChange = (value) => {
    if (!value) return onChange?.({ sortBy: '', sortDir: 'desc' });
    const [by, dir] = value.split('-');
    onChange?.({ sortBy: by || '', sortDir: dir === 'asc' ? 'asc' : 'desc' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="mb-2 flex items-center gap-2 text-2xl font-bold">
            <Filter className="h-5 w-5" />
            Explorar y filtrar
          </DialogTitle>
          <DialogDescription>Refina el feed por tipo de negocio, categoría, precio y popularidad.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Tipo de negocio</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={businessType ? 'outline' : 'default'}
                onClick={() => onChange?.({ businessType: '' })}
                className="gap-2"
              >
                <Compass className="h-4 w-4" />
                Todos
              </Button>
              {businessTypes.map((type) => {
                const Icon = typeIcon[type] || Coffee;
                const active = businessType === type;
                return (
                  <Button
                    key={type}
                    variant={active ? 'default' : 'outline'}
                    className="gap-2"
                    onClick={() => onChange?.({ businessType: type })}
                  >
                    <Icon className="h-4 w-4" />
                    {formatLabel(type)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Categorías de alimentos</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <Button variant={categoryId ? 'outline' : 'default'} className="justify-start" onClick={() => onChange?.({ categoryId: '' })}>
                <Compass className="mr-2 h-4 w-4" />
                Todas
              </Button>
              {categoryList.map((category) => {
                const Icon = typeIcon[category.type] || Coffee;
                const active = categoryId === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={active ? 'default' : 'outline'}
                    className="justify-start gap-2"
                    onClick={() => onChange?.({ categoryId: category.id })}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Rango de precios</p>
              <div className="flex flex-wrap gap-2">
                <Button variant={priceRange ? 'outline' : 'default'} onClick={() => onChange?.({ priceRange: '' })}>
                  Cualquiera
                </Button>
                {priceRangeList.map((range) => (
                  <Button
                    key={range}
                    variant={priceRange === range ? 'default' : 'outline'}
                    onClick={() => onChange?.({ priceRange: range })}
                  >
                    {formatLabel(range)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Ordenar por</p>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                value={sortValue}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="">Sin orden</option>
                <option value="visits-desc">Más visitas</option>
                <option value="visits-asc">Menos visitas</option>
                <option value="hearts-desc">Más corazones</option>
                <option value="hearts-asc">Menos corazones</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                onClear?.();
              }}
            >
              Limpiar filtros
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button onClick={() => onOpenChange(false)}>Aplicar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreDialog;

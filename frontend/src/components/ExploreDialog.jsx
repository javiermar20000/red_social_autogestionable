import { Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog.jsx';
import { Button } from './ui/Button.jsx';

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
  const categoryList = categories;
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
        <DialogHeader className="text-center">
          <DialogTitle className="mb-2 flex w-full items-center justify-center gap-2 text-2xl font-bold">
            <Filter className="h-5 w-5" />
            Explorar y filtrar
          </DialogTitle>
          <DialogDescription>Refina el feed por tipo de negocio, categoría, precio y popularidad.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Tipo de negocio</p>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
              value={businessType}
              onChange={(e) => onChange?.({ businessType: e.target.value })}
            >
              <option value="">Todos los tipos</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Categorías de alimentos</p>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
              value={categoryId}
              onChange={(e) => onChange?.({ categoryId: e.target.value })}
            >
              <option value="">Todas las categorías</option>
              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Rango de precios</p>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                value={priceRange}
                onChange={(e) => onChange?.({ priceRange: e.target.value })}
              >
                <option value="">Cualquier rango</option>
                {priceRangeList.map((range) => (
                  <option key={range} value={range}>
                    {formatLabel(range)}
                  </option>
                ))}
              </select>
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
              variant="danger"
              onClick={() => {
                onClear?.();
              }}
            >
              Limpiar filtros
            </Button>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button variant="danger" onClick={() => onOpenChange(false)}>Aplicar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreDialog;

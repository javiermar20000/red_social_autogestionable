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
  regions = [],
  citiesByRegion = {},
  amenities = [],
  filters = {},
  onChange,
  onClear,
}) => {
  const {
    categoryId = '',
    businessType = '',
    region = '',
    city = '',
    amenities: amenitiesFilter = [],
    sortBy = '',
    sortDir = 'desc',
  } = filters || {};
  const categoryList = categories;
  const sortValue = sortBy ? `${sortBy}-${sortDir}` : '';
  const selectedAmenities = Array.isArray(amenitiesFilter) ? amenitiesFilter : [];
  const rawCityOptions = region ? citiesByRegion[region] || [] : [];
  const cityOptions = city && !rawCityOptions.includes(city) ? [city, ...rawCityOptions] : rawCityOptions;
  const amenityOptions = amenities
    .map((amenity) => {
      if (typeof amenity === 'string') {
        return { value: amenity, label: formatLabel(amenity) };
      }
      return {
        value: amenity.value,
        label: amenity.label || formatLabel(amenity.value),
      };
    })
    .filter((amenity) => amenity.value);

  const handleSortChange = (value) => {
    if (!value) return onChange?.({ sortBy: '', sortDir: 'desc' });
    const [by, dir] = value.split('-');
    onChange?.({ sortBy: by || '', sortDir: dir === 'asc' ? 'asc' : 'desc' });
  };

  const toggleAmenity = (value) => {
    const current = selectedAmenities;
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    onChange?.({ amenities: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="text-center">
          <DialogTitle className="mb-2 flex w-full items-center justify-center gap-2 text-2xl font-bold">
            <Filter className="h-5 w-5" />
            Explorar y filtrar
          </DialogTitle>
          <DialogDescription>Refina el feed por tipo de negocio, categoría, región, ciudad y características.</DialogDescription>
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
              <p className="text-sm font-semibold text-muted-foreground">Región</p>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                value={region}
                onChange={(e) => onChange?.({ region: e.target.value, city: '' })}
              >
                <option value="">Todas las regiones</option>
                {regions.map((regionName) => (
                  <option key={regionName} value={regionName}>
                    {regionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Ciudad</p>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                value={city}
                onChange={(e) => onChange?.({ city: e.target.value })}
                disabled={!region}
              >
                <option value="">{region ? 'Selecciona ciudad' : 'Selecciona región primero'}</option>
                {cityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Características</p>
            <p className="text-xs text-muted-foreground">Selecciona una o varias.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {amenityOptions.map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity.value);
                return (
                  <label
                    key={amenity.value}
                    className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-soft transition hover:border-destructive/60"
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isChecked}
                      onChange={() => toggleAmenity(amenity.value)}
                    />
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background text-transparent transition peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-background peer-checked:border-destructive peer-checked:bg-destructive peer-checked:text-white">
                      <svg viewBox="0 0 12 9" className="h-3 w-3" aria-hidden="true">
                        <path
                          d="M1 4.5L4.25 7.5L11 1.25"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </label>
                );
              })}
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

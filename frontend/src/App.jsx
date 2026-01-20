import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import MasonryGrid from './components/MasonryGrid.jsx';
import PinCard from './components/PinCard.jsx';
import PinDetailDialog from './components/PinDetailDialog.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import ExploreDialog from './components/ExploreDialog.jsx';
import { Button } from './components/ui/Button.jsx';
import { Input } from './components/ui/Input.jsx';
import { Label } from './components/ui/Label.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/Dialog.jsx';
import { Avatar, AvatarFallback } from './components/ui/Avatar.jsx';
import { cn } from './lib/cn.js';
import pin1 from './assets/pin1.jpg';
import pin2 from './assets/pin2.jpg';
import pin3 from './assets/pin3.jpg';
import pin4 from './assets/pin4.jpg';
import pin5 from './assets/pin5.jpg';
import pin6 from './assets/pin6.jpg';
import pin7 from './assets/pin7.jpg';
import pin8 from './assets/pin8.jpg';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const placeholderImages = [pin1, pin2, pin3, pin4, pin5, pin6, pin7, pin8];
const SESSION_LIKES_STORAGE_KEY = 'publicationLikesSession';
const MAX_BUSINESS_LOGO_BYTES = 1024 * 1024;
const numberFormatter = new Intl.NumberFormat('es-CL');
const formatNumber = (value) => numberFormatter.format(value);

const fetchJson = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Error de servidor');
  }
  return data;
};

const publicationTypes = [
  { value: 'AVISO_GENERAL', label: 'Aviso general' },
  { value: 'PROMOCION', label: 'Promoción' },
  { value: 'EVENTO', label: 'Evento' },
];

const cafeCategoryTypes = [
  'ESPRESSO',
  'AMERICANO',
  'CAPPUCCINO',
  'LATTE',
  'MOCHA',
  'FLAT_WHITE',
  'MACCHIATO',
  'COLD_BREW',
  'AFFOGATO',
];

const foodCategoryTypes = [
  'PIZZA',
  'SUSHI',
  'HAMBURGUESAS',
  'PASTAS',
  'COMIDA_MEXICANA',
  'COMIDA_CHINA',
  'COMIDA_INDIAN',
  'POSTRES',
  'SANDWICHES',
  'ENSALADAS',
];

const barCategoryTypes = [
  'CERVEZAS',
  'VINOS',
  'COCTELES',
  'DESTILADOS',
  'BEBIDAS_SIN_ALCOHOL',
  'TAPAS',
  'PICOTEO',
];

const foodtruckCategoryTypes = [
  'HOT_DOGS',
  'TACOS',
  'BURRITOS',
  'AREPAS',
  'EMPANADAS',
  'PAPAS_FRITAS',
  'WRAPS',
  'BROCHETAS',
  'HELADOS',
];

const categoriesByBusinessType = {
  CAFETERIA: cafeCategoryTypes,
  RESTAURANTE: foodCategoryTypes,
  BAR: barCategoryTypes,
  FOODTRUCK: foodtruckCategoryTypes,
};

const defaultBusinessTypes = ['RESTAURANTE', 'CAFETERIA', 'FOODTRUCK', 'BAR'];
const defaultCategoryTypes = defaultBusinessTypes.flatMap((type) => categoriesByBusinessType[type] || []);
const defaultFilters = {
  search: '',
  categoryId: '',
  businessId: '',
  businessType: '',
  region: '',
  city: '',
  amenities: [],
  sortBy: '',
  sortDir: 'desc',
};
const chileRegions = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];
const chileCitiesByRegion = {
  'Arica y Parinacota': ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  Tarapacá: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  Antofagasta: [
    'Antofagasta',
    'Mejillones',
    'Sierra Gorda',
    'Taltal',
    'Calama',
    'Ollagüe',
    'San Pedro de Atacama',
    'Tocopilla',
    'María Elena',
  ],
  Atacama: [
    'Copiapó',
    'Caldera',
    'Tierra Amarilla',
    'Chañaral',
    'Diego de Almagro',
    'Vallenar',
    'Freirina',
    'Huasco',
    'Alto del Carmen',
  ],
  Coquimbo: [
    'La Serena',
    'Coquimbo',
    'Andacollo',
    'La Higuera',
    'Paihuano',
    'Vicuña',
    'Ovalle',
    'Combarbalá',
    'Monte Patria',
    'Punitaqui',
    'Río Hurtado',
    'Illapel',
    'Canela',
    'Los Vilos',
    'Salamanca',
  ],
  Valparaíso: [
    'Valparaíso',
    'Casablanca',
    'Concón',
    'Juan Fernández',
    'Puchuncaví',
    'Quintero',
    'Viña del Mar',
    'Isla de Pascua',
    'Quilpué',
    'Villa Alemana',
    'Limache',
    'Olmué',
    'Quillota',
    'La Calera',
    'Hijuelas',
    'La Cruz',
    'Nogales',
    'San Antonio',
    'Algarrobo',
    'Cartagena',
    'El Quisco',
    'El Tabo',
    'Santo Domingo',
    'La Ligua',
    'Cabildo',
    'Papudo',
    'Petorca',
    'Zapallar',
    'Los Andes',
    'Calle Larga',
    'Rinconada',
    'San Esteban',
    'San Felipe',
    'Catemu',
    'Llay-Llay',
    'Panquehue',
    'Putaendo',
    'Santa María',
  ],
  'Metropolitana de Santiago': [
    'Cerrillos',
    'Cerro Navia',
    'Conchalí',
    'El Bosque',
    'Estación Central',
    'Huechuraba',
    'Independencia',
    'La Cisterna',
    'La Florida',
    'La Granja',
    'La Pintana',
    'La Reina',
    'Las Condes',
    'Lo Barnechea',
    'Lo Espejo',
    'Lo Prado',
    'Macul',
    'Maipú',
    'Ñuñoa',
    'Pedro Aguirre Cerda',
    'Peñalolén',
    'Providencia',
    'Pudahuel',
    'Quilicura',
    'Quinta Normal',
    'Recoleta',
    'Renca',
    'San Joaquín',
    'San Miguel',
    'San Ramón',
    'Santiago',
    'Vitacura',
    'Puente Alto',
    'Pirque',
    'San José de Maipo',
    'Colina',
    'Lampa',
    'Tiltil',
    'San Bernardo',
    'Buin',
    'Calera de Tango',
    'Paine',
    'Melipilla',
    'Alhué',
    'Curacaví',
    'María Pinto',
    'San Pedro',
    'Talagante',
    'El Monte',
    'Isla de Maipo',
    'Padre Hurtado',
    'Peñaflor',
  ],
  "Libertador General Bernardo O'Higgins": [
    'Rancagua',
    'Codegua',
    'Coinco',
    'Coltauco',
    'Doñihue',
    'Graneros',
    'Las Cabras',
    'Machalí',
    'Malloa',
    'Mostazal',
    'Olivar',
    'Peumo',
    'Pichidegua',
    'Quinta de Tilcoco',
    'Rengo',
    'Requínoa',
    'San Vicente',
    'San Fernando',
    'Chimbarongo',
    'Chépica',
    'Lolol',
    'Nancagua',
    'Palmilla',
    'Peralillo',
    'Placilla',
    'Pumanque',
    'Santa Cruz',
    'Pichilemu',
    'La Estrella',
    'Litueche',
    'Marchigüe',
    'Navidad',
    'Paredones',
  ],
  Maule: [
    'Talca',
    'Constitución',
    'Curepto',
    'Empedrado',
    'Maule',
    'Pelarco',
    'Pencahue',
    'Río Claro',
    'San Clemente',
    'San Rafael',
    'Linares',
    'Colbún',
    'Longaví',
    'Parral',
    'Retiro',
    'San Javier',
    'Villa Alegre',
    'Yerbas Buenas',
    'Curicó',
    'Hualañé',
    'Licantén',
    'Molina',
    'Rauco',
    'Romeral',
    'Sagrada Familia',
    'Teno',
    'Vichuquén',
    'Cauquenes',
    'Chanco',
    'Pelluhue',
  ],
  Ñuble: [
    'Chillán',
    'Chillán Viejo',
    'Bulnes',
    'El Carmen',
    'Pemuco',
    'Pinto',
    'Quillón',
    'San Ignacio',
    'Yungay',
    'Coelemu',
    'Cobquecura',
    'Ninhue',
    'Portezuelo',
    'Quirihue',
    'Ránquil',
    'Treguaco',
    'San Carlos',
    'Coihueco',
    'Ñiquén',
    'San Fabián',
    'San Nicolás',
  ],
  Biobío: [
    'Concepción',
    'Coronel',
    'Chiguayante',
    'Florida',
    'Hualqui',
    'Lota',
    'Penco',
    'San Pedro de la Paz',
    'Santa Juana',
    'Talcahuano',
    'Tomé',
    'Hualpén',
    'Arauco',
    'Cañete',
    'Contulmo',
    'Curanilahue',
    'Lebu',
    'Los Álamos',
    'Tirúa',
    'Los Ángeles',
    'Antuco',
    'Cabrero',
    'Laja',
    'Mulchén',
    'Nacimiento',
    'Negrete',
    'Quilaco',
    'Quilleco',
    'San Rosendo',
    'Santa Bárbara',
    'Tucapel',
    'Yumbel',
    'Alto Biobío',
  ],
  'La Araucanía': [
    'Temuco',
    'Carahue',
    'Cunco',
    'Curarrehue',
    'Freire',
    'Galvarino',
    'Gorbea',
    'Lautaro',
    'Loncoche',
    'Melipeuco',
    'Nueva Imperial',
    'Padre Las Casas',
    'Perquenco',
    'Pitrufquén',
    'Pucón',
    'Saavedra',
    'Teodoro Schmidt',
    'Toltén',
    'Vilcún',
    'Villarrica',
    'Cholchol',
    'Angol',
    'Collipulli',
    'Curacautín',
    'Ercilla',
    'Lonquimay',
    'Los Sauces',
    'Lumaco',
    'Purén',
    'Renaico',
    'Traiguén',
    'Victoria',
  ],
  'Los Ríos': [
    'Valdivia',
    'Corral',
    'Lanco',
    'Los Lagos',
    'Máfil',
    'Mariquina',
    'Paillaco',
    'Panguipulli',
    'La Unión',
    'Futrono',
    'Lago Ranco',
    'Río Bueno',
  ],
  'Los Lagos': [
    'Puerto Montt',
    'Calbuco',
    'Cochamó',
    'Fresia',
    'Frutillar',
    'Los Muermos',
    'Llanquihue',
    'Maullín',
    'Puerto Varas',
    'Osorno',
    'Puerto Octay',
    'Purranque',
    'Puyehue',
    'Río Negro',
    'San Juan de la Costa',
    'San Pablo',
    'Ancud',
    'Castro',
    'Chonchi',
    'Curaco de Vélez',
    'Dalcahue',
    'Puqueldón',
    'Queilén',
    'Quemchi',
    'Quellón',
    'Quinchao',
    'Chaitén',
    'Futaleufú',
    'Hualaihué',
    'Palena',
  ],
  'Aysén del General Carlos Ibáñez del Campo': [
    'Coyhaique',
    'Lago Verde',
    'Aysén',
    'Cisnes',
    'Guaitecas',
    'Chile Chico',
    'Río Ibáñez',
    'Cochrane',
    "O'Higgins",
    'Tortel',
  ],
  'Magallanes y de la Antártica Chilena': [
    'Punta Arenas',
    'Laguna Blanca',
    'Río Verde',
    'San Gregorio',
    'Cabo de Hornos',
    'Antártica',
    'Porvenir',
    'Primavera',
    'Timaukel',
    'Natales',
    'Torres del Paine',
  ],
};
const businessAmenityOptions = [
  { value: 'PET_FRIENDLY', label: 'Pet friendly' },
  { value: 'TERRAZA', label: 'Terraza' },
  { value: 'AREA_FUMADORES', label: 'Área para fumadores' },
  { value: 'SALA_REUNIONES', label: 'Sala de reuniones' },
  { value: 'CYBER', label: 'Cyber' },
  { value: 'ENCHUFES', label: 'Enchufes para cargar dispositivos' },
];

const sanitizeSessionLikes = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  return Object.entries(raw).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = true;
    }
    return acc;
  }, {});
};

const readSessionLikes = () => {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_LIKES_STORAGE_KEY) || '{}');
    return sanitizeSessionLikes(stored);
  } catch {
    return {};
  }
};

const normalizeCategory = (cat, fallbackList = []) => {
  if (!cat) return null;
  if (typeof cat === 'string') {
    const found = fallbackList.find((c) => String(c.id) === String(cat));
    if (found) return normalizeCategory(found, fallbackList);
    return { id: String(cat), name: String(cat), type: String(cat) };
  }
  const id = cat.id ?? cat.slug ?? cat.type ?? cat.name;
  const type = cat.type || cat.name || (cat.id ? String(cat.id) : '');
  const name = cat.name || type || (id ? String(id) : '');
  return { ...cat, id: id ? String(id) : name, name, type: type || name };
};

const formatCategoryLabel = (cat) => {
  if (!cat) return '';
  const type = cat.type || '';
  const name = cat.name || type || cat.id || '';
  return type && name && type !== name ? `${type} · ${name}` : name || type;
};

const humanizeCategoryType = (type = '') =>
  type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeLocationValue = (value = '') => String(value || '').trim().toLowerCase();
const normalizeAmenityValue = (value = '') => String(value || '').trim().toUpperCase();

const getCitiesForRegion = (region = '') => (region ? chileCitiesByRegion[region] || [] : []);

const buildCityOptions = (region, currentCity) => {
  const cities = getCitiesForRegion(region);
  if (currentCity && !cities.includes(currentCity)) {
    return [currentCity, ...cities];
  }
  return cities;
};

const detectMediaTypeFromUrl = (value = '') => {
  if (!value) return 'IMAGEN';
  const lower = value.toLowerCase();
  if (lower.startsWith('data:video')) return 'VIDEO';
  if (/\.(mp4|webm|ogg)(\?.*)?$/.test(lower)) return 'VIDEO';
  if (lower.includes('/video')) return 'VIDEO';
  return 'IMAGEN';
};

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const [authLoading, setAuthLoading] = useState(false);

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [alerts, setAlerts] = useState([]);

  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(() => localStorage.getItem('tenantId') || '');
  const [tenantInfo, setTenantInfo] = useState(null);

  const [categoryTypes, setCategoryTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [businesses, setBusinesses] = useState([]);

  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [topHeartsMode, setTopHeartsMode] = useState(false);
  const [likedById, setLikedById] = useState(() => readSessionLikes());

  const [selectedPublication, setSelectedPublication] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [similarSource, setSimilarSource] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasNewSimilar, setHasNewSimilar] = useState(false);

  const [tenantForm, setTenantForm] = useState({ nombre: '', dominio: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: '', tenantId: '' });
  const [businessForm, setBusinessForm] = useState({
    name: '',
    type: 'RESTAURANTE',
    description: '',
    address: '',
    city: '',
    region: '',
    amenities: [],
  });
  const [publicationForm, setPublicationForm] = useState({
    titulo: '',
    contenido: '',
    tipo: 'AVISO_GENERAL',
    fechaFinVigencia: '',
    categoryIds: [],
    categoryTypes: [],
    businessId: '',
    mediaUrl: '',
    mediaType: 'IMAGEN',
    precio: '',
  });

  const [adminQueues, setAdminQueues] = useState({ publications: [] });
  const [myPublications, setMyPublications] = useState([]);
  const [loadingMyPublications, setLoadingMyPublications] = useState(false);
  const [editingPublicationId, setEditingPublicationId] = useState(null);
  const [adminPanelTab, setAdminPanelTab] = useState('perfil');
  const [profileBusinessId, setProfileBusinessId] = useState('');
  const [businessProfileForm, setBusinessProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    region: '',
    amenities: [],
    imageUrl: '',
  });

  const resetPublicationForm = () => {
    setPublicationForm({
      titulo: '',
      contenido: '',
      tipo: 'AVISO_GENERAL',
      fechaFinVigencia: '',
      categoryIds: [],
      categoryTypes: [],
      businessId: '',
      mediaUrl: '',
      mediaType: 'IMAGEN',
      precio: '',
    });
    setEditingPublicationId(null);
  };

  const openCreateDialog = () => {
    resetPublicationForm();
    setCreateOpen(true);
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const isAdmin = currentUser?.role === 'admin';
  const isOferente = currentUser?.rol === 'OFERENTE';
  const shouldShowPublicFeed = !isAdmin && !isOferente;

  const notify = (variant, message) => {
    setAlerts((prev) => [...prev, { id: crypto.randomUUID(), variant, message }]);
    setTimeout(() => setAlerts((prev) => prev.slice(1)), 4000);
  };

  const handleMediaUrlChange = (value) => {
    const mediaType = detectMediaTypeFromUrl(value);
    setPublicationForm((prev) => ({ ...prev, mediaUrl: value, mediaType }));
  };

  const handleMediaFileChange = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) {
      notify('danger', 'Solo se permiten imágenes o videos cortos');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      handleMediaUrlChange(result);
    };
    reader.onerror = () => notify('danger', 'No se pudo leer el archivo de portada');
    reader.readAsDataURL(file);
  };

  const handleBusinessLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('danger', 'Selecciona una imagen válida');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_BUSINESS_LOGO_BYTES) {
      notify('danger', 'La imagen supera el máximo de 1 MB');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        notify('danger', 'No se pudo leer la imagen');
        return;
      }
      setBusinessProfileForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.onerror = () => notify('danger', 'No se pudo leer la imagen');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const loadPublicTenants = async () => {
    try {
      const data = await fetchJson('/public/tenants');
      setTenants(data);
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadTenantInfo = async () => {
    if (!token || isAdmin) return;
    try {
      const data = await fetchJson('/tenants/me', { headers: authHeaders });
      setTenantInfo(data);
      if (data?.id) {
        setSelectedTenantId(String(data.id));
        localStorage.setItem('tenantId', String(data.id));
      }
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadCategoryTypes = async () => {
    try {
      const data = await fetchJson('/catalog/category-types');
      setCategoryTypes(data);
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadCategories = async (tenantIdOverride) => {
    const tenantToUse = tenantIdOverride || selectedTenantId;
    if (!tenantToUse) {
      setCategories([]);
      return [];
    }
    try {
      const data = await fetchJson(`/categories?tenantId=${tenantToUse}`, { headers: authHeaders });
      setCategories(data);
      return data;
    } catch (err) {
      notify('danger', err.message);
      return [];
    }
  };

  const loadBusinesses = async () => {
    if (!selectedTenantId && !isAdmin) {
      setBusinesses([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (selectedTenantId) params.set('tenantId', selectedTenantId);
      if (isOferente) params.set('mine', 'true');
      const query = params.toString();
      const data = await fetchJson(`/businesses${query ? `?${query}` : ''}`, { headers: authHeaders });
      setBusinesses(data);
    } catch (err) {
      notify('danger', err.message);
      setBusinesses([]);
    }
  };

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      const params = new URLSearchParams();
      const categoryIdsForFilter = resolveCategoryIdsForFilter(filters.categoryId);
      const numericCategoryIds = categoryIdsForFilter.filter((id) => /^\d+$/.test(String(id)));
      if (filters.search) params.set('search', filters.search);
      if (numericCategoryIds.length === 1) {
        params.set('categoryId', numericCategoryIds[0]);
      }
      if (filters.businessId) params.set('businessId', filters.businessId);
      if (currentUser?.rol === 'OFERENTE') params.set('mine', 'true');
      const tenantParam = currentUser ? selectedTenantId || currentUser?.tenantId : '';
      if (tenantParam) params.set('tenantId', tenantParam);
      const query = params.toString();
      const data = await fetchJson(`/feed/publications${query ? `?${query}` : ''}`, { headers: authHeaders });
      setFeed(data);
    } catch (err) {
      notify('danger', err.message);
      setFeed([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleHome = () => {
    setTopHeartsMode(false);
    const isDefault =
      filters.search === defaultFilters.search &&
      filters.categoryId === defaultFilters.categoryId &&
      filters.businessId === defaultFilters.businessId &&
      filters.businessType === defaultFilters.businessType &&
      filters.region === defaultFilters.region &&
      filters.city === defaultFilters.city &&
      (!filters.amenities || filters.amenities.length === 0) &&
      filters.sortBy === defaultFilters.sortBy &&
      filters.sortDir === defaultFilters.sortDir;
    if (!isDefault) {
      setFilters({ ...defaultFilters });
    } else {
      loadFeed();
    }
  };

  const handleTopHearts = () => {
    setTopHeartsMode(true);
    setFilters({ ...defaultFilters, sortBy: 'hearts', sortDir: 'desc' });
  };

  const loadMyPublications = async () => {
    if (!isOferente) {
      setMyPublications([]);
      setLoadingMyPublications(false);
      return;
    }
    setLoadingMyPublications(true);
    try {
      const params = new URLSearchParams();
      if (selectedTenantId) params.set('tenantId', selectedTenantId);
      const query = params.toString();
      const data = await fetchJson(`/publications/mine${query ? `?${query}` : ''}`, { headers: authHeaders });
      const decorated = data.map((item, idx) => {
        const fallbackCover = placeholderImages[(Number(item.id) || idx) % placeholderImages.length];
        const coverUrl = item.coverUrl || fallbackCover;
        const coverType = item.coverType || detectMediaTypeFromUrl(item.coverUrl || '');
        const normalizedCategories = (item.categories || [])
          .map((cat) => normalizeCategory(cat, categories))
          .filter(Boolean);
        const categoryIds = normalizedCategories.map((c) => c.id);
        return {
          ...item,
          coverUrl,
          coverType,
          categories: normalizedCategories,
          categoryIds: item.categoryIds || categoryIds,
          business: item.business || businesses.find((b) => String(b.id) === String(item.businessId)) || null,
        };
      });
      setMyPublications(decorated);
    } catch (err) {
      notify('danger', err.message);
      setMyPublications([]);
    } finally {
      setLoadingMyPublications(false);
    }
  };

  const loadAdminQueues = async () => {
    if (!isAdmin) return;
    try {
      const publicationsPending = await fetchJson('/admin/publications/pending', { headers: authHeaders });
      setAdminQueues({ publications: publicationsPending });
    } catch (err) {
      notify('danger', err.message);
    }
  };

  useEffect(() => {
    loadPublicTenants();
    loadCategoryTypes();
  }, []);

  useEffect(() => {
    loadTenantInfo();
  }, [token, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setSelectedTenantId('');
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedTenantId) {
      loadCategories();
    }
    if (selectedTenantId || isAdmin) {
      loadBusinesses();
    }
  }, [selectedTenantId, isAdmin]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFeed();
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters.search, filters.categoryId, filters.businessId, currentUser, selectedTenantId]);

  useEffect(() => {
    loadAdminQueues();
  }, [currentUser]);

  useEffect(() => {
    if (isOferente) {
      loadMyPublications();
    }
  }, [isOferente, selectedTenantId]);

  const myBusinesses = useMemo(() => {
    if (isAdmin) return businesses;
    if (!currentUser) return [];
    return businesses.filter((b) => String(b.ownerId) === String(currentUser.id));
  }, [businesses, isAdmin, currentUser]);

  const businessListForForms = isAdmin ? businesses : myBusinesses;

  const activePublicationBusinessId = useMemo(() => {
    return publicationForm.businessId || filters.businessId || businessListForForms[0]?.id || '';
  }, [publicationForm.businessId, filters.businessId, businessListForForms]);

  const selectedBusinessForPublication = useMemo(() => {
    return businessListForForms.find((b) => String(b.id) === String(activePublicationBusinessId)) || null;
  }, [businessListForForms, activePublicationBusinessId]);

  const allowedCategoryTypesForBusiness = useMemo(() => {
    const businessType = selectedBusinessForPublication?.type;
    if (businessType && categoriesByBusinessType[businessType]) {
      return categoriesByBusinessType[businessType];
    }
    return categoryTypes;
  }, [selectedBusinessForPublication, categoryTypes]);

  useEffect(() => {
    if (!publicationForm.businessId && businessListForForms.length) {
      setPublicationForm((prev) => ({ ...prev, businessId: businessListForForms[0].id }));
    }
  }, [businessListForForms, publicationForm.businessId]);

  useEffect(() => {
    const allowed = new Set((allowedCategoryTypesForBusiness || []).map((t) => String(t)));
    setPublicationForm((prev) => {
      const current = (prev.categoryTypes || []).filter(Boolean);
      const filteredTypes = current.filter((t) => allowed.has(String(t))).slice(0, 1);
      const changed = filteredTypes[0] !== current[0] || filteredTypes.length !== current.length;
      if (!changed) return prev;
      return { ...prev, categoryTypes: filteredTypes, categoryIds: filteredTypes.length ? (prev.categoryIds || []).slice(0, 1) : [] };
    });
  }, [allowedCategoryTypesForBusiness]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_LIKES_STORAGE_KEY, JSON.stringify(likedById));
    } catch {
      // no-op
    }
  }, [likedById]);

  useEffect(() => {
    if (!businessListForForms.length) {
      setProfileBusinessId('');
      return;
    }
    if (!profileBusinessId || !businessListForForms.some((b) => String(b.id) === String(profileBusinessId))) {
      setProfileBusinessId(String(businessListForForms[0].id));
    }
  }, [businessListForForms, profileBusinessId]);

  useEffect(() => {
    const selected = businessListForForms.find((b) => String(b.id) === String(profileBusinessId));
    if (!selected) return;
    setBusinessProfileForm((prev) => ({
      ...prev,
      name: selected.name || '',
      description: selected.description || '',
      address: selected.address || '',
      city: selected.city || '',
      region: selected.region || '',
      amenities: Array.isArray(selected.amenities) ? selected.amenities : [],
      imageUrl: selected.imageUrl || '',
    }));
  }, [businessListForForms, profileBusinessId]);

  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    try {
      const data = await fetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setToken(data.token);
      localStorage.setItem('token', data.token);
      const user = data.admin ? { ...data.admin, role: 'admin' } : data.user;
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      if (user?.tenantId) {
        setSelectedTenantId(String(user.tenantId));
        localStorage.setItem('tenantId', String(user.tenantId));
      }
      setAuthOpen(false);
      notify('success', 'Sesión iniciada');
      loadTenantInfo();
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setAuthLoading(true);
    try {
      await fetchJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      notify('success', 'Usuario creado, ahora inicia sesión');
      setAuthOpen(true);
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    setMyPublications([]);
    setEditingPublicationId(null);
    resetPublicationForm();
    setTenantInfo(null);
    setSelectedTenantId('');
    notify('info', 'Sesión cerrada');
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchJson('/tenants', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(tenantForm),
      });
      setTenantInfo(data.tenant);
      setSelectedTenantId(String(data.tenant.id));
      localStorage.setItem('tenantId', String(data.tenant.id));
      setTenantForm({ nombre: '', dominio: '' });
      notify('success', 'Tenant creado');
      setCreateOpen(false);
      loadPublicTenants();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const tenantId = categoryForm.tenantId || selectedTenantId || tenantInfo?.id;
    if (!tenantId) return notify('danger', 'Selecciona un tenant antes de crear categorías');
    try {
      await fetchJson('/categories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...categoryForm, tenantId }),
      });
      notify('success', 'Categoría creada');
      setCategoryForm({ name: '', type: '', tenantId: '' });
      loadCategories();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...businessForm,
        description: businessForm.description || null,
        address: businessForm.address || null,
        city: businessForm.city || null,
        region: businessForm.region || null,
        amenities: Array.isArray(businessForm.amenities) ? businessForm.amenities : [],
      };
      const data = await fetchJson('/businesses', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const tenantIdFromResponse = data?.tenant?.id ? String(data.tenant.id) : null;
      if (tenantIdFromResponse) {
        setTenantInfo(data.tenant);
        setSelectedTenantId(tenantIdFromResponse);
        localStorage.setItem('tenantId', tenantIdFromResponse);
        if (currentUser) {
          const updatedUser = { ...currentUser, tenantId: data.tenant.id };
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      notify('success', 'Negocio creado');
      setBusinessForm({
        name: '',
        type: 'RESTAURANTE',
        description: '',
        address: '',
        city: '',
        region: '',
        amenities: [],
      });
      if (!tenantIdFromResponse || tenantIdFromResponse === selectedTenantId) {
        loadBusinesses();
      }
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleEditPublication = (publication) => {
    setEditingPublicationId(publication.id);
    const firstCategoryId =
      (publication.categoryIds && publication.categoryIds.length ? publication.categoryIds[0] : null) ||
      (publication.categories || []).map((c) => c?.id || c).find(Boolean) ||
      '';
    const firstCategoryType = (publication.categories || []).map((c) => c?.type).find(Boolean) || '';
    setPublicationForm({
      titulo: publication.titulo || '',
      contenido: publication.contenido || '',
      tipo: publication.tipo || 'AVISO_GENERAL',
      fechaFinVigencia: publication.fechaFinVigencia ? String(publication.fechaFinVigencia).slice(0, 10) : '',
      categoryIds: firstCategoryId ? [String(firstCategoryId)] : [],
      categoryTypes: firstCategoryType ? [firstCategoryType] : [],
      businessId: publication.businessId || publication.business?.id || '',
      mediaUrl: publication.coverUrl || '',
      mediaType: publication.coverType || detectMediaTypeFromUrl(publication.coverUrl || ''),
      precio: publication.precio === null || publication.precio === undefined ? '' : publication.precio,
    });
    setCreateOpen(true);
  };

  const handleDeletePublication = async (publicationId) => {
    const confirmed = window.confirm('¿Eliminar esta publicación?');
    if (!confirmed) return;
    try {
      await fetchJson(`/publications/${publicationId}`, { method: 'DELETE', headers: authHeaders });
      notify('success', 'Publicación eliminada');
      loadFeed();
      loadMyPublications();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreatePublication = async (e) => {
    e.preventDefault();
    const businessId = activePublicationBusinessId;
    if (!businessId) return notify('danger', 'Selecciona un negocio para publicar');
    const rawPrice = publicationForm.precio;
    const parsedPrice = Number(rawPrice);
    if (rawPrice === '' || rawPrice === null || rawPrice === undefined) {
      return notify('danger', 'El precio es obligatorio');
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return notify('danger', 'El precio debe ser un número válido');
    }
    const isEditing = Boolean(editingPublicationId);
    const businessForPublication =
      businessListForForms.find((b) => String(b.id) === String(businessId)) || selectedBusinessForPublication;
    const tenantForCategories =
      businessForPublication?.tenantId || selectedTenantId || tenantInfo?.id || currentUser?.tenantId || null;
    const selectedCategoryType = (publicationForm.categoryTypes || [])[0] || '';
    let categoryIdsToSend = (publicationForm.categoryIds || []).slice(0, 1);
    if (!selectedCategoryType && !categoryIdsToSend.length) {
      return notify('danger', 'Selecciona una categoría para esta publicación');
    }
    if (selectedCategoryType) {
      if (!tenantForCategories) return notify('danger', 'No se pudo determinar el tenant para las categorías');
      try {
        const existing = categories.find(
          (c) => c.type === selectedCategoryType && String(c.tenantId) === String(tenantForCategories)
        );
        if (existing) {
          categoryIdsToSend = [String(existing.id)];
        } else {
          const name = humanizeCategoryType(selectedCategoryType);
          try {
            const created = await fetchJson('/categories', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({ name, type: selectedCategoryType, tenantId: tenantForCategories }),
            });
            categoryIdsToSend = [String(created.id)];
          } catch (err) {
            // Si ya existe, recarga y busca de nuevo
            const refreshed = await loadCategories(tenantForCategories);
            const found = refreshed.find(
              (c) => c.type === selectedCategoryType && String(c.tenantId) === String(tenantForCategories)
            );
            if (found) categoryIdsToSend = [String(found.id)];
            else throw err;
          }
        }
        await loadCategories(tenantForCategories);
      } catch (err) {
        notify('danger', err.message);
        return;
      }
    }
    try {
      await fetchJson(isEditing ? `/publications/${editingPublicationId}` : `/businesses/${businessId}/publications`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          titulo: publicationForm.titulo,
          contenido: publicationForm.contenido,
          tipo: publicationForm.tipo,
          businessId,
          categoryIds: categoryIdsToSend,
          fechaFinVigencia: publicationForm.fechaFinVigencia || undefined,
          mediaUrl: publicationForm.mediaUrl || undefined,
          mediaType: publicationForm.mediaType,
          precio: parsedPrice,
        }),
      });
      notify('success', isEditing ? 'Publicación actualizada' : 'Publicación creada y enviada a validación');
      resetPublicationForm();
      setCreateOpen(false);
      loadFeed();
      loadMyPublications();
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleSaveBusinessProfile = async (e) => {
    e?.preventDefault?.();
    if (!profileBusinessId) return notify('danger', 'Selecciona un negocio para editar su perfil');
    try {
      await fetchJson(`/businesses/${profileBusinessId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: businessProfileForm.name,
          description: businessProfileForm.description,
          imageUrl: businessProfileForm.imageUrl || null,
          address: businessProfileForm.address,
          city: businessProfileForm.city,
          region: businessProfileForm.region,
          amenities: Array.isArray(businessProfileForm.amenities) ? businessProfileForm.amenities : [],
        }),
      });
      notify('success', 'Perfil de negocio actualizado');
      loadBusinesses();
      loadFeed();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleApprovePublication = async (id, approve = true) => {
    try {
      const endpoint = approve ? `/admin/publications/${id}/approve` : `/admin/publications/${id}/reject`;
      const body = approve ? undefined : JSON.stringify({ comentarios: window.prompt('Motivo del rechazo') || '' });
      await fetchJson(endpoint, {
        method: 'POST',
        headers: authHeaders,
        body,
      });
      notify('success', `Publicación ${approve ? 'aprobada' : 'rechazada'}`);
      loadAdminQueues();
      loadFeed();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleRegisterVisit = async (publication) => {
    const tenantForVisit = publication?.business?.tenantId || selectedTenantId;
    if (!publication?.id || !tenantForVisit || publication.estado !== 'PUBLICADA') return;
    try {
      await fetchJson(`/publications/${publication.id}/visit?tenantId=${tenantForVisit}`, { method: 'POST' });
      loadFeed();
    } catch {
      // silencioso
    }
  };

  const handleSelectPublication = (publication) => {
    if (!publication) return;
    setSelectedPublication(publication);
    setSimilarSource(publication);
    const similarList = findSimilarPublications(publication);
    setSimilarItems(similarList);
    setHasNewSimilar(similarList.length > 0);
  };

  const handleOpenNotifications = () => {
    setNotificationsOpen(true);
    setHasNewSimilar(false);
  };

  const handleSelectFromNotifications = (publication) => {
    if (!publication) return;
    setNotificationsOpen(false);
    handleSelectPublication(publication);
  };

  const feedWithDecorations = useMemo(
    () =>
      feed.map((item, idx) => {
        const fallbackCover = placeholderImages[(Number(item.id) || idx) % placeholderImages.length];
        const coverUrl = item.coverUrl || fallbackCover;
        const coverType = item.coverType || detectMediaTypeFromUrl(item.coverUrl || '');
        const precio =
          item.precio === null || item.precio === undefined
            ? null
            : Number.isFinite(Number(item.precio))
            ? Number(item.precio)
            : null;
        const rawCategories =
          item.categories && item.categories.length
            ? item.categories
            : (item.categoryIds || []).map(
                (cid) => categories.find((c) => String(c.id) === String(cid)) || { id: cid, name: cid }
              );
        const normalizedCategories = rawCategories.map((cat) => normalizeCategory(cat, categories)).filter(Boolean);
        return {
          ...item,
          coverUrl,
          coverType,
          precio,
          categories: normalizedCategories,
          categoryIds: item.categoryIds || normalizedCategories.map((c) => c.id),
          business: item.business || businesses.find((b) => b.id === item.businessId),
        };
      }),
    [feed, categories, businesses]
  );

  const derivedCategories = useMemo(() => {
    const map = new Map();
    feedWithDecorations.forEach((pub) => {
      (pub.categories || []).forEach((cat) => {
        const normalized = normalizeCategory(cat, categories);
        if (!normalized) return;
        const labelKey = String(normalized.name || normalized.type || normalized.id || '').trim().toLowerCase();
        if (!labelKey) return;
        const existing = map.get(labelKey) || { ...normalized, id: normalized.id, ids: new Set() };
        if (normalized.id) existing.ids.add(String(normalized.id));
        map.set(labelKey, existing);
      });
    });
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      ids: Array.from(entry.ids || []),
    }));
  }, [feedWithDecorations, categories]);

  const resolveCategoryIdsForFilter = (selectedId) => {
    const target = String(selectedId || '').trim();
    if (!target) return [];
    const normalizeKey = (cat) => String(cat?.name || cat?.type || cat?.id || '').trim().toLowerCase();
    const sources = [
      ...categories,
      ...derivedCategories.map((c) => ({
        ...c,
        ids: Array.isArray(c.ids) ? c.ids : [],
      })),
    ];
    const matched = sources.find((cat) => String(cat.id) === target || (cat.ids || []).some((id) => String(id) === target));
    const key = matched ? normalizeKey(matched) : normalizeKey({ id: target });
    const ids = sources
      .filter((cat) => normalizeKey(cat) === key)
      .flatMap((cat) => {
        const collected = [];
        if (cat.id) collected.push(cat.id);
        if (Array.isArray(cat.ids)) collected.push(...cat.ids);
        return collected;
      })
      .filter(Boolean)
      .map(String);
    return Array.from(new Set(ids.length ? ids : [target]));
  };

  const getVisitsValue = (pub) => {
    const value = pub?.visitas ?? pub?.visits ?? pub?.visitCount ?? 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getBaseHeartsValue = (pub) => {
    const value =
      pub?.corazones ??
      pub?.hearts ??
      pub?.likes ??
      pub?.likesCount ??
      pub?.meGusta ??
      pub?.favoritos ??
      pub?.favorites ??
      pub?.reactions ??
      0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getHeartsValue = (pub) => {
    if (!pub) return 0;
    return getBaseHeartsValue(pub);
  };

  const getPublicationLabel = (pub) => {
    const title = String(pub?.titulo || '').trim();
    if (title) return title;
    const businessName = String(pub?.business?.name || '').trim();
    if (businessName) return `Publicación de ${businessName}`;
    const fallbackId = pub?.id ? `#${pub.id}` : 'sin id';
    return `Publicación ${fallbackId}`;
  };

  const buildTopStats = (items, valueAccessor, limit = 5) => {
    const entries = (items || []).map((pub, index) => {
      const value = valueAccessor(pub);
      return {
        id: pub?.id ?? `pub-${index}`,
        label: getPublicationLabel(pub),
        value: Number.isFinite(value) ? value : 0,
      };
    });
    const sorted = [...entries].sort((a, b) => b.value - a.value).slice(0, limit);
    const maxValue = sorted.reduce((max, item) => Math.max(max, item.value), 0);
    const bars = sorted.map((item) => ({
      ...item,
      percent: maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0,
    }));
    return { bars, maxValue };
  };

  const hasLikedInSession = (pub) => {
    const key = pub?.id ? String(pub.id) : '';
    return key ? Boolean(likedById[key]) : false;
  };

  const updatePublicationLikes = (items, publicationId, nextLikes) => {
    if (!Array.isArray(items) || !items.length) return items;
    const normalized = Math.max(0, Math.floor(Number(nextLikes) || 0));
    let changed = false;
    const updated = items.map((item) => {
      if (String(item.id) !== publicationId) return item;
      const current = getBaseHeartsValue(item);
      if (current === normalized) return item;
      changed = true;
      return { ...item, likes: normalized };
    });
    return changed ? updated : items;
  };

  const applyLikesUpdate = (publicationId, nextLikes) => {
    const normalized = Math.max(0, Math.floor(Number(nextLikes) || 0));
    setFeed((prev) => updatePublicationLikes(prev, publicationId, normalized));
    setMyPublications((prev) => updatePublicationLikes(prev, publicationId, normalized));
    setSelectedPublication((prev) => {
      if (!prev || String(prev.id) !== publicationId) return prev;
      return { ...prev, likes: normalized };
    });
  };

  const handleLike = async (publication) => {
    const id = publication?.id;
    const tenantForLike = publication?.business?.tenantId || selectedTenantId;
    if (!id || !tenantForLike || publication.estado !== 'PUBLICADA') return;
    const key = String(id);
    if (likedById[key]) return;
    const currentLikes = getHeartsValue(publication);
    const optimisticLikes = currentLikes + 1;
    setLikedById((prev) => ({ ...prev, [key]: true }));
    applyLikesUpdate(key, optimisticLikes);
    try {
      const data = await fetchJson(`/publications/${id}/like?tenantId=${tenantForLike}`, { method: 'POST' });
      const serverLikes = Number(data?.likes);
      if (Number.isFinite(serverLikes)) {
        applyLikesUpdate(key, serverLikes);
      } else {
        loadFeed();
      }
    } catch (err) {
      setLikedById((prev) => {
        if (!prev[key]) return prev;
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
      applyLikesUpdate(key, currentLikes);
      notify('danger', err.message);
    }
  };

  const extractCategoryKeys = (pub) => {
    if (!pub) return [];
    const keys = new Set();
    const baseCategories =
      (pub.categories && pub.categories.length
        ? pub.categories
        : (pub.categoryIds || []).map((cid) => ({ id: cid }))
      ) || [];
    const categoriesWithTypes =
      Array.isArray(pub.categoryTypes) && pub.categoryTypes.length
        ? [...baseCategories, ...pub.categoryTypes.map((type) => ({ id: type, type, name: type, slug: type }))]
        : baseCategories;
    categoriesWithTypes.forEach((cat) => {
      const normalized = normalizeCategory(cat, categories);
      if (!normalized) return;
      [normalized.id, normalized.slug, normalized.type, normalized.name].forEach((val) => {
        const key = String(val || '').trim().toLowerCase();
        if (key) keys.add(key);
      });
    });
    (pub.categoryIds || []).forEach((cid) => {
      const key = String(cid || '').trim().toLowerCase();
      if (key) keys.add(key);
    });
    return Array.from(keys);
  };

  const findSimilarPublications = (publication) => {
    if (!publication) return [];
    const targetKeys = extractCategoryKeys(publication);
    if (!targetKeys.length) return [];
    const targetSet = new Set(targetKeys);
    return feedWithDecorations
      .filter((item) => String(item.id) !== String(publication.id))
      .filter((item) => {
        const itemKeys = extractCategoryKeys(item);
        return itemKeys.some((key) => targetSet.has(key));
      })
      .sort((a, b) => getVisitsValue(b) - getVisitsValue(a))
      .slice(0, 6);
  };

  const businessTypeOptions = useMemo(() => {
    const types = new Set(defaultBusinessTypes);
    feedWithDecorations.forEach((pub) => {
      if (pub.business?.type) types.add(String(pub.business.type).toUpperCase());
    });
    businesses.forEach((b) => {
      if (b.type) types.add(String(b.type).toUpperCase());
    });
    return Array.from(types);
  }, [feedWithDecorations, businesses]);

  const categoryFilterOptions = useMemo(() => {
    const normalizeKey = (value) => String(value || '').trim().toLowerCase();
    const readTypeValue = (entry) => {
      if (!entry) return '';
      if (typeof entry === 'object') {
        return entry.type || entry.name || entry.id || '';
      }
      return entry;
    };

    const businessTypeKey = String(filters.businessType || '').trim().toUpperCase();
    const mappedTypes = businessTypeKey && categoriesByBusinessType[businessTypeKey]
      ? categoriesByBusinessType[businessTypeKey]
      : null;
    const baseTypes = mappedTypes?.length ? mappedTypes : categoryTypes.length ? categoryTypes : defaultCategoryTypes;

    let typeValues = baseTypes
      .map((entry) => readTypeValue(entry))
      .filter(Boolean)
      .map((value) => String(value));

    if (!typeValues.length && categories.length) {
      typeValues = categories
        .map((cat) => cat?.type || cat?.name || cat?.id)
        .filter(Boolean)
        .map((value) => String(value));
    }

    const categoriesByKey = new Map();
    categories.forEach((cat) => {
      const key = normalizeKey(cat?.type || cat?.name || cat?.id);
      if (!key || categoriesByKey.has(key)) return;
      categoriesByKey.set(key, cat);
    });

    const seen = new Set();
    return typeValues
      .filter((value) => {
        const key = normalizeKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((value) => {
        const key = normalizeKey(value);
        const existing = categoriesByKey.get(key) || null;
        return {
          ...(existing || {}),
          id: String(value),
          name: existing?.name || humanizeCategoryType(value),
          type: existing?.type || String(value),
        };
      });
  }, [filters.businessType, categoryTypes, categories]);

  const filteredPublicFeed = useMemo(() => {
    let list = feedWithDecorations;
    const categoryIdsToMatch = resolveCategoryIdsForFilter(filters.categoryId);
    if (categoryIdsToMatch.length) {
      const targets = categoryIdsToMatch.map(String);
      list = list.filter((pub) => {
        const catIds = (pub.categoryIds || []).map(String);
        return catIds.some((id) => targets.includes(id));
      });
    }
    if (filters.businessType) {
      const target = String(filters.businessType).toUpperCase();
      list = list.filter((pub) => String(pub.business?.type || '').toUpperCase() === target);
    }
    if (filters.region) {
      const target = normalizeLocationValue(filters.region);
      list = list.filter((pub) => normalizeLocationValue(pub.business?.region) === target);
    }
    if (filters.city) {
      const target = normalizeLocationValue(filters.city);
      list = list.filter((pub) => normalizeLocationValue(pub.business?.city) === target);
    }
    const selectedAmenities = Array.isArray(filters.amenities)
      ? filters.amenities.map(normalizeAmenityValue).filter(Boolean)
      : [];
    if (selectedAmenities.length) {
      list = list.filter((pub) => {
        const businessAmenities = Array.isArray(pub.business?.amenities) ? pub.business.amenities : [];
        const normalizedAmenities = businessAmenities.map(normalizeAmenityValue);
        return selectedAmenities.every((amenity) => normalizedAmenities.includes(amenity));
      });
    }
    const sortBy = topHeartsMode ? 'hearts' : filters.sortBy;
    const sortDir = topHeartsMode ? 'desc' : filters.sortDir;
    const sorted = [...list];
    if (sortBy === 'visits') {
      sorted.sort((a, b) => {
        const diff = getVisitsValue(b) - getVisitsValue(a);
        return sortDir === 'asc' ? -diff : diff;
      });
    } else if (sortBy === 'hearts') {
      sorted.sort((a, b) => {
        const diff = getHeartsValue(b) - getHeartsValue(a);
        return sortDir === 'asc' ? -diff : diff;
      });
    }
    return topHeartsMode ? sorted.slice(0, 100) : sorted;
  }, [feedWithDecorations, filters, derivedCategories, categories, topHeartsMode]);

  useEffect(() => {
    if (!similarSource) return;
    const updated = findSimilarPublications(similarSource);
    setSimilarItems(updated);
    if (!updated.length) {
      setHasNewSimilar(false);
    }
  }, [feedWithDecorations, similarSource]);

  const selectedCategoryType = (publicationForm.categoryTypes || [])[0] || '';
  const panelPublications = useMemo(() => {
    if (isAdmin) return feedWithDecorations;
    if (currentUser?.rol === 'OFERENTE') return myPublications;
    return [];
  }, [isAdmin, feedWithDecorations, myPublications, currentUser]);
  const statsSummary = useMemo(() => {
    const totalPublications = panelPublications.length;
    const totalVisits = panelPublications.reduce((sum, pub) => sum + getVisitsValue(pub), 0);
    const totalLikes = panelPublications.reduce((sum, pub) => sum + getHeartsValue(pub), 0);
    const topVisits = buildTopStats(panelPublications, getVisitsValue);
    const topLikes = buildTopStats(panelPublications, getHeartsValue);
    return { totalPublications, totalVisits, totalLikes, topVisits, topLikes };
  }, [panelPublications]);
  const businessLogoValue = typeof businessProfileForm.imageUrl === 'string' ? businessProfileForm.imageUrl : '';
  const isBusinessLogoDataUrl = businessLogoValue.startsWith('data:');
  const businessLogoInputValue = isBusinessLogoDataUrl ? '' : businessLogoValue;
  const hasBusinessLogo = Boolean(businessLogoValue);
  const selectedBusinessLogoUrl = (() => {
    const businessId = selectedPublication?.business?.id ?? selectedPublication?.businessId;
    if (!businessId) return '';
    if (selectedPublication?.business?.imageUrl) return selectedPublication.business.imageUrl;
    const match = businesses.find((b) => String(b.id) === String(businessId));
    return match?.imageUrl || '';
  })();
  const businessFormCityOptions = buildCityOptions(businessForm.region, businessForm.city);
  const businessProfileCityOptions = buildCityOptions(businessProfileForm.region, businessProfileForm.city);

  return (
    <div className="min-h-screen bg-background">
      <Header
        search={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        onExplore={() => setExploreOpen(true)}
        onTopHearts={handleTopHearts}
        onNotifications={handleOpenNotifications}
        hasNotifications={hasNewSimilar}
        notificationsCount={similarItems.length}
        onCreate={openCreateDialog}
        onHome={handleHome}
        onAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="container px-4 py-6 space-y-6">
        {shouldShowPublicFeed && (
          <section>
            {loadingFeed ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
                Cargando feed...
              </div>
            ) : filteredPublicFeed.length ? (
              <MasonryGrid>
                {filteredPublicFeed.map((pub) => (
                  <PinCard
                    key={pub.id}
                    publication={pub}
                    likesCount={getHeartsValue(pub)}
                    liked={hasLikedInSession(pub)}
                    onLike={handleLike}
                    onSelect={handleSelectPublication}
                  />
                ))}
              </MasonryGrid>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No hay publicaciones que coincidan con los filtros.
              </div>
            )}
          </section>
        )}
        {(isOferente || isAdmin) && (
          <section className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isAdmin ? 'Panel del administrador' : 'Panel del oferente'}</p>
                <h4 className="text-xl font-semibold">Gestiona tu perfil y publicaciones</h4>
              </div>
              <Button variant="outline" onClick={openCreateDialog}>
                Abrir panel de creación
              </Button>
            </div>
            <Tabs value={adminPanelTab} onValueChange={setAdminPanelTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                <TabsTrigger value="gestion">Gestión publicaciones</TabsTrigger>
                <TabsTrigger value="feed">Publicaciones</TabsTrigger>
                <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="mt-4">
                {businessListForForms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Aún no tienes negocios activos en este tenant.
                  </div>
                ) : (
                  <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSaveBusinessProfile}>
                    <div className="md:col-span-2">
                      <Label>Negocio</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={profileBusinessId}
                        onChange={(e) => setProfileBusinessId(e.target.value)}
                        required
                      >
                        {businessListForForms.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} · {b.type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Nombre del restaurante</Label>
                      <Input
                        value={businessProfileForm.name}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Imagen de perfil</Label>
                      <Input
                        placeholder="https://..."
                        value={businessLogoInputValue}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-muted/60 px-3 py-2 text-sm font-medium hover:bg-muted">
                          <input type="file" accept="image/*" className="sr-only" onChange={handleBusinessLogoUpload} />
                          Subir imagen
                        </label>
                        {hasBusinessLogo && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setBusinessProfileForm((prev) => ({ ...prev, imageUrl: '' }))}
                          >
                            Quitar
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">Máx 1 MB. Se guarda en el servidor.</p>
                      </div>
                      {hasBusinessLogo && (
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar src={businessLogoValue} alt={`Logo de ${businessProfileForm.name || 'negocio'}`}>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {(businessProfileForm.name || 'N')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs text-muted-foreground">
                            {isBusinessLogoDataUrl ? 'Imagen cargada desde archivo.' : 'Imagen desde URL.'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descripción</Label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        rows={3}
                        value={businessProfileForm.description}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Input
                        value={businessProfileForm.address}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Región</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={businessProfileForm.region || ''}
                        onChange={(e) =>
                          setBusinessProfileForm((prev) => ({ ...prev, region: e.target.value, city: '' }))
                        }
                      >
                        <option value="">Selecciona región</option>
                        {chileRegions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Ciudad</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={businessProfileForm.city || ''}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                        disabled={!businessProfileForm.region}
                      >
                        <option value="">
                          {businessProfileForm.region ? 'Selecciona ciudad' : 'Selecciona región primero'}
                        </option>
                        {businessProfileCityOptions.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Servicios y espacios</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Selecciona todo lo que aplique.</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {businessAmenityOptions.map((amenity) => {
                          const isChecked = businessProfileForm.amenities.includes(amenity.value);
                          return (
                            <label
                              key={amenity.value}
                              className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-soft transition hover:border-destructive/60"
                            >
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setBusinessProfileForm((prev) => {
                                    const current = Array.isArray(prev.amenities) ? prev.amenities : [];
                                    const next = new Set(current);
                                    if (checked) next.add(amenity.value);
                                    else next.delete(amenity.value);
                                    return { ...prev, amenities: Array.from(next) };
                                  });
                                }}
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
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      <Button type="submit">Guardar perfil</Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="gestion" className="mt-4 space-y-6">
                {isOferente && (
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tus publicaciones</p>
                        <h4 className="text-lg font-semibold">Gestiona y edita lo que ya publicaste</h4>
                      </div>
                      <Button size="sm" variant="outline" onClick={openCreateDialog}>
                        Nueva publicación
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {loadingMyPublications && <p className="text-sm text-muted-foreground">Cargando tus publicaciones...</p>}
                      {!loadingMyPublications && !myPublications.length && (
                        <p className="text-sm text-muted-foreground">Aún no tienes publicaciones creadas.</p>
                      )}
                      {myPublications.map((pub) => (
                        <div
                          key={pub.id}
                          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {pub.estado} · {pub.business?.name || 'Negocio'}
                            </p>
                            <h5 className="text-lg font-semibold">{pub.titulo}</h5>
                            <div className="flex flex-wrap gap-2">
                              {(pub.categories || []).map((cat) => (
                                <span key={cat.id || cat} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                                  {formatCategoryLabel(cat)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditPublication(pub)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePublication(pub.id)}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gestión rápida</p>
                      <h4 className="text-lg font-semibold">Negocios y categorías</h4>
                    </div>
                    <Button size="sm" variant="outline" onClick={openCreateDialog}>
                      Abrir panel de creación
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <h5 className="font-semibold">Categorias activas</h5>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <span key={c.id} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                            {c.name} · {c.type}
                          </span>
                        ))}
                        {!categories.length && <p className="text-sm text-muted-foreground">Sin categorías</p>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <h5 className="font-semibold">Negocios activos ({businessListForForms.length})</h5>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {businessListForForms.map((b) => (
                          <span key={b.id} className="rounded-full border px-3 py-1 text-xs">
                            {b.name} · {b.type}
                          </span>
                        ))}
                        {!businessListForForms.length && <p className="text-sm text-muted-foreground">Sin negocios activos</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="feed" className="mt-4">
                {panelPublications.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {panelPublications.map((pub) => (
                      <PinCard
                        key={pub.id}
                        publication={pub}
                        likesCount={getHeartsValue(pub)}
                        liked={hasLikedInSession(pub)}
                        onLike={handleLike}
                        onSelect={handleSelectPublication}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                    No hay publicaciones para mostrar.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="estadisticas" className="mt-4 space-y-6">
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tablero de rendimiento</p>
                      <h4 className="text-lg font-semibold">Visualizaciones y me gusta</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? 'Resumen global de publicaciones publicadas' : 'Resumen de tus publicaciones'}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Publicaciones</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(statsSummary.totalPublications)}</p>
                      <p className="text-xs text-muted-foreground">Total en el tablero</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Visitas</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(statsSummary.totalVisits)}</p>
                      <p className="text-xs text-muted-foreground">Suma de visualizaciones</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Me gusta</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(statsSummary.totalLikes)}</p>
                      <p className="text-xs text-muted-foreground">Reacciones acumuladas</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold">Más visitadas</h5>
                      <span className="text-xs text-muted-foreground">Top 5</span>
                    </div>
                    {statsSummary.topVisits.bars.length && statsSummary.topVisits.maxValue > 0 ? (
                      <div className="mt-4 space-y-3">
                        {statsSummary.topVisits.bars.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="max-w-[70%] truncate font-medium">{item.label}</span>
                              <span className="text-muted-foreground">{formatNumber(item.value)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">Aún no hay visualizaciones registradas.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold">Más me gusta</h5>
                      <span className="text-xs text-muted-foreground">Top 5</span>
                    </div>
                    {statsSummary.topLikes.bars.length && statsSummary.topLikes.maxValue > 0 ? (
                      <div className="mt-4 space-y-3">
                        {statsSummary.topLikes.bars.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="max-w-[70%] truncate font-medium">{item.label}</span>
                              <span className="text-muted-foreground">{formatNumber(item.value)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-rose-500"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">Aún no hay me gusta registrados.</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        )}

        {isAdmin && (
          <section className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Panel de validación</p>
                <h4 className="text-xl font-semibold">Publicaciones pendientes</h4>
              </div>
              <Button variant="outline" onClick={loadAdminQueues}>
                Recargar
              </Button>
            </div>
            <div className="mt-4">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h6 className="font-semibold">Publicaciones</h6>
                  <span className="text-xs text-muted-foreground">{adminQueues.publications.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {adminQueues.publications.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
                      <div>
                        <p className="font-semibold">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.business?.name ? `${p.business.name} · #${p.businessId}` : `Negocio #${p.businessId}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleSelectPublication(p)}>
                          Ver más
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleApprovePublication(p.id, true)}>
                          Aprobar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApprovePublication(p.id, false)}>
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!adminQueues.publications.length && <p className="text-sm text-muted-foreground">Sin pendientes</p>}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-card/80">
        <div className="container px-4 py-8 space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sobre la app</p>
            <p className="max-w-3xl text-sm text-muted-foreground">
              GastroHub es la red social autogestionable para negocios gastronómicos: comparte novedades, gestiona tus
              locales y deja que la comunidad descubra tus productos en un feed curado.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <p>Creado para comunidades que se autogestionan y comparten gastronomía local.</p>
            <p>© {currentYear} GastroHub. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoading}
      />

      <ExploreDialog
        open={exploreOpen}
        onOpenChange={setExploreOpen}
        categories={categoryFilterOptions}
        businessTypes={businessTypeOptions}
        regions={chileRegions}
        citiesByRegion={chileCitiesByRegion}
        amenities={businessAmenityOptions}
        filters={filters}
        onChange={(partial) => {
          setTopHeartsMode(false);
          setFilters((prev) => ({ ...prev, ...partial }));
        }}
        onClear={() => {
          setTopHeartsMode(false);
          setFilters((prev) => ({
            ...prev,
            categoryId: '',
            businessType: '',
            region: '',
            city: '',
            amenities: [],
            sortBy: '',
            sortDir: 'desc',
          }));
        }}
      />

      <Dialog
        open={notificationsOpen}
        onOpenChange={(open) => {
          setNotificationsOpen(open);
          if (open) setHasNewSimilar(false);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader className="text-left">
            <DialogTitle>Productos similares</DialogTitle>
            <DialogDescription>
              {similarSource ? `Inspirados en ${similarSource.titulo}` : 'Selecciona una publicación para ver sugerencias.'}
            </DialogDescription>
          </DialogHeader>

          {similarItems.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {similarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectFromNotifications(item)}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-hover"
                >
                  <div className="relative h-36 w-full overflow-hidden">
                    <img
                      src={item.coverUrl || placeholderImages[0]}
                      alt={item.titulo}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <span className="absolute left-2 bottom-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800">
                      {getVisitsValue(item)} visitas
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="line-clamp-1 text-sm font-semibold">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCategoryLabel((item.categories || [])[0]) || 'Sin categoría'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.business?.name ? `${item.business.name} · ${item.business.type}` : 'Descubre más detalles'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {similarSource
                ? 'No encontramos otras publicaciones en esta categoría.'
                : 'Explora una publicación para ver recomendaciones aquí.'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="text-left">
            <DialogTitle>Crear o gestionar contenido</DialogTitle>
            <DialogDescription>
              Publica novedades, registra negocios, categorías o crea tu tenant directamente desde aquí.
            </DialogDescription>
          </DialogHeader>

          {!currentUser ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-muted-foreground">Inicia sesión para crear contenido.</p>
              <Button
                className="mt-3"
                variant="danger"
                onClick={() => {
                  setCreateOpen(false);
                  setAuthOpen(true);
                }}
              >
                Abrir login
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="publicacion" className="mt-2">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-2">
                <TabsTrigger value="publicacion">Publicación</TabsTrigger>
                <TabsTrigger value="negocio">Negocio</TabsTrigger>
              </TabsList>

              <TabsContent value="publicacion" className="mt-4">
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreatePublication}>
                  <div className="md:col-span-2">
                    <Label>Título</Label>
                    <Input
                      value={publicationForm.titulo}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, titulo: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={publicationForm.tipo}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, tipo: e.target.value }))}
                    >
                      {publicationTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Negocio</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={publicationForm.businessId}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, businessId: e.target.value }))}
                      required
                    >
                      <option value="">Selecciona negocio</option>
                      {businessListForForms.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Contenido</Label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      rows={3}
                      value={publicationForm.contenido}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, contenido: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fin de vigencia</Label>
                    <Input
                      type="date"
                      value={publicationForm.fechaFinVigencia}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, fechaFinVigencia: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 4500"
                      value={publicationForm.precio}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, precio: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Portada (imagen o video)</Label>
                    <div className="mt-1 space-y-2 rounded-lg border border-dashed border-input p-3">
                      <Input
                        placeholder="https://... o pega un data URL"
                        value={publicationForm.mediaUrl}
                        onChange={(e) => handleMediaUrlChange(e.target.value)}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-muted/60 px-3 py-2 text-sm font-medium hover:bg-muted">
                          <input
                            type="file"
                            accept="image/*,video/mp4,video/webm,video/ogg"
                            className="sr-only"
                            onChange={(e) => handleMediaFileChange(e.target.files?.[0] || null)}
                          />
                          Subir archivo
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Acepta imagen o video corto. Se enviará como enlace o base64 al backend.
                        </p>
                      </div>
                      {publicationForm.mediaUrl && (
                        <div className="overflow-hidden rounded-lg border bg-muted/40">
                          {publicationForm.mediaType === 'VIDEO' ? (
                            <video src={publicationForm.mediaUrl} controls className="h-56 w-full object-cover" />
                          ) : (
                            <img src={publicationForm.mediaUrl} alt="Portada" className="h-56 w-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Categoría</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selecciona una única categoría permitida para este negocio.
                    </p>
                    {!selectedBusinessForPublication && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selecciona primero un negocio para ver sus categorías disponibles.
                      </p>
                    )}
                    {selectedBusinessForPublication && allowedCategoryTypesForBusiness.length > 0 && (
                      <select
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={selectedCategoryType}
                        onChange={(e) =>
                          setPublicationForm((prev) => ({
                            ...prev,
                            categoryTypes: e.target.value ? [e.target.value] : [],
                            categoryIds: [],
                          }))
                        }
                        required
                      >
                        <option value="">Elige una categoría</option>
                        {allowedCategoryTypesForBusiness.map((type) => {
                          const typeValue = typeof type === 'object' ? type.type || type.name || type.id : type;
                          const optionValue = String(typeValue);
                          return (
                            <option key={optionValue} value={optionValue}>
                              {formatCategoryLabel({ type: optionValue, name: humanizeCategoryType(optionValue) })}
                            </option>
                          );
                        })}
                      </select>
                    )}
                    {selectedBusinessForPublication && !allowedCategoryTypesForBusiness.length && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Este negocio aún no tiene categorías configuradas.
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit">
                        {editingPublicationId ? 'Actualizar publicación' : 'Publicar (queda pendiente de validación)'}
                      </Button>
                      {editingPublicationId && (
                        <Button type="button" variant="outline" onClick={resetPublicationForm}>
                          Cancelar edición
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="negocio" className="mt-4">
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateBusiness}>
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={businessForm.name}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.type}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="RESTAURANTE">Restaurante</option>
                      <option value="CAFETERIA">Cafetería</option>
                      <option value="BAR">Bar</option>
                      <option value="FOODTRUCK">Foodtruck</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción</Label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      rows={3}
                      value={businessForm.description}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Región</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.region || ''}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, region: e.target.value, city: '' }))}
                    >
                      <option value="">Selecciona región</option>
                      {chileRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                      </select>
                    </div>
                  <div>
                    <Label>Ciudad</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.city || ''}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, city: e.target.value }))}
                      disabled={!businessForm.region}
                    >
                      <option value="">{businessForm.region ? 'Selecciona ciudad' : 'Selecciona región primero'}</option>
                      {businessFormCityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      value={businessForm.address}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Servicios y espacios</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Selecciona todo lo que aplique.</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {businessAmenityOptions.map((amenity) => {
                        const isChecked = businessForm.amenities.includes(amenity.value);
                        return (
                          <label
                            key={amenity.value}
                            className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-soft transition hover:border-destructive/60"
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBusinessForm((prev) => {
                                  const current = Array.isArray(prev.amenities) ? prev.amenities : [];
                                  const next = new Set(current);
                                  if (checked) next.add(amenity.value);
                                  else next.delete(amenity.value);
                                  return { ...prev, amenities: Array.from(next) };
                                });
                              }}
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
                  <div className="md:col-span-2">
                    <Button type="submit">Crear negocio</Button>
                  </div>
                </form>
              </TabsContent>

              {(isOferente || isAdmin) && (
                <TabsContent value="tenant" className="mt-4">
                  <form className="space-y-3" onSubmit={handleCreateTenant}>
                    <div>
                      <Label>Nombre del tenant</Label>
                      <Input
                        value={tenantForm.nombre}
                        onChange={(e) => setTenantForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Dominio (opcional)</Label>
                      <Input
                        value={tenantForm.dominio}
                        onChange={(e) => setTenantForm((prev) => ({ ...prev, dominio: e.target.value }))}
                      />
                    </div>
                    <Button type="submit">Crear tenant</Button>
                  </form>
                </TabsContent>
              )}

              {(isOferente || isAdmin) && (
                <TabsContent value="categoria" className="mt-4">
                  <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreateCategory}>
                    <div className="md:col-span-1">
                      <Label>Nombre</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Tipo</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={categoryForm.type}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, type: e.target.value }))}
                        required
                      >
                        <option value="">Selecciona tipo</option>
                        {categoryTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isAdmin && (
                      <div className="md:col-span-1">
                        <Label>Tenant ID</Label>
                        <Input
                          value={categoryForm.tenantId}
                          onChange={(e) => setCategoryForm((prev) => ({ ...prev, tenantId: e.target.value }))}
                          placeholder="Opcional"
                        />
                      </div>
                    )}
                    <div className="md:col-span-3">
                      <Button type="submit">Crear categoría</Button>
                    </div>
                  </form>
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <PinDetailDialog
        open={Boolean(selectedPublication)}
        onOpenChange={(open) => !open && setSelectedPublication(null)}
        publication={selectedPublication}
        onRegisterVisit={handleRegisterVisit}
        onLike={handleLike}
        liked={hasLikedInSession(selectedPublication)}
        businessLogoUrl={selectedBusinessLogoUrl}
        onEdit={(pub) => {
          if (pub) {
            handleEditPublication(pub);
            setSelectedPublication(null);
          }
        }}
        onDelete={(id) => {
          if (id) {
            handleDeletePublication(id);
            setSelectedPublication(null);
          }
        }}
        currentUser={currentUser}
      />

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-semibold shadow-hover text-white',
              a.variant === 'danger' && 'bg-rose-500',
              a.variant === 'success' && 'bg-emerald-500',
              a.variant === 'info' && 'bg-sky-500',
              a.variant === 'warning' && 'bg-amber-500'
            )}
          >
            {a.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

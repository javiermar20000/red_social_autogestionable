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
const LIKES_STORAGE_KEY = 'publicationLikes';

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
  priceRange: '',
  sortBy: '',
  sortDir: 'desc',
};

const sanitizeLikesMap = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  return Object.entries(raw).reduce((acc, [key, value]) => {
    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) {
      acc[key] = Math.floor(num);
    }
    return acc;
  }, {});
};

const readStoredLikes = () => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const stored = JSON.parse(localStorage.getItem(LIKES_STORAGE_KEY) || '{}');
    return sanitizeLikesMap(stored);
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
  const [likesById, setLikesById] = useState(() => readStoredLikes());

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
    priceRange: '',
    latitude: '',
    longitude: '',
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

  const [adminQueues, setAdminQueues] = useState({ tenants: [], users: [], businesses: [], publications: [] });
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
    priceRange: '',
    latitude: '',
    longitude: '',
    imageUrl: '',
  });
  const [businessLogos, setBusinessLogos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('businessLogos') || '{}');
    } catch {
      return {};
    }
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
    if (!selectedTenantId) {
      setBusinesses([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      params.set('tenantId', selectedTenantId);
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
      filters.priceRange === defaultFilters.priceRange &&
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
      const [tenantsPending, usersPending, businessesPending, publicationsPending] = await Promise.all([
        fetchJson('/admin/tenants/pending', { headers: authHeaders }),
        fetchJson('/admin/users/pending', { headers: authHeaders }),
        fetchJson('/admin/businesses/pending', { headers: authHeaders }),
        fetchJson('/admin/publications/pending', { headers: authHeaders }),
      ]);
      setAdminQueues({
        tenants: tenantsPending,
        users: usersPending,
        businesses: businessesPending,
        publications: publicationsPending,
      });
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
      loadBusinesses();
    }
  }, [selectedTenantId]);

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
    localStorage.setItem('businessLogos', JSON.stringify(businessLogos));
  }, [businessLogos]);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likesById));
    } catch {
      // no-op
    }
  }, [likesById]);

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
      priceRange: selected.priceRange || '',
      latitude: selected.latitude ? String(selected.latitude) : '',
      longitude: selected.longitude ? String(selected.longitude) : '',
      imageUrl: businessLogos[selected.id] || '',
    }));
  }, [businessListForForms, profileBusinessId, businessLogos]);

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
      notify('success', 'Tenant solicitado, espera aprobación del admin');
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
        priceRange: businessForm.priceRange || null,
        latitude: businessForm.latitude || null,
        longitude: businessForm.longitude || null,
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
      notify('success', 'Negocio enviado a validación del admin');
      setBusinessForm({
        name: '',
        type: 'RESTAURANTE',
        description: '',
        address: '',
        city: '',
        region: '',
        priceRange: '',
        latitude: '',
        longitude: '',
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
          precio: publicationForm.precio === '' ? null : Number(publicationForm.precio),
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
    const lat = businessProfileForm.latitude === '' ? null : Number(businessProfileForm.latitude);
    const lng = businessProfileForm.longitude === '' ? null : Number(businessProfileForm.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return notify('danger', 'Latitud o longitud inválida');
    }
    try {
      await fetchJson(`/businesses/${profileBusinessId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: businessProfileForm.name,
          description: businessProfileForm.description,
          address: businessProfileForm.address,
          city: businessProfileForm.city,
          region: businessProfileForm.region,
          priceRange: businessProfileForm.priceRange || null,
          latitude: lat,
          longitude: lng,
        }),
      });
      setBusinessLogos((prev) => ({ ...prev, [profileBusinessId]: businessProfileForm.imageUrl || '' }));
      notify('success', 'Perfil de negocio actualizado');
      loadBusinesses();
      loadFeed();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleApproveTenant = async (id, action = 'approve') => {
    try {
      await fetchJson(`/admin/tenants/${id}/${action === 'approve' ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: authHeaders,
      });
      notify('success', `Tenant ${action === 'approve' ? 'aprobado' : 'rechazado'}`);
      loadAdminQueues();
      loadPublicTenants();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleApproveUser = async (id, action = 'approve') => {
    try {
      await fetchJson(`/admin/users/${id}/${action === 'approve' ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: authHeaders,
      });
      notify('success', `Usuario ${action === 'approve' ? 'aprobado' : 'rechazado'}`);
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleApproveBusiness = async (id) => {
    try {
      await fetchJson(`/admin/businesses/${id}/approve`, { method: 'POST', headers: authHeaders });
      notify('success', 'Negocio aprobado');
      loadAdminQueues();
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

  const getEstimatedHeartsValue = (pub) => {
    const base = getBaseHeartsValue(pub);
    const visits = getVisitsValue(pub);
    const estimated = visits ? Math.round(visits * 0.1) : 0;
    return Math.max(base, estimated);
  };

  const getHeartsValue = (pub) => {
    if (!pub) return 0;
    const key = pub?.id ? String(pub.id) : '';
    if (key && Object.prototype.hasOwnProperty.call(likesById, key)) {
      const stored = Number(likesById[key]);
      return Number.isFinite(stored) ? stored : 0;
    }
    return getEstimatedHeartsValue(pub);
  };

  const handleLike = (publication) => {
    const id = publication?.id;
    if (!id) return;
    const key = String(id);
    setLikesById((prev) => {
      const stored = Number(prev[key]);
      const current = Number.isFinite(stored) ? stored : getEstimatedHeartsValue(publication);
      return { ...prev, [key]: Math.max(0, Math.floor(current) + 1) };
    });
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

  const priceRangeOptions = useMemo(() => {
    const ranges = new Set();
    businesses.forEach((b) => {
      if (b.priceRange) ranges.add(String(b.priceRange));
    });
    feedWithDecorations.forEach((pub) => {
      if (pub.business?.priceRange) ranges.add(String(pub.business.priceRange));
    });
    return Array.from(ranges);
  }, [businesses, feedWithDecorations]);

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
    if (filters.priceRange) {
      const target = String(filters.priceRange).toUpperCase();
      list = list.filter((pub) => String(pub.business?.priceRange || '').toUpperCase() === target);
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
  }, [feedWithDecorations, filters, derivedCategories, categories, likesById, topHeartsMode]);

  useEffect(() => {
    const sources = [...feed, ...myPublications];
    if (!sources.length) return;
    setLikesById((prev) => {
      let changed = false;
      const next = { ...prev };
      sources.forEach((pub) => {
        const id = pub?.id ? String(pub.id) : '';
        if (!id || Object.prototype.hasOwnProperty.call(next, id)) return;
        next[id] = getEstimatedHeartsValue(pub);
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [feed, myPublications]);

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
              <TabsList className="grid w-full md:w-auto md:grid-cols-3">
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                <TabsTrigger value="gestion">Gestión publicaciones</TabsTrigger>
                <TabsTrigger value="feed">Publicaciones</TabsTrigger>
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
                      <Label>Imagen de perfil (URL)</Label>
                      <Input
                        placeholder="https://..."
                        value={businessProfileForm.imageUrl}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Guardado localmente para referencia visual. No se envía al servidor.
                      </p>
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
                      <Label>Ciudad</Label>
                      <Input
                        value={businessProfileForm.city}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Región</Label>
                      <Input
                        value={businessProfileForm.region}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, region: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Rango de precio</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={businessProfileForm.priceRange || ''}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, priceRange: e.target.value }))}
                      >
                        <option value="">Sin rango</option>
                        <option value="BAJO">Bajo</option>
                        <option value="MEDIO">Medio</option>
                        <option value="ALTO">Alto</option>
                      </select>
                    </div>
                    <div>
                      <Label>Latitud</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={businessProfileForm.latitude}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, latitude: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Longitud</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={businessProfileForm.longitude}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, longitude: e.target.value }))}
                      />
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
            </Tabs>
          </section>
        )}

        {isAdmin && (
          <section className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Panel de validación</p>
                <h4 className="text-xl font-semibold">Pendientes de aprobación</h4>
              </div>
              <Button variant="outline" onClick={loadAdminQueues}>
                Recargar
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h6 className="font-semibold">Tenants</h6>
                  <span className="text-xs text-muted-foreground">{adminQueues.tenants.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {adminQueues.tenants.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
                      <div>
                        <p className="font-semibold">{t.nombre}</p>
                        <p className="text-xs text-muted-foreground">#{t.id}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleApproveTenant(t.id, 'approve')}>
                          Aprobar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApproveTenant(t.id, 'reject')}>
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!adminQueues.tenants.length && <p className="text-sm text-muted-foreground">Sin pendientes</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h6 className="font-semibold">Oferentes</h6>
                  <span className="text-xs text-muted-foreground">{adminQueues.users.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {adminQueues.users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
                      <div>
                        <p className="font-semibold">{u.email}</p>
                        <p className="text-xs text-muted-foreground">#{u.id}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleApproveUser(u.id, 'approve')}>
                          Aprobar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApproveUser(u.id, 'reject')}>
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!adminQueues.users.length && <p className="text-sm text-muted-foreground">Sin pendientes</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h6 className="font-semibold">Negocios</h6>
                  <span className="text-xs text-muted-foreground">{adminQueues.businesses.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {adminQueues.businesses.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
                      <div>
                        <p className="font-semibold">{b.name}</p>
                        <p className="text-xs text-muted-foreground">Tenant #{b.tenantId}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleApproveBusiness(b.id)}>
                        Aprobar
                      </Button>
                    </div>
                  ))}
                  {!adminQueues.businesses.length && <p className="text-sm text-muted-foreground">Sin pendientes</p>}
                </div>
              </div>

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
                        <p className="text-xs text-muted-foreground">Negocio #{p.businessId}</p>
                      </div>
                      <div className="flex gap-1">
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
        priceRanges={priceRangeOptions}
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
            priceRange: '',
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
              Publica novedades, registra negocios, categorías o solicita tu tenant directamente desde aquí.
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
                      placeholder="Opcional"
                      value={publicationForm.precio}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, precio: e.target.value }))}
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
                    <Label>Ciudad</Label>
                    <Input value={businessForm.city} onChange={(e) => setBusinessForm((prev) => ({ ...prev, city: e.target.value }))} />
                  </div>
                    <div>
                      <Label>Región</Label>
                      <Input
                        value={businessForm.region}
                        onChange={(e) => setBusinessForm((prev) => ({ ...prev, region: e.target.value }))}
                      />
                    </div>
                  <div>
                    <Label>Dirección</Label>
                    <Input
                      value={businessForm.address}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Rango precios</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.priceRange}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, priceRange: e.target.value }))}
                    >
                      <option value="">Sin definir</option>
                      <option value="BAJO">Bajo</option>
                      <option value="MEDIO">Medio</option>
                      <option value="ALTO">Alto</option>
                    </select>
                  </div>
                  <div>
                    <Label>Latitud</Label>
                    <Input
                      value={businessForm.latitude}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, latitude: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Longitud</Label>
                    <Input
                      value={businessForm.longitude}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, longitude: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit">Enviar a validación</Button>
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
                    <Button type="submit">Solicitar tenant</Button>
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

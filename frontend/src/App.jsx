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

const categoriesByBusinessType = {
  CAFETERIA: cafeCategoryTypes,
  RESTAURANTE: foodCategoryTypes,
};

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
  const [filters, setFilters] = useState({ search: '', categoryId: '', businessId: '' });

  const [selectedPublication, setSelectedPublication] = useState(null);

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
    businessId: '',
    mediaUrl: '',
  });

  const [adminQueues, setAdminQueues] = useState({ tenants: [], users: [], businesses: [], publications: [] });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const isAdmin = currentUser?.role === 'admin';
  const isOferente = currentUser?.rol === 'OFERENTE';

  const notify = (variant, message) => {
    setAlerts((prev) => [...prev, { id: crypto.randomUUID(), variant, message }]);
    setTimeout(() => setAlerts((prev) => prev.slice(1)), 4000);
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

  const loadCategories = async () => {
    if (!selectedTenantId) {
      setCategories([]);
      return;
    }
    try {
      const data = await fetchJson(`/categories?tenantId=${selectedTenantId}`, { headers: authHeaders });
      setCategories(data);
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadBusinesses = async () => {
    if (!selectedTenantId) {
      setBusinesses([]);
      return;
    }
    try {
      const data = await fetchJson(`/businesses?tenantId=${selectedTenantId}`);
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
      if (filters.search) params.set('search', filters.search);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.businessId) params.set('businessId', filters.businessId);
      const data = await fetchJson(`/feed/publications?${params.toString()}`, { headers: authHeaders });
      setFeed(data);
    } catch (err) {
      notify('danger', err.message);
      setFeed([]);
    } finally {
      setLoadingFeed(false);
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
  }, [filters.search, filters.categoryId, filters.businessId, currentUser]);

  useEffect(() => {
    loadAdminQueues();
  }, [currentUser]);

  const activePublicationBusinessId = useMemo(
    () => publicationForm.businessId || filters.businessId || businesses[0]?.id || '',
    [publicationForm.businessId, filters.businessId, businesses]
  );

  const selectedBusinessForPublication = useMemo(
    () => businesses.find((b) => String(b.id) === String(activePublicationBusinessId)) || null,
    [businesses, activePublicationBusinessId]
  );

  const filteredCategoriesForPublication = useMemo(() => {
    const businessType = selectedBusinessForPublication?.type;
    const allowedTypes = businessType ? categoriesByBusinessType[businessType] : null;
    if (!allowedTypes) return categories;
    const allowedSet = new Set(allowedTypes);
    return categories.filter((cat) => allowedSet.has(cat.type));
  }, [categories, selectedBusinessForPublication]);

  useEffect(() => {
    if (!publicationForm.businessId && businesses.length) {
      setPublicationForm((prev) => ({ ...prev, businessId: businesses[0].id }));
    }
  }, [businesses, publicationForm.businessId]);

  useEffect(() => {
    const allowedIds = new Set(filteredCategoriesForPublication.map((c) => c.id));
    setPublicationForm((prev) => {
      const filteredIds = prev.categoryIds.filter((id) => allowedIds.has(id));
      if (filteredIds.length === prev.categoryIds.length) return prev;
      return { ...prev, categoryIds: filteredIds };
    });
  }, [filteredCategoriesForPublication]);

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
    setTenantInfo(null);
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

  const handleCreatePublication = async (e) => {
    e.preventDefault();
    const businessId = activePublicationBusinessId;
    if (!businessId) return notify('danger', 'Selecciona un negocio para publicar');
    try {
      await fetchJson(`/businesses/${businessId}/publications`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...publicationForm,
          businessId,
          categoryIds: publicationForm.categoryIds,
          fechaFinVigencia: publicationForm.fechaFinVigencia || undefined,
          mediaUrl: publicationForm.mediaUrl || undefined,
        }),
      });
      notify('success', 'Publicación creada y enviada a validación');
      setPublicationForm({
        titulo: '',
        contenido: '',
        tipo: 'AVISO_GENERAL',
        fechaFinVigencia: '',
        categoryIds: [],
        businessId: '',
        mediaUrl: '',
      });
      loadFeed();
      loadAdminQueues();
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

  const feedWithDecorations = useMemo(
    () =>
      feed.map((item, idx) => ({
        ...item,
        coverUrl: item.coverUrl || placeholderImages[(Number(item.id) || idx) % placeholderImages.length],
        categories:
          item.categories ||
          (item.categoryIds || []).map((cid) => categories.find((c) => c.id === cid) || { id: cid, name: cid }),
        business: item.business || businesses.find((b) => b.id === item.businessId),
      })),
    [feed, categories, businesses]
  );

  const derivedCategories = useMemo(() => {
    const map = new Map();
    feedWithDecorations.forEach((pub) => {
      (pub.categories || []).forEach((cat) => {
        const id = cat.id || cat;
        const name = cat.name || cat;
        if (!map.has(id)) map.set(id, { id, name });
      });
    });
    return Array.from(map.values());
  }, [feedWithDecorations]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        search={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        onExplore={() => setExploreOpen(true)}
        onCreate={() => setCreateOpen(true)}
        onAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="container px-4 py-6 space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Publicaciones aceptadas</p>
            <h2 className="mt-1 text-3xl font-bold">GastroHub</h2>
            <p className="text-muted-foreground">Explora todas las publicaciones públicas de la comunidad gastronómica.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadFeed}>
              Actualizar
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Crear</Button>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={filters.categoryId ? 'outline' : 'secondary'}
              onClick={() => setFilters((prev) => ({ ...prev, categoryId: '' }))}
            >
              Todas las categorías
            </Button>
            {derivedCategories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={filters.categoryId === cat.id ? 'default' : 'outline'}
                onClick={() => setFilters((prev) => ({ ...prev, categoryId: cat.id }))}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </section>

        <section>
          {loadingFeed ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
              Cargando feed...
            </div>
          ) : feedWithDecorations.length ? (
            <MasonryGrid>
              {feedWithDecorations.map((pub) => (
                <PinCard key={pub.id} publication={pub} onSelect={setSelectedPublication} />
              ))}
            </MasonryGrid>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Aún no hay publicaciones publicadas.
            </div>
          )}
        </section>

        {(isOferente || isAdmin) && (
          <section className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gestión rápida</p>
                <h4 className="text-xl font-semibold">Negocios y categorías</h4>
              </div>
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
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
                <h5 className="font-semibold">Negocios activos ({businesses.length})</h5>
                <div className="mt-2 flex flex-wrap gap-2">
                  {businesses.map((b) => (
                    <span key={b.id} className="rounded-full border px-3 py-1 text-xs">
                      {b.name} · {b.type}
                    </span>
                  ))}
                  {!businesses.length && <p className="text-sm text-muted-foreground">Sin negocios activos</p>}
                </div>
              </div>
            </div>
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
        categories={derivedCategories}
        selectedCategoryId={filters.categoryId}
        onSelect={(id) => setFilters((prev) => ({ ...prev, categoryId: id }))}
        onClear={() => setFilters((prev) => ({ ...prev, categoryId: '' }))}
      />

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
              <Button className="mt-3" onClick={() => setAuthOpen(true)}>
                Abrir login
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="publicacion" className="mt-4">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="publicacion">Publicación</TabsTrigger>
                <TabsTrigger value="negocio">Negocio</TabsTrigger>
                {(isOferente || isAdmin) && <TabsTrigger value="tenant">Tenant</TabsTrigger>}
                {(isOferente || isAdmin) && <TabsTrigger value="categoria">Categoría</TabsTrigger>}
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
                      {businesses.map((b) => (
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
                    <Label>Imagen de portada (URL)</Label>
                    <Input
                      placeholder="https://..."
                      value={publicationForm.mediaUrl}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, mediaUrl: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Categorías</Label>
                    {selectedBusinessForPublication?.type && categoriesByBusinessType[selectedBusinessForPublication.type] && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Mostrando categorías de {selectedBusinessForPublication.type === 'CAFETERIA' ? 'cafés' : 'comidas'} según
                        el tipo de negocio seleccionado.
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filteredCategoriesForPublication.map((c) => {
                        const checked = publicationForm.categoryIds.includes(c.id);
                        return (
                          <button
                            type="button"
                            key={c.id}
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs',
                              checked ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground'
                            )}
                            onClick={() =>
                              setPublicationForm((prev) => ({
                                ...prev,
                                categoryIds: checked
                                  ? prev.categoryIds.filter((id) => id !== c.id)
                                  : [...prev.categoryIds, c.id],
                              }))
                            }
                          >
                            {c.name}
                          </button>
                        );
                      })}
                      {!filteredCategoriesForPublication.length && (
                        <p className="text-sm text-muted-foreground">Crea una categoría del tipo correspondiente primero.</p>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit">Publicar (queda pendiente de validación)</Button>
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

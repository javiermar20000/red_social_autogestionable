import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const placeholderImg = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';

const fetchJson = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Error de servidor');
  }
  return data;
};

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ nombre: '', email: '', password: '', role: 'OFERENTE' });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [alerts, setAlerts] = useState([]);

  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);

  const [categoryTypes, setCategoryTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [publications, setPublications] = useState([]);

  const [businessSearch, setBusinessSearch] = useState('');
  const [publicationSearch, setPublicationSearch] = useState('');

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
  });

  const [adminQueues, setAdminQueues] = useState({ tenants: [], users: [], businesses: [], publications: [] });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const notify = (variant, message) => {
    setAlerts((prev) => [...prev, { id: crypto.randomUUID(), variant, message }]);
    setTimeout(() => setAlerts((prev) => prev.slice(1)), 3500);
  };

  const loadPublicTenants = async () => {
    try {
      const data = await fetchJson('/public/tenants');
      setTenants(data);
      if (!selectedTenantId && data.length) {
        setSelectedTenantId(String(data[0].id));
      }
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadTenantInfo = async () => {
    if (!token || currentUser?.role === 'admin') return;
    try {
      const data = await fetchJson('/tenants/me', { headers: authHeaders });
      setTenantInfo(data);
      if (data?.id) setSelectedTenantId(String(data.id));
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

  const loadPublications = async () => {
    if (!selectedTenantId || !selectedBusinessId) {
      setPublications([]);
      return;
    }
    try {
      const headers = { ...authHeaders };
      const data = await fetchJson(`/businesses/${selectedBusinessId}/publications?tenantId=${selectedTenantId}`, {
        headers,
      });
      setPublications(data);
    } catch (err) {
      notify('danger', err.message);
      setPublications([]);
    }
  };

  const loadAdminQueues = async () => {
    if (currentUser?.role !== 'admin') return;
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
    loadPublications();
  }, [selectedBusinessId, selectedTenantId, currentUser]);

  useEffect(() => {
    loadAdminQueues();
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      setToken(data.token);
      localStorage.setItem('token', data.token);
      const user = data.admin ? { ...data.admin, role: 'admin' } : data.user;
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      notify('success', 'Sesión iniciada');
      setAuthMode('login');
      loadTenantInfo();
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await fetchJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify(authForm),
      });
      notify('success', 'Usuario creado, ahora inicia sesión');
      setAuthMode('login');
    } catch (err) {
      notify('danger', err.message);
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
      setTenantForm({ nombre: '', dominio: '' });
      notify('success', 'Tenant solicitado, espera aprobación del admin');
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
      await fetchJson('/businesses', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
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
      loadBusinesses();
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreatePublication = async (e) => {
    e.preventDefault();
    if (!selectedBusinessId) return notify('danger', 'Selecciona un negocio');
    try {
      await fetchJson(`/businesses/${selectedBusinessId}/publications`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...publicationForm,
          categoryIds: publicationForm.categoryIds,
          fechaFinVigencia: publicationForm.fechaFinVigencia || undefined,
        }),
      });
      notify('success', 'Publicación creada y enviada a validación');
      setPublicationForm({ titulo: '', contenido: '', tipo: 'AVISO_GENERAL', fechaFinVigencia: '', categoryIds: [] });
      loadPublications();
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
      loadPublications();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const filteredBusinesses = useMemo(() => {
    const term = businessSearch.toLowerCase();
    return businesses.filter((biz) => {
      const matches = !term || biz.name?.toLowerCase().includes(term) || biz.description?.toLowerCase().includes(term);
      return matches;
    });
  }, [businesses, businessSearch]);

  const filteredPublications = useMemo(() => {
    const term = publicationSearch.toLowerCase();
    return publications.filter((item) => {
      const matchesSearch =
        !term || item.titulo?.toLowerCase().includes(term) || item.contenido?.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [publications, publicationSearch]);

  const roleLabel =
    currentUser?.role === 'admin'
      ? 'Admin global'
      : currentUser?.rol === 'OFERENTE'
      ? 'Oferente'
      : currentUser?.rol === 'VISITANTE'
      ? 'Visitante'
      : 'Invitado';

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-4">
        <div className="mb-4 p-4 bg-white rounded shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
          <div>
            <p className="text-uppercase text-secondary mb-1 fw-semibold">Red social autogestionable</p>
            <h1 className="mb-2">GastroHub</h1>
            <p className="text-muted mb-0">
              Multi-tenant con validación por admin. Gestiona tenants, negocios y publicaciones con estados y categorías tipadas.
            </p>
          </div>
          <div className="text-end">
            {currentUser ? (
              <div>
                <p className="mb-1">
                  Conectado como <strong>{currentUser.email || currentUser.nombre}</strong>
                </p>
                <span className="badge bg-primary me-2">{roleLabel}</span>
                {currentUser.estadoRegistro && (
                  <span className="badge bg-info text-dark me-2">Estado: {currentUser.estadoRegistro}</span>
                )}
                <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <span className="badge bg-secondary">Visitante</span>
            )}
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">{authMode === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h5>
                  <button className="btn btn-link p-0" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                    {authMode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
                  </button>
                </div>
                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="vstack gap-3">
                  {authMode === 'register' && (
                    <div>
                      <label className="form-label">Nombre</label>
                      <input
                        className="form-control"
                        value={authForm.nombre}
                        onChange={(e) => setAuthForm({ ...authForm, nombre: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      required
                    />
                  </div>
                  {authMode === 'register' && (
                    <div>
                      <label className="form-label">Rol</label>
                      <select
                        className="form-select"
                        value={authForm.role}
                        onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                      >
                        <option value="OFERENTE">Oferente</option>
                        <option value="VISITANTE">Visitante</option>
                        <option value="admin">Admin global</option>
                      </select>
                    </div>
                  )}
                  <button className="btn btn-primary" type="submit">
                    {authMode === 'login' ? 'Entrar' : 'Registrar'}
                  </button>
                </form>
              </div>
            </div>

            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Tenants activos</h5>
                  <button className="btn btn-sm btn-outline-secondary" onClick={loadPublicTenants}>
                    Actualizar
                  </button>
                </div>
                <select
                  className="form-select mb-2"
                  value={selectedTenantId}
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    setSelectedBusinessId('');
                  }}
                >
                  <option value="">Selecciona un tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} (#{t.id})
                    </option>
                  ))}
                </select>
                {tenantInfo && (
                  <div className="alert alert-info mb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">Tu tenant</div>
                        <div className="small">Estado: {tenantInfo.estado}</div>
                      </div>
                      <span className="badge bg-secondary">ID {tenantInfo.id}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {currentUser?.rol === 'OFERENTE' && (
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <h5 className="card-title mb-2">Solicitar tenant</h5>
                  <p className="text-muted small">Un admin debe validarlo antes de poder publicar.</p>
                  <form className="vstack gap-2" onSubmit={handleCreateTenant}>
                    <input
                      className="form-control"
                      placeholder="Nombre del tenant"
                      value={tenantForm.nombre}
                      onChange={(e) => setTenantForm({ ...tenantForm, nombre: e.target.value })}
                      required
                    />
                    <input
                      className="form-control"
                      placeholder="Dominio (opcional)"
                      value={tenantForm.dominio}
                      onChange={(e) => setTenantForm({ ...tenantForm, dominio: e.target.value })}
                    />
                    <button className="btn btn-success" type="submit">
                      Enviar solicitud
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-8">
            {(currentUser?.role === 'admin' || currentUser?.rol === 'OFERENTE') && (
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Categorías por tenant</h5>
                    <span className="badge text-bg-light border">Tipos: {categoryTypes.length}</span>
                  </div>
                  <form className="row g-2" onSubmit={handleCreateCategory}>
                    <div className="col-md-4">
                      <input
                        className="form-control"
                        placeholder="Nombre"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={categoryForm.type}
                        onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                        required
                      >
                        <option value="">Tipo de categoría</option>
                        {categoryTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    {currentUser?.role === 'admin' && (
                      <div className="col-md-4">
                        <input
                          className="form-control"
                          placeholder="Tenant ID (opcional)"
                          value={categoryForm.tenantId}
                          onChange={(e) => setCategoryForm({ ...categoryForm, tenantId: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="col-12">
                      <button className="btn btn-outline-primary" type="submit">
                        Crear categoría
                      </button>
                    </div>
                  </form>
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <span key={c.id} className="badge bg-info text-dark">
                        {c.name} · {c.type}
                      </span>
                    ))}
                    {!categories.length && <p className="text-muted mb-0">Sin categorías para este tenant.</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Negocios activos</h5>
                  <input
                    type="search"
                    className="form-control form-control-sm w-auto"
                    placeholder="Buscar por nombre"
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                  />
                </div>
                <div className="row g-3">
                  {filteredBusinesses.map((biz) => (
                    <div className="col-md-6" key={biz.id}>
                      <div
                        className={`card h-100 ${selectedBusinessId === biz.id ? 'border-primary' : ''}`}
                        role="button"
                        onClick={() => setSelectedBusinessId(biz.id)}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="card-subtitle text-muted">#{biz.id}</h6>
                              <h5 className="card-title">{biz.name}</h5>
                              <small className="text-muted">{biz.type}</small>
                            </div>
                            <span className={`badge ${biz.status === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}`}>
                              {biz.status}
                            </span>
                          </div>
                          <p className="card-text text-muted">{biz.description || 'Sin descripción'}</p>
                          <div className="text-muted small">
                            {[biz.city, biz.region].filter(Boolean).join(' · ')} {biz.address ? ` · ${biz.address}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!filteredBusinesses.length && <p className="text-muted">No hay negocios activos en este tenant.</p>}
                </div>
              </div>
            </div>

            {(currentUser?.rol === 'OFERENTE' || currentUser?.role === 'admin') && (
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <h5 className="card-title mb-3">Registrar negocio (queda INACTIVO hasta que un admin lo valide)</h5>
                  <form className="row g-3" onSubmit={handleCreateBusiness}>
                    <div className="col-md-6">
                      <label className="form-label">Nombre</label>
                      <input
                        className="form-control"
                        value={businessForm.name}
                        onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tipo</label>
                      <select
                        className="form-select"
                        value={businessForm.type}
                        onChange={(e) => setBusinessForm({ ...businessForm, type: e.target.value })}
                      >
                        <option value="RESTAURANTE">Restaurante</option>
                        <option value="CAFETERIA">Cafetería</option>
                        <option value="BAR">Bar</option>
                        <option value="FOODTRUCK">Foodtruck</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        value={businessForm.description}
                        onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ciudad</label>
                      <input
                        className="form-control"
                        value={businessForm.city}
                        onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Región</label>
                      <input
                        className="form-control"
                        value={businessForm.region}
                        onChange={(e) => setBusinessForm({ ...businessForm, region: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Dirección</label>
                      <input
                        className="form-control"
                        value={businessForm.address}
                        onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Rango precios</label>
                      <select
                        className="form-select"
                        value={businessForm.priceRange}
                        onChange={(e) => setBusinessForm({ ...businessForm, priceRange: e.target.value })}
                      >
                        <option value="">Sin definir</option>
                        <option value="BAJO">Bajo</option>
                        <option value="MEDIO">Medio</option>
                        <option value="ALTO">Alto</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Latitud</label>
                      <input
                        className="form-control"
                        value={businessForm.latitude}
                        onChange={(e) => setBusinessForm({ ...businessForm, latitude: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Longitud</label>
                      <input
                        className="form-control"
                        value={businessForm.longitude}
                        onChange={(e) => setBusinessForm({ ...businessForm, longitude: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <button className="btn btn-success" type="submit">
                        Enviar a validación
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {selectedBusinessId && (
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Publicaciones del negocio #{selectedBusinessId}</h5>
                    <input
                      className="form-control form-control-sm w-auto"
                      placeholder="Buscar"
                      value={publicationSearch}
                      onChange={(e) => setPublicationSearch(e.target.value)}
                    />
                  </div>

                  {(currentUser?.rol === 'OFERENTE' || currentUser?.role === 'admin') && (
                    <form className="border rounded p-3 mb-3 bg-light" onSubmit={handleCreatePublication}>
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label">Título</label>
                          <input
                            className="form-control"
                            value={publicationForm.titulo}
                            onChange={(e) => setPublicationForm({ ...publicationForm, titulo: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Tipo</label>
                          <select
                            className="form-select"
                            value={publicationForm.tipo}
                            onChange={(e) => setPublicationForm({ ...publicationForm, tipo: e.target.value })}
                          >
                            <option value="AVISO_GENERAL">Aviso</option>
                            <option value="PROMOCION">Promoción</option>
                            <option value="EVENTO">Evento</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label">Contenido</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={publicationForm.contenido}
                            onChange={(e) => setPublicationForm({ ...publicationForm, contenido: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Fin de vigencia</label>
                          <input
                            type="date"
                            className="form-control"
                            value={publicationForm.fechaFinVigencia}
                            onChange={(e) => setPublicationForm({ ...publicationForm, fechaFinVigencia: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Categorías</label>
                          <div className="d-flex flex-wrap gap-2">
                            {categories.map((c) => {
                              const checked = publicationForm.categoryIds.includes(c.id);
                              return (
                                <label key={c.id} className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-1"
                                    checked={checked}
                                    onChange={() => {
                                      setPublicationForm((prev) => ({
                                        ...prev,
                                        categoryIds: checked
                                          ? prev.categoryIds.filter((id) => id !== c.id)
                                          : [...prev.categoryIds, c.id],
                                      }));
                                    }}
                                  />
                                  {c.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="col-12">
                          <button className="btn btn-primary" type="submit">
                            Publicar (queda pendiente)
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="row g-3">
                    {filteredPublications.map((item) => (
                      <div className="col-md-6" key={item.id}>
                        <div className="card h-100 shadow-sm">
                          <div className="ratio ratio-16x9">
                            <img src={placeholderImg} alt={item.titulo} className="rounded-top object-fit-cover" />
                          </div>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="card-title mb-1">{item.titulo}</h5>
                                <small className="text-muted">{item.tipo}</small>
                              </div>
                              <span
                                className={`badge ${
                                  item.estado === 'PUBLICADA'
                                    ? 'text-bg-success'
                                    : item.estado === 'PENDIENTE_VALIDACION'
                                    ? 'text-bg-warning'
                                    : 'text-bg-secondary'
                                }`}
                              >
                                {item.estado}
                              </span>
                            </div>
                            <p className="card-text">{item.contenido}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">Visitas: {item.visitas}</small>
                              <div className="d-flex gap-1">
                                {(item.categoryIds || []).map((cid) => {
                                  const cat = categories.find((c) => c.id === cid);
                                  return (
                                    <span key={cid} className="badge text-bg-light border">
                                      {cat?.name || cid}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!filteredPublications.length && <p className="text-muted">No hay publicaciones visibles.</p>}
                  </div>
                </div>
              </div>
            )}

            {currentUser?.role === 'admin' && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">Panel de validación (admin)</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Tenants pendientes</h6>
                          <span className="badge bg-secondary">{adminQueues.tenants.length}</span>
                        </div>
                        {adminQueues.tenants.map((t) => (
                          <div key={t.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                              <div className="fw-semibold">{t.nombre}</div>
                              <small className="text-muted">#{t.id}</small>
                            </div>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleApproveTenant(t.id, 'approve')}>
                                Aprobar
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleApproveTenant(t.id, 'reject')}>
                                Rechazar
                              </button>
                            </div>
                          </div>
                        ))}
                        {!adminQueues.tenants.length && <p className="text-muted mb-0">Sin pendientes.</p>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Oferentes pendientes</h6>
                          <span className="badge bg-secondary">{adminQueues.users.length}</span>
                        </div>
                        {adminQueues.users.map((u) => (
                          <div key={u.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                              <div className="fw-semibold">{u.email}</div>
                              <small className="text-muted">#{u.id}</small>
                            </div>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleApproveUser(u.id, 'approve')}>
                                Aprobar
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleApproveUser(u.id, 'reject')}>
                                Rechazar
                              </button>
                            </div>
                          </div>
                        ))}
                        {!adminQueues.users.length && <p className="text-muted mb-0">Sin pendientes.</p>}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Negocios por aprobar</h6>
                          <span className="badge bg-secondary">{adminQueues.businesses.length}</span>
                        </div>
                        {adminQueues.businesses.map((b) => (
                          <div key={b.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                              <div className="fw-semibold">{b.name}</div>
                              <small className="text-muted">Tenant #{b.tenantId}</small>
                            </div>
                            <button className="btn btn-sm btn-outline-success" onClick={() => handleApproveBusiness(b.id)}>
                              Aprobar
                            </button>
                          </div>
                        ))}
                        {!adminQueues.businesses.length && <p className="text-muted mb-0">Sin pendientes.</p>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Publicaciones pendientes</h6>
                          <span className="badge bg-secondary">{adminQueues.publications.length}</span>
                        </div>
                        {adminQueues.publications.map((p) => (
                          <div key={p.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <div>
                              <div className="fw-semibold">{p.titulo}</div>
                              <small className="text-muted">Negocio #{p.businessId}</small>
                            </div>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleApprovePublication(p.id, true)}>
                                Aprobar
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleApprovePublication(p.id, false)}>
                                Rechazar
                              </button>
                            </div>
                          </div>
                        ))}
                        {!adminQueues.publications.length && <p className="text-muted mb-0">Sin pendientes.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          {alerts.map((a) => (
            <div key={a.id} className={`toast align-items-center text-bg-${a.variant} show`}>
              <div className="d-flex">
                <div className="toast-body">{a.message}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
                ></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

import { NextFunction, Request, Response, Router } from 'express';
import { registerUser, loginUser } from './services/auth-service.js';
import { AuthRequest, authMiddleware, optionalAuthMiddleware, requireRole } from './middleware/auth.js';
import { EstadoRegistroUsuario, RolUsuario, User } from './entities/User.js';
import { Tenant, TenantEstado } from './entities/Tenant.js';
import { Category, CategoriaTipo } from './entities/Category.js';
import { Business, NegocioEstado, NegocioRangoPrecio, NegocioTipo } from './entities/Business.js';
import { Publication, PublicacionEstado, PublicacionTipo } from './entities/Publication.js';
import { PublicationCategory } from './entities/PublicationCategory.js';
import { PublicationReview, RevisionResultado } from './entities/PublicationReview.js';
import { In } from 'typeorm';
import { runWithContext } from './utils/rls.js';

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const getTenantIdFromRequest = (req: AuthRequest) => {
  const fromQuery = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
  const header = req.headers['x-tenant-id'];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  return fromQuery || (typeof fromHeader === 'string' ? fromHeader : undefined) || req.auth?.tenantId || null;
};

const ensureTenantIsActive = async (tenantId: string) => {
  const tenant = await runWithContext({ isAdmin: true }, (manager) =>
    manager.getRepository(Tenant).findOne({ where: { id: tenantId } })
  );
  if (!tenant) throw new Error('Tenant no encontrado');
  if (tenant.estado !== TenantEstado.ACTIVO) throw new Error('El tenant debe estar activo');
  return tenant;
};

const ensureUserReady = (user: User) => {
  if (user.estadoRegistro !== EstadoRegistroUsuario.ACTIVO) {
    throw new Error('Tu cuenta debe ser validada por un admin');
  }
  if (!user.tenantId) {
    throw new Error('Debes tener un tenant asignado');
  }
};

// ========================
// AUTH
// ========================

router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const { email, password, nombre, role } = req.body;
    const result = await registerUser(email, password, nombre, role);
    if (result.admin) {
      return res.json({ admin: { id: result.admin.id, email: result.admin.email, nombre: result.admin.nombre } });
    }
    const user = result.user!;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        estadoRegistro: user.estadoRegistro,
        tenantId: user.tenantId,
      },
    });
  })
);

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { token, user, admin } = await loginUser(email, password);
    if (admin) {
      return res.json({
        token,
        admin: { id: admin.id, email: admin.email, nombre: admin.nombre },
        role: 'admin',
      });
    }
    res.json({
      token,
      user: {
        id: user!.id,
        email: user!.email,
        nombre: user!.nombre,
        rol: user!.rol,
        estadoRegistro: user!.estadoRegistro,
        tenantId: user!.tenantId,
      },
    });
  })
);

// ========================
// TENANTS
// ========================

router.get(
  '/public/tenants',
  asyncHandler(async (_req, res) => {
    const tenants = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Tenant).find({ where: { estado: TenantEstado.ACTIVO } })
    );
    res.json(tenants);
  })
);

router.get(
  '/tenants/me',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) return res.json(null);
    const tenant = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Tenant).findOne({ where: { id: tenantId } })
    );
    res.json(tenant);
  })
);

router.post(
  '/tenants',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.auth!.user!;
    if (user.tenantId) return res.status(400).json({ message: 'Ya tienes un tenant asignado' });
    if (user.estadoRegistro !== EstadoRegistroUsuario.ACTIVO) {
      return res.status(400).json({ message: 'Tu cuenta aún no está validada' });
    }
    const { nombre, dominio } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre es obligatorio' });
    const tenant = await runWithContext({ isAdmin: true }, async (manager) => {
      const repo = manager.getRepository(Tenant);
      const created = repo.create({
        nombre,
        dominio: dominio || null,
        creadorOferenteId: user.id,
        validadorAdminId: null,
      });
      const saved = await repo.save(created);
      await manager.getRepository(User).update({ id: user.id }, { tenantId: saved.id });
      return saved;
    });
    res.json({ tenant });
  })
);

router.get(
  '/admin/tenants/pending',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (_req, res) => {
    const tenants = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Tenant).find({ where: { estado: TenantEstado.PENDIENTE_VALIDACION } })
    );
    res.json(tenants);
  })
);

router.post(
  '/admin/tenants/:id/approve',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const adminId = req.auth!.admin!.id;
    const tenantId = req.params.id;
    const tenant = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Tenant).findOne({ where: { id: tenantId } })
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant no encontrado' });
    await runWithContext({ isAdmin: true }, async (manager) => {
      await manager.getRepository(Tenant).update({ id: tenantId }, { estado: TenantEstado.ACTIVO, validadorAdminId: adminId });
      await manager.getRepository(User).update(
        { id: tenant.creadorOferenteId },
        { estadoRegistro: EstadoRegistroUsuario.ACTIVO, fechaValidacion: new Date(), tenantId: tenant.id }
      );
    });
    res.json({ message: 'Tenant aprobado' });
  })
);

router.post(
  '/admin/tenants/:id/reject',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const tenantId = req.params.id;
    const tenant = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Tenant).findOne({ where: { id: tenantId } })
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant no encontrado' });
    await runWithContext({ isAdmin: true }, async (manager) => {
      await manager.getRepository(Tenant).update({ id: tenantId }, { estado: TenantEstado.RECHAZADO });
      await manager.getRepository(User).update(
        { id: tenant.creadorOferenteId },
        { estadoRegistro: EstadoRegistroUsuario.RECHAZADO, tenantId: null }
      );
    });
    res.json({ message: 'Tenant rechazado' });
  })
);

// ========================
// USERS (VALIDACIÓN OFERENTES)
// ========================

router.get(
  '/admin/users/pending',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (_req, res) => {
    const users = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(User).find({ where: { estadoRegistro: EstadoRegistroUsuario.PENDIENTE_VALIDACION } })
    );
    res.json(users);
  })
);

router.post(
  '/admin/users/:id/approve',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    await runWithContext({ isAdmin: true }, (manager) =>
      manager
        .getRepository(User)
        .update({ id: userId }, { estadoRegistro: EstadoRegistroUsuario.ACTIVO, fechaValidacion: new Date() })
    );
    res.json({ message: 'Usuario aprobado' });
  })
);

router.post(
  '/admin/users/:id/reject',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(User).update({ id: userId }, { estadoRegistro: EstadoRegistroUsuario.RECHAZADO })
    );
    res.json({ message: 'Usuario rechazado' });
  })
);

// ========================
// CATEGORIES
// ========================

router.get(
  '/categories',
  asyncHandler(async (req: AuthRequest, res) => {
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });
    const categories = await runWithContext({ tenantId }, (manager) =>
      manager.getRepository(Category).find({ where: { tenantId } })
    );
    res.json(categories);
  })
);

router.get(
  '/catalog/category-types',
  asyncHandler(async (_req, res) => {
    res.json(Object.values(CategoriaTipo));
  })
);

router.post(
  '/categories',
  authMiddleware,
  requireRole(['admin', RolUsuario.OFERENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const type = req.body.type as CategoriaTipo;
    const name = req.body.name as string;
    const slug = req.body.slug as string | undefined;
    if (!name || !type) return res.status(400).json({ message: 'Nombre y tipo son obligatorios' });
    const tenantId = req.auth?.isAdminGlobal ? req.body.tenantId || req.auth?.tenantId : req.auth?.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'tenantId es obligatorio' });
    const normalizedSlug = (slug || name).toLowerCase().replace(/\s+/g, '-');
    const category = await runWithContext(
      { tenantId, isAdmin: req.auth?.isAdminGlobal },
      (manager) => manager.getRepository(Category).save({ tenantId, name, slug: normalizedSlug, type })
    );
    res.json(category);
  })
);

// ========================
// BUSINESSES
// ========================

router.get(
  '/businesses',
  asyncHandler(async (req: AuthRequest, res) => {
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });
    const tenant = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Tenant).findOne({ where: { id: tenantId, estado: TenantEstado.ACTIVO } })
    );
    if (!tenant) return res.json([]);
    const businesses = await runWithContext({ tenantId }, (manager) =>
      manager.getRepository(Business).find({ where: { tenantId, status: NegocioEstado.ACTIVO } })
    );
    res.json(businesses);
  })
);

router.post(
  '/businesses',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.auth!.user!;
    ensureUserReady(user);
    const tenant = await ensureTenantIsActive(user.tenantId!);
    const { name, type, description, address, city, region, priceRange, latitude, longitude } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre es obligatorio' });
    const business = await runWithContext({ tenantId: tenant.id }, (manager) =>
      manager.getRepository(Business).save({
        tenantId: tenant.id,
        ownerId: user.id,
        name,
        type: (type as NegocioTipo) || NegocioTipo.RESTAURANTE,
        description: description || null,
        address: address || null,
        city: city || null,
        region: region || null,
        priceRange: (priceRange as NegocioRangoPrecio) || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        status: NegocioEstado.INACTIVO,
      })
    );
    res.json({ business });
  })
);

router.get(
  '/admin/businesses/pending',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (_req, res) => {
    const businesses = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).find({ where: { status: NegocioEstado.INACTIVO } })
    );
    res.json(businesses);
  })
);

router.post(
  '/admin/businesses/:id/approve',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).update({ id }, { status: NegocioEstado.ACTIVO })
    );
    res.json({ message: 'Negocio aprobado' });
  })
);

// ========================
// PUBLICATIONS
// ========================

router.post(
  '/businesses/:id/publications',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.auth!.user!;
    ensureUserReady(user);
    const tenantId = user.tenantId!;
    const { id } = req.params;
    const { titulo, contenido, tipo, fechaFinVigencia, categoryIds = [] } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ message: 'Título y contenido son obligatorios' });

    const publication = await runWithContext({ tenantId }, async (manager) => {
      const business = await manager
        .getRepository(Business)
        .findOne({ where: { id, tenantId, ownerId: user.id, status: NegocioEstado.ACTIVO } });
      if (!business) throw new Error('Negocio no encontrado o inactivo');

      const validCategoryIds: string[] = [];
      if (categoryIds.length) {
        const categories = await manager
          .getRepository(Category)
          .find({ where: { id: In(categoryIds as string[]), tenantId: business.tenantId } });
        if (categories.length !== categoryIds.length) {
          throw new Error('Alguna categoría no existe en este tenant');
        }
        validCategoryIds.push(...categories.map((c) => c.id));
      }

      const publicationRepo = manager.getRepository(Publication);
      const record = publicationRepo.create({
        businessId: business.id,
        authorId: user.id,
        titulo,
        contenido,
        tipo: (tipo as PublicacionTipo) || PublicacionTipo.AVISO_GENERAL,
        estado: PublicacionEstado.PENDIENTE_VALIDACION,
        fechaFinVigencia: fechaFinVigencia ? new Date(fechaFinVigencia) : null,
      });
      const saved = await publicationRepo.save(record);
      if (validCategoryIds.length) {
        const links = validCategoryIds.map((cid) => ({ publicationId: saved.id, categoryId: cid }));
        await manager.getRepository(PublicationCategory).save(links);
      }
      return saved;
    });

    res.json({ publication });
  })
);

router.get(
  '/businesses/:id/publications',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });
    const includeAll = req.auth?.isAdminGlobal || req.auth?.user?.rol === RolUsuario.OFERENTE;
    const statusFilter = includeAll ? undefined : PublicacionEstado.PUBLICADA;
    const businessId = req.params.id;

    const publications = await runWithContext({ tenantId, isAdmin: req.auth?.isAdminGlobal }, async (manager) => {
      const repo = manager.getRepository(Publication);
      const rows = await repo.find({
        where: {
          businessId,
          ...(statusFilter ? { estado: statusFilter } : {}),
        },
        order: { fechaPublicacion: 'DESC', fechaCreacion: 'DESC' },
      });
      if (!rows.length) return [];
      const linkRepo = manager.getRepository(PublicationCategory);
      const links = await linkRepo.find({ where: { publicationId: In(rows.map((p) => p.id)) } });
      const grouped = links.reduce<Record<string, string[]>>((acc, link) => {
        acc[link.publicationId] = acc[link.publicationId] || [];
        acc[link.publicationId].push(link.categoryId);
        return acc;
      }, {});
      return rows.map((p) => ({ ...p, categoryIds: grouped[p.id] || [] }));
    });
    res.json(publications);
  })
);

router.get(
  '/admin/publications/pending',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (_req, res) => {
    const pending = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Publication).find({ where: { estado: PublicacionEstado.PENDIENTE_VALIDACION } })
    );
    res.json(pending);
  })
);

router.post(
  '/admin/publications/:id/approve',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const adminId = req.auth!.admin!.id;
    await runWithContext({ isAdmin: true }, async (manager) => {
      const repo = manager.getRepository(Publication);
      const publication = await repo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');
      await repo.update({ id: publicationId }, { estado: PublicacionEstado.PUBLICADA, fechaPublicacion: new Date() });
      await manager.getRepository(PublicationReview).save({
        publicationId,
        adminId,
        resultado: RevisionResultado.APROBADA,
        comentarios: null,
      });
    });
    res.json({ message: 'Publicación aprobada' });
  })
);

router.post(
  '/admin/publications/:id/reject',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const adminId = req.auth!.admin!.id;
    const { comentarios } = req.body;
    await runWithContext({ isAdmin: true }, async (manager) => {
      const repo = manager.getRepository(Publication);
      const publication = await repo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');
      await repo.update({ id: publicationId }, { estado: PublicacionEstado.RECHAZADA });
      await manager.getRepository(PublicationReview).save({
        publicationId,
        adminId,
        resultado: RevisionResultado.RECHAZADA,
        comentarios: comentarios || null,
      });
    });
    res.json({ message: 'Publicación rechazada' });
  })
);

router.post(
  '/publications/:id/visit',
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });
    await runWithContext({ tenantId }, async (manager) => {
      const repo = manager.getRepository(Publication);
      const publication = await repo.findOne({ where: { id: publicationId, estado: PublicacionEstado.PUBLICADA } });
      if (!publication) throw new Error('Publicación no encontrada o no publicada');
      await repo.update({ id: publicationId }, { visitas: publication.visitas + 1 });
    });
    res.json({ message: 'Visita registrada' });
  })
);

// Manejo de errores por defecto para evitar que el proceso caiga por excepciones no capturadas
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error in route', err);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

export default router;

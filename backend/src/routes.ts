import { NextFunction, Request, Response, Router } from 'express';
import { registerUser, loginUser } from './services/auth-service.js';
import { AuthRequest, authMiddleware, optionalAuthMiddleware, requireRole } from './middleware/auth.js';
import { EstadoRegistroUsuario, RolUsuario, User } from './entities/User.js';
import { Tenant, TenantEstado } from './entities/Tenant.js';
import { Category, CategoriaTipo } from './entities/Category.js';
import { Business, NegocioEstado, NegocioTipo } from './entities/Business.js';
import { Publication, PublicacionEstado, PublicacionTipo } from './entities/Publication.js';
import { Media, MediaTipo } from './entities/Media.js';
import { PublicationCategory } from './entities/PublicationCategory.js';
import { PublicationReview, RevisionResultado } from './entities/PublicationReview.js';
import { Comment, ComentarioEstado } from './entities/Comment.js';
import { ReservationTable, MesaEstado } from './entities/ReservationTable.js';
import { Reservation, ReservaEstado, ReservaHorario } from './entities/Reservation.js';
import { ReservationTableLink } from './entities/ReservationTableLink.js';
import { EntityManager, In, LessThan } from 'typeorm';
import { runWithContext } from './utils/rls.js';

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const getTenantIdFromRequest = (req: AuthRequest) => {
  const fromQuery = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
  const header = req.headers['x-tenant-id'];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  return fromQuery || (typeof fromHeader === 'string' ? fromHeader : undefined) || req.auth?.tenantId || null;
};

const resolveTenantScope = (
  req: AuthRequest,
  options: { allowPublic?: boolean; optional?: boolean; allowAdminAll?: boolean } = {}
) => {
  const { allowPublic = false, optional = false, allowAdminAll = true } = options;
  const requested = getTenantIdFromRequest(req);
  const authTenant = req.auth?.tenantId ?? null;
  const isAdmin = !!req.auth?.isAdminGlobal;

  if (isAdmin) {
    if (requested) return requested;
    if (allowAdminAll) return null; // admin puede ver todo sin aislar por tenant
    if (!optional) throw new Error('tenantId es requerido');
    return null;
  }

  if (authTenant) {
    if (requested && requested !== authTenant) {
      throw new Error('No puedes operar sobre otro tenant');
    }
    return authTenant;
  }

  if (allowPublic) {
    if (requested) return requested;
    if (!optional) throw new Error('tenantId es requerido');
    return null;
  }

  throw new Error('tenantId es requerido');
};

const ensureTenantIsActive = async (tenantId: string, options: { allowAutoActivate?: boolean } = {}) => {
  const { allowAutoActivate = false } = options;
  const tenant = await runWithContext({ isAdmin: true }, (manager) =>
    manager.getRepository(Tenant).findOne({ where: { id: tenantId } })
  );
  if (!tenant) throw new Error('Tenant no encontrado');
  if (tenant.estado !== TenantEstado.ACTIVO) {
    if (allowAutoActivate && tenant.estado === TenantEstado.PENDIENTE_VALIDACION) {
      await runWithContext({ isAdmin: true }, (manager) =>
        manager.getRepository(Tenant).update({ id: tenantId }, { estado: TenantEstado.ACTIVO })
      );
      return { ...tenant, estado: TenantEstado.ACTIVO };
    }
    throw new Error('El tenant debe estar activo');
  }
  return tenant;
};

const ensureUserReady = (user: User, options: { requireTenant?: boolean } = {}) => {
  const { requireTenant = true } = options;
  if (user.estadoRegistro !== EstadoRegistroUsuario.ACTIVO) {
    throw new HttpError(403, 'Tu cuenta aún no está activa');
  }
  if (requireTenant && !user.tenantId) {
    throw new HttpError(400, 'Debes tener un tenant asignado');
  }
};

const parseNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const parsePositiveInt = (value: unknown, fallback = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

const parseTimeToMinutes = (value: unknown): number | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const normalizeTimeValue = (value: unknown): string | null => {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const RESERVATION_DURATION_MINUTES = 60;
const DEFAULT_OPERATING_DAYS = [1, 2, 3, 4, 5, 6, 0];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateValue = (value: unknown): string | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!ISO_DATE_PATTERN.test(raw)) return null;
  const [yearRaw, monthRaw, dayRaw] = raw.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseDateToKey = (value: unknown): number | null => {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  const [yearRaw, monthRaw, dayRaw] = normalized.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return year * 10000 + month * 100 + day;
};

const getWeekdayFromDate = (value: string): number | null => {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  const [yearRaw, monthRaw, dayRaw] = normalized.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const parseBoolean = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return null;
};

const normalizeOperatingDays = (value: unknown): number[] | null => {
  if (value === null || value === undefined) return null;
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [value];
  const normalized = values
    .map((item) => Number(item))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return Array.from(new Set(normalized));
};

const normalizeHolidayDates = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const normalized = values.map(normalizeDateValue).filter(Boolean) as string[];
  return Array.from(new Set(normalized)).sort();
};

const normalizeVacationRanges = (
  value: unknown
): { start: string; end: string; label?: string | null }[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const start = normalizeDateValue((item as { start?: unknown }).start);
      const end = normalizeDateValue((item as { end?: unknown }).end);
      if (!start || !end) return null;
      const startKey = parseDateToKey(start);
      const endKey = parseDateToKey(end);
      if (startKey === null || endKey === null || startKey > endKey) return null;
      const labelRaw = typeof (item as { label?: unknown }).label === 'string' ? (item as { label?: string }).label : '';
      const label = labelRaw ? labelRaw.trim().slice(0, 160) : '';
      return label ? { start, end, label } : { start, end };
    })
    .filter(Boolean) as { start: string; end: string; label?: string | null }[];
};

const isDateWithinRange = (dateKey: number, start: string | null, end: string | null): boolean => {
  const startKey = parseDateToKey(start);
  const endKey = parseDateToKey(end);
  if (startKey === null && endKey === null) return true;
  if (startKey !== null && dateKey < startKey) return false;
  if (endKey !== null && dateKey > endKey) return false;
  return true;
};

const isDateWithinBusinessAvailability = (business: Business, date: string): boolean => {
  const normalizedDate = normalizeDateValue(date);
  if (!normalizedDate) return false;
  const dateKey = parseDateToKey(normalizedDate);
  if (dateKey === null) return false;
  const weekday = getWeekdayFromDate(normalizedDate);
  if (weekday === null) return false;

  const operatingDays = normalizeOperatingDays(business.operatingDays);
  if (Array.isArray(operatingDays)) {
    if (!operatingDays.length) return false;
    if (!operatingDays.includes(weekday)) return false;
  }

  if (Array.isArray(business.holidayDates) && business.holidayDates.includes(normalizedDate)) {
    return false;
  }

  if (Array.isArray(business.vacationRanges) && business.vacationRanges.length) {
    const isVacation = business.vacationRanges.some((range) => {
      const startKey = parseDateToKey(range?.start);
      const endKey = parseDateToKey(range?.end);
      if (startKey === null || endKey === null) return false;
      return dateKey >= startKey && dateKey <= endKey;
    });
    if (isVacation) return false;
  }

  if (business.temporaryClosureActive) {
    const start = business.temporaryClosureStart || null;
    const end = business.temporaryClosureEnd || null;
    if (isDateWithinRange(dateKey, start, end)) return false;
  }

  return true;
};

const buildReservationWindow = (minutes: number) => {
  const start = Math.max(0, minutes);
  const end = Math.min(24 * 60, minutes + RESERVATION_DURATION_MINUTES);
  return { start, end };
};

const isReservationTimeOverlapping = (requestedMinutes: number, candidateTime: string): boolean => {
  const candidateMinutes = parseTimeToMinutes(candidateTime);
  if (candidateMinutes === null) return false;
  const requestedWindow = buildReservationWindow(requestedMinutes);
  const candidateWindow = buildReservationWindow(candidateMinutes);
  return requestedWindow.start < candidateWindow.end && candidateWindow.start < requestedWindow.end;
};

const getReservedTableIdsForDateTime = async (
  manager: EntityManager,
  businessId: string,
  date: string,
  time: string
) => {
  const targetMinutes = parseTimeToMinutes(time);
  if (targetMinutes === null) return new Set<string>();
  const reservationRepo = manager.getRepository(Reservation);
  const reservations = await reservationRepo.find({
    where: { businessId, date, status: In([ReservaEstado.CONFIRMADA, ReservaEstado.COMPLETADA]) },
    select: { id: true, time: true },
  });
  if (!reservations.length) return new Set<string>();

  const overlappingIds = reservations
    .filter((reservation) => isReservationTimeOverlapping(targetMinutes, reservation.time))
    .map((reservation) => String(reservation.id));

  if (!overlappingIds.length) return new Set<string>();

  const links = await manager.getRepository(ReservationTableLink).find({
    where: { reservationId: In(overlappingIds) },
  });

  return new Set(links.map((link) => String(link.tableId)));
};

const isTimeWithinBusinessHours = (business: Business, time: string): boolean => {
  const timeMinutes = parseTimeToMinutes(time);
  if (timeMinutes === null) return false;

  const morningStart = parseTimeToMinutes(business.morningStart);
  const morningEnd = parseTimeToMinutes(business.morningEnd);
  const afternoonStart = parseTimeToMinutes(business.afternoonStart);
  const afternoonEnd = parseTimeToMinutes(business.afternoonEnd);

  const hasMorningRange = morningStart !== null && morningEnd !== null;
  const hasAfternoonRange = afternoonStart !== null && afternoonEnd !== null;

  if (!hasMorningRange && !hasAfternoonRange) return true;

  const inMorning = hasMorningRange && timeMinutes >= morningStart! && timeMinutes <= morningEnd!;
  const inAfternoon = hasAfternoonRange && timeMinutes >= afternoonStart! && timeMinutes <= afternoonEnd!;
  return Boolean(inMorning || inAfternoon);
};

const normalizeReservationSchedule = (value: unknown): ReservaHorario => {
  const raw = String(value || '').trim().toUpperCase();
  const allowed = Object.values(ReservaHorario);
  return (allowed.includes(raw as ReservaHorario) ? raw : ReservaHorario.ALMUERZO) as ReservaHorario;
};

const generateReservationCode = () => {
  const random = Math.floor(100 + Math.random() * 900);
  return `RSV-${Date.now().toString(36).toUpperCase()}-${random}`;
};

const normalizePublicationExtras = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const nombre = String((item as { nombre?: unknown }).nombre || '').trim();
      const precioRaw = (item as { precio?: unknown }).precio;
      const precio =
        precioRaw === undefined || precioRaw === null || precioRaw === ''
          ? null
          : Number.parseFloat(String(precioRaw));
      const imagenUrl = typeof (item as { imagenUrl?: unknown }).imagenUrl === 'string'
        ? String((item as { imagenUrl?: string }).imagenUrl).trim()
        : '';
      if (!nombre && precio === null && !imagenUrl) return null;
      if (!nombre) throw new Error('El nombre del agregado es obligatorio');
      if (precio === null || !Number.isFinite(precio) || precio < 0) {
        throw new Error('Precio inválido en agregados');
      }
      return {
        nombre: nombre.slice(0, 120),
        precio,
        imagenUrl: imagenUrl || null,
      };
    })
    .filter(Boolean) as { nombre: string; precio: number; imagenUrl?: string | null }[];
  if (normalized.length > 4) {
    throw new Error('Solo puedes agregar hasta 4 adicionales');
  }
  return normalized;
};

const normalizeMediaItems = (items?: Media[]) => {
  if (!Array.isArray(items)) return [];
  return [...items]
    .filter((item) => item?.url)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((item) => ({
      url: item.url,
      tipo: item.tipo,
      orden: item.orden ?? null,
    }));
};

const fetchPublicationRatingSummary = async (
  manager: EntityManager,
  publicationIds: string[],
  userId?: string | null
) => {
  if (!publicationIds.length) {
    return {
      summaryByPublication: {} as Record<string, { ratingAverage: number | null; ratingCount: number }>,
      userRatingsByPublication: {} as Record<string, number>,
    };
  }

  const ratingRows = await manager
    .getRepository(Comment)
    .createQueryBuilder('c')
    .select('c.publicationId', 'publicationId')
    .addSelect('AVG(c.calificacion)', 'ratingAverage')
    .addSelect('COUNT(*)', 'ratingCount')
    .where('c.publicationId IN (:...ids)', { ids: publicationIds })
    .andWhere('c.esCalificacion = true')
    .andWhere('c.estado = :estado', { estado: ComentarioEstado.VISIBLE })
    .groupBy('c.publicationId')
    .getRawMany();

  const summaryByPublication = ratingRows.reduce<Record<string, { ratingAverage: number | null; ratingCount: number }>>(
    (acc, row) => {
      const id = String(row.publicationId);
      const avg = parseNumeric(row.ratingAverage ?? row.ratingaverage);
      const countValue = parseNumeric(row.ratingCount ?? row.ratingcount);
      const count = Number.isFinite(countValue ?? NaN) ? Math.max(0, Math.floor(countValue as number)) : 0;
      acc[id] = {
        ratingAverage: avg,
        ratingCount: count,
      };
      return acc;
    },
    {}
  );

  let userRatingsByPublication: Record<string, number> = {};
  if (userId) {
    const userRows = await manager
      .getRepository(Comment)
      .createQueryBuilder('c')
      .select('c.publicationId', 'publicationId')
      .addSelect('c.calificacion', 'calificacion')
      .where('c.publicationId IN (:...ids)', { ids: publicationIds })
      .andWhere('c.userId = :userId', { userId })
      .andWhere('c.esCalificacion = true')
      .andWhere('c.estado = :estado', { estado: ComentarioEstado.VISIBLE })
      .getRawMany();

    userRatingsByPublication = userRows.reduce<Record<string, number>>((acc, row) => {
      const id = String(row.publicationId);
      const value = parseNumeric(row.calificacion);
      if (Number.isFinite(value ?? NaN)) {
        acc[id] = Math.max(1, Math.min(5, Math.floor(value as number)));
      }
      return acc;
    }, {});
  }

  return { summaryByPublication, userRatingsByPublication };
};

const BUSINESS_AMENITIES = new Set([
  'PET_FRIENDLY',
  'TERRAZA',
  'AREA_FUMADORES',
  'SALA_REUNIONES',
  'CYBER',
  'ENCHUFES',
]);

const normalizeAmenities = (raw: unknown) => {
  const values = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
  const normalized = values
    .map((value) => String(value).trim().toUpperCase())
    .filter((value) => BUSINESS_AMENITIES.has(value));
  return Array.from(new Set(normalized));
};

const categoriaTiposCafe: CategoriaTipo[] = [
  CategoriaTipo.ESPRESSO,
  CategoriaTipo.AMERICANO,
  CategoriaTipo.CAPPUCCINO,
  CategoriaTipo.LATTE,
  CategoriaTipo.MOCHA,
  CategoriaTipo.FLAT_WHITE,
  CategoriaTipo.MACCHIATO,
  CategoriaTipo.COLD_BREW,
  CategoriaTipo.AFFOGATO,
];

const categoriaTiposComida: CategoriaTipo[] = [
  CategoriaTipo.PIZZA,
  CategoriaTipo.SUSHI,
  CategoriaTipo.HAMBURGUESAS,
  CategoriaTipo.PASTAS,
  CategoriaTipo.COMIDA_MEXICANA,
  CategoriaTipo.COMIDA_CHINA,
  CategoriaTipo.COMIDA_INDIAN,
  CategoriaTipo.POSTRES,
  CategoriaTipo.SANDWICHES,
  CategoriaTipo.ENSALADAS,
];

const categoriaTiposBar: CategoriaTipo[] = [
  CategoriaTipo.CERVEZAS,
  CategoriaTipo.VINOS,
  CategoriaTipo.COCTELES,
  CategoriaTipo.DESTILADOS,
  CategoriaTipo.BEBIDAS_SIN_ALCOHOL,
  CategoriaTipo.TAPAS,
  CategoriaTipo.PICOTEO,
];

const categoriaTiposFoodtruck: CategoriaTipo[] = [
  CategoriaTipo.HOT_DOGS,
  CategoriaTipo.TACOS,
  CategoriaTipo.BURRITOS,
  CategoriaTipo.AREPAS,
  CategoriaTipo.EMPANADAS,
  CategoriaTipo.PAPAS_FRITAS,
  CategoriaTipo.WRAPS,
  CategoriaTipo.BROCHETAS,
  CategoriaTipo.HELADOS,
];

const categoriasPermitidasPorNegocio: Partial<Record<NegocioTipo, CategoriaTipo[]>> = {
  [NegocioTipo.CAFETERIA]: categoriaTiposCafe,
  [NegocioTipo.RESTAURANTE]: categoriaTiposComida,
  [NegocioTipo.BAR]: categoriaTiposBar,
  [NegocioTipo.FOODTRUCK]: categoriaTiposFoodtruck,
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
      return res.status(400).json({ message: 'Tu cuenta aún no está activa' });
    }
    const { nombre, dominio } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre es obligatorio' });
    const tenant = await runWithContext({ isAdmin: true }, async (manager) => {
      const repo = manager.getRepository(Tenant);
      const created = repo.create({
        nombre,
        dominio: dominio || null,
        estado: TenantEstado.ACTIVO,
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
    let tenantId: string;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
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
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }

    const requester = req.auth;
    const isAdmin = !!requester?.isAdminGlobal;
    const owner = requester?.user;
    const isOferente = owner?.rol === RolUsuario.OFERENTE;
    const mine = isOferente || (typeof req.query.mine === 'string' && req.query.mine === 'true' && !!owner);
    if (!tenantId && !isAdmin) return res.status(400).json({ message: 'tenantId es requerido' });

    if (tenantId) {
      const tenant = await runWithContext({ isAdmin: true }, (manager) =>
        manager.getRepository(Tenant).findOne({ where: { id: tenantId, estado: TenantEstado.ACTIVO } })
      );
      if (!tenant) return res.json([]);
    }

    const businesses = await runWithContext({ tenantId: tenantId ?? undefined, isAdmin }, (manager) =>
      manager.getRepository(Business).find({
        where: {
          ...(tenantId ? { tenantId } : {}),
          ...(mine ? { ownerId: owner!.id } : {}),
          ...(mine || isAdmin ? {} : { status: NegocioEstado.ACTIVO }),
        },
        order: { createdAt: 'DESC' },
      })
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
    ensureUserReady(user, { requireTenant: false });
    const {
      name,
      type,
      description,
      address,
      city,
      region,
      amenities,
      imageUrl,
      phone,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      operatingDays,
      holidayDates,
      vacationRanges,
      temporaryClosureActive,
      temporaryClosureStart,
      temporaryClosureEnd,
      temporaryClosureMessage,
    } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre es obligatorio' });

    let tenant = null as Tenant | null;
    if (user.tenantId) {
      tenant = await ensureTenantIsActive(user.tenantId, { allowAutoActivate: true });
    } else {
      const tenantName = String(name || `Tenant de ${user.nombre}`).slice(0, 255);
      tenant = await runWithContext({ isAdmin: true }, async (manager) => {
        const repo = manager.getRepository(Tenant);
        const created = repo.create({
          nombre: tenantName,
          dominio: null,
          estado: TenantEstado.ACTIVO,
          creadorOferenteId: user.id,
          validadorAdminId: null,
        });
        const saved = await repo.save(created);
        await manager.getRepository(User).update({ id: user.id }, { tenantId: saved.id });
        return saved;
      });
      user.tenantId = tenant.id;
    }

    const tenantId = tenant?.id;
    if (!tenantId) throw new Error('No se pudo crear o asociar un tenant');

    const business = await runWithContext({ tenantId }, (manager) =>
      manager.getRepository(Business).save({
        tenantId,
        ownerId: user.id,
        name,
        type: (type as NegocioTipo) || NegocioTipo.RESTAURANTE,
        description: description || null,
        phone: phone ? String(phone).slice(0, 30) : null,
        imageUrl: imageUrl || null,
        address: address || null,
        city: city || null,
        region: region || null,
        amenities: normalizeAmenities(amenities),
        morningStart: normalizeTimeValue(morningStart),
        morningEnd: normalizeTimeValue(morningEnd),
        afternoonStart: normalizeTimeValue(afternoonStart),
        afternoonEnd: normalizeTimeValue(afternoonEnd),
        operatingDays: normalizeOperatingDays(operatingDays) ?? DEFAULT_OPERATING_DAYS,
        holidayDates: normalizeHolidayDates(holidayDates),
        vacationRanges: normalizeVacationRanges(vacationRanges),
        temporaryClosureActive: parseBoolean(temporaryClosureActive) ?? false,
        temporaryClosureStart: normalizeDateValue(temporaryClosureStart),
        temporaryClosureEnd: normalizeDateValue(temporaryClosureEnd),
        temporaryClosureMessage:
          typeof temporaryClosureMessage === 'string' ? temporaryClosureMessage.trim().slice(0, 200) : null,
        status: NegocioEstado.ACTIVO,
      })
    );
    res.json({ business, tenant });
  })
);

router.get(
  '/businesses/:id',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true, optional: true, allowAdminAll: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    const requester = req.auth;
    const isAdmin = !!requester?.isAdminGlobal;
    if (!tenantId && !isAdmin) return res.status(400).json({ message: 'tenantId es requerido' });
    const businessId = req.params.id;

    const business = await runWithContext({ tenantId, isAdmin }, async (manager) => {
      const record = await manager.getRepository(Business).findOne({ where: { id: businessId } });
      if (!record) return null;
      if (tenantId && record.tenantId !== tenantId) return null;
      const isOwner = requester?.user && record.ownerId === requester.user.id;
      if (!isAdmin && !isOwner && record.status !== NegocioEstado.ACTIVO) return null;

      const owner = await manager.getRepository(User).findOne({
        where: { id: record.ownerId },
        select: { email: true, nombre: true },
      });

      return {
        ...record,
        contactEmail: owner?.email || null,
        ownerName: owner?.nombre || null,
      };
    });

    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json(business);
  })
);

router.put(
  '/businesses/:id',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const businessId = req.params.id;
    const requester = req.auth!;
    const isAdmin = Boolean(requester.admin);
    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== requester.user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para editar este negocio' });
    }

    const {
      name,
      description,
      address,
      city,
      region,
      amenities,
      imageUrl,
      phone,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      operatingDays,
      holidayDates,
      vacationRanges,
      temporaryClosureActive,
      temporaryClosureStart,
      temporaryClosureEnd,
      temporaryClosureMessage,
    } = req.body;
    const updates: Partial<Business> = {};
    if (name !== undefined) updates.name = String(name).slice(0, 255);
    if (description !== undefined) updates.description = description || null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl || null;
    if (phone !== undefined) updates.phone = phone ? String(phone).slice(0, 30) : null;
    if (address !== undefined) updates.address = address || null;
    if (city !== undefined) updates.city = city || null;
    if (region !== undefined) updates.region = region || null;
    if (amenities !== undefined) updates.amenities = normalizeAmenities(amenities);
    if (morningStart !== undefined) updates.morningStart = normalizeTimeValue(morningStart);
    if (morningEnd !== undefined) updates.morningEnd = normalizeTimeValue(morningEnd);
    if (afternoonStart !== undefined) updates.afternoonStart = normalizeTimeValue(afternoonStart);
    if (afternoonEnd !== undefined) updates.afternoonEnd = normalizeTimeValue(afternoonEnd);
    if (operatingDays !== undefined) updates.operatingDays = normalizeOperatingDays(operatingDays);
    if (holidayDates !== undefined) updates.holidayDates = normalizeHolidayDates(holidayDates);
    if (vacationRanges !== undefined) updates.vacationRanges = normalizeVacationRanges(vacationRanges);
    if (temporaryClosureActive !== undefined) {
      const parsed = parseBoolean(temporaryClosureActive);
      if (parsed !== null) updates.temporaryClosureActive = parsed;
    }
    if (temporaryClosureStart !== undefined) updates.temporaryClosureStart = normalizeDateValue(temporaryClosureStart);
    if (temporaryClosureEnd !== undefined) updates.temporaryClosureEnd = normalizeDateValue(temporaryClosureEnd);
    if (temporaryClosureMessage !== undefined) {
      updates.temporaryClosureMessage =
        typeof temporaryClosureMessage === 'string' ? temporaryClosureMessage.trim().slice(0, 200) : null;
    }

    await runWithContext({ tenantId: business.tenantId, isAdmin }, (manager) =>
      manager.getRepository(Business).update({ id: businessId }, updates)
    );

    const updated = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    res.json(updated);
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
// RESERVAS Y MESAS
// ========================

router.get(
  '/businesses/:id/tables',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const businessId = req.params.id;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date : '';
    const timeQuery = typeof req.query.time === 'string' ? req.query.time : '';
    const requester = req.auth;
    const isAdmin = !!requester?.isAdminGlobal;
    const owner = requester?.user;

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });

    const isOwner = owner && business.ownerId === owner.id;
    if (!isAdmin && !isOwner && business.status !== NegocioEstado.ACTIVO) {
      return res.status(404).json({ message: 'Negocio no disponible' });
    }

    const normalizedDate = normalizeDateValue(dateQuery);
    const normalizedTime = normalizeTimeValue(timeQuery);
    const shouldResolveAvailability = Boolean(normalizedDate && normalizedTime);

    const tables = await runWithContext({ tenantId: business.tenantId, isAdmin }, async (manager) => {
      const tableRepo = manager.getRepository(ReservationTable);
      await tableRepo.update(
        { businessId: business.id, status: MesaEstado.OCUPADA, occupiedUntil: LessThan(new Date()) },
        { status: MesaEstado.DISPONIBLE, occupiedUntil: null }
      );

      const list = await tableRepo.find({
        where: { businessId: business.id },
        order: { id: 'ASC' },
      });

      if (!shouldResolveAvailability || !normalizedDate || !normalizedTime) return list;

      const reservedTableIds = await getReservedTableIdsForDateTime(
        manager,
        String(business.id),
        normalizedDate,
        normalizedTime
      );

      return list.map((table) => {
        const isManualOccupied = table.status === MesaEstado.OCUPADA && !table.occupiedUntil;
        const baseStatus =
          table.status === MesaEstado.MANTENIMIENTO || isManualOccupied ? table.status : MesaEstado.DISPONIBLE;
        let availabilityStatus = baseStatus;
        if (baseStatus === MesaEstado.DISPONIBLE && reservedTableIds.has(String(table.id))) {
          availabilityStatus = MesaEstado.OCUPADA;
        }
        return {
          ...table,
          availabilityStatus,
          isAvailableForTime: availabilityStatus === MesaEstado.DISPONIBLE,
        };
      });
    });

    res.json(tables);
  })
);

router.post(
  '/businesses/:id/tables',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const businessId = req.params.id;
    const requester = req.auth!;
    const isAdmin = !!requester.isAdminGlobal;
    const user = requester.user;

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para este negocio' });
    }

    const label = String(req.body?.label || '').trim() || `Mesa ${Date.now()}`;
    const seats = parsePositiveInt(req.body?.seats, 1);
    const statusRaw = String(req.body?.status || MesaEstado.DISPONIBLE).toUpperCase();
    const status = Object.values(MesaEstado).includes(statusRaw as MesaEstado)
      ? (statusRaw as MesaEstado)
      : MesaEstado.DISPONIBLE;

    const created = await runWithContext({ tenantId: business.tenantId, isAdmin }, (manager) => {
      const repo = manager.getRepository(ReservationTable);
      const record = repo.create({
        businessId: business.id,
        label,
        seats,
        status,
      });
      return repo.save(record);
    });

    res.json(created);
  })
);

router.post(
  '/businesses/:id/tables/batch',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const businessId = req.params.id;
    const requester = req.auth!;
    const isAdmin = !!requester.isAdminGlobal;
    const user = requester.user;

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para este negocio' });
    }

    const count = parsePositiveInt(req.body?.count, 1);
    const seats = parsePositiveInt(req.body?.seats, 1);
    const statusRaw = String(req.body?.status || MesaEstado.DISPONIBLE).toUpperCase();
    const status = Object.values(MesaEstado).includes(statusRaw as MesaEstado)
      ? (statusRaw as MesaEstado)
      : MesaEstado.DISPONIBLE;
    const prefix = String(req.body?.prefix || 'Mesa').trim() || 'Mesa';

    const created = await runWithContext({ tenantId: business.tenantId, isAdmin }, async (manager) => {
      const repo = manager.getRepository(ReservationTable);
      const existingCount = await repo.count({ where: { businessId: business.id } });
      const startIndex = existingCount + 1;
      const records = Array.from({ length: count }, (_, index) =>
        repo.create({
          businessId: business.id,
          label: `${prefix} ${startIndex + index}`,
          seats,
          status,
        })
      );
      return repo.save(records);
    });

    res.json(created);
  })
);

router.put(
  '/tables/:id',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const tableId = req.params.id;
    const requester = req.auth!;
    const isAdmin = !!requester.isAdminGlobal;
    const user = requester.user;

    const table = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(ReservationTable).findOne({ where: { id: tableId } })
    );
    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' });

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: table.businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta mesa' });
    }

    const updates: Partial<ReservationTable> = {};
    if (req.body?.label !== undefined) {
      updates.label = String(req.body.label || '').trim() || table.label;
    }
    if (req.body?.seats !== undefined) {
      updates.seats = parsePositiveInt(req.body.seats, table.seats);
    }
    if (req.body?.status !== undefined) {
      const statusRaw = String(req.body.status || '').toUpperCase();
      if (Object.values(MesaEstado).includes(statusRaw as MesaEstado)) {
        updates.status = statusRaw as MesaEstado;
        if (updates.status !== MesaEstado.OCUPADA) {
          updates.occupiedUntil = null;
        }
      }
    }
    updates.updatedAt = new Date();

    await runWithContext({ tenantId: business.tenantId, isAdmin }, (manager) =>
      manager.getRepository(ReservationTable).update({ id: tableId }, updates)
    );

    const updated = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(ReservationTable).findOne({ where: { id: tableId } })
    );
    res.json(updated);
  })
);

router.delete(
  '/tables/:id',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const tableId = req.params.id;
    const requester = req.auth!;
    const isAdmin = !!requester.isAdminGlobal;
    const user = requester.user;

    const table = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(ReservationTable).findOne({ where: { id: tableId } })
    );
    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' });

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: table.businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta mesa' });
    }

    try {
      await runWithContext({ tenantId: business.tenantId, isAdmin }, (manager) =>
        manager.getRepository(ReservationTable).delete({ id: tableId })
      );
      res.json({ message: 'Mesa eliminada' });
    } catch (err) {
      res.status(400).json({ message: 'No se pudo eliminar la mesa. Puede tener reservas asociadas.' });
    }
  })
);

router.get(
  '/businesses/:id/reservations',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const businessId = req.params.id;
    const requester = req.auth!;
    const isAdmin = Boolean(requester.admin);

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== requester.user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estas reservas' });
    }

    const list = await runWithContext({ tenantId: business.tenantId, isAdmin }, async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const reservations = await reservationRepo.find({
        where: { businessId: business.id },
        order: { createdAt: 'DESC' },
      });
      if (!reservations.length) return [];

      const reservationIds = reservations.map((item) => String(item.id));
      const links = await manager.getRepository(ReservationTableLink).find({
        where: { reservationId: In(reservationIds) },
      });
      const linksByReservation = links.reduce<Record<string, ReservationTableLink[]>>((acc, link) => {
        const key = String(link.reservationId);
        acc[key] = acc[key] || [];
        acc[key].push(link);
        return acc;
      }, {});

      const userIds = reservations
        .map((reservation) => reservation.userId)
        .filter(Boolean)
        .map((id) => String(id));
      const users = userIds.length
        ? await manager.getRepository(User).find({ where: { id: In(userIds) }, select: { id: true, nombre: true, email: true } })
        : [];
      const userMap = users.reduce<Record<string, User>>((acc, user) => {
        acc[String(user.id)] = user;
        return acc;
      }, {});

      return reservations.map((reservation) => {
        const tables = (linksByReservation[String(reservation.id)] || []).map((link) => ({
          id: link.tableId,
          label: link.tableLabel,
          seats: link.tableSeats,
        }));
        const totalSeats = tables.reduce((acc, table) => acc + (Number(table.seats) || 0), 0);
        const userInfo = reservation.userId ? userMap[String(reservation.userId)] : null;
        return {
          id: reservation.id,
          code: reservation.code,
          businessId: reservation.businessId,
          businessName: business.name,
          businessType: business.type,
          tables,
          totalSeats,
          date: reservation.date,
          time: reservation.time,
          schedule: reservation.schedule,
          notes: reservation.notes,
          status: reservation.status,
          totalPrice: parseNumeric(reservation.amount) ?? 0,
          userId: reservation.userId,
          holderName: reservation.holderName,
          guestName: reservation.guestName,
          guestLastName: reservation.guestLastName,
          guestRut: reservation.guestRut,
          userName: userInfo?.nombre || null,
          userEmail: userInfo?.email || null,
          createdAt: reservation.createdAt,
        };
      });
    });

    res.json(list);
  })
);

router.post(
  '/reservations',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const requester = req.auth;
    const isAdmin = !!requester?.isAdminGlobal;
    const user = requester?.user;

    if (user && user.rol !== RolUsuario.CLIENTE) {
      return res.status(403).json({ message: 'Solo clientes pueden reservar con registro' });
    }

    const businessId = String(req.body?.businessId || '').trim();
    if (!businessId) return res.status(400).json({ message: 'Negocio es obligatorio' });

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: businessId } })
    );
    if (!business || business.status !== NegocioEstado.ACTIVO) {
      return res.status(404).json({ message: 'Negocio no disponible' });
    }

    const tableIds = Array.isArray(req.body?.tableIds) ? req.body.tableIds.map(String) : [];
    if (!tableIds.length) {
      return res.status(400).json({ message: 'Selecciona al menos una mesa' });
    }

    const date = String(req.body?.date || '').trim();
    const time = String(req.body?.time || '').trim();
    if (!date || !time) {
      return res.status(400).json({ message: 'Fecha y hora son obligatorias' });
    }

    const normalizedDate = normalizeDateValue(date);
    if (!normalizedDate) {
      return res.status(400).json({ message: 'La fecha seleccionada no es válida' });
    }

    const schedule = normalizeReservationSchedule(req.body?.schedule);
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (!isDateWithinBusinessAvailability(business, normalizedDate)) {
      return res
        .status(400)
        .json({ message: 'El local no está disponible para la fecha seleccionada.' });
    }

    if (!isTimeWithinBusinessHours(business, time)) {
      return res.status(400).json({ message: 'La hora seleccionada no está dentro del horario de funcionamiento.' });
    }

    const guestName = String(req.body?.guest?.nombre || '').trim();
    const guestLastName = String(req.body?.guest?.apellido || '').trim();
    const guestRut = String(req.body?.guest?.rut || '').trim();
    if (!user && (!guestName || !guestLastName || !guestRut)) {
      return res.status(400).json({ message: 'Nombre, apellido y RUT son obligatorios' });
    }

    const amountRaw = parseNumeric(req.body?.amount);
    const amountValue = amountRaw !== null && amountRaw >= 0 ? amountRaw : 5000;

    const response = await runWithContext({ tenantId: business.tenantId, isAdmin }, async (manager) => {
      const tableRepo = manager.getRepository(ReservationTable);
      const reservationRepo = manager.getRepository(Reservation);
      const linkRepo = manager.getRepository(ReservationTableLink);

      const tables = await tableRepo
        .createQueryBuilder('mesa')
        .setLock('pessimistic_write')
        .where('mesa.id IN (:...ids)', { ids: tableIds })
        .andWhere('mesa.negocio_id = :businessId', { businessId: business.id })
        .getMany();

      if (tables.length !== tableIds.length) {
        throw new Error('Alguna mesa no existe para este negocio');
      }

      const now = new Date();
      const expiredTableIds = tables
        .filter((table) => table.status === MesaEstado.OCUPADA && table.occupiedUntil && table.occupiedUntil <= now)
        .map((table) => String(table.id));
      if (expiredTableIds.length) {
        await tableRepo.update(
          { id: In(expiredTableIds) },
          { status: MesaEstado.DISPONIBLE, occupiedUntil: null, updatedAt: new Date() }
        );
        tables.forEach((table) => {
          if (expiredTableIds.includes(String(table.id))) {
            table.status = MesaEstado.DISPONIBLE;
            table.occupiedUntil = null;
          }
        });
      }

      const unavailable = tables.filter((table) => {
        if (table.status === MesaEstado.MANTENIMIENTO) return true;
        if (table.status === MesaEstado.OCUPADA && !table.occupiedUntil) return true;
        return false;
      });
      if (unavailable.length) {
        throw new Error('Algunas mesas ya no están disponibles');
      }

      const reservedTableIds = await getReservedTableIdsForDateTime(
        manager,
        String(business.id),
        normalizedDate,
        time
      );
      const reservedIds = tableIds.filter((tableId) => reservedTableIds.has(String(tableId)));
      if (reservedIds.length) {
        throw new Error('Algunas mesas ya están reservadas para ese horario');
      }

      const holderName = user ? user.nombre : `${guestName} ${guestLastName}`.trim();

      let saved: Reservation | null = null;
      let attempts = 0;
      while (!saved && attempts < 3) {
        attempts += 1;
        const code = generateReservationCode();
        try {
          saved = await reservationRepo.save(
            reservationRepo.create({
              businessId: business.id,
              userId: user ? user.id : null,
              code,
              holderName: holderName || null,
              guestName: user ? null : guestName || null,
              guestLastName: user ? null : guestLastName || null,
              guestRut: user ? null : guestRut || null,
              date: normalizedDate,
              time,
              schedule,
              notes: notes || null,
              status: ReservaEstado.CONFIRMADA,
              amount: amountValue.toFixed(2),
            })
          );
        } catch (err: any) {
          if (err?.code !== '23505') throw err;
        }
      }
      if (!saved) throw new Error('No se pudo generar el código de reserva');

      const links = tables.map((table) =>
        linkRepo.create({
          reservationId: saved!.id,
          tableId: table.id,
          tableLabel: table.label,
          tableSeats: table.seats,
        })
      );
      await linkRepo.save(links);

      const totalSeats = tables.reduce((acc, table) => acc + (Number(table.seats) || 0), 0);

      return {
        reservation: saved,
        tables,
        totalSeats,
      };
    });

    const tableSummaries = response.tables.map((table) => ({
      id: table.id,
      label: table.label,
      seats: table.seats,
    }));

    res.json({
      id: response.reservation.id,
      code: response.reservation.code,
      businessId: business.id,
      businessName: business.name,
      businessType: business.type,
      tables: tableSummaries,
      totalSeats: response.totalSeats,
      date: response.reservation.date,
      time: response.reservation.time,
      schedule: response.reservation.schedule,
      notes: response.reservation.notes,
      status: response.reservation.status,
      totalPrice: parseNumeric(response.reservation.amount) ?? amountValue,
      userId: response.reservation.userId,
      holderName: response.reservation.holderName,
      guestName: response.reservation.guestName,
      guestRut: response.reservation.guestRut,
      createdAt: response.reservation.createdAt,
    });
  })
);

router.get(
  '/reservations/verify',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const code = String(req.query.code || '').trim();
    if (!code) return res.status(400).json({ message: 'Código es obligatorio' });

    const requester = req.auth!;
    const isAdmin = Boolean(requester.admin);

    const reservation = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Reservation).findOne({ where: { code } })
    );
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    const business = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(Business).findOne({ where: { id: reservation.businessId } })
    );
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    if (!isAdmin && business.ownerId !== requester.user!.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta reserva' });
    }

    let scanValid = false;
    let reservationStatus = reservation.status;
    const validationTimestamp = new Date();

    if (reservation.status === ReservaEstado.CONFIRMADA) {
      const updateResult = await runWithContext({ tenantId: business.tenantId, isAdmin }, (manager) =>
        manager.getRepository(Reservation).update(
          { id: reservation.id, status: ReservaEstado.CONFIRMADA },
          { status: ReservaEstado.COMPLETADA, validatedAt: validationTimestamp }
        )
      );

      if (updateResult.affected && updateResult.affected > 0) {
        scanValid = true;
        reservationStatus = ReservaEstado.COMPLETADA;
      } else {
        const refreshed = await runWithContext({ tenantId: business.tenantId, isAdmin }, (manager) =>
          manager.getRepository(Reservation).findOne({
            where: { id: reservation.id },
            select: { status: true },
          })
        );
        reservationStatus = refreshed?.status ?? reservation.status;
      }
    }

    const data = await runWithContext({ tenantId: business.tenantId, isAdmin }, async (manager) => {
      const links = await manager.getRepository(ReservationTableLink).find({
        where: { reservationId: reservation.id },
      });
      if (scanValid && links.length) {
        const occupiedUntil = new Date(validationTimestamp.getTime() + RESERVATION_DURATION_MINUTES * 60 * 1000);
        await manager
          .getRepository(ReservationTable)
          .createQueryBuilder()
          .update()
          .set({ status: MesaEstado.OCUPADA, occupiedUntil })
          .where('id IN (:...ids)', { ids: links.map((link) => link.tableId) })
          .andWhere('estado <> :maintenance', { maintenance: MesaEstado.MANTENIMIENTO })
          .execute();
      }
      const tables = links.map((link) => ({
        id: link.tableId,
        label: link.tableLabel,
        seats: link.tableSeats,
      }));
      const totalSeats = tables.reduce((acc, table) => acc + (Number(table.seats) || 0), 0);

      const userInfo = reservation.userId
        ? await manager.getRepository(User).findOne({
            where: { id: reservation.userId },
            select: { id: true, nombre: true, email: true },
          })
        : null;

      return {
        id: reservation.id,
        code: reservation.code,
        businessId: business.id,
        businessName: business.name,
        businessType: business.type,
        tables,
        totalSeats,
        date: reservation.date,
        time: reservation.time,
        schedule: reservation.schedule,
        notes: reservation.notes,
        status: reservationStatus,
        totalPrice: parseNumeric(reservation.amount) ?? 0,
        userId: reservation.userId,
        holderName: reservation.holderName,
        guestName: reservation.guestName,
        guestLastName: reservation.guestLastName,
        guestRut: reservation.guestRut,
        userName: userInfo?.nombre || null,
        userEmail: userInfo?.email || null,
        createdAt: reservation.createdAt,
      };
    });

    res.json({
      valid: scanValid,
      reservation: data,
    });
  })
);

router.get(
  '/reservations/mine',
  authMiddleware,
  requireRole([RolUsuario.CLIENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.auth!.user!;
    ensureUserReady(user, { requireTenant: false });

    const data = await runWithContext({ isAdmin: true }, async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const list = await reservationRepo.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });
      if (!list.length) return [];

      const businessIds = Array.from(new Set(list.map((item) => String(item.businessId))));
      const businesses = await manager.getRepository(Business).find({ where: { id: In(businessIds) } });
      const businessMap = businesses.reduce<Record<string, Business>>((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
      }, {});

      const reservationIds = list.map((item) => String(item.id));
      const links = await manager.getRepository(ReservationTableLink).find({
        where: { reservationId: In(reservationIds) },
      });
      const linksByReservation = links.reduce<Record<string, ReservationTableLink[]>>((acc, link) => {
        const key = String(link.reservationId);
        acc[key] = acc[key] || [];
        acc[key].push(link);
        return acc;
      }, {});

      return list.map((reservation) => {
        const business = businessMap[String(reservation.businessId)];
        const tables = (linksByReservation[String(reservation.id)] || []).map((link) => ({
          id: link.tableId,
          label: link.tableLabel,
          seats: link.tableSeats,
        }));
        const totalSeats = tables.reduce((acc, table) => acc + (Number(table.seats) || 0), 0);
        return {
          id: reservation.id,
          code: reservation.code,
          businessId: reservation.businessId,
          businessName: business?.name || '',
          businessType: business?.type || '',
          tables,
          totalSeats,
          date: reservation.date,
          time: reservation.time,
          schedule: reservation.schedule,
          notes: reservation.notes,
          status: reservation.status,
          totalPrice: parseNumeric(reservation.amount) ?? 0,
          userId: reservation.userId,
          holderName: reservation.holderName,
          guestName: reservation.guestName,
          guestRut: reservation.guestRut,
          createdAt: reservation.createdAt,
        };
      });
    });

    res.json(data);
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
    const { titulo, contenido, tipo, fechaFinVigencia, categoryIds = [], precio, extras } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ message: 'Título y contenido son obligatorios' });
    const precioNormalizado =
      precio === undefined || precio === null || precio === '' ? null : Number.parseFloat(precio as string);
    if (precioNormalizado === null) return res.status(400).json({ message: 'Precio es obligatorio' });
    if (!Number.isFinite(precioNormalizado) || precioNormalizado < 0) {
      return res.status(400).json({ message: 'Precio inválido' });
    }
    let extrasNormalized: { nombre: string; precio: number; imagenUrl?: string | null }[] = [];
    try {
      extrasNormalized = normalizePublicationExtras(extras);
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }

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
        const allowedTypes = categoriasPermitidasPorNegocio[business.type];
        if (allowedTypes) {
          const allowedSet = new Set(allowedTypes);
          const invalidCategories = categories.filter((c) => !allowedSet.has(c.type));
          if (invalidCategories.length) {
            throw new Error('Alguna categoría no es válida para el tipo de negocio');
          }
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
        precio: precioNormalizado,
        extras: extrasNormalized.length ? extrasNormalized : null,
      });
      const saved = await publicationRepo.save(record);
      if (validCategoryIds.length) {
        const links = validCategoryIds.map((cid) => ({ publicationId: saved.id, categoryId: cid }));
        await manager.getRepository(PublicationCategory).save(links);
      }

      const mediaEntries: { url: string; tipo?: MediaTipo }[] = [];
      const { mediaUrl, mediaUrls: mediaUrlsBody, mediaItems: mediaItemsBody, mediaType } = req.body as {
        mediaUrl?: string;
        mediaUrls?: string[];
        mediaItems?: { url?: string; tipo?: MediaTipo }[];
        mediaType?: MediaTipo;
      };
      if (mediaUrl) {
        mediaEntries.push({ url: mediaUrl, tipo: mediaType === MediaTipo.VIDEO ? MediaTipo.VIDEO : MediaTipo.IMAGEN });
      }
      if (Array.isArray(mediaUrlsBody)) {
        mediaUrlsBody.filter(Boolean).forEach((url) => mediaEntries.push({ url, tipo: MediaTipo.IMAGEN }));
      }
      if (Array.isArray(mediaItemsBody)) {
        mediaItemsBody.forEach((item) => {
          if (!item?.url) return;
          mediaEntries.push({ url: item.url, tipo: item.tipo === MediaTipo.VIDEO ? MediaTipo.VIDEO : MediaTipo.IMAGEN });
        });
      }
      if (mediaEntries.length) {
        const mediaRepo = manager.getRepository(Media);
        const records = mediaEntries.map((entry, index) => ({
          publicationId: saved.id,
          url: entry.url,
          tipo: entry.tipo === MediaTipo.VIDEO ? MediaTipo.VIDEO : MediaTipo.IMAGEN,
          orden: index,
          descripcion: null,
        }));
        await mediaRepo.save(records);
      }

      return saved;
    });

    res.json({ publication });
  })
);

router.get(
  '/publications/mine',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.auth!.user!;
    ensureUserReady(user, { requireTenant: false });
    const tenantId = user.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });

    const publications = await runWithContext({ tenantId }, async (manager) => {
      const businessRepo = manager.getRepository(Business);
      const businesses = await businessRepo.find({ where: { tenantId, ownerId: user.id } });
      const businessIds = businesses.map((b) => b.id);
      if (!businessIds.length) return [];

      const qb = manager.getRepository(Publication).createQueryBuilder('p');
      qb.where('p.businessId IN (:...bizIds)', { bizIds: businessIds });
      qb.orderBy('p.fechaCreacion', 'DESC').addOrderBy('p.fechaPublicacion', 'DESC');
      const rows = await qb.getMany();
      if (!rows.length) return [];

      const publicationIds = rows.map((p) => p.id);
      const { summaryByPublication, userRatingsByPublication } = await fetchPublicationRatingSummary(
        manager,
        publicationIds,
        null
      );
      const linkRepo = manager.getRepository(PublicationCategory);
      const links = await linkRepo.find({ where: { publicationId: In(publicationIds) } });
      const mediaRepo = manager.getRepository(Media);
      const medias = await mediaRepo.find({ where: { publicationId: In(publicationIds) } });
      const categoryRepo = manager.getRepository(Category);
      const categoryIds = [...new Set(links.map((l) => l.categoryId))];
      const categoryEntities = categoryIds.length ? await categoryRepo.find({ where: { id: In(categoryIds) } }) : [];

      const categoriesByPublication = links.reduce<Record<string, Category[]>>((acc, link) => {
        const found = categoryEntities.find((c) => c.id === link.categoryId);
        if (found) {
          acc[link.publicationId] = acc[link.publicationId] || [];
          acc[link.publicationId].push(found);
        }
        return acc;
      }, {});

      const mediaByPublication = medias.reduce<Record<string, Media[]>>((acc, media) => {
        acc[media.publicationId] = acc[media.publicationId] || [];
        acc[media.publicationId].push(media);
        return acc;
      }, {});

      const businessMap = businesses.reduce<Record<string, Business>>((acc, biz) => {
        acc[biz.id] = biz;
        return acc;
      }, {});

      return rows.map((p) => {
        const ratingSummary = summaryByPublication[p.id] || { ratingAverage: null, ratingCount: 0 };
        return {
          ...p,
          categoryIds: categoriesByPublication[p.id]?.map((c) => c.id) || [],
          categories: categoriesByPublication[p.id] || [],
          business: businessMap[p.businessId],
          coverUrl: mediaByPublication[p.id]?.[0]?.url || null,
          coverType: mediaByPublication[p.id]?.[0]?.tipo || null,
          mediaItems: normalizeMediaItems(mediaByPublication[p.id]),
          ratingAverage: ratingSummary.ratingAverage,
          ratingCount: ratingSummary.ratingCount,
          userRating: userRatingsByPublication[p.id] ?? null,
        };
      });
    });

    res.json(publications);
  })
);

router.get(
  '/businesses/:id/publications',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });
    const requester = req.auth;
    const user = requester?.user;
    const isAdmin = !!requester?.isAdminGlobal;
    const businessId = req.params.id;
    const ratingUserId = user?.rol === RolUsuario.CLIENTE ? user.id : null;

    const publications = await runWithContext({ tenantId, isAdmin }, async (manager) => {
      const business = await manager.getRepository(Business).findOne({ where: { id: businessId } });
      if (!business || business.tenantId !== tenantId) return [];
      const isOwner = user && business.ownerId === user.id;
      const includeAll = isAdmin || isOwner;
      const statusFilter = includeAll ? undefined : PublicacionEstado.PUBLICADA;

      const repo = manager.getRepository(Publication);
      const rows = await repo.find({
        where: {
          businessId,
          ...(statusFilter ? { estado: statusFilter } : {}),
        },
        order: { fechaPublicacion: 'DESC', fechaCreacion: 'DESC' },
      });
      if (!rows.length) return [];
      const publicationIds = rows.map((p) => p.id);
      const { summaryByPublication, userRatingsByPublication } = await fetchPublicationRatingSummary(
        manager,
        publicationIds,
        ratingUserId
      );
      const linkRepo = manager.getRepository(PublicationCategory);
      const links = await linkRepo.find({ where: { publicationId: In(publicationIds) } });
      const mediaRepo = manager.getRepository(Media);
      const medias = await mediaRepo.find({ where: { publicationId: In(publicationIds) } });
      const categoryRepo = manager.getRepository(Category);
      const categoryIds = [...new Set(links.map((l) => l.categoryId))];
      const categoryEntities = categoryIds.length ? await categoryRepo.find({ where: { id: In(categoryIds) } }) : [];

      const grouped = links.reduce<Record<string, string[]>>((acc, link) => {
        acc[link.publicationId] = acc[link.publicationId] || [];
        acc[link.publicationId].push(link.categoryId);
        return acc;
      }, {});
      const categoriesByPublication = links.reduce<Record<string, Category[]>>((acc, link) => {
        const found = categoryEntities.find((c) => c.id === link.categoryId);
        if (found) {
          acc[link.publicationId] = acc[link.publicationId] || [];
          acc[link.publicationId].push(found);
        }
        return acc;
      }, {});
      const mediaGrouped = medias.reduce<Record<string, Media[]>>((acc, item) => {
        acc[item.publicationId] = acc[item.publicationId] || [];
        acc[item.publicationId].push(item);
        return acc;
      }, {});

      return rows.map((p) => {
        const ratingSummary = summaryByPublication[p.id] || { ratingAverage: null, ratingCount: 0 };
        return {
          ...p,
          categoryIds: grouped[p.id] || [],
          categories: categoriesByPublication[p.id] || [],
          coverUrl: mediaGrouped[p.id]?.[0]?.url || null,
          coverType: mediaGrouped[p.id]?.[0]?.tipo || null,
          mediaItems: normalizeMediaItems(mediaGrouped[p.id]),
          ratingAverage: ratingSummary.ratingAverage,
          ratingCount: ratingSummary.ratingCount,
          userRating: userRatingsByPublication[p.id] ?? null,
        };
      });
    });
    res.json(publications);
  })
);

router.get(
  '/feed/publications',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true, optional: true, allowAdminAll: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    const statusFilter = PublicacionEstado.PUBLICADA;
    const mine =
      typeof req.query.mine === 'string' && req.query.mine === 'true' && req.auth?.user?.rol === RolUsuario.OFERENTE;
    const authorIdFilter = mine ? req.auth!.user!.id : null;
    const effectiveTenantId = mine ? req.auth?.user?.tenantId || tenantId : tenantId;
    if (mine && !effectiveTenantId && !req.auth?.isAdminGlobal) {
      return res.status(400).json({ message: 'tenantId es requerido' });
    }
    const ctxIsAdmin = !!req.auth?.isAdminGlobal;
    const searchTerm = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : null;
    const businessId = typeof req.query.businessId === 'string' ? req.query.businessId : null;
    const ratingUserId = req.auth?.user?.rol === RolUsuario.CLIENTE ? req.auth.user.id : null;

    const fetchPublications = async (ctxTenantId: string | null, authorId?: string | null) =>
      runWithContext({ tenantId: ctxTenantId ?? undefined, isAdmin: ctxTenantId ? ctxIsAdmin : true }, async (manager) => {
        const businessRepo = manager.getRepository(Business);
        const businesses = await businessRepo.find({
          where: {
            ...(ctxTenantId ? { tenantId: ctxTenantId } : {}),
            status: NegocioEstado.ACTIVO,
          },
        });
        const businessIds = businesses.map((b) => b.id);
        if (!businessIds.length) return [];

        const qb = manager.getRepository(Publication).createQueryBuilder('p');
        qb.where('p.businessId IN (:...bizIds)', { bizIds: businessIds });
        qb.andWhere('p.estado = :estado', { estado: statusFilter });
        if (businessId) qb.andWhere('p.businessId = :businessId', { businessId });
        if (authorId) qb.andWhere('p.authorId = :authorId', { authorId });
        if (categoryId) {
          qb.andWhere(
            'p.id IN (SELECT pc.publicacion_id FROM publicacion_categoria pc WHERE pc.categoria_id = :categoryId)',
            { categoryId }
          );
        }
        if (searchTerm) {
          const matchingBusinessIds = businesses
            .filter((biz) => biz.name && biz.name.toLowerCase().includes(searchTerm))
            .map((biz) => biz.id);
          if (matchingBusinessIds.length) {
            qb.andWhere(
              '(LOWER(p.titulo) LIKE :term OR LOWER(p.contenido) LIKE :term OR p.businessId IN (:...bizIds))',
              { term: `%${searchTerm}%`, bizIds: matchingBusinessIds }
            );
          } else {
            qb.andWhere('(LOWER(p.titulo) LIKE :term OR LOWER(p.contenido) LIKE :term)', { term: `%${searchTerm}%` });
          }
        }
        qb.orderBy('p.fechaPublicacion', 'DESC').addOrderBy('p.fechaCreacion', 'DESC');
        const rows = await qb.getMany();
        if (!rows.length) return [];

        const publicationIds = rows.map((p) => p.id);
        const { summaryByPublication, userRatingsByPublication } = await fetchPublicationRatingSummary(
          manager,
          publicationIds,
          ratingUserId
        );
        const linkRepo = manager.getRepository(PublicationCategory);
        const links = await linkRepo.find({ where: { publicationId: In(publicationIds) } });
        const mediaRepo = manager.getRepository(Media);
        const medias = await mediaRepo.find({ where: { publicationId: In(publicationIds) } });
        const categoryRepo = manager.getRepository(Category);
        const categoryIds = [...new Set(links.map((l) => l.categoryId))];
        const categoryEntities = categoryIds.length ? await categoryRepo.find({ where: { id: In(categoryIds) } }) : [];

        const categoriesByPublication = links.reduce<Record<string, Category[]>>((acc, link) => {
          const found = categoryEntities.find((c) => c.id === link.categoryId);
          if (found) {
            acc[link.publicationId] = acc[link.publicationId] || [];
            acc[link.publicationId].push(found);
          }
          return acc;
        }, {});

        const mediaByPublication = medias.reduce<Record<string, Media[]>>((acc, media) => {
          acc[media.publicationId] = acc[media.publicationId] || [];
          acc[media.publicationId].push(media);
          return acc;
        }, {});

        const businessMap = businesses.reduce<Record<string, Business>>((acc, biz) => {
          acc[biz.id] = biz;
          return acc;
        }, {});

        return rows.map((p) => {
          const ratingSummary = summaryByPublication[p.id] || { ratingAverage: null, ratingCount: 0 };
          return {
            ...p,
            categoryIds: categoriesByPublication[p.id]?.map((c) => c.id) || [],
            categories: categoriesByPublication[p.id] || [],
            business: businessMap[p.businessId],
            coverUrl: mediaByPublication[p.id]?.[0]?.url || null,
            coverType: mediaByPublication[p.id]?.[0]?.tipo || null,
            mediaItems: normalizeMediaItems(mediaByPublication[p.id]),
            ratingAverage: ratingSummary.ratingAverage,
            ratingCount: ratingSummary.ratingCount,
            userRating: userRatingsByPublication[p.id] ?? null,
          };
        });
      });

    if (mine && !authorIdFilter) {
      return res.status(400).json({ message: 'No se pudo determinar el autor' });
    }
    const publications = effectiveTenantId
      ? await fetchPublications(effectiveTenantId, authorIdFilter)
      : await fetchPublications(null, authorIdFilter);

    res.json(publications);
  })
);

router.get(
  '/feed/ads',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true, optional: true, allowAdminAll: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    const ctxIsAdmin = !!req.auth?.isAdminGlobal;
    const ratingUserId = req.auth?.user?.rol === RolUsuario.CLIENTE ? req.auth.user.id : null;

    const fetchAds = async (ctxTenantId: string | null) =>
      runWithContext({ tenantId: ctxTenantId ?? undefined, isAdmin: ctxTenantId ? ctxIsAdmin : true }, async (manager) => {
        const businessRepo = manager.getRepository(Business);
        const businesses = await businessRepo.find({
          where: {
            ...(ctxTenantId ? { tenantId: ctxTenantId } : {}),
            status: NegocioEstado.ACTIVO,
          },
        });
        const businessIds = businesses.map((b) => b.id);
        if (!businessIds.length) return [];

        const qb = manager.getRepository(Publication).createQueryBuilder('p');
        qb.where('p.businessId IN (:...bizIds)', { bizIds: businessIds });
        qb.andWhere('p.estado = :estado', { estado: PublicacionEstado.PUBLICADA });
        qb.andWhere('p.esPublicidad = :esPublicidad', { esPublicidad: true });
        qb.orderBy('p.fechaPublicacion', 'DESC').addOrderBy('p.fechaCreacion', 'DESC');
        const rows = await qb.getMany();
        if (!rows.length) return [];

        const publicationIds = rows.map((p) => p.id);
        const { summaryByPublication, userRatingsByPublication } = await fetchPublicationRatingSummary(
          manager,
          publicationIds,
          ratingUserId
        );
        const linkRepo = manager.getRepository(PublicationCategory);
        const links = await linkRepo.find({ where: { publicationId: In(publicationIds) } });
        const mediaRepo = manager.getRepository(Media);
        const medias = await mediaRepo.find({ where: { publicationId: In(publicationIds) } });
        const categoryRepo = manager.getRepository(Category);
        const categoryIds = [...new Set(links.map((l) => l.categoryId))];
        const categoryEntities = categoryIds.length ? await categoryRepo.find({ where: { id: In(categoryIds) } }) : [];

        const categoriesByPublication = links.reduce<Record<string, Category[]>>((acc, link) => {
          const found = categoryEntities.find((c) => c.id === link.categoryId);
          if (found) {
            acc[link.publicationId] = acc[link.publicationId] || [];
            acc[link.publicationId].push(found);
          }
          return acc;
        }, {});

        const mediaByPublication = medias.reduce<Record<string, Media[]>>((acc, media) => {
          acc[media.publicationId] = acc[media.publicationId] || [];
          acc[media.publicationId].push(media);
          return acc;
        }, {});

        const businessMap = businesses.reduce<Record<string, Business>>((acc, biz) => {
          acc[biz.id] = biz;
          return acc;
        }, {});

        return rows.map((p) => {
          const ratingSummary = summaryByPublication[p.id] || { ratingAverage: null, ratingCount: 0 };
          return {
            ...p,
            categoryIds: categoriesByPublication[p.id]?.map((c) => c.id) || [],
            categories: categoriesByPublication[p.id] || [],
            business: businessMap[p.businessId],
            coverUrl: mediaByPublication[p.id]?.[0]?.url || null,
            coverType: mediaByPublication[p.id]?.[0]?.tipo || null,
            mediaItems: normalizeMediaItems(mediaByPublication[p.id]),
            ratingAverage: ratingSummary.ratingAverage,
            ratingCount: ratingSummary.ratingCount,
            userRating: userRatingsByPublication[p.id] ?? null,
          };
        });
      });

    const publications = tenantId ? await fetchAds(tenantId) : await fetchAds(null);
    res.json(publications);
  })
);

router.put(
  '/publications/:id',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const isAdmin = !!req.auth?.isAdminGlobal;
    const user = req.auth?.user;
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: false, optional: true, allowAdminAll: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    if (!tenantId && !isAdmin) return res.status(400).json({ message: 'tenantId es requerido' });
    if (!isAdmin && user) ensureUserReady(user);

    const { titulo, contenido, tipo, fechaFinVigencia, categoryIds = [], precio, extras } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ message: 'Título y contenido son obligatorios' });
    const precioNormalizado =
      precio === undefined || precio === null || precio === '' ? null : Number.parseFloat(precio as string);
    if (precioNormalizado === null) return res.status(400).json({ message: 'Precio es obligatorio' });
    if (!Number.isFinite(precioNormalizado) || precioNormalizado < 0) {
      return res.status(400).json({ message: 'Precio inválido' });
    }
    let extrasNormalized: { nombre: string; precio: number; imagenUrl?: string | null }[] = [];
    try {
      extrasNormalized = normalizePublicationExtras(extras);
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }

    const updated = await runWithContext({ tenantId: tenantId ?? undefined, isAdmin }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const publication = await publicationRepo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');

      const business = await manager.getRepository(Business).findOne({ where: { id: publication.businessId } });
      if (!business) throw new Error('Negocio no encontrado');
      if (!isAdmin && business.ownerId !== user?.id) {
        throw new Error('No puedes editar esta publicación');
      }

      const validCategoryIds: string[] = [];
      if (categoryIds.length) {
        const categories = await manager
          .getRepository(Category)
          .find({ where: { id: In(categoryIds as string[]), tenantId: business.tenantId } });
        if (categories.length !== categoryIds.length) {
          throw new Error('Alguna categoría no existe en este tenant');
        }
        const allowedTypes = categoriasPermitidasPorNegocio[business.type];
        if (allowedTypes) {
          const allowedSet = new Set(allowedTypes);
          const invalidCategories = categories.filter((c) => !allowedSet.has(c.type));
          if (invalidCategories.length) {
            throw new Error('Alguna categoría no es válida para el tipo de negocio');
          }
        }
        validCategoryIds.push(...categories.map((c) => c.id));
      }

      await publicationRepo.update(
        { id: publicationId },
        {
          titulo,
          contenido,
          tipo: (tipo as PublicacionTipo) || PublicacionTipo.AVISO_GENERAL,
          fechaFinVigencia: fechaFinVigencia ? new Date(fechaFinVigencia) : null,
          precio: precioNormalizado,
          extras: extrasNormalized.length ? extrasNormalized : null,
          estado: PublicacionEstado.PENDIENTE_VALIDACION,
          fechaPublicacion: null,
        }
      );

      const linkRepo = manager.getRepository(PublicationCategory);
      await linkRepo.delete({ publicationId });
      if (validCategoryIds.length) {
        const links = validCategoryIds.map((cid) => ({ publicationId, categoryId: cid }));
        await linkRepo.save(links);
      }

      const mediaRepo = manager.getRepository(Media);
      const { mediaUrl, mediaUrls: mediaUrlsBody, mediaItems: mediaItemsBody, mediaType } = req.body as {
        mediaUrl?: string;
        mediaUrls?: string[];
        mediaItems?: { url?: string; tipo?: MediaTipo }[];
        mediaType?: MediaTipo;
      };
      const mediaEntries: { url: string; tipo?: MediaTipo }[] = [];
      if (mediaUrl) mediaEntries.push({ url: mediaUrl, tipo: mediaType });
      if (Array.isArray(mediaUrlsBody)) mediaUrlsBody.filter(Boolean).forEach((url) => mediaEntries.push({ url }));
      if (Array.isArray(mediaItemsBody)) {
        mediaItemsBody.forEach((item) => {
          if (!item?.url) return;
          mediaEntries.push({ url: item.url, tipo: item.tipo });
        });
      }
      if (mediaEntries.length) {
        await mediaRepo.delete({ publicationId });
        const records = mediaEntries.map((entry, index) => ({
          publicationId,
          url: entry.url,
          tipo: entry.tipo === MediaTipo.VIDEO ? MediaTipo.VIDEO : MediaTipo.IMAGEN,
          orden: index,
          descripcion: null,
        }));
        await mediaRepo.save(records);
      }

      return publicationRepo.findOne({ where: { id: publicationId } });
    });

    res.json({ message: 'Publicación actualizada y enviada a validación', publication: updated });
  })
);

router.delete(
  '/publications/:id',
  authMiddleware,
  requireRole([RolUsuario.OFERENTE, 'admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const isAdmin = !!req.auth?.isAdminGlobal;
    const user = req.auth?.user;
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: false, optional: true, allowAdminAll: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    if (!tenantId && !isAdmin) return res.status(400).json({ message: 'tenantId es requerido' });
    if (!isAdmin && user) ensureUserReady(user);

    await runWithContext({ tenantId: tenantId ?? undefined, isAdmin }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const publication = await publicationRepo.findOne({ where: { id: publicationId } });
      if (!publication) return;
      const business = await manager.getRepository(Business).findOne({ where: { id: publication.businessId } });
      if (!business) throw new Error('Negocio no encontrado');
      if (!isAdmin && business.ownerId !== user?.id) {
        throw new Error('No puedes eliminar esta publicación');
      }
      await manager.getRepository(PublicationCategory).delete({ publicationId });
      await manager.getRepository(Media).delete({ publicationId });
      await manager.getRepository(PublicationReview).delete({ publicationId });
      await publicationRepo.delete({ id: publicationId });
    });

    res.json({ message: 'Publicación eliminada' });
  })
);

router.get(
  '/admin/publications/pending',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (_req, res) => {
    const pending = await runWithContext({ isAdmin: true }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const rows = await publicationRepo.find({
        where: { estado: PublicacionEstado.PENDIENTE_VALIDACION },
        order: { fechaCreacion: 'DESC' },
      });
      if (!rows.length) return [];

      const publicationIds = rows.map((p) => p.id);
      const linkRepo = manager.getRepository(PublicationCategory);
      const links = await linkRepo.find({ where: { publicationId: In(publicationIds) } });
      const mediaRepo = manager.getRepository(Media);
      const medias = await mediaRepo.find({ where: { publicationId: In(publicationIds) } });

      const categoryRepo = manager.getRepository(Category);
      const categoryIds = [...new Set(links.map((l) => l.categoryId))];
      const categoryEntities = categoryIds.length ? await categoryRepo.find({ where: { id: In(categoryIds) } }) : [];

      const categoriesByPublication = links.reduce<Record<string, Category[]>>((acc, link) => {
        const found = categoryEntities.find((c) => c.id === link.categoryId);
        if (found) {
          acc[link.publicationId] = acc[link.publicationId] || [];
          acc[link.publicationId].push(found);
        }
        return acc;
      }, {});

      const mediaByPublication = medias.reduce<Record<string, Media[]>>((acc, media) => {
        acc[media.publicationId] = acc[media.publicationId] || [];
        acc[media.publicationId].push(media);
        return acc;
      }, {});

      const businessIds = [...new Set(rows.map((p) => p.businessId).filter(Boolean))];
      const businessRepo = manager.getRepository(Business);
      const businessEntities = businessIds.length ? await businessRepo.find({ where: { id: In(businessIds) } }) : [];
      const businessMap = businessEntities.reduce<Record<string, Business>>((acc, biz) => {
        acc[biz.id] = biz;
        return acc;
      }, {});

      return rows.map((p) => ({
        ...p,
        categoryIds: categoriesByPublication[p.id]?.map((c) => c.id) || [],
        categories: categoriesByPublication[p.id] || [],
        business: businessMap[p.businessId] || null,
        coverUrl: mediaByPublication[p.id]?.[0]?.url || null,
        coverType: mediaByPublication[p.id]?.[0]?.tipo || null,
        mediaItems: normalizeMediaItems(mediaByPublication[p.id]),
      }));
    });
    res.json(pending);
  })
);

router.get(
  '/admin/publications/ads',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: false, optional: true, allowAdminAll: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }

    const publications = await runWithContext({ tenantId: tenantId ?? undefined, isAdmin: true }, async (manager) => {
      const businessRepo = manager.getRepository(Business);
      const businesses = await businessRepo.find({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: NegocioEstado.ACTIVO,
        },
      });
      const businessIds = businesses.map((b) => b.id);
      if (!businessIds.length) return [];

      const qb = manager.getRepository(Publication).createQueryBuilder('p');
      qb.where('p.businessId IN (:...bizIds)', { bizIds: businessIds });
      qb.andWhere('p.estado = :estado', { estado: PublicacionEstado.PUBLICADA });
      qb.orderBy('p.fechaPublicacion', 'DESC').addOrderBy('p.fechaCreacion', 'DESC');
      const rows = await qb.getMany();
      if (!rows.length) return [];

      const publicationIds = rows.map((p) => p.id);
      const linkRepo = manager.getRepository(PublicationCategory);
      const links = await linkRepo.find({ where: { publicationId: In(publicationIds) } });
      const mediaRepo = manager.getRepository(Media);
      const medias = await mediaRepo.find({ where: { publicationId: In(publicationIds) } });
      const categoryRepo = manager.getRepository(Category);
      const categoryIds = [...new Set(links.map((l) => l.categoryId))];
      const categoryEntities = categoryIds.length ? await categoryRepo.find({ where: { id: In(categoryIds) } }) : [];

      const categoriesByPublication = links.reduce<Record<string, Category[]>>((acc, link) => {
        const found = categoryEntities.find((c) => c.id === link.categoryId);
        if (found) {
          acc[link.publicationId] = acc[link.publicationId] || [];
          acc[link.publicationId].push(found);
        }
        return acc;
      }, {});

      const mediaByPublication = medias.reduce<Record<string, Media[]>>((acc, media) => {
        acc[media.publicationId] = acc[media.publicationId] || [];
        acc[media.publicationId].push(media);
        return acc;
      }, {});

      const businessMap = businesses.reduce<Record<string, Business>>((acc, biz) => {
        acc[biz.id] = biz;
        return acc;
      }, {});

      return rows.map((p) => ({
        ...p,
        categoryIds: categoriesByPublication[p.id]?.map((c) => c.id) || [],
        categories: categoriesByPublication[p.id] || [],
        business: businessMap[p.businessId],
        coverUrl: mediaByPublication[p.id]?.[0]?.url || null,
        coverType: mediaByPublication[p.id]?.[0]?.tipo || null,
        mediaItems: normalizeMediaItems(mediaByPublication[p.id]),
      }));
    });

    res.json(publications);
  })
);

router.post(
  '/admin/publications/:id/ads',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const { enabled } = req.body as { enabled?: boolean };
    const tenantId = getTenantIdFromRequest(req);
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled debe ser booleano' });
    }

    await runWithContext({ tenantId: tenantId ?? undefined, isAdmin: true }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const publication = await publicationRepo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');

      const businessRepo = manager.getRepository(Business);
      const business = await businessRepo.findOne({ where: { id: publication.businessId } });
      if (!business) throw new Error('Negocio no encontrado');
      if (tenantId && String(business.tenantId) !== String(tenantId)) {
        throw new Error('La publicación no pertenece al tenant seleccionado');
      }
      if (enabled && publication.estado !== PublicacionEstado.PUBLICADA) {
        throw new Error('Solo publicaciones publicadas pueden mostrarse en publicidad');
      }

      await publicationRepo.update({ id: publicationId }, { esPublicidad: enabled });
    });

    res.json({
      message: enabled ? 'Publicación añadida al espacio publicitario' : 'Publicación retirada del espacio publicitario',
    });
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

router.get(
  '/publications/:id/comments',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const isAdmin = !!req.auth?.isAdminGlobal;
    const comments = await runWithContext({ isAdmin: true }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const publication = await publicationRepo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');
      if (!isAdmin && publication.estado !== PublicacionEstado.PUBLICADA) {
        throw new Error('Publicación no disponible');
      }

      const commentRepo = manager.getRepository(Comment);
      const commentWhere = isAdmin
        ? { publicationId }
        : { publicationId, estado: ComentarioEstado.VISIBLE };
      const rows = await commentRepo.find({
        where: commentWhere,
        order: { fechaCreacion: 'ASC' },
      });
      if (!rows.length) return [];
      const userIds = Array.from(new Set(rows.map((row) => row.userId).filter(Boolean)));
      const users = userIds.length ? await manager.getRepository(User).find({ where: { id: In(userIds) } }) : [];
      const userMap = users.reduce<Record<string, User>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      return rows.map((comment) => ({
        id: comment.id,
        publicationId: comment.publicationId,
        userId: comment.userId,
        userName: userMap[comment.userId]?.nombre || 'Usuario',
        contenido: comment.contenido,
        parentId: comment.parentId,
        fechaCreacion: comment.fechaCreacion,
        esCalificacion: comment.esCalificacion,
        calificacion: comment.calificacion,
      }));
    });
    res.json({ comments });
  })
);

router.post(
  '/publications/:id/comments',
  authMiddleware,
  requireRole([RolUsuario.CLIENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const user = req.auth?.user;
    if (!user) return res.status(401).json({ message: 'No autenticado' });
    ensureUserReady(user, { requireTenant: false });

    const contenido = typeof req.body?.contenido === 'string' ? req.body.contenido.trim() : '';
    if (!contenido) return res.status(400).json({ message: 'El comentario es obligatorio' });
    const parentIdRaw = req.body?.parentId;
    const parentId = parentIdRaw ? String(parentIdRaw) : null;

    const created = await runWithContext({ isAdmin: true }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const publication = await publicationRepo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');
      if (publication.estado !== PublicacionEstado.PUBLICADA) {
        throw new Error('Publicación no disponible');
      }

      let parent: Comment | null = null;
      if (parentId) {
        parent = await manager.getRepository(Comment).findOne({ where: { id: parentId } });
        if (!parent) throw new Error('Comentario padre no encontrado');
        if (String(parent.publicationId) !== String(publicationId)) {
          throw new Error('El comentario padre pertenece a otra publicación');
        }
      }

      const commentRepo = manager.getRepository(Comment);
      const record = commentRepo.create({
        publicationId,
        userId: user.id,
        parentId: parent?.id ?? null,
        contenido,
        estado: ComentarioEstado.VISIBLE,
        esCalificacion: false,
        calificacion: null,
      });
      return commentRepo.save(record);
    });

    res.json({
      comment: {
        id: created.id,
        publicationId: created.publicationId,
        userId: created.userId,
        userName: user.nombre,
        contenido: created.contenido,
        parentId: created.parentId,
        fechaCreacion: created.fechaCreacion,
        esCalificacion: created.esCalificacion,
        calificacion: created.calificacion,
      },
    });
  })
);

router.post(
  '/publications/:id/ratings',
  authMiddleware,
  requireRole([RolUsuario.CLIENTE]),
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    const user = req.auth?.user;
    if (!user) return res.status(401).json({ message: 'No autenticado' });
    ensureUserReady(user, { requireTenant: false });

    const contenido = typeof req.body?.contenido === 'string' ? req.body.contenido.trim() : '';
    const ratingRaw = req.body?.calificacion;
    const ratingValue = Number(ratingRaw);
    if (!contenido) return res.status(400).json({ message: 'La opinión es obligatoria' });
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
    }

    const created = await runWithContext({ isAdmin: true }, async (manager) => {
      const publicationRepo = manager.getRepository(Publication);
      const publication = await publicationRepo.findOne({ where: { id: publicationId } });
      if (!publication) throw new Error('Publicación no encontrada');
      if (publication.estado !== PublicacionEstado.PUBLICADA) {
        throw new Error('Publicación no disponible');
      }

      const commentRepo = manager.getRepository(Comment);
      const existing = await commentRepo.findOne({
        where: { publicationId, userId: user.id, esCalificacion: true },
      });
      if (existing) throw new Error('Ya calificaste esta publicación');

      const record = commentRepo.create({
        publicationId,
        userId: user.id,
        parentId: null,
        contenido,
        estado: ComentarioEstado.VISIBLE,
        esCalificacion: true,
        calificacion: ratingValue,
      });
      const saved = await commentRepo.save(record);

      const summaryRow = await commentRepo
        .createQueryBuilder('c')
        .select('AVG(c.calificacion)', 'ratingAverage')
        .addSelect('COUNT(*)', 'ratingCount')
        .where('c.publicationId = :publicationId', { publicationId })
        .andWhere('c.esCalificacion = true')
        .andWhere('c.estado = :estado', { estado: ComentarioEstado.VISIBLE })
        .getRawOne();
      const ratingAverage = parseNumeric(summaryRow?.ratingAverage ?? summaryRow?.ratingaverage);
      const ratingCountValue = parseNumeric(summaryRow?.ratingCount ?? summaryRow?.ratingcount);
      const ratingCount = Number.isFinite(ratingCountValue ?? NaN)
        ? Math.max(0, Math.floor(ratingCountValue as number))
        : 0;

      return { saved, ratingAverage, ratingCount };
    });

    res.json({
      comment: {
        id: created.saved.id,
        publicationId: created.saved.publicationId,
        userId: created.saved.userId,
        userName: user.nombre,
        contenido: created.saved.contenido,
        parentId: created.saved.parentId,
        fechaCreacion: created.saved.fechaCreacion,
        esCalificacion: created.saved.esCalificacion,
        calificacion: created.saved.calificacion,
      },
      ratingSummary: {
        ratingAverage: created.ratingAverage,
        ratingCount: created.ratingCount,
      },
      userRating: created.saved.calificacion,
    });
  })
);

router.post(
  '/publications/:id/visit',
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
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

router.post(
  '/publications/:id/like',
  asyncHandler(async (req: AuthRequest, res) => {
    const publicationId = req.params.id;
    let tenantId: string | null;
    try {
      tenantId = resolveTenantScope(req, { allowPublic: true });
    } catch (err) {
      return res.status(400).json({ message: (err as Error).message });
    }
    if (!tenantId) return res.status(400).json({ message: 'tenantId es requerido' });
    let nextLikes = 0;
    await runWithContext({ tenantId }, async (manager) => {
      const repo = manager.getRepository(Publication);
      const publication = await repo.findOne({ where: { id: publicationId, estado: PublicacionEstado.PUBLICADA } });
      if (!publication) throw new Error('Publicación no encontrada o no publicada');
      const currentLikes = Number.isFinite(publication.likes) ? publication.likes : 0;
      nextLikes = currentLikes + 1;
      await repo.update({ id: publicationId }, { likes: nextLikes });
    });
    res.json({ message: 'Me gusta registrado', likes: nextLikes });
  })
);

// Manejo de errores por defecto para evitar que el proceso caiga por excepciones no capturadas
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error in route', err);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

export default router;

# Red social autogestionable (multi-tenant)

Stack:
- Backend: Node.js + Express 4.18.2, TypeORM 0.3.17 (ORM para evitar SQL directo), PostgreSQL 15, Redis 7.2 (cache), JWT + bcrypt.
- Frontend: React 18 + Vite 5.
- Infra: Docker Compose con servicios db, redis, backend y frontend (servido con Nginx que también hace de reverse proxy al backend).

## Levantar con Docker
```bash
cp .env.example .env
# Ajusta credenciales si lo necesitas
npm install --prefix backend
npm install --prefix frontend
# o deja que Docker instale dentro de los contenedores

docker compose up --build
```
- Frontend (Nginx): http://localhost:8081
- Backend: expuesto sólo en la red interna de Docker en `backend:4000` y accesible desde el host a través de Nginx en `http://localhost:8081/api`
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Si cambias el host/puerto del frontend, ajusta `FRONTEND_ORIGIN` en `.env` (puedes poner varios separados por coma).

## Scripts locales (sin Docker)
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev -- --host
```
Asegúrate de tener PostgreSQL y Redis levantados con las variables de `.env`.

### Proxy del frontend
- Dev local (sin Docker): `VITE_API_PROXY_TARGET=http://localhost:4000`.
- Con Docker ya no se expone el backend; Nginx en el contenedor de frontend hace proxy interno a `backend:4000` en la ruta `/api`. Usa `http://localhost:8081` en el host.

## API principal
- `POST /api/auth/register` { email, password, role } (roles: visitor | oferente | admin)
- `POST /api/auth/login` -> { token }
- `GET /api/categories` / `POST /api/categories` (admin)
- `POST /api/businesses` (oferente/admin) crea negocio, genera esquema `tenant_<slug>` y abre conexión TypeORM.
- `GET /api/businesses` lista negocios.
- `POST /api/businesses/:slug/listings` (oferente/admin) crea publicaciones en su esquema.
- `GET /api/businesses/:slug/listings` lee publicaciones activas con caché Redis (60s).
- `POST /api/businesses/:slug/listings/:id/visit` registra visitas por esquema.
- `GET /api/admin/dashboard/visits` (admin) resume visitas por negocio.

## Notas de multi-tenant
- Cada negocio usa un esquema dedicado en PostgreSQL (`tenant_<slug>`).
- `ensureTenantSchema` crea el esquema vía TypeORM y `getTenantDataSource` abre conexiones aisladas con entidades propias.
- Redis cachea listados por schema para reducir consultas.

## Próximos pasos sugeridos
- Agregar validaciones y tests (Jest/Supertest).
- Completar flujos de expiración de publicaciones y carga de imágenes (S3/local).
- Endpoints de filtros/búsquedas y panel de control por rol.
- Pipeline CI y seeding inicial de categorías.

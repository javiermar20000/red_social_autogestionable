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
- Persistencia de DB: por defecto el volumen es `red_social_autogestionable_pgdata` (nombre estándar de Compose). Para fijar un nombre estable entre re-deploys, define `PGDATA_VOLUME_NAME=red_social_pgdata` en `.env`.
- No uses `docker compose down -v` ni borres el volumen si quieres conservar datos.
- En producción, usa un volumen externo o una DB gestionada (RDS, Cloud SQL, etc.) para evitar pérdida de datos por reinicios o re-deploys.

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

## APK (Android con navegador/TWA)
El frontend ya incluye `manifest.webmanifest`, `sw.js` y `assetlinks.json` en `frontend/public` para hacerlo instalable. Para obtener un APK que use el navegador de Android por debajo (Trusted Web Activity):

### Requisitos
- JDK 17+ instalado.
- Android SDK (platform-tools y build-tools).
- Node.js.

### Pasos
1) Compila y publica el frontend con HTTPS en un dominio accesible.
```bash
cd frontend
npm install
npm run build
```
2) Actualiza `frontend/public/.well-known/assetlinks.json` con tu `package_name` y el SHA-256 del certificado con el que firmarás el APK.
3) Genera el proyecto Android y el APK con Bubblewrap:
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TU_DOMINIO/manifest.webmanifest
bubblewrap build
```
El APK queda dentro del proyecto generado por Bubblewrap, en `app/build/outputs/apk/release/app-release.apk`.

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

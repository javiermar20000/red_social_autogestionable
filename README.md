# Match Coffee

Match Coffee es una plataforma web para promocionar negocios gastronomicos, gestionar publicaciones y habilitar reservas con QR. La aplicacion es multi-tenant y permite que cada oferente administre sus negocios, mientras los clientes pueden explorar, comentar, calificar y reservar.

Stack:
- Backend: Node.js + Express, TypeORM, PostgreSQL 15, JWT, bcrypt.
- Frontend: React 18 + Vite, Tailwind, Bootstrap, Leaflet.
- Infra: Docker Compose con Nginx, PostgreSQL, Redis y servicios de backup.

## Caracteristicas
- Multi-tenant con Row Level Security (RLS).
- Publicaciones con moderacion y categorias.
- Feed publico con filtros y anuncios destacados.
- Reservas de mesas con validacion por QR.
- Suscripciones de publicidad y reservas via Mercado Pago.
- PWA con service worker y soporte TWA en Android.

## Ejecucion rapida con Docker
```bash
cp .env.example .env
npm install --prefix backend
npm install --prefix frontend
docker compose up --build
```

URLs:
- Frontend: `http://localhost:8081`
- API: `http://localhost:8081/api`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Ejecucion local sin Docker
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
Asegura tener PostgreSQL y Redis levantados y configurar `.env`.

## Documentacion
- `docs/README.md` indice general.
- `docs/vision.md` proposito y alcance.
- `docs/arquitectura.md` vista tecnica.
- `docs/diagramas.md` UML y diagramas.
- `docs/backend.md`, `docs/frontend.md`, `docs/base-de-datos.md`.
- `docs/ejecucion.md` comandos y operacion.

## Notas multi-tenant
- El aislamiento se basa en `tenant_id` con RLS en PostgreSQL.
- El backend usa `runWithContext` para setear `app.tenant_id` y `app.is_admin_global`.
- Para endpoints publicos puedes enviar `tenantId` por query o `x-tenant-id`.

## Mercado Pago
- Configura `MP_ACCESS_TOKEN` y los IDs de plan en `.env`.
- El frontend usa URLs de checkout definidas en `VITE_MP_PLAN_*`.

## Android / TWA
- Ver `docs/android-twa.md` para empaquetar la PWA como APK.

## Proximos pasos sugeridos
- Migraciones y seeds controlados.
- Integracion de almacenamiento de imagenes externo.
- Analitica y reportes avanzados.

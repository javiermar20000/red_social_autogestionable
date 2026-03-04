# Backend

## Resumen
El backend es una API REST construida con Node.js + Express y TypeORM sobre PostgreSQL. Implementa autenticacion con JWT, roles de usuario (admin global, oferente y cliente/visitante), y aislamiento multi-tenant mediante politicas RLS en la base de datos. Tambien expone endpoints para negocios, publicaciones, categorias, comentarios y moderacion.

## Estructura relevante
- `backend/src/server.ts`: bootstrap del servidor, middleware base y arranque.
- `backend/src/routes.ts`: rutas REST principales.
- `backend/src/entities/`: entidades TypeORM (tenant, usuario, negocio, publicacion, categoria, comentario, media, etc.).
- `backend/src/middleware/auth.ts`: autenticacion JWT y control de roles.
- `backend/src/utils/rls.ts`: contexto RLS (setea `app.tenant_id` y `app.is_admin_global`).
- `backend/src/config/data-source.ts`: configuracion de TypeORM.

## Variables de entorno (ver `.env.example`)
- `PORT`: puerto del backend (por defecto 4000).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: conexion PostgreSQL.
- `JWT_SECRET`: secreto para firmar tokens.
- `REDIS_URL`: conexion Redis (cliente preparado).

## Scripts
- `npm run dev --prefix backend`: servidor en modo desarrollo.
- `npm run build --prefix backend`: compila TypeScript.
- `npm start --prefix backend`: ejecuta build en `dist/`.

## Multi-tenant y seguridad
- El aislamiento se basa en `tenant_id` y politicas RLS definidas en `db/init.sql`.
- `runWithContext` inyecta `app.tenant_id` y `app.is_admin_global` por transaccion.
- Roles principales: `admin` (admin_global), `OFERENTE`, `CLIENTE`/`VISITANTE`.

## Endpoints principales (resumen)
- Auth: `POST /auth/register`, `POST /auth/login`.
- Tenants: `GET /public/tenants`, `GET /tenants/me`, `POST /tenants`, aprobaciones admin.
- Usuarios (admin): `GET /admin/users/pending`, `POST /admin/users/:id/approve|reject`.
- Categorias: `GET /categories`, `GET /catalog/category-types`, `POST /categories`.
- Negocios: `GET /businesses`, `GET /businesses/:id`, `POST /businesses`, `PUT /businesses/:id`.
- Publicaciones: `POST /businesses/:id/publications`, `GET /businesses/:id/publications`, `GET /publications/mine`,
  `PUT /publications/:id`, `DELETE /publications/:id`.
- Feed: `GET /feed/publications`, `GET /feed/ads`.
- Moderacion (admin): `GET /admin/publications/pending`, `POST /admin/publications/:id/approve|reject`,
  `POST /admin/publications/:id/ads`.
- Interaccion: `GET/POST /publications/:id/comments`, `POST /publications/:id/visit`, `POST /publications/:id/like`.

## Observaciones y pendientes funcionales
- Redis esta definido en la infraestructura, pero su uso en la API aun es limitado.
- Funcionalidades solicitadas a futuro: conversaciones en PinCards, calificacion de alimentos y reservas con cobro.

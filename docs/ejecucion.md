# Ejecucion y operacion

## Requisitos
- Docker y Docker Compose.
- Node.js 18+ si ejecutas sin Docker.
- PostgreSQL 15 y Redis 7 si ejecutas sin Docker.

## Levantar con Docker
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

## Levantar sin Docker
Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev -- --host
```

Asegura `FRONTEND_ORIGIN` en `.env` y `VITE_API_PROXY_TARGET` en frontend.

## Variables de entorno esenciales
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- `JWT_SECRET`.
- `REDIS_URL`.
- `MP_ACCESS_TOKEN` y `MP_PLAN_*`.
- `VITE_API_URL`, `VITE_API_PROXY_TARGET`.

## Crear admin global y oferente demo
El repo incluye `crear_cuenta_admin.txt` con comandos listos para:
- Crear un admin global.
- Crear un oferente con tenant y suscripciones activas.

Ejecuta el archivo en la raiz del proyecto:
```bash
bash crear_cuenta_admin.txt
```

## Reset de base de datos
Si necesitas reiniciar el esquema desde cero:
```bash
docker compose down
# cuidado: el siguiente comando elimina datos
docker volume rm red_social_autogestionable_pgdata
```
Si configuraste `PGDATA_VOLUME_NAME`, usa ese nombre de volumen.

## Logs utiles
```bash
docker compose logs --tail=200 backend
```

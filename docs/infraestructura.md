# Infraestructura

## Docker Compose
El proyecto incluye `docker-compose.yml` con los siguientes servicios:
- `db`: PostgreSQL 15 (puerto 5432 en host).
- `redis`: Redis 7.2 (puerto 6379 en host).
- `backend`: Node/Express (con variables desde `.env`).
- `frontend`: Nginx sirviendo el build de Vite y haciendo proxy a `/api`.

## Puertos
- Frontend: `http://localhost:8081`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Nginx (frontend)
- Configuracion en `frontend/nginx.conf`.
- Hace proxy interno de `/api` hacia `backend:4000` dentro de la red Docker.

## Levantar servicios
```bash
cp .env.example .env
npm install --prefix backend
npm install --prefix frontend
docker compose up --build
```

## Notas
- El backend no expone puerto al host en Docker; se accede via Nginx.
- Si cambias el host/puerto del frontend, ajusta `FRONTEND_ORIGIN` en `.env`.
- Persistencia: por defecto el volumen es `red_social_autogestionable_pgdata` (nombre estándar de Compose). Para fijar un nombre estable entre re-deploys, define `PGDATA_VOLUME_NAME=red_social_pgdata` en `.env`.
- No uses `docker compose down -v` ni borres el volumen si quieres conservar datos.
- En producción, usa un volumen externo o una base de datos gestionada para evitar pérdida de datos por reinicios/redeploy.

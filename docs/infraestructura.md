# Infraestructura

## Docker Compose
El proyecto incluye `docker-compose.yml` con los siguientes servicios:
- `db`: PostgreSQL 15.
- `db-init`: inicializa la base desde `db/init.sql` o desde el ultimo backup.
- `db-backup`: backups periodicos con `pg_dump`.
- `redis`: Redis 7.2.
- `backend`: API Express.
- `frontend`: Nginx sirviendo el build de Vite y haciendo proxy a `/api`.

## Puertos
- Frontend: `http://localhost:8081`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Nginx
- Configuracion en `frontend/nginx.conf`.
- Proxy interno `/api` hacia `backend:4000`.
- Fallback SPA hacia `index.html`.

## Volumenes
- `pgdata`: datos de PostgreSQL.
- `pgbackups`: backups comprimidos.

## Backups
- `db-backup` ejecuta `pg_dump` cada `BACKUP_INTERVAL_SECONDS`.
- `BACKUP_RETENTION` controla la cantidad de archivos.
- `db-init` restaura desde `latest.sql.gz` si existe.

## Variables de entorno infra
- `PGDATA_VOLUME_NAME`, `PGBACKUP_VOLUME_NAME`.
- `BACKUP_INTERVAL_SECONDS`, `BACKUP_RETENTION`.

## Comandos principales
```bash
cp .env.example .env
npm install --prefix backend
npm install --prefix frontend
docker compose up --build
```

## Notas
- El backend no expone puerto al host en Docker; se accede via Nginx.
- Evita `docker compose down -v` si necesitas conservar datos.

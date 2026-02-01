#!/bin/sh
set -eu

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-red_social}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
INIT_SQL="${INIT_SQL:-/init/init.sql}"

export PGPASSWORD="${DB_PASSWORD}"

until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres >/dev/null 2>&1; do
  sleep 2
done

db_exists="$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")"
if [ "${db_exists}" != "1" ]; then
  createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"
  if [ -f "${BACKUP_DIR}/latest.sql.gz" ]; then
    gunzip -c "${BACKUP_DIR}/latest.sql.gz" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
  elif [ -f "${INIT_SQL}" ]; then
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${INIT_SQL}"
  fi
fi

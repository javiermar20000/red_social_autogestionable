#!/bin/sh
set -eu

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-red_social}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-3600}"
BACKUP_RETENTION="${BACKUP_RETENTION:-48}"

export PGPASSWORD="${DB_PASSWORD}"

mkdir -p "${BACKUP_DIR}"

while true; do
  if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres >/dev/null 2>&1; then
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
      ts="$(date -u +"%Y%m%d%H%M%S")"
      file="${BACKUP_DIR}/${DB_NAME}_${ts}.sql.gz"
      if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip -c > "${file}"; then
        ln -sf "$(basename "${file}")" "${BACKUP_DIR}/latest.sql.gz"
        extra="$(ls -1t "${BACKUP_DIR}"/${DB_NAME}_*.sql.gz 2>/dev/null | awk "NR>${BACKUP_RETENTION}")"
        if [ -n "${extra}" ]; then
          echo "${extra}" | xargs rm -f --
        fi
      fi
    fi
  fi
  sleep "${BACKUP_INTERVAL_SECONDS}"
done

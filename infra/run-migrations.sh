#!/usr/bin/env bash
# =============================================================
# DAVAL — Aplica migraciones en orden.
# Reutilizado por setup-dev.sh y deploy.sh.
#
# Variables (con defaults para dev):
#   PG_HOST      (default: localhost)
#   PG_PORT      (default: 5432)
#   PG_DB        (default: daval_db_dev)
#   PG_USER      (default: daval_dev)
#   PGPASSWORD   (default: daval_dev_pass)
#
# Aplica:
#   1) infra/migrate.sql               — esquema base idempotente
#   2) database/migrations/*.sql       — deltas idempotentes en orden
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_DB="${PG_DB:-daval_db_dev}"
PG_USER="${PG_USER:-daval_dev}"
export PGPASSWORD="${PGPASSWORD:-daval_dev_pass}"

PSQL=(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -X -q)

echo "  → Esquema base (infra/migrate.sql)"
"${PSQL[@]}" -f "$SCRIPT_DIR/migrate.sql"

MIG_DIR="$ROOT_DIR/database/migrations"
if [ -d "$MIG_DIR" ]; then
  shopt -s nullglob
  for f in "$MIG_DIR"/*.sql; do
    echo "  → $(basename "$f")"
    "${PSQL[@]}" -f "$f"
  done
fi

echo "  ✓ Migraciones aplicadas"

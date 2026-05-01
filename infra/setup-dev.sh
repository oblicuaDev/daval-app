#!/usr/bin/env bash
# =============================================================
# DAVAL APP — Setup entorno de desarrollo local
# Uso: bash infra/setup-dev.sh
# Requiere: psql, node >= 20, npm
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PG_SUPERUSER="${PG_SUPERUSER:-postgres}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"

echo ""
echo "========================================"
echo "  DAVAL APP — Setup Dev"
echo "========================================"

# -------------------------------------------# 1. Dependencias del API (no toca package.json si ya existe)
# ---------------------------------------------------------------
echo ""
echo "[1/4] Instalando dependencias del API..."
cd "$ROOT_DIR/api"
if [ ! -f package.json ]; then
  echo "  ✗ Falta api/package.json. Aborto." >&2
  exit 1
fi
npm install
cd "$ROOT_DIR"

# ---------------------------------------------------------------
# 2. Dependencias del frontend
# ---------------------------------------------------------------
echo ""
echo "[2/4] Instalando dependencias del frontend..."
cd "$ROOT_DIR"
npm install

# ---------------------------------------------------------------
# 3. Crear rol y base de datos
# ---------------------------------------------------------------
echo ""
echo "[3/4] Configurando PostgreSQL local (rol + DB)..."

# Password del superusuario: env var o prompt (sin eco)
if [ -z "${PG_SUPERUSER_PASSWORD:-}" ]; then
  read -r -s -p "  Password de '$PG_SUPERUSER' en $PG_HOST:$PG_PORT: " PG_SUPERUSER_PASSWORD
  echo ""
fi

PGPASSWORD="$PG_SUPERUSER_PASSWORD" \
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPERUSER" -v ON_ERROR_STOP=1 \
       -f "$SCRIPT_DIR/setup-dev.sql"

# ---------------------------------------------------------------
# 4. Migraciones (esquema base + deltas idempotentes)
# ---------------------------------------------------------------
echo ""
echo "[4/4] Aplicando migraciones..."
PG_HOST="$PG_HOST" PG_PORT="$PG_PORT" \
PG_DB=daval_db_dev PG_USER=daval_dev PGPASSWORD=daval_dev_pass \
  bash "$SCRIPT_DIR/run-migrations.sh"

# ---------------------------------------------------------------
# .env de ejemplo (no se sobreescribe si ya existe)
# ---------------------------------------------------------------
ENV_FILE="$ROOT_DIR/api/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
NODE_ENV=development
PORT=3000
TZ=America/Bogota

DB_HOST=localhost
DB_PORT=5432
DB_NAME=daval_db_dev
DB_USER=daval_dev
DB_PASSWORD=daval_dev_pass
DB_MAX_CONNECTIONS=10

JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES_IN=8h

CORS_ORIGIN=http://localhost:5173
EOF
  echo "  ✓ api/.env creado"
else
  echo "  ✓ api/.env ya existe (no sobreescrito)"
fi

# .env del frontend
WEB_ENV="$ROOT_DIR/.env"
if [ ! -f "$WEB_ENV" ]; then
  cat > "$WEB_ENV" <<'EOF'
VITE_API_URL=http://localhost:3000
EOF
  echo "  ✓ .env (frontend) creado"
fi

echo ""
echo "========================================"
echo "  ✓ Setup dev completado"
echo "  Backend:  cd api && npm run dev"
echo "  Frontend: npm run dev"
echo "========================================"
echo "  Setup completado exitosamente"
echo "  Iniciar API: cd api && npm run dev"
echo "========================================"
echo ""

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

# ---------------------------------------------------------------
# 1. Estructura de carpetas
# ---------------------------------------------------------------
echo ""
echo "[1/5] Creando estructura de carpetas..."

mkdir -p "$ROOT_DIR/api/src/config"
mkdir -p "$ROOT_DIR/api/src/routes"
mkdir -p "$ROOT_DIR/api/src/controllers"
mkdir -p "$ROOT_DIR/api/src/middleware"

echo "  ✓ api/src/{config,routes,controllers,middleware}"

# ---------------------------------------------------------------
# 2. package.json del API
# ---------------------------------------------------------------
echo ""
echo "[2/5] Inicializando package.json en api/..."

if [ ! -f "$ROOT_DIR/api/package.json" ]; then
  cd "$ROOT_DIR/api"
  npm init -y --quiet
  # Ajustes mínimos al package.json generado
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json'));
    pkg.name = 'daval-api';
    pkg.description = 'API Backend Daval App';
    pkg.main = 'src/index.js';
    pkg.scripts = {
      start: 'node --env-file=.env src/index.js',
      dev: 'node --env-file=.env --watch src/index.js'
    };
    pkg.engines = { node: '>=20.0.0' };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
  cd "$ROOT_DIR"
  echo "  ✓ package.json creado"
else
  echo "  ✓ package.json ya existe. Omitido."
fi

# ---------------------------------------------------------------
# 3. Instalar dependencias
# ---------------------------------------------------------------
echo ""
echo "[3/5] Instalando dependencias (express, pg, bcryptjs, jsonwebtoken)..."

cd "$ROOT_DIR/api"
npm install --save express pg bcryptjs jsonwebtoken
cd "$ROOT_DIR"
echo "  ✓ Dependencias instaladas"

# ---------------------------------------------------------------
# 4. Crear rol y base de datos
# ---------------------------------------------------------------
echo ""
echo "[4/5] Ejecutando setup-dev.sql (rol + base de datos)..."

psql \
  -h "$PG_HOST" \
  -p "$PG_PORT" \
  -U "$PG_SUPERUSER" \
  -f "$SCRIPT_DIR/setup-dev.sql"

echo "  ✓ Rol daval_dev y base de datos daval_db_dev listos"

# ---------------------------------------------------------------
# 5. Ejecutar migración
# ---------------------------------------------------------------
echo ""
echo "[5/5] Ejecutando migrate.sql (esquema completo)..."

PGPASSWORD="daval_dev_pass" psql \
  -h "$PG_HOST" \
  -p "$PG_PORT" \
  -U daval_dev \
  -d daval_db_dev \
  -f "$SCRIPT_DIR/migrate.sql"

echo "  ✓ Esquema aplicado correctamente"

# ---------------------------------------------------------------
# .env de ejemplo (no se sobreescribe si ya existe)
# ---------------------------------------------------------------
ENV_FILE="$ROOT_DIR/api/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
# DAVAL API — Variables de entorno DEV
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=daval_db_dev
DB_USER=daval_dev
DB_PASSWORD=daval_dev_pass
DB_MAX_CONNECTIONS=10

JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES_IN=8h
EOF
  echo ""
  echo "  ✓ api/.env creado con valores por defecto"
else
  echo ""
  echo "  ✓ api/.env ya existe. No se sobreescribió."
fi

echo ""
echo "========================================"
echo "  Setup completado exitosamente"
echo "  Iniciar API: cd api && npm run dev"
echo "========================================"
echo ""

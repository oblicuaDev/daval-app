#!/usr/bin/env bash
# =============================================================
# DAVAL APP — Setup de PostgreSQL en PROD (one-shot).
# Ejecutar como root en la VM:
#   sudo bash /var/www/davalapp/repo/infra/setup-db.sh
#
# Crea rol/DB de prod y aplica migraciones.
# Espera DB_PASSWORD en /var/www/davalapp/env/db.env (no versionado).
# =============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="/var/www/davalapp/env"
ENV_FILE="$ENV_DIR/db.env"

mkdir -p "$ENV_DIR"
if [ ! -f "$ENV_FILE" ]; then
  PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
  cat > "$ENV_FILE" <<EOF
PG_HOST=localhost
PG_PORT=5432
PG_DB=daval_db_prod
PG_USER=daval_prod
PGPASSWORD=$PASS
EOF
  chmod 600 "$ENV_FILE"
  echo "  ✓ Generado $ENV_FILE con password aleatorio"
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

echo "========================================"
echo " DAVAL — Setup PostgreSQL (PROD)"
echo "========================================"

# 1. Crear rol + DB con superusuario
sudo -u postgres psql -v PROD_PASS="'$PGPASSWORD'" -f "$SCRIPT_DIR/setup-prod.sql"

# 2. Aplicar migraciones (esquema base + deltas)
echo "Aplicando migraciones..."
bash "$SCRIPT_DIR/run-migrations.sh"

echo ""
echo "========================================"
echo " ✓ Base de datos lista"
echo "   DB:   $PG_DB"
echo "   User: $PG_USER"
echo "   Env:  $ENV_FILE  (¡no commitear!)"
echo "========================================"

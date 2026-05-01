#!/usr/bin/env bash
# =============================================================
# DAVAL APP — Bootstrap inicial de la VM (PROD, one-shot).
# Ejecutar como root, una sola vez:
#   sudo bash setup-prod.sh <git-remote-url>
#
# Instala Node 20, PM2, Nginx, PostgreSQL, clona el repo,
# crea estructura, prepara DB y deja listo para `deploy.sh`.
# =============================================================

set -euo pipefail

REPO_URL="${1:-}"
if [ -z "$REPO_URL" ]; then
  echo "Uso: sudo bash setup-prod.sh <git-remote-url>" >&2
  exit 1
fi

APP_DIR="/var/www/davalapp"
REPO_DIR="$APP_DIR/repo"
ENV_DIR="$APP_DIR/env"
LOG_DIR="/var/log/daval"

echo "========================================"
echo " DAVAL — Bootstrap VM (PROD)"
echo "========================================"

# 1. Paquetes del sistema
echo "[1/5] Instalando paquetes del sistema..."
apt-get update -y
apt-get install -y curl ca-certificates gnupg rsync git nginx postgresql postgresql-contrib openssl
# Node 20 vía NodeSource
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
# PM2 global
npm install -g pm2

# 2. Estructura de carpetas
echo "[2/5] Creando estructura..."
mkdir -p "$APP_DIR"/{api,client,env} "$LOG_DIR"
chown -R "$SUDO_USER":"$SUDO_USER" "$APP_DIR" "$LOG_DIR" 2>/dev/null || true

# 3. Clonar repo
echo "[3/5] Clonando repo..."
if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$REPO_URL" "$REPO_DIR"
else
  echo "  ✓ Repo ya existe, saltando clone"
fi

# 4. .env del API (placeholder; el operador debe completarlo)
API_ENV="$ENV_DIR/api.env"
if [ ! -f "$API_ENV" ]; then
  cat > "$API_ENV" <<'EOF'
NODE_ENV=production
PORT=3000
TZ=America/Bogota

DB_HOST=localhost
DB_PORT=5432
DB_NAME=daval_db_prod
DB_USER=daval_prod
DB_PASSWORD=__REEMPLAZAR__
DB_MAX_CONNECTIONS=10

JWT_SECRET=__GENERAR_CON_openssl_rand_-base64_48__
JWT_EXPIRES_IN=8h

CORS_ORIGIN=http://34.68.133.113
EOF
  chmod 600 "$API_ENV"
  echo "  ⚠ $API_ENV creado con placeholders. Editalo antes de seguir."
fi

# 5. PostgreSQL: rol + DB + migraciones
echo "[4/5] Configurando PostgreSQL..."
bash "$REPO_DIR/infra/setup-db.sh"

# Sincronizar password del .env del API con el generado en db.env
if grep -q '__REEMPLAZAR__' "$API_ENV"; then
  # shellcheck disable=SC1090
  source "$ENV_DIR/db.env"
  sed -i "s|DB_PASSWORD=__REEMPLAZAR__|DB_PASSWORD=$PGPASSWORD|" "$API_ENV"
  echo "  ✓ DB_PASSWORD escrito en $API_ENV"
fi

# 6. PM2 startup
echo "[5/5] PM2 al arranque del sistema..."
pm2 startup systemd -u "${SUDO_USER:-root}" --hp "$(eval echo ~"${SUDO_USER:-root}")" || true

echo ""
echo "========================================"
echo " ✓ Bootstrap completo"
echo " 1. Revisa $API_ENV (JWT_SECRET, CORS_ORIGIN)"
echo " 2. Lanza el primer deploy:"
echo "    sudo bash $REPO_DIR/infra/deploy.sh"
echo "========================================"

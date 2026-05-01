#!/usr/bin/env bash
# =============================================================
# DAVAL APP — Deploy en VM (PROD)
# Ejecutar en el servidor:
#   sudo bash /var/www/davalapp/repo/infra/deploy.sh
#
# Asume estructura:
#   /var/www/davalapp/
#     repo/      ← clon git (se hace pull aquí)
#     api/       ← código del backend en runtime
#     client/    ← build estático servido por Nginx
#     env/       ← .env del API (no versionado)
# =============================================================

set -euo pipefail

APP_DIR="/var/www/davalapp"
REPO_DIR="$APP_DIR/repo"
API_DIR="$APP_DIR/api"
CLIENT_DIR="$APP_DIR/client"
ENV_DIR="$APP_DIR/env"
NGINX_CONF="/etc/nginx/sites-available/daval"
LOG_DIR="/var/log/daval"

mkdir -p "$API_DIR" "$CLIENT_DIR" "$ENV_DIR" "$LOG_DIR"

echo "========================================"
echo " Deploy — Daval App (PROD)"
echo " $(date -u +'%F %T UTC')"
echo "========================================"

# ----------------------------------------------------------
# 1. Actualizar código (git pull)
# ----------------------------------------------------------
echo "[1/6] git pull en $REPO_DIR ..."
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "  ✗ No existe $REPO_DIR/.git. Ejecuta primero infra/setup-prod.sh"
  exit 1
fi
git -C "$REPO_DIR" fetch --all --prune
git -C "$REPO_DIR" reset --hard origin/main
echo "  ✓ HEAD: $(git -C "$REPO_DIR" rev-parse --short HEAD)"

# ----------------------------------------------------------
# 2. Migraciones de base de datos (idempotentes)
# ----------------------------------------------------------
echo "[2/6] Aplicando migraciones..."
if [ -f "$ENV_DIR/db.env" ]; then
  # shellcheck disable=SC1091
  set -a; source "$ENV_DIR/db.env"; set +a
fi
bash "$REPO_DIR/infra/run-migrations.sh"

# ----------------------------------------------------------
# 3. Backend: copiar código + instalar deps + reload PM2
# ----------------------------------------------------------
echo "[3/6] Sincronizando backend..."
rsync -a --delete \
  --exclude='node_modules' --exclude='.env' \
  "$REPO_DIR/api/" "$API_DIR/"

# .env vive en $ENV_DIR/api.env y se symlinkea
if [ -f "$ENV_DIR/api.env" ]; then
  ln -sf "$ENV_DIR/api.env" "$API_DIR/.env"
else
  echo "  ⚠ Falta $ENV_DIR/api.env (no se forzó symlink). El API no arrancará sin él."
fi

cd "$API_DIR"
npm ci --omit=dev
echo "  ✓ Backend dependencies instaladas"

# ----------------------------------------------------------
# 4. Frontend: build y publicar
# ----------------------------------------------------------
echo "[4/6] Build del frontend..."
cd "$REPO_DIR"
npm ci
npm run build
rsync -a --delete "$REPO_DIR/dist/" "$CLIENT_DIR/"
echo "  ✓ Build publicado en $CLIENT_DIR"

# ----------------------------------------------------------
# 5. PM2: arrancar o recargar el API
# ----------------------------------------------------------
echo "[5/6] PM2 (daval-api)..."
pm2 startOrReload "$REPO_DIR/infra/ecosystem.config.cjs" --env production --update-env
pm2 save
echo "  ✓ daval-api en línea"

# ----------------------------------------------------------
# 6. Nginx: configurar y recargar
# ----------------------------------------------------------
echo "[6/6] Nginx..."
cp "$REPO_DIR/infra/nginx.conf" "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/daval
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "  ✓ Nginx recargado"

echo ""
echo "========================================"
echo " ✅ Deploy completado"
echo " API:      http://$(hostname -I | awk '{print $1}')/api/health"
echo " Frontend: http://$(hostname -I | awk '{print $1}')"
echo " PM2:      pm2 status"
echo "========================================"

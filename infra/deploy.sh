#!/bin/bash
# Corre en el VM: bash /var/www/davalapp/infra/deploy.sh
set -e

APP_DIR="/var/www/davalapp"
NGINX_CONF="/etc/nginx/sites-available/daval"

echo "======================================"
echo " Deploy — Daval App"
echo " $(date)"
echo "======================================"

echo "[1/3] Configurando Nginx..."
cp "$APP_DIR/infra/nginx.conf" "$NGINX_CONF"

if [ ! -f "/etc/nginx/sites-enabled/daval" ]; then
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/daval
fi

rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo "[OK] Nginx recargado"

echo "[2/3] Verificando archivos del cliente..."
ls "$APP_DIR/client/" | head -5
echo "[OK] Archivos presentes"

echo "======================================"
echo " Deploy completado"
echo " http://34.68.133.113"
echo "======================================"

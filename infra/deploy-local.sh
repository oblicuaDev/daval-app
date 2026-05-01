#!/usr/bin/env bash
# =============================================================
# DAVAL APP — Trigger deploy desde la máquina local.
# Flujo: git push → SSH a la VM → ejecuta infra/deploy.sh.
#
# Requiere que el repo ya esté clonado en la VM en /var/www/davalapp/repo
# (corre infra/setup-prod.sh la primera vez).
#
# Uso:
#   bash infra/deploy-local.sh             # rama actual
#   BRANCH=main bash infra/deploy-local.sh
# =============================================================

set -euo pipefail

# Credenciales gcloud en Windows (Git Bash)
export CLOUDSDK_CONFIG="${CLOUDSDK_CONFIG:-$HOME/AppData/Roaming/gcloud}"

VM="${VM:-davalapp}"
ZONE="${ZONE:-us-central1-a}"
PROJECT="${PROJECT:-oblicua-tests}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
HOST_IP="${HOST_IP:-34.68.133.113}"

echo "=== [1/3] Push '$BRANCH' a origin ==="
if [ -n "$(git status --porcelain)" ]; then
  echo "  ✗ Working tree sucio. Commitea o stashea antes de desplegar." >&2
  git status --short
  exit 1
fi
git push origin "$BRANCH"

echo "=== [2/3] Ejecutando deploy.sh en $VM ==="
gcloud compute ssh "$VM" --zone="$ZONE" --project="$PROJECT" \
  --command="sudo bash /var/www/davalapp/repo/infra/deploy.sh"

echo "=== [3/3] Health check ==="
curl -fsSL --max-time 5 "http://$HOST_IP/api/health" || {
  echo "  ⚠ Health check falló. Revisa: pm2 logs daval-api"
  exit 1
}

echo ""
echo "=== ✅ Deploy listo → http://$HOST_IP ==="

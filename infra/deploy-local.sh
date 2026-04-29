set -e

# Fija las credenciales de gcloud para cualquier terminal en Windows
export CLOUDSDK_CONFIG="$HOME/AppData/Roaming/gcloud"

VM="davalapp"
ZONE="us-central1-a"
PROJECT="oblicua-tests"
REMOTE="/var/www/davalapp"

echo "=== [1/4] Build frontend ==="
npm run build

echo "=== [2/4] Preparar directorios en VM ==="
gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT \
  --command="sudo mkdir -p $REMOTE/client $REMOTE/infra $REMOTE/upload && sudo chmod 777 $REMOTE/client $REMOTE/infra $REMOTE/upload"

echo "=== [3/4] Upload archivos ==="
gcloud compute scp --recurse dist $VM:$REMOTE/upload/ \
  --zone=$ZONE --project=$PROJECT

gcloud compute scp infra/nginx.conf infra/deploy.sh $VM:$REMOTE/infra/ \
  --zone=$ZONE --project=$PROJECT

gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT \
  --command="sudo cp -r $REMOTE/upload/dist/. $REMOTE/client/ && sudo rm -rf $REMOTE/upload/dist"

echo "=== [4/4] Ejecutar deploy en VM ==="
gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT \
  --command="sudo bash $REMOTE/infra/deploy.sh"

echo ""
echo "=== Listo → http://34.68.133.113 ==="

/**
 * Supabase Storage via protocolo S3-compatible.
 * Más fiable que la REST API con JWT en entornos serverless.
 *
 * Variables de entorno requeridas:
 *   SUPABASE_S3_ENDPOINT   https://<project>.storage.supabase.co/storage/v1/s3
 *   SUPABASE_S3_ACCESS_KEY Access Key ID   (Supabase → Storage → S3 Connection)
 *   SUPABASE_S3_SECRET_KEY Secret Access Key
 *   SUPABASE_S3_REGION     (opcional, default: auto)
 *   SUPABASE_BUCKET        nombre del bucket (default: product-images)
 *
 * URL pública resultante:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = process.env.SUPABASE_BUCKET ?? 'product-images';

function buildPublicUrl(filename) {
  // Deriva la URL pública a partir del endpoint S3 o de SUPABASE_URL
  const endpoint = process.env.SUPABASE_S3_ENDPOINT ?? '';
  // endpoint = https://<project>.storage.supabase.co/storage/v1/s3
  // → base   = https://<project>.supabase.co
  const base = endpoint
    .replace('.storage.supabase.co/storage/v1/s3', '.supabase.co')
    .replace(/\/storage\/v1\/s3\/?$/, '');
  return `${base}/storage/v1/object/public/${BUCKET}/${filename}`;
}

function getClient() {
  const endpoint = process.env.SUPABASE_S3_ENDPOINT;
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY;
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Faltan variables: SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY, SUPABASE_S3_SECRET_KEY'
    );
  }

  return new S3Client({
    endpoint,
    region: process.env.SUPABASE_S3_REGION ?? 'auto',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // requerido por Supabase S3
  });
}

/**
 * Sube un Buffer al bucket de Supabase Storage.
 * @returns {Promise<string>} URL pública del archivo
 */
export async function uploadToStorage(buffer, filename, contentType) {
  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
  }));
  return buildPublicUrl(filename);
}

/**
 * Elimina un archivo del bucket. Ignora errores silenciosamente.
 */
export async function deleteFromStorage(url) {
  if (!url || !url.includes('/storage/v1/object/public/')) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const filename = url.split(marker)[1];
  if (!filename) return;

  try {
    const client = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: filename }));
  } catch { /* ignorar */ }
}

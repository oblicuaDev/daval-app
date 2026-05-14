/**
 * Helper para subir/eliminar imágenes en Supabase Storage.
 * Usa fetch nativo (Node 18+) — sin dependencias extra.
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL          https://<project>.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role key (solo backend, nunca frontend)
 *   SUPABASE_BUCKET       nombre del bucket (default: product-images)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET ?? 'product-images';

function storageBase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY para subir imágenes');
  }
  return `${SUPABASE_URL}/storage/v1/object`;
}

/**
 * Sube un Buffer al bucket de Supabase Storage.
 * @param {Buffer} buffer       Contenido del archivo
 * @param {string} filename     Nombre del archivo en el bucket (ej: "abc123.jpg")
 * @param {string} contentType  MIME type (ej: "image/jpeg")
 * @returns {Promise<string>}   URL pública del archivo
 */
export async function uploadToStorage(buffer, filename, contentType) {
  const base = storageBase();
  const res = await fetch(`${base}/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase Storage upload falló (${res.status}): ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

/**
 * Elimina un archivo del bucket de Supabase Storage.
 * Ignora errores (imagen no existente, URL externa, etc.).
 * @param {string|null} url  URL pública del archivo a eliminar
 */
export async function deleteFromStorage(url) {
  if (!url || !url.includes('/storage/v1/object/public/')) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const filename = url.split(marker)[1];
  if (!filename) return;

  const base = storageBase();
  await fetch(`${base}/${BUCKET}/${filename}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  }).catch(() => { /* ignorar errores de borrado */ });
}

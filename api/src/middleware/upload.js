import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Solo se permiten imágenes JPEG, PNG, WebP o GIF');
    err.code = 'INVALID_MIME';
    cb(err, false);
  }
}

// Memory storage — compatible con Vercel (sin disco persistente)
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
  fileFilter,
}).single('image');

/** Wraps multer.single para que los errores lleguen como ApiError shapes. */
export function handleUpload(req, res, next) {
  uploadSingle(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'La imagen no puede superar 5 MB' });
    }
    if (err.code === 'INVALID_MIME') {
      return res.status(400).json({ error: 'INVALID_MIME', message: err.message });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'UNEXPECTED_FILE', message: 'Campo de archivo inesperado' });
    }
    next(err);
  });
}

/** Genera nombre único para el archivo subido. */
export function generateFilename(file) {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  return `${crypto.randomBytes(16).toString('hex')}${ext}`;
}

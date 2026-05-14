// Servidor local de desarrollo — en Vercel se usa api/index.js en su lugar
import app from './app.js';
import pool from './config/db.js';
import { resetStuckSync } from './services/siigoSync.js';

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`[daval-api] listening on :${port} (TZ=${process.env.TZ})`);

  pool.query('SELECT 1')
    .then(() => console.log('[DB] Pool listo'))
    .catch((err) => console.error('[DB] Warmup falló (no es fatal):', err.message));

  resetStuckSync().catch((err) => console.error('[startup] resetStuckSync falló:', err.message));
});

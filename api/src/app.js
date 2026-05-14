import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import quotationsRouter from './routes/quotations.js';
import routesRouter from './routes/routes.js';
import adminRouter from './routes/admin.js';
import siigoRouter from './routes/siigo.js';
import { errorHandler, notFound } from './middleware/error.js';
import pool from './config/db.js';
import { resetStuckSync } from './services/siigoSync.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// ── Uploads locales (solo en desarrollo; en Vercel las imágenes van a Supabase Storage) ──
const uploadsPath = path.join(__dirname, '../uploads');
try { fs.mkdirSync(uploadsPath, { recursive: true }); } catch (_) { /* ignore */ }
app.use('/uploads', express.static(uploadsPath, { maxAge: '7d', immutable: false }));

// ── Reset de syncs colgados al primer request (compatible con serverless) ─────
let syncReset = false;
app.use((_req, _res, next) => {
  if (!syncReset) {
    syncReset = true;
    resetStuckSync().catch((err) => console.error('[resetStuck]', err.message));
  }
  next();
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, ts: new Date().toISOString(), db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, ts: new Date().toISOString(), db: err.message });
  }
});

// ── Rutas bajo /api (compatibles con Vercel rewrites) ─────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/stats', adminRouter.stats);
app.use('/api/categories', adminRouter.categories);
app.use('/api/price-lists', adminRouter.priceLists);
app.use('/api/companies', adminRouter.companies);
app.use('/api/promotions', adminRouter.promotions);
app.use('/api/users', adminRouter.users);
app.use('/api/integrations/siigo', siigoRouter);

app.use(notFound);
app.use(errorHandler);

export default app;

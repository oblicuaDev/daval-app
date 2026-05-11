import 'dotenv/config';
import path from 'path';
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

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Serve uploaded product images as public static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  immutable: false,
}));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/quotations', quotationsRouter);
app.use('/routes', routesRouter);
app.use('/stats', adminRouter.stats);
app.use('/categories', adminRouter.categories);
app.use('/price-lists', adminRouter.priceLists);
app.use('/companies', adminRouter.companies);
app.use('/integrations/siigo', siigoRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`[daval-api] listening on :${port} (TZ=${process.env.TZ})`);
});

import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { asyncHandler } from '../lib/validate.js';
import { testConnection } from '../lib/siigo/client.js';
import { startProductsSync, isSyncRunning } from '../services/siigoSync.js';
import { pushQuoteToSiigo, getIntegrationHistory } from '../services/siigoQuote.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')];

// =============================================================
// Settings
// =============================================================

const SettingsSchema = z.object({
  partnerId: z.string().min(1).optional(),
  username:  z.string().min(1).optional(),
  accessKey: z.string().min(1).optional(),    // sólo se actualiza si viene presente
  baseUrl:   z.string().url().optional(),
});

const maskKey = (k) => (k ? `${k.slice(0, 4)}…${k.slice(-4)}` : null);

router.get('/settings', adminOnly, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT partner_id, username, access_key, base_url,
            cached_token_expires,
            last_sync_started_at, last_sync_finished_at,
            last_sync_status, last_sync_count, last_sync_error
       FROM siigo_settings WHERE id = 1`
  );
  const s = r.rows[0];
  res.json({
    partnerId: s.partner_id,
    username: s.username,
    accessKey: maskKey(s.access_key),
    accessKeySet: !!s.access_key,
    baseUrl: s.base_url,
    tokenExpiresAt: s.cached_token_expires,
    lastSync: {
      startedAt: s.last_sync_started_at,
      finishedAt: s.last_sync_finished_at,
      status: s.last_sync_status,
      count: s.last_sync_count,
      error: s.last_sync_error,
    },
  });
}));

router.put('/settings', adminOnly, asyncHandler(async (req, res) => {
  const b = SettingsSchema.parse(req.body);
  const r = await query(
    `UPDATE siigo_settings SET
        partner_id = COALESCE($1, partner_id),
        username   = COALESCE($2, username),
        access_key = COALESCE($3, access_key),
        base_url   = COALESCE($4, base_url),
        -- al cambiar credenciales, invalida el token cacheado
        cached_token = CASE WHEN $3 IS NOT NULL OR $2 IS NOT NULL THEN NULL ELSE cached_token END,
        cached_token_expires = CASE WHEN $3 IS NOT NULL OR $2 IS NOT NULL THEN NULL ELSE cached_token_expires END,
        updated_at = NOW()
      WHERE id = 1
      RETURNING partner_id, username, base_url`,
    [b.partnerId ?? null, b.username ?? null, b.accessKey ?? null, b.baseUrl ?? null]
  );
  res.json({ updated: true, settings: r.rows[0] });
}));

// =============================================================
// Connection test
// =============================================================

router.post('/test-connection', adminOnly, asyncHandler(async (_req, res) => {
  const result = await testConnection();
  res.json(result);
}));

// =============================================================
// Product sync
// =============================================================

router.post('/sync/products', adminOnly, asyncHandler(async (req, res) => {
  const { logId } = await startProductsSync(req.user.sub);
  res.status(202).json({ accepted: true, logId, status: 'running' });
}));

router.get('/sync/status', adminOnly, asyncHandler(async (_req, res) => {
  const running = await isSyncRunning();
  const last = await query(
    `SELECT id, kind, status, started_at, finished_at,
            items_processed, items_created, items_updated, error_message
       FROM siigo_sync_logs
      WHERE kind = 'products'
      ORDER BY started_at DESC
      LIMIT 1`
  );
  res.json({ running, last: last.rows[0] ?? null });
}));

router.get('/sync/logs', adminOnly, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const r = await query(
    `SELECT l.id, l.kind, l.status, l.started_at, l.finished_at,
            l.items_processed, l.items_created, l.items_updated, l.error_message,
            u.name AS triggered_by_name
       FROM siigo_sync_logs l
  LEFT JOIN users u ON u.id = l.triggered_by
      ORDER BY l.started_at DESC
      LIMIT $1`,
    [limit]
  );
  res.json({ items: r.rows });
}));

// =============================================================
// Push de cotización a SIIGO
// POST /integrations/siigo/quotes/:quoteId
// POST /integrations/siigo/quotes/:quoteId/retry   (debug/admin — fuerza reenvío)
// =============================================================

router.post('/quotes/:quoteId', adminOnly, asyncHandler(async (req, res) => {
  const result = await pushQuoteToSiigo(
    req.params.quoteId,
    req.user.sub,
    { force: false }
  );
  res.status(201).json(result);
}));

router.post('/quotes/:quoteId/retry', adminOnly, asyncHandler(async (req, res) => {
  const result = await pushQuoteToSiigo(
    req.params.quoteId,
    req.user.sub,
    { force: true }
  );
  res.status(201).json(result);
}));

router.get('/quotes/:quoteId/history', adminOnly, asyncHandler(async (req, res) => {
  const items = await getIntegrationHistory(req.params.quoteId);
  res.json({ items });
}));

// Alias del endpoint legacy (mantiene compatibilidad si ya estaba siendo usado)
router.post('/quotations/:id/push', adminOnly, asyncHandler(async (req, res) => {
  const result = await pushQuoteToSiigo(
    req.params.id,
    req.user.sub,
    { force: false }
  );
  res.status(201).json(result);
}));

export default router;

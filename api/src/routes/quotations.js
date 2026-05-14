import { Router } from 'express';
import { z } from 'zod';
import { query, getClient } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { asyncHandler } from '../lib/validate.js';
import { resolvePrices } from '../lib/pricing.js';
import { computeRouteCutoff } from '../lib/cutoff.js';

const router = Router();

const CreateSchema = z.object({
  branchId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
});

/**
 * POST /quotations
 * - Cutoff is enforced server-side (locked rule).
 * - Pricing is resolved server-side (locked rule: min(promo, list)).
 * - Frontend never sends prices or advisorId for client-initiated quotations.
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const body = CreateSchema.parse(req.body);

  // Resolve client + branch + route + advisor (one trip)
  const ctx = await query(
    `SELECT c.id        AS client_id,
            c.price_list_id,
            cb.id       AS branch_id,
            cb.company_id,
            cb.advisor_id,
            r.id        AS route_id,
            r.day, r.cutoff_time
       FROM company_branches cb
       JOIN clients  c ON c.user_id = $1
       LEFT JOIN routes r ON r.id = cb.route_id
      WHERE cb.id = $2`,
    [req.user.sub, body.branchId]
  );
  const row = ctx.rows[0];
  if (!row) throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Branch not found for current user');

  // Cutoff guard
  const cutoff = computeRouteCutoff({ day: row.day, cutoff_time: row.cutoff_time });
  if (!cutoff.isOpen) {
    throw new ApiError(422, 'ROUTE_CLOSED', cutoff.message, { nextOpenDate: cutoff.nextOpenDate });
  }

  // Resolve prices
  const productIds = body.items.map(i => i.productId);
  const priceMap = await resolvePrices({
    productIds,
    priceListId: row.price_list_id,
    clientId: row.client_id,
  });
  for (const it of body.items) {
    if (!priceMap.has(it.productId)) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', `Product ${it.productId} not found`);
    }
  }

  const conn = await getClient();
  try {
    await conn.query('BEGIN');

    const code = `COT-${String(await nextSeq(conn)).padStart(6, '0')}`;
    const total = body.items.reduce((s, it) => s + (priceMap.get(it.productId).finalPrice * it.quantity), 0);

    const q = await conn.query(
      `INSERT INTO quotations (code, client_id, advisor_id, status, company_id, branch_id, notes, total)
       VALUES ($1, $2, $3, 'sent', $4, $5, $6, $7)
       RETURNING id, code, status, total, created_at`,
      [code, row.client_id, row.advisor_id, row.company_id, row.branch_id, body.notes ?? null, total]
    );
    const quotation = q.rows[0];

    // Bulk INSERT — un solo round-trip sin importar cuántos ítems tenga la cotización
    const itemValues = [];
    const itemParams = [];
    let pi = 1;
    for (const it of body.items) {
      const p = priceMap.get(it.productId);
      const priceType = p.promotionPrice != null && p.promotionPrice <= p.priceListPrice ? 'promotion' : 'price_list';
      const subtotal = p.finalPrice * it.quantity;
      itemValues.push(`($${pi},$${pi+1},$${pi+2},$${pi+3},$${pi+4},$${pi+5})`);
      itemParams.push(quotation.id, it.productId, it.quantity, priceType, p.finalPrice, subtotal);
      pi += 6;
    }
    await conn.query(
      `INSERT INTO quotation_items (quotation_id, product_id, quantity, price_type, unit_price, subtotal)
       VALUES ${itemValues.join(',')}`,
      itemParams
    );

    await conn.query('COMMIT');
    res.status(201).json(await loadQuotation(quotation.id));
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}));

/**
 * GET /quotations — scoped by role
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { status, clientId, advisorId } = req.query;
  const filters = [];
  const params = [];

  if (req.user.role === 'client') {
    params.push(req.user.sub);
    filters.push(`cl.user_id = $${params.length}`);
  } else if (req.user.role === 'advisor') {
    params.push(req.user.sub);
    filters.push(`q.advisor_id = $${params.length}`);
  } else {
    if (clientId)  { params.push(clientId);  filters.push(`q.client_id  = $${params.length}`); }
    if (advisorId) { params.push(advisorId); filters.push(`q.advisor_id = $${params.length}`); }
  }
  if (status) { params.push(status); filters.push(`q.status = $${params.length}`); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const r = await query(
    `SELECT q.id, q.code, q.status, q.total, q.created_at, q.updated_at,
            q.client_id, q.advisor_id, q.company_id, q.branch_id,
            cl.name AS client_name, co.name AS company_name, cb.name AS branch_name
       FROM quotations q
       JOIN clients cl ON cl.id = q.client_id
  LEFT JOIN companies co ON co.id = q.company_id
  LEFT JOIN company_branches cb ON cb.id = q.branch_id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT 200`,
    params
  );
  res.json({ items: r.rows.map(mapQuotationRow) });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const data = await loadQuotation(req.params.id, req.user);
  if (!data) throw new ApiError(404, 'NOT_FOUND', 'Quotation not found');
  res.json(data);
}));

// Comments
const CommentSchema = z.object({ text: z.string().min(1) });
router.post('/:id/comments', requireAuth, asyncHandler(async (req, res) => {
  const { text } = CommentSchema.parse(req.body);
  const r = await query(
    `INSERT INTO quotation_comments (quotation_id, author_id, text)
     VALUES ($1,$2,$3) RETURNING id, created_at`,
    [req.params.id, req.user.sub, text]
  );
  res.status(201).json({ id: r.rows[0].id, createdAt: r.rows[0].created_at });
}));

// Status patch (admin/advisor)
const StatusSchema = z.object({ status: z.enum(['draft','sent','pending','approved','rejected','synced','sent_to_siigo']) });
router.patch('/:id/status', requireAuth, requireRole('admin','advisor'), asyncHandler(async (req, res) => {
  const { status } = StatusSchema.parse(req.body);
  const r = await query(
    `UPDATE quotations SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, status`,
    [status, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Quotation not found');
  res.json(r.rows[0]);
}));

// SIIGO sync trigger (mock)
router.post('/:id/send-to-siigo', requireAuth, requireRole('admin','advisor'), asyncHandler(async (req, res) => {
  const fakeId = `SIIGO-${Date.now()}`;
  const fakeUrl = `https://siigo.local/quotation/${fakeId}`;
  const r = await query(
    `UPDATE quotations
        SET siigo_quotation_id=$1, siigo_url=$2, status='synced', updated_at=NOW()
      WHERE id=$3 RETURNING id, siigo_quotation_id, siigo_url, status`,
    [fakeId, fakeUrl, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Quotation not found');
  res.json(r.rows[0]);
}));

// Clone quotation — reuse items with fresh prices
router.post('/:id/clone', requireAuth, asyncHandler(async (req, res) => {
  const source = await loadQuotation(req.params.id, req.user);
  if (!source) throw new ApiError(404, 'NOT_FOUND', 'Quotation not found');
  if (!source.branchId) throw new ApiError(422, 'NO_BRANCH', 'Source quotation has no branch');

  const ctx = await query(
    `SELECT c.id AS client_id, c.price_list_id, cb.advisor_id, cb.company_id,
            r.id AS route_id, r.day, r.cutoff_time
       FROM company_branches cb
       JOIN clients c ON c.user_id = $1
       LEFT JOIN routes r ON r.id = cb.route_id
      WHERE cb.id = $2`,
    [req.user.sub, source.branchId]
  );
  if (!ctx.rows[0]) throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Branch not accessible');
  const row = ctx.rows[0];

  const cutoff = computeRouteCutoff({ day: row.day, cutoff_time: row.cutoff_time });
  if (!cutoff.isOpen) throw new ApiError(422, 'ROUTE_CLOSED', cutoff.message, { nextOpenDate: cutoff.nextOpenDate });

  const productIds = source.items.map(i => i.productId);
  const priceMap = await resolvePrices({ productIds, priceListId: row.price_list_id, clientId: row.client_id });

  const conn = await getClient();
  try {
    await conn.query('BEGIN');
    const code = `COT-${String(await nextSeq(conn)).padStart(6, '0')}`;
    const total = source.items.reduce((s, it) => s + (priceMap.get(it.productId)?.finalPrice ?? it.unitPrice) * it.quantity, 0);
    const q = await conn.query(
      `INSERT INTO quotations (code, client_id, advisor_id, status, company_id, branch_id, notes, total)
       VALUES ($1,$2,$3,'sent',$4,$5,$6,$7) RETURNING id, code, status, total, created_at`,
      [code, row.client_id, row.advisor_id, row.company_id, source.branchId, source.notes ?? null, total]
    );
    const quotation = q.rows[0];
    const itemValues = [];
    const itemParams = [];
    let pi = 1;
    for (const it of source.items) {
      const p = priceMap.get(it.productId);
      const priceType = p?.promotionPrice != null && p.promotionPrice <= p.priceListPrice ? 'promotion' : 'price_list';
      const unitPrice = p?.finalPrice ?? it.unitPrice;
      const subtotal = unitPrice * it.quantity;
      itemValues.push(`($${pi},$${pi+1},$${pi+2},$${pi+3},$${pi+4},$${pi+5})`);
      itemParams.push(quotation.id, it.productId, it.quantity, priceType, unitPrice, subtotal);
      pi += 6;
    }
    await conn.query(
      `INSERT INTO quotation_items (quotation_id, product_id, quantity, price_type, unit_price, subtotal) VALUES ${itemValues.join(',')}`,
      itemParams
    );
    await conn.query('COMMIT');
    res.status(201).json(await loadQuotation(quotation.id));
  } catch (e) { await conn.query('ROLLBACK'); throw e; } finally { conn.release(); }
}));

// ----- helpers -----
async function nextSeq(conn) {
  const r = await conn.query("SELECT nextval('quotation_code_seq') AS n");
  return r.rows[0].n;
}

function mapQuotationRow(q) {
  return {
    id: q.id, code: q.code, status: q.status,
    total: Number(q.total),
    clientId: q.client_id, clientName: q.client_name,
    advisorId: q.advisor_id,
    companyId: q.company_id, companyName: q.company_name,
    branchId: q.branch_id, branchName: q.branch_name,
    createdAt: q.created_at, updatedAt: q.updated_at,
  };
}

async function loadQuotation(id, user = null) {
  const q = await query(
    `SELECT q.*, cl.name AS client_name, co.name AS company_name, cb.name AS branch_name
       FROM quotations q
       JOIN clients cl ON cl.id = q.client_id
  LEFT JOIN companies co ON co.id = q.company_id
  LEFT JOIN company_branches cb ON cb.id = q.branch_id
      WHERE q.id = $1`,
    [id]
  );
  const row = q.rows[0];
  if (!row) return null;

  // Authorization scope check
  if (user) {
    if (user.role === 'client') {
      const ok = await query(`SELECT 1 FROM clients WHERE id=$1 AND user_id=$2`, [row.client_id, user.sub]);
      if (!ok.rowCount) return null;
    } else if (user.role === 'advisor' && row.advisor_id !== user.sub) {
      return null;
    }
  }

  const [items, comments, stalePrices] = await Promise.all([
    query(
      `SELECT qi.id, qi.product_id, p.name AS product_name, p.sku, qi.quantity, qi.price_type,
              qi.unit_price, qi.subtotal
         FROM quotation_items qi
         JOIN products p ON p.id = qi.product_id
        WHERE qi.quotation_id = $1
        ORDER BY qi.created_at`,
      [id]
    ),
    query(
      `SELECT c.id, c.text, c.created_at, u.id AS author_id, u.name AS author_name, u.role AS author_role
         FROM quotation_comments c
    LEFT JOIN users u ON u.id = c.author_id
        WHERE c.quotation_id = $1
        ORDER BY c.created_at`,
      [id]
    ),
    // Detecta si algún producto fue modificado después de crear la cotización
    // (indica que los precios históricos del item pueden no reflejar los actuales)
    query(
      `SELECT 1
         FROM quotation_items qi
         JOIN products p ON p.id = qi.product_id
        WHERE qi.quotation_id = $1
          AND p.updated_at > $2
        LIMIT 1`,
      [id, row.created_at]
    ),
  ]);

  return {
    ...mapQuotationRow(row),
    notes: row.notes,
    siigoUrl: row.siigo_url,
    siigoQuotationId: row.siigo_quotation_id,
    pricesOutdated: stalePrices.rowCount > 0,
    items: items.rows.map(it => ({
      id: it.id, productId: it.product_id, productName: it.product_name, sku: it.sku,
      quantity: Number(it.quantity), priceType: it.price_type,
      unitPrice: Number(it.unit_price), subtotal: Number(it.subtotal ?? it.unit_price * it.quantity),
    })),
    comments: comments.rows.map(c => ({
      id: c.id, text: c.text, createdAt: c.created_at,
      authorId: c.author_id, authorName: c.author_name, authorRole: c.author_role,
    })),
  };
}

export default router;

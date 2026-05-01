import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/validate.js';
import { resolvePrices } from '../lib/pricing.js';
import { ApiError } from '../middleware/error.js';

const router = Router();

/**
 * GET /products
 * Returns products with server-resolved pricing.
 * Pricing rules are encapsulated in lib/pricing.js — clients never compute price.
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { active, categoryId, search } = req.query;

  const filters = [];
  const params = [];
  if (active !== undefined) { params.push(active === 'true'); filters.push(`p.active = $${params.length}`); }
  if (categoryId)           { params.push(categoryId);        filters.push(`p.category_id = $${params.length}`); }
  if (search)               { params.push(`%${search}%`);     filters.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const r = await query(
    `SELECT p.id, p.sku, p.name, p.unit, p.stock, p.quality, p.image_url, p.active,
            p.category_id, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.name
       LIMIT 500`,
    params
  );

  // Resolve price list for the calling user
  let priceListId = null;
  let clientId = null;
  if (req.user.role === 'client') {
    const cli = await query(
      `SELECT id, price_list_id FROM clients WHERE user_id = $1 LIMIT 1`,
      [req.user.sub]
    );
    if (cli.rows[0]) { clientId = cli.rows[0].id; priceListId = cli.rows[0].price_list_id; }
  } else if (req.query.priceListId) {
    priceListId = req.query.priceListId;
  }

  const productIds = r.rows.map(p => p.id);
  const prices = await resolvePrices({ productIds, priceListId, clientId });

  const items = r.rows.map(p => {
    const pr = prices.get(p.id) ?? {};
    return {
      id: p.id, sku: p.sku, name: p.name,
      categoryId: p.category_id, categoryName: p.category_name,
      unit: p.unit, stock: Number(p.stock), quality: p.quality,
      imageUrl: p.image_url, active: p.active,
      basePrice: pr.basePrice ?? null,
      priceListPrice: pr.priceListPrice ?? null,
      promotionPrice: pr.promotionPrice ?? null,
      finalPrice: pr.finalPrice ?? null,
      priceListId: pr.priceListId ?? null,
    };
  });

  res.json({ items, total: items.length });
}));

// Admin: create
const CreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string().uuid().nullable().optional(),
  unit: z.string().optional(),
  stock: z.number().nonnegative().default(0),
  quality: z.string().optional(),
  imageUrl: z.string().optional(),
  basePrice: z.number().nonnegative().default(0),
  active: z.boolean().default(true),
});

router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const b = CreateSchema.parse(req.body);
  const r = await query(
    `INSERT INTO products (name, sku, category_id, unit, stock, quality, image_url, base_price, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [b.name, b.sku, b.categoryId ?? null, b.unit ?? null, b.stock, b.quality ?? null,
     b.imageUrl ?? null, b.basePrice, b.active]
  );
  res.status(201).json({ id: r.rows[0].id });
}));

// Admin: update
const UpdateSchema = CreateSchema.partial();
router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const b = UpdateSchema.parse(req.body);
  const set = [];
  const params = [];
  const map = { name:'name', sku:'sku', categoryId:'category_id', unit:'unit', stock:'stock',
                quality:'quality', imageUrl:'image_url', basePrice:'base_price', active:'active' };
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { params.push(b[k]); set.push(`${col} = $${params.length}`); }
  }
  if (!set.length) throw new ApiError(400, 'EMPTY_PATCH', 'No fields to update');
  params.push(req.params.id);
  const r = await query(
    `UPDATE products SET ${set.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Product not found');
  res.json({ id: r.rows[0].id });
}));

export default router;

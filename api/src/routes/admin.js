import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { asyncHandler } from '../lib/validate.js';

const adminOnly = [requireAuth, requireRole('admin')];

// ---------------- Categories ----------------
const categories = Router();
const CategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

categories.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(`SELECT id, name, description, active FROM categories ORDER BY name`);
  res.json({ items: r.rows });
}));
categories.post('/', adminOnly, asyncHandler(async (req, res) => {
  const b = CategorySchema.parse(req.body);
  const r = await query(
    `INSERT INTO categories (name, description, active) VALUES ($1,$2,$3) RETURNING id`,
    [b.name, b.description ?? null, b.active]
  );
  res.status(201).json({ id: r.rows[0].id });
}));
categories.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const b = CategorySchema.partial().parse(req.body);
  const r = await query(
    `UPDATE categories SET name = COALESCE($1, name),
                          description = COALESCE($2, description),
                          active = COALESCE($3, active)
      WHERE id = $4 RETURNING id`,
    [b.name ?? null, b.description ?? null, b.active ?? null, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Category not found');
  res.json({ id: r.rows[0].id });
}));
categories.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  await query(`DELETE FROM categories WHERE id=$1`, [req.params.id]);
  res.status(204).end();
}));

// ---------------- Price lists ----------------
const priceLists = Router();
const PriceListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  multiplier: z.number().positive().default(1),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
});

priceLists.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT id, name, description, multiplier, is_default, active
       FROM price_lists ORDER BY name`
  );
  res.json({ items: r.rows.map(x => ({ ...x, multiplier: Number(x.multiplier), isDefault: x.is_default })) });
}));
priceLists.post('/', adminOnly, asyncHandler(async (req, res) => {
  const b = PriceListSchema.parse(req.body);
  const r = await query(
    `INSERT INTO price_lists (name, description, multiplier, is_default, active)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [b.name, b.description ?? null, b.multiplier, b.isDefault, b.active]
  );
  res.status(201).json({ id: r.rows[0].id });
}));
priceLists.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const b = PriceListSchema.partial().parse(req.body);
  const r = await query(
    `UPDATE price_lists SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        multiplier = COALESCE($3, multiplier),
        is_default = COALESCE($4, is_default),
        active = COALESCE($5, active),
        updated_at = NOW()
      WHERE id = $6 RETURNING id`,
    [b.name ?? null, b.description ?? null, b.multiplier ?? null, b.isDefault ?? null, b.active ?? null, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Price list not found');
  res.json({ id: r.rows[0].id });
}));

// ---------------- Companies + branches ----------------
const companies = Router();
const CompanySchema = z.object({
  name: z.string().min(1),
  nit: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().default(true),
});
const BranchSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  routeId: z.string().uuid().nullable().optional(),
  advisorId: z.string().uuid().nullable().optional(),
  active: z.boolean().default(true),
});

companies.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT c.id, c.name, c.nit, c.email, c.phone, c.address, c.active,
            COALESCE(json_agg(json_build_object(
              'id', b.id, 'name', b.name, 'address', b.address, 'city', b.city,
              'routeId', b.route_id, 'advisorId', b.advisor_id, 'active', b.active
            )) FILTER (WHERE b.id IS NOT NULL), '[]') AS branches
       FROM companies c
  LEFT JOIN company_branches b ON b.company_id = c.id
      GROUP BY c.id ORDER BY c.name`
  );
  res.json({ items: r.rows });
}));
companies.post('/', adminOnly, asyncHandler(async (req, res) => {
  const b = CompanySchema.parse(req.body);
  const r = await query(
    `INSERT INTO companies (name, nit, email, phone, address, active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [b.name, b.nit, b.email ?? null, b.phone ?? null, b.address ?? null, b.active]
  );
  res.status(201).json({ id: r.rows[0].id });
}));
companies.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const b = CompanySchema.partial().parse(req.body);
  const r = await query(
    `UPDATE companies SET
        name = COALESCE($1, name),
        nit = COALESCE($2, nit),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        active = COALESCE($6, active),
        updated_at = NOW()
      WHERE id = $7 RETURNING id`,
    [b.name ?? null, b.nit ?? null, b.email ?? null, b.phone ?? null, b.address ?? null, b.active ?? null, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Company not found');
  res.json({ id: r.rows[0].id });
}));

companies.post('/:id/branches', adminOnly, asyncHandler(async (req, res) => {
  const b = BranchSchema.parse(req.body);
  const r = await query(
    `INSERT INTO company_branches (company_id, name, address, city, route_id, advisor_id, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.params.id, b.name, b.address ?? null, b.city ?? null, b.routeId ?? null, b.advisorId ?? null, b.active]
  );
  res.status(201).json({ id: r.rows[0].id });
}));
companies.put('/:id/branches/:branchId', adminOnly, asyncHandler(async (req, res) => {
  const b = BranchSchema.partial().parse(req.body);
  const r = await query(
    `UPDATE company_branches SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        route_id = COALESCE($4, route_id),
        advisor_id = COALESCE($5, advisor_id),
        active = COALESCE($6, active),
        updated_at = NOW()
      WHERE id = $7 AND company_id = $8 RETURNING id`,
    [b.name ?? null, b.address ?? null, b.city ?? null, b.routeId ?? null, b.advisorId ?? null,
     b.active ?? null, req.params.branchId, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Branch not found');
  res.json({ id: r.rows[0].id });
}));

// ---------------- Stats ----------------
const stats = Router();
stats.get('/admin', adminOnly, asyncHandler(async (_req, res) => {
  const totals = await query(
    `SELECT COUNT(*)::int AS orders_count, COALESCE(SUM(total),0) AS total_revenue
       FROM quotations WHERE status <> 'rejected'`
  );
  const top = await query(
    `SELECT p.id, p.name, SUM(qi.quantity) AS qty, SUM(qi.subtotal) AS total
       FROM quotation_items qi
       JOIN products p ON p.id = qi.product_id
       JOIN quotations q ON q.id = qi.quotation_id
      WHERE q.status <> 'rejected'
      GROUP BY p.id, p.name
      ORDER BY total DESC
      LIMIT 10`
  );
  const recent = await query(
    `SELECT q.id, q.code, q.total, q.status, q.created_at, c.name AS client_name
       FROM quotations q
       JOIN clients c ON c.id = q.client_id
      ORDER BY q.created_at DESC LIMIT 10`
  );
  const monthly = await query(
    `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
            SUM(total) AS total
       FROM quotations
      WHERE status <> 'rejected'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1 ORDER BY 1`
  );
  res.json({
    totalRevenue: Number(totals.rows[0].total_revenue),
    ordersCount: totals.rows[0].orders_count,
    topProducts: top.rows.map(r => ({ id: r.id, name: r.name, qty: Number(r.qty), total: Number(r.total) })),
    recentOrders: recent.rows,
    monthlyRevenue: monthly.rows.map(r => ({ month: r.month, total: Number(r.total) })),
  });
}));

export default { categories, priceLists, companies, stats };

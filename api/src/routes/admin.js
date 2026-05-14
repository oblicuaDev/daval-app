import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, getClient } from '../config/db.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { asyncHandler } from '../lib/validate.js';
import { sendAdvisorNewClientEmail } from '../lib/mailer.js';

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
priceLists.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM price_lists WHERE id=$1', [req.params.id]);
  res.status(204).end();
}));

// GET /price-lists/:id/products — list products with custom price in this list
priceLists.get('/:id/products', requireAuth, asyncHandler(async (req, res) => {
  const r = await query(
    `SELECT p.id AS product_id, p.sku, p.name, p.unit, p.active, p.base_price,
            ppl.price AS custom_price
       FROM products p
       LEFT JOIN product_price_lists ppl
         ON ppl.product_id = p.id AND ppl.price_list_id = $1
      ORDER BY p.name`,
    [req.params.id]
  );
  res.json({ items: r.rows.map(x => ({
    productId: x.product_id,
    sku: x.sku, name: x.name, unit: x.unit, active: x.active,
    basePrice: Number(x.base_price),
    customPrice: x.custom_price != null ? Number(x.custom_price) : null,
  }))});
}));

// POST /price-lists/:id/products — bulk upsert (replaces all custom prices for this list)
priceLists.post('/:id/products', adminOnly, asyncHandler(async (req, res) => {
  const items = z.array(z.object({
    productId: z.string().uuid(),
    price: z.number().nonnegative(),
  })).parse(req.body.items ?? []);

  const plr = await query('SELECT name FROM price_lists WHERE id=$1', [req.params.id]);
  if (!plr.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Price list not found');
  const listName = plr.rows[0].name;

  const conn = await getClient();
  try {
    await conn.query('BEGIN');
    await conn.query('DELETE FROM product_price_lists WHERE price_list_id=$1', [req.params.id]);
    if (items.length) {
      const vals = items.map((_, i) => `($${i * 3 + 1},$${i * 3 + 2},$${i * 3 + 3},$${items.length * 3 + 1})`).join(',');
      const params = items.flatMap(it => [it.productId, it.price, listName]);
      params.push(req.params.id);
      await conn.query(
        `INSERT INTO product_price_lists (product_id, price, price_list_name, price_list_id) VALUES ${vals}`,
        params
      );
    }
    await conn.query('COMMIT');
    res.json({ updated: items.length });
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
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
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  active: z.boolean().default(true),
});

companies.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT c.id, c.name, c.nit, c.email, c.phone, c.address, c.active,
            COALESCE(json_agg(json_build_object(
              'id', b.id, 'name', b.name, 'address', b.address, 'city', b.city,
              'routeId', b.route_id, 'advisorId', b.advisor_id, 'active', b.active,
              'latitude', b.latitude, 'longitude', b.longitude
            )) FILTER (WHERE b.id IS NOT NULL), '[]') AS branches
       FROM companies c
  LEFT JOIN company_branches b ON b.company_id = c.id
      GROUP BY c.id ORDER BY c.name`
  );
  res.json({ items: r.rows });
}));
// POST /companies — público: permite auto-registro de empresas sin sesión previa
companies.post('/', asyncHandler(async (req, res) => {
  const b = CompanySchema.parse(req.body);
  const r = await query(
    `INSERT INTO companies (name, nit, email, phone, address, active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [b.name, b.nit, b.email ?? null, b.phone ?? null, b.address ?? null, b.active]
  );
  console.log(`[companies] nueva empresa registrada: ${b.name} (NIT ${b.nit})`);
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

// POST /companies/:id/branches — público para auto-registro; routeId/advisorId solo para admins
companies.post('/:id/branches', optionalAuth, asyncHandler(async (req, res) => {
  const b = BranchSchema.parse(req.body);
  const isAdmin = req.user?.role === 'admin';
  const r = await query(
    `INSERT INTO company_branches (company_id, name, address, city, route_id, advisor_id, active, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [req.params.id, b.name, b.address ?? null, b.city ?? null,
     isAdmin ? (b.routeId ?? null) : null,
     isAdmin ? (b.advisorId ?? null) : null,
     b.active, b.latitude ?? null, b.longitude ?? null]
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
        latitude = COALESCE($7, latitude),
        longitude = COALESCE($8, longitude),
        updated_at = NOW()
      WHERE id = $9 AND company_id = $10 RETURNING id`,
    [b.name ?? null, b.address ?? null, b.city ?? null, b.routeId ?? null, b.advisorId ?? null,
     b.active ?? null, b.latitude ?? null, b.longitude ?? null, req.params.branchId, req.params.id]
  );
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Branch not found');
  res.json({ id: r.rows[0].id });
}));
companies.delete('/:id/branches/:branchId', adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM company_branches WHERE id=$1 AND company_id=$2', [req.params.branchId, req.params.id]);
  res.status(204).end();
}));
companies.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM companies WHERE id=$1', [req.params.id]);
  res.status(204).end();
}));

// ---------------- Stats ----------------
const stats = Router();
stats.get('/admin', adminOnly, asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const dateParams = [];
  const dateFilter = [];
  if (dateFrom) { dateParams.push(dateFrom); dateFilter.push(`created_at >= $${dateParams.length}`); }
  if (dateTo)   { dateParams.push(dateTo);   dateFilter.push(`created_at <= $${dateParams.length}`); }
  const dateWhere = dateFilter.length ? `AND ${dateFilter.join(' AND ')}` : '';

  const [totals, top, recent, monthly] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS orders_count, COALESCE(SUM(total),0) AS total_revenue
         FROM quotations WHERE status <> 'rejected' ${dateWhere}`,
      dateParams
    ),
    query(
      `SELECT p.id, p.name, SUM(qi.quantity) AS qty, SUM(qi.subtotal) AS total
         FROM quotation_items qi
         JOIN products p ON p.id = qi.product_id
         JOIN quotations q ON q.id = qi.quotation_id
        WHERE q.status <> 'rejected' ${dateWhere.replace(/created_at/g, 'q.created_at')}
        GROUP BY p.id, p.name
        ORDER BY total DESC
        LIMIT 10`,
      dateParams
    ),
    query(
      `SELECT q.id, q.code, q.total, q.status, q.created_at, q.siigo_url,
              c.name AS client_name
         FROM quotations q
         JOIN clients c ON c.id = q.client_id
        WHERE 1=1 ${dateWhere}
        ORDER BY q.created_at DESC LIMIT 10`,
      dateParams
    ),
    query(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
              SUM(total) AS total
         FROM quotations
        WHERE status <> 'rejected'
          AND created_at >= NOW() - INTERVAL '12 months'
          ${dateWhere}
        GROUP BY 1 ORDER BY 1`,
      dateParams
    ),
  ]);
  res.json({
    totalRevenue: Number(totals.rows[0].total_revenue),
    ordersCount: totals.rows[0].orders_count,
    topProducts: top.rows.map(r => ({ id: r.id, name: r.name, qty: Number(r.qty), total: Number(r.total) })),
    recentOrders: recent.rows,
    monthlyRevenue: monthly.rows.map(r => ({ month: r.month, total: Number(r.total) })),
  });
}));

stats.get('/advisor', requireAuth, requireRole('admin', 'advisor'), asyncHandler(async (req, res) => {
  const advisorId = req.user.role === 'advisor' ? req.user.sub : (req.query.advisorId ?? null);
  const params = advisorId ? [advisorId] : [];
  const advisorFilter = advisorId ? `AND q.advisor_id = $1` : '';

  const totals = await query(
    `SELECT COUNT(*)::int AS orders_count, COALESCE(SUM(total),0) AS total_revenue
       FROM quotations q WHERE status <> 'rejected' ${advisorFilter}`,
    params
  );
  const top = await query(
    `SELECT p.id, p.name, SUM(qi.quantity) AS qty, SUM(qi.subtotal) AS total
       FROM quotation_items qi
       JOIN products p ON p.id = qi.product_id
       JOIN quotations q ON q.id = qi.quotation_id
      WHERE q.status <> 'rejected' ${advisorFilter}
      GROUP BY p.id, p.name ORDER BY total DESC LIMIT 10`,
    params
  );
  const recent = await query(
    `SELECT q.id, q.code, q.total, q.status, q.created_at, cl.name AS client_name
       FROM quotations q
       JOIN clients cl ON cl.id = q.client_id
      WHERE 1=1 ${advisorFilter}
      ORDER BY q.created_at DESC LIMIT 10`,
    params
  );
  const monthly = await query(
    `SELECT to_char(date_trunc('month', q.created_at), 'YYYY-MM') AS month, SUM(q.total) AS total
       FROM quotations q
      WHERE q.status <> 'rejected'
        AND q.created_at >= NOW() - INTERVAL '12 months'
        ${advisorFilter}
      GROUP BY 1 ORDER BY 1`,
    params
  );
  res.json({
    totalRevenue: Number(totals.rows[0].total_revenue),
    ordersCount: totals.rows[0].orders_count,
    topProducts: top.rows.map(r => ({ id: r.id, name: r.name, qty: Number(r.qty), total: Number(r.total) })),
    recentOrders: recent.rows,
    monthlyRevenue: monthly.rows.map(r => ({ month: r.month, total: Number(r.total) })),
  });
}));

// ---------------- Promotions ----------------
const promotions = Router();
const PromotionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  kind: z.enum(['permanent', 'eventual']).default('eventual'),
  scope: z.enum(['all', 'specific']),
  startsAt: z.string(),
  endsAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.kind === 'eventual' && !data.endsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'endsAt requerido para promociones eventuales' });
  }
});

promotions.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT p.id, p.name, p.description, p.kind, p.scope, p.starts_at, p.ends_at, p.active,
            COALESCE(json_agg(DISTINCT jsonb_build_object('sku',pp.sku,'price',pp.price))
              FILTER (WHERE pp.sku IS NOT NULL), '[]') AS prices,
            COALESCE(json_agg(DISTINCT pc.client_id) FILTER (WHERE pc.client_id IS NOT NULL), '[]') AS client_ids
       FROM promotions p
       LEFT JOIN promotion_prices pp ON pp.promotion_id = p.id
       LEFT JOIN promotion_clients pc ON pc.promotion_id = p.id
      GROUP BY p.id ORDER BY p.starts_at DESC`
  );
  res.json({ items: r.rows.map(x => ({
    id: x.id, name: x.name, description: x.description,
    kind: x.kind ?? 'eventual', scope: x.scope,
    startsAt: x.starts_at, endsAt: x.ends_at, active: x.active,
    prices: x.prices, clientIds: x.client_ids,
  }))});
}));

promotions.post('/', adminOnly, asyncHandler(async (req, res) => {
  const b = PromotionSchema.parse(req.body);
  const prices = req.body.prices ?? [];
  const clientIds = req.body.clientIds ?? [];
  const conn = await getClient();
  try {
    await conn.query('BEGIN');
    const r = await conn.query(
      `INSERT INTO promotions (name, description, kind, scope, starts_at, ends_at, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [b.name, b.description ?? null, b.kind, b.scope, b.startsAt, b.endsAt ?? null, b.active]
    );
    const id = r.rows[0].id;
    if (prices.length) {
      const vals = prices.map((_, i) => `($1,$${i * 2 + 2},$${i * 2 + 3})`).join(',');
      const priceParams = [id, ...prices.flatMap(p => [p.sku, p.price])];
      await conn.query(`INSERT INTO promotion_prices (promotion_id,sku,price) VALUES ${vals}`, priceParams);
    }
    if (b.scope === 'specific' && clientIds.length) {
      const vals = clientIds.map((_, i) => `($1,$${i + 2})`).join(',');
      await conn.query(`INSERT INTO promotion_clients (promotion_id,client_id) VALUES ${vals}`, [id, ...clientIds]);
    }
    await conn.query('COMMIT');
    res.status(201).json({ id });
  } catch (e) { await conn.query('ROLLBACK'); throw e; } finally { conn.release(); }
}));

promotions.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const b = PromotionSchema.partial().parse(req.body);
  const { prices, clientIds } = req.body;
  const conn = await getClient();
  try {
    await conn.query('BEGIN');
    await conn.query(
      `UPDATE promotions SET
          name = COALESCE($1, name), description = COALESCE($2, description),
          kind = COALESCE($3, kind), scope = COALESCE($4, scope),
          starts_at = COALESCE($5, starts_at),
          ends_at = $6,
          active = COALESCE($7, active), updated_at = NOW()
        WHERE id = $8`,
      [b.name ?? null, b.description ?? null, b.kind ?? null, b.scope ?? null,
       b.startsAt ?? null, b.endsAt ?? null, b.active ?? null, req.params.id]
    );
    if (prices !== undefined) {
      await conn.query('DELETE FROM promotion_prices WHERE promotion_id=$1', [req.params.id]);
      if (prices.length) {
        const vals = prices.map((_, i) => `($1,$${i * 2 + 2},$${i * 2 + 3})`).join(',');
        await conn.query(
          `INSERT INTO promotion_prices (promotion_id,sku,price) VALUES ${vals}`,
          [req.params.id, ...prices.flatMap(p => [p.sku, p.price])]
        );
      }
    }
    if (clientIds !== undefined) {
      await conn.query('DELETE FROM promotion_clients WHERE promotion_id=$1', [req.params.id]);
      if (clientIds.length) {
        const vals = clientIds.map((_, i) => `($1,$${i + 2})`).join(',');
        await conn.query(`INSERT INTO promotion_clients (promotion_id,client_id) VALUES ${vals}`, [req.params.id, ...clientIds]);
      }
    }
    await conn.query('COMMIT');
    res.json({ id: req.params.id });
  } catch (e) { await conn.query('ROLLBACK'); throw e; } finally { conn.release(); }
}));

promotions.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  await query('DELETE FROM promotions WHERE id=$1', [req.params.id]);
  res.status(204).end();
}));

// ---------------- Users (admin CRUD) ----------------
const users = Router();
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'advisor', 'client']),
  companyId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  active: z.boolean().default(true),
});

users.get('/', adminOnly, asyncHandler(async (req, res) => {
  const { role } = req.query;
  const params = [];
  const where = role ? (params.push(role), `WHERE u.role = $1`) : '';
  const r = await query(
    `SELECT u.id, u.name, u.email, u.role, u.active, u.company_id, u.branch_id, u.created_at,
            c.id AS client_id, c.price_list_id, c.advisor_id AS client_advisor_id, c.route_id,
            pl.name AS price_list_name,
            co.name AS company_name,
            cb.name AS branch_name
       FROM users u
       LEFT JOIN clients c ON c.user_id = u.id
       LEFT JOIN price_lists pl ON pl.id = c.price_list_id
       LEFT JOIN companies co ON co.id = u.company_id
       LEFT JOIN company_branches cb ON cb.id = u.branch_id
       ${where} ORDER BY u.name`,
    params
  );
  res.json({ items: r.rows.map(x => ({
    id: x.id, name: x.name, email: x.email, role: x.role, active: x.active,
    companyId: x.company_id, branchId: x.branch_id, createdAt: x.created_at,
    clientId: x.client_id, priceListId: x.price_list_id,
    advisorId: x.client_advisor_id, routeId: x.route_id,
    priceListName: x.price_list_name,
    companyName: x.company_name,
    branchName: x.branch_name,
  }))});
}));

const UserCreateSchema = UserSchema.extend({
  priceListId: z.string().uuid().nullable().optional(),
});

// POST /users — público para auto-registro de clientes; solo admins pueden asignar otros roles
users.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const raw = req.body;
  // Unauthenticated callers can only create client accounts
  if (!isAdmin && raw.role && raw.role !== 'client') {
    throw new ApiError(403, 'FORBIDDEN', 'Solo se permite el rol client en auto-registro');
  }
  if (!isAdmin) raw.role = 'client';

  const b = UserCreateSchema.parse(raw);
  if (!b.password) throw new ApiError(400, 'MISSING_PASSWORD', 'password required for new users');
  const hash = await bcrypt.hash(b.password, 10);

  const conn = await getClient();
  try {
    await conn.query('BEGIN');
    const r = await conn.query(
      `INSERT INTO users (name, email, password_hash, role, active, company_id, branch_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [b.name, b.email, hash, b.role, b.active, b.companyId ?? null, b.branchId ?? null]
    );
    const userId = r.rows[0].id;

    if (b.role === 'client') {
      // resolve route from branch if provided
      let routeId = null;
      if (b.branchId) {
        const br = await conn.query('SELECT route_id FROM company_branches WHERE id=$1', [b.branchId]);
        routeId = br.rows[0]?.route_id ?? null;
      }
      await conn.query(
        `INSERT INTO clients (name, nit, email, user_id, price_list_id, route_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [b.name, `NIT-${userId.slice(0, 8)}`, b.email, userId, b.priceListId ?? null, routeId]
      );
    }

    await conn.query('COMMIT');
    res.status(201).json({ id: userId });

    // Notificación al asesor (fire-and-forget — no bloquea la respuesta)
    if (b.role === 'client' && b.branchId) {
      query(
        `SELECT u.name, u.email
           FROM users u
           JOIN company_branches cb ON cb.advisor_id = u.id
          WHERE cb.id = $1 LIMIT 1`,
        [b.branchId]
      ).then(async (advisorRows) => {
        const advisor = advisorRows.rows[0];
        if (!advisor) return;
        await sendAdvisorNewClientEmail({
          advisorEmail: advisor.email,
          advisorName: advisor.name,
          clientName: b.name,
          clientEmail: b.email,
          clientNit: `NIT-${userId.slice(0, 8)}`,
        });
      }).catch((err) => {
        console.error('[admin/users] error enviando email al asesor:', err.message);
      });
    }
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  } finally {
    conn.release();
  }
}));

users.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const b = UserSchema.partial().parse(req.body);
  const sets = [];
  const params = [];
  const map = { name: 'name', email: 'email', role: 'role', active: 'active', companyId: 'company_id', branchId: 'branch_id' };
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { params.push(b[k]); sets.push(`${col}=$${params.length}`); }
  }
  if (b.password) { const h = await bcrypt.hash(b.password, 10); params.push(h); sets.push(`password_hash=$${params.length}`); }
  if (!sets.length) throw new ApiError(400, 'EMPTY_PATCH', 'No fields to update');
  sets.push('updated_at=NOW()');
  params.push(req.params.id);
  const r = await query(`UPDATE users SET ${sets.join(',')} WHERE id=$${params.length} RETURNING id`, params);
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  res.json({ id: r.rows[0].id });
}));

users.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  await query(`UPDATE users SET active=FALSE, updated_at=NOW() WHERE id=$1`, [req.params.id]);
  res.status(204).end();
}));

export default { categories, priceLists, companies, stats, promotions, users };

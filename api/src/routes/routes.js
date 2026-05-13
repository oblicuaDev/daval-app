import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { computeRouteCutoff } from '../lib/cutoff.js';
import { asyncHandler } from '../lib/validate.js';

const adminOnly = [requireAuth, requireRole('admin')];

const router = Router();

// List routes (admin/advisor consume; clients use /me/cutoff)
router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT id, name, description, day, cutoff_time, city, quadrant_id, quadrant_name,
            bounds, center, map_zone, street_from, street_to, carrera_from, carrera_to,
            advisor_id, active
       FROM routes WHERE active=TRUE ORDER BY name`
  );
  res.json({ items: r.rows.map(row => ({
    id: row.id, name: row.name, description: row.description,
    day: row.day, cutoffTime: row.cutoff_time, city: row.city,
    quadrantId: row.quadrant_id, quadrantName: row.quadrant_name,
    bounds: row.bounds, center: row.center,
    mapZone: row.map_zone, streetFrom: row.street_from, streetTo: row.street_to,
    carreraFrom: row.carrera_from, carreraTo: row.carrera_to,
    advisorId: row.advisor_id, active: row.active,
  })) });
}));

// Server-authoritative cutoff for the current client user
router.get('/me/cutoff', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'client') {
    throw new ApiError(403, 'FORBIDDEN', 'Only client users have a route cutoff');
  }
  const r = await query(
    `SELECT r.id, r.name, r.day, r.cutoff_time
       FROM users u
       JOIN clients c ON c.user_id = u.id
       JOIN routes  r ON r.id = c.route_id
      WHERE u.id = $1 AND r.active = TRUE`,
    [req.user.sub]
  );
  const route = r.rows[0];
  const status = computeRouteCutoff(route);
  res.json({ route: route ?? null, ...status });
}));

const RouteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  day: z.string().optional(),
  cutoffTime: z.string().optional(),
  city: z.string().optional(),
  mapZone: z.string().optional(),
  quadrantId: z.string().optional(),
  quadrantName: z.string().optional(),
  streetFrom: z.string().optional(),
  streetTo: z.string().optional(),
  carreraFrom: z.string().optional(),
  carreraTo: z.string().optional(),
  bounds: z.any().optional(),
  center: z.any().optional(),
  advisorId: z.string().uuid().nullable().optional(),
  active: z.boolean().default(true),
});

router.post('/', adminOnly, asyncHandler(async (req, res) => {
  const b = RouteSchema.parse(req.body);
  const r = await query(
    `INSERT INTO routes (name, description, day, cutoff_time, city, map_zone,
                         quadrant_id, quadrant_name, street_from, street_to, carrera_from, carrera_to,
                         bounds, center, advisor_id, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [b.name, b.description ?? null, b.day ?? null, b.cutoffTime ?? null, b.city ?? null,
     b.mapZone ?? null, b.quadrantId ?? null, b.quadrantName ?? null,
     b.streetFrom ?? null, b.streetTo ?? null, b.carreraFrom ?? null, b.carreraTo ?? null,
     b.bounds ? JSON.stringify(b.bounds) : null,
     b.center ? JSON.stringify(b.center) : null,
     b.advisorId ?? null, b.active]
  );
  res.status(201).json({ id: r.rows[0].id });
}));

router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const b = RouteSchema.partial().parse(req.body);
  const sets = [];
  const params = [];
  const map = {
    name: 'name', description: 'description', day: 'day', cutoffTime: 'cutoff_time',
    city: 'city', mapZone: 'map_zone', quadrantId: 'quadrant_id', quadrantName: 'quadrant_name',
    streetFrom: 'street_from', streetTo: 'street_to',
    carreraFrom: 'carrera_from', carreraTo: 'carrera_to',
    advisorId: 'advisor_id', active: 'active',
  };
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) { params.push(b[k]); sets.push(`${col}=$${params.length}`); }
  }
  if (b.bounds !== undefined) { params.push(JSON.stringify(b.bounds)); sets.push(`bounds=$${params.length}`); }
  if (b.center !== undefined) { params.push(JSON.stringify(b.center)); sets.push(`center=$${params.length}`); }
  if (!sets.length) throw new ApiError(400, 'EMPTY_PATCH', 'No fields to update');
  sets.push('updated_at=NOW()');
  params.push(req.params.id);
  const r = await query(`UPDATE routes SET ${sets.join(',')} WHERE id=$${params.length} RETURNING id`, params);
  if (!r.rowCount) throw new ApiError(404, 'NOT_FOUND', 'Route not found');
  res.json({ id: r.rows[0].id });
}));

router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  await query(`UPDATE routes SET active=FALSE, updated_at=NOW() WHERE id=$1`, [req.params.id]);
  res.status(204).end();
}));

export default router;

import { Router } from 'express';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error.js';
import { computeRouteCutoff } from '../lib/cutoff.js';
import { asyncHandler } from '../lib/validate.js';

const router = Router();

// List routes (admin/advisor consume; clients use /me/cutoff)
router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const r = await query(
    `SELECT id, name, description, day, cutoff_time, city, quadrant_id, quadrant_name,
            bounds, center, advisor_id, active
       FROM routes WHERE active=TRUE ORDER BY name`
  );
  res.json({ items: r.rows });
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

export default router;

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/db.js';
import { ApiError } from '../middleware/error.js';
import { requireAuth, signToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { asyncHandler } from '../lib/validate.js';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const userPublic = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  companyId: u.company_id ?? null,
  branchId: u.branch_id ?? null,
});

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body);
  const r = await query(
    `SELECT id, name, email, password_hash, role, active, company_id, branch_id
       FROM users WHERE email=$1`,
    [email]
  );
  const u = r.rows[0];
  if (!u || !u.active) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const token = signToken({ sub: u.id, role: u.role, email: u.email });
  const refreshToken = signRefreshToken({ sub: u.id });
  res.json({ token, refreshToken, user: userPublic(u) });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) throw new ApiError(400, 'MISSING_TOKEN', 'refreshToken required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }

  const r = await query(
    `SELECT id, name, email, role, active, company_id, branch_id FROM users WHERE id = $1`,
    [payload.sub]
  );
  const u = r.rows[0];
  if (!u || !u.active) throw new ApiError(401, 'USER_INACTIVE', 'User not found or inactive');

  const token = signToken({ sub: u.id, role: u.role, email: u.email });
  const newRefreshToken = signRefreshToken({ sub: u.id });
  res.json({ token, refreshToken: newRefreshToken, user: userPublic(u) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const r = await query(
    `SELECT u.id, u.name, u.email, u.role, u.company_id, u.branch_id,
            c.price_list_id
       FROM users u
       LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.id = $1`,
    [req.user.sub]
  );
  const u = r.rows[0];
  if (!u) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  res.json({ user: { ...userPublic(u), priceListId: u.price_list_id ?? null } });
}));

export default router;

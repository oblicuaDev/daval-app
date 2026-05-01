import jwt from 'jsonwebtoken';
import { ApiError } from './error.js';

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  });
}

export function requireAuth(req, _res, next) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing token'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing user'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'FORBIDDEN', `Requires role: ${roles.join('|')}`));
  }
  next();
};

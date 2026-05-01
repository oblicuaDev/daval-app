import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (_req, res) =>
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: err.flatten(),
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'INTERNAL', message: 'Internal server error' });
};

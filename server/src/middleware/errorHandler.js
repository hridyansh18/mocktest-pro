import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * 404 handler — mounted after all routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
};

/**
 * Global error handler — mounted last. Distinguishes operational errors
 * (AppError, thrown deliberately with a safe message) from unexpected
 * programming errors (logged in full, but never leak internals to the
 * client in production).
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const isOperational = err.isOperational === true;
  const statusCode = err.statusCode || 500;

  if (!isOperational) {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
  } else {
    logger.warn(`${statusCode} ${req.method} ${req.originalUrl} — ${err.message}`);
  }

  const body = {
    success: false,
    error: {
      message: isOperational ? err.message : 'Internal server error'
    }
  };

  if (err.details) body.error.details = err.details;
  if (env.nodeEnv === 'development' && !isOperational) body.error.stack = err.stack;

  res.status(statusCode).json(body);
};

export default errorHandler;

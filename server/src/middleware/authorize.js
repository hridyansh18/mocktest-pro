import { AppError } from '../utils/AppError.js';

/**
 * Restricts a route to one or more roles. Must run after `authenticate`
 * so req.user is populated. Usage: router.get('/x', authenticate, authorize('admin'), handler)
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(AppError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

export default authorize;

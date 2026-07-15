import { AppError } from '../utils/AppError.js';

export const requireSuperAdmin = (
  req,
  res,
  next
) => {
  if (
    !req.user ||
    req.user.adminRole !== 'super_admin'
  ) {
    return next(
      AppError.forbidden(
        'Super Admin access required'
      )
    );
  }

  next();
};

export default requireSuperAdmin;
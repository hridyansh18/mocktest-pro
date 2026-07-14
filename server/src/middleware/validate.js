import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

/**
 * Runs after an array of express-validator check(...) rules. Collects
 * all violations and returns a single structured 400 rather than
 * letting bad input reach controllers/models.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(AppError.badRequest('Validation failed', details));
};

export default validate;

import { body } from 'express-validator';

export const registerAdminValidator = [
  body('fullName').trim().isLength({ min: 2, max: 150 }).withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character')
    .isLength({ max: 128 }).withMessage('Password is too long'),
  body('institution').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('designation').optional({ checkFalsy: true }).trim().isLength({ max: 150 })
];

export const loginAdminValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

export const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

export default { registerAdminValidator, loginAdminValidator, refreshTokenValidator };

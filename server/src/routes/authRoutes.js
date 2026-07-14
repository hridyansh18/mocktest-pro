import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';

import {
  loginAdminValidator,
  refreshTokenValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post(
  '/admin/login',
  authLimiter,
  loginAdminValidator,
  validate,
  authController.login
);

router.post(
  '/refresh',
  authLimiter,
  refreshTokenValidator,
  validate,
  authController.refresh
);

router.post(
  '/logout',
  authenticate,
  refreshTokenValidator,
  validate,
  authController.logout
);

router.get(
  '/me',
  authenticate,
  authController.me
);

export default router;
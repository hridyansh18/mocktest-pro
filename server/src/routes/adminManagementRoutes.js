import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';

import * as controller from '../controllers/adminManagementController.js';

const router = Router();

router.use(
  authenticate,
  requireSuperAdmin
);

router.get(
  '/',
  controller.list
);

router.post(
  '/',
  controller.create
);

router.patch(
  '/:adminId/status',
  controller.status
);

export default router;
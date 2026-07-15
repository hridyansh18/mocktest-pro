import { Router } from 'express';

import * as studentController from '../controllers/studentController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(
  authenticate,
  authorize('admin')
);

router.get(
  '/',
  studentController.listStudents
);

export default router;
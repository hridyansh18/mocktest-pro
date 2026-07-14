import { Router } from 'express';

import authRoutes from './authRoutes.js';
import testRoutes from './testRoutes.js';
import publicTestRoutes from './publicTestRoutes.js';
import attemptRoutes from './attemptRoutes.js';
import studentRoutes from './studentRoutes.js';
import adminManagementRoutes from './adminManagementRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);

router.use(
  '/admin/management',
  adminManagementRoutes
);

router.use('/admin/tests', testRoutes);
router.use('/admin/students', studentRoutes);

router.use('/public/tests', publicTestRoutes);
router.use('/attempts', attemptRoutes);

export default router;
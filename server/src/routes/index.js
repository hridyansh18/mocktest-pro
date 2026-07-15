import { Router } from 'express';
import { pool } from '../config/db.js';

import authRoutes from './authRoutes.js';
import testRoutes from './testRoutes.js';
import publicTestRoutes from './publicTestRoutes.js';
import attemptRoutes from './attemptRoutes.js';
import studentRoutes from './studentRoutes.js';
import adminManagementRoutes from './adminManagementRoutes.js';

const router = Router();

router.get('/health', async (req, res) => {
  let database = 'unavailable';
  try {
    await pool.query('SELECT 1');
    database = 'connected';
  } catch {
    // Keep the response free of connection strings and provider details.
  }

  res.status(database === 'connected' ? 200 : 503).json({
    success: database === 'connected',
    data: {
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      timestamp: new Date().toISOString()
    }
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
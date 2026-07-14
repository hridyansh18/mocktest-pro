import { Router } from 'express';
import * as testController from '../controllers/testController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createTestValidator,
  updateTestValidator,
  testIdParamValidator,
  listTestsValidator,
  addAllowedStudentsValidator
} from '../validators/testValidators.js';
import questionRouter from './questionRoutes.js';
import * as resultController from '../controllers/resultController.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/', createTestValidator, validate, testController.createTest);
router.get('/', listTestsValidator, validate, testController.listTests);
router.get('/:id', testIdParamValidator, validate, testController.getTest);
router.patch('/:id', updateTestValidator, validate, testController.updateTest);
router.delete('/:id', testIdParamValidator, validate, testController.deleteTest);
router.get('/:id/results', testIdParamValidator, validate, resultController.results);
router.get('/:id/leaderboard', testIdParamValidator, validate, resultController.leaderboard);
router.get('/:id/security-logs', testIdParamValidator, validate, resultController.securityLogs);
router.get('/:id/live-monitor', testIdParamValidator, validate, resultController.liveMonitor);

router.post('/:id/allowed-students', addAllowedStudentsValidator, validate, testController.addAllowedStudents);
router.get('/:id/allowed-students', testIdParamValidator, validate, testController.listAllowedStudents);
router.delete('/:id/allowed-students/:studentEntryId', testIdParamValidator, validate, testController.removeAllowedStudent);

// Nested question routes: /api/admin/tests/:testId/questions/...
router.use('/:testId/questions', questionRouter);

export default router;

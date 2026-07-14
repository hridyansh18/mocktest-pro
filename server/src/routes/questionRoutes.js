import { Router } from 'express';
import * as questionController from '../controllers/questionController.js';
import { validate } from '../middleware/validate.js';
import {
  createQuestionValidator,
  updateQuestionValidator,
  questionIdParamValidator,
  reorderQuestionsValidator,
  bulkImportValidator
} from '../validators/questionValidators.js';

// mergeParams so :testId from the parent /admin/tests router is visible here.
// Auth/RBAC is already applied by the parent testRoutes router.
const router = Router({ mergeParams: true });

router.post('/', createQuestionValidator, validate, questionController.createQuestion);
router.get('/', questionController.listQuestions);
router.post('/bulk-import', bulkImportValidator, validate, questionController.bulkImportQuestions);
router.patch('/reorder', reorderQuestionsValidator, validate, questionController.reorderQuestions);
router.patch('/:id', updateQuestionValidator, validate, questionController.updateQuestion);
router.delete('/:id', questionIdParamValidator, validate, questionController.deleteQuestion);
router.post('/:id/duplicate', questionIdParamValidator, validate, questionController.duplicateQuestion);

export default router;

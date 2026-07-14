import { Router } from 'express';
import { testAccessLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { testCodeParam, accessBody } from '../validators/attemptValidators.js';
import { validateAccess, instructions } from '../controllers/publicTestController.js';

const router = Router();
router.post('/:testCodeId/access', testAccessLimiter, [...testCodeParam, ...accessBody], validate, validateAccess);
router.get('/:testCodeId/instructions', testCodeParam, validate, instructions);
export default router;

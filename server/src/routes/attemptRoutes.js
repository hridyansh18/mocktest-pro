import { Router } from 'express';

import {
  authenticateAttempt,
} from '../middleware/authenticate.js';

import { validate } from '../middleware/validate.js';

import {
  attemptIdParam,
  startAttemptBody,
  saveAnswerBody,
} from '../validators/attemptValidators.js';

import * as controller from '../controllers/attemptController.js';

import {
  violation,
} from '../controllers/violationController.js';

import {
  studentResult,
  studentLeaderboard,
} from '../controllers/resultController.js';

import {
  violationBody,
} from '../validators/violationValidators.js';

const router = Router();

router.post(
  '/start',
  startAttemptBody,
  validate,
  controller.start
);

router.use(
  '/:attemptId',
  attemptIdParam,
  validate,
  authenticateAttempt
);

router.get(
  '/:attemptId/questions',
  controller.questions
);

router.post(
  '/:attemptId/answers',
  saveAnswerBody,
  validate,
  controller.saveAnswer
);

router.post(
  '/:attemptId/violations',
  violationBody,
  validate,
  violation
);

router.post(
  '/:attemptId/submit',
  controller.submit
);

router.get(
  '/:attemptId/result',
  studentResult
);

router.get(
  '/:attemptId/leaderboard',
  studentLeaderboard
);

export default router;
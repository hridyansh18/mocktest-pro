import { body, param } from 'express-validator';

export const testCodeParam = [
  param('testCodeId').trim().notEmpty().isLength({ max: 30 })
];

export const accessBody = [
  body('fullName').trim().isLength({ min: 2, max: 150 }),
  body('enrollmentNumber').trim().isLength({ min: 1, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('accessCode').optional({ nullable: true }).isString().isLength({ max: 20 })
];

export const startAttemptBody = [
  body('testCodeId').trim().notEmpty().isLength({ max: 30 }),
  ...accessBody
];

export const attemptIdParam = [param('attemptId').isUUID()];

export const saveAnswerBody = [
  body('questionId').isUUID(),
  body('selectedOptionId').optional({ nullable: true }).isUUID(),
  body('status').optional().isIn([
    'not_visited', 'not_answered', 'answered', 'marked_for_review', 'answered_marked_for_review'
  ])
];

import { body, param, query as queryValidator } from 'express-validator';
import { TEST_CATEGORIES } from '../config/constants.js';

const RESULT_VISIBILITY_VALUES = ['immediate', 'after_expiry', 'hidden'];
const TEST_STATUS_VALUES = ['draft', 'scheduled', 'active', 'expired', 'archived'];

export const createTestValidator = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional({ checkFalsy: true }).isString(),
  body('subject').optional({ checkFalsy: true }).isString().isLength({ max: 150 }),
  body('category').isIn(TEST_CATEGORIES).withMessage('Invalid test category'),
  body('durationMinutes').isInt({ min: 1 }).withMessage('Duration must be a positive number of minutes'),
  body('marksPerQuestion').optional().isFloat({ min: 0 }),
  body('negativeMarking').optional().isBoolean(),
  body('negativeMarksValue').optional().isFloat({ min: 0 }),
  body('startAt').isISO8601().withMessage('startAt must be a valid ISO 8601 datetime'),
  body('expiresAt').isISO8601().withMessage('expiresAt must be a valid ISO 8601 datetime'),
  body('maxAttempts').optional().isInt({ min: 1 }),
  body('passingPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('instructions').optional({ checkFalsy: true }).isString(),
  body('visibility').optional().isIn(['public', 'private']),
  body('requireTestCode').optional().isBoolean(),
  body('restrictToAllowedList').optional().isBoolean(),
  body('collegeEmailDomain').optional({ checkFalsy: true }).isString(),
  body('maxStudentLimit').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('shuffleQuestions').optional().isBoolean(),
  body('shuffleOptions').optional().isBoolean(),
  body('resultVisibility').optional().isIn(RESULT_VISIBILITY_VALUES),
  body('showQuestionReview').optional().isBoolean(),
  body('leaderboardEnabled').optional().isBoolean(),
  body('status').optional().isIn(TEST_STATUS_VALUES),
  body('allowedStudents').optional().isArray(),
  body('allowedStudents.*.email').optional().isEmail()
];

export const updateTestValidator = [
  param('id').isUUID().withMessage('Invalid test id'),
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('category').optional().isIn(TEST_CATEGORIES),
  body('durationMinutes').optional().isInt({ min: 1 }),
  body('marksPerQuestion').optional().isFloat({ min: 0 }),
  body('negativeMarking').optional().isBoolean(),
  body('negativeMarksValue').optional().isFloat({ min: 0 }),
  body('startAt').optional().isISO8601(),
  body('expiresAt').optional().isISO8601(),
  body('maxAttempts').optional().isInt({ min: 1 }),
  body('passingPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('visibility').optional().isIn(['public', 'private']),
  body('requireTestCode').optional().isBoolean(),
  body('restrictToAllowedList').optional().isBoolean(),
  body('maxStudentLimit').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('shuffleQuestions').optional().isBoolean(),
  body('shuffleOptions').optional().isBoolean(),
  body('resultVisibility').optional().isIn(RESULT_VISIBILITY_VALUES),
  body('showQuestionReview').optional().isBoolean(),
  body('leaderboardEnabled').optional().isBoolean(),
  body('status').optional().isIn(TEST_STATUS_VALUES)
];

export const testIdParamValidator = [param('id').isUUID().withMessage('Invalid test id')];

export const listTestsValidator = [
  queryValidator('status').optional().isIn(TEST_STATUS_VALUES),
  queryValidator('category').optional().isIn(TEST_CATEGORIES),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 })
];

export const addAllowedStudentsValidator = [
  param('id').isUUID(),
  body('students').isArray({ min: 1 }).withMessage('Provide at least one student'),
  body('students.*.email').isEmail().withMessage('Each student needs a valid email'),
  body('students.*.enrollmentNumber').optional().isString()
];

export default {
  createTestValidator,
  updateTestValidator,
  testIdParamValidator,
  listTestsValidator,
  addAllowedStudentsValidator
};

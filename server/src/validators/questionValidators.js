import { body, param } from 'express-validator';
import { DIFFICULTY_LEVELS } from '../config/constants.js';

const optionRules = (prefix = 'options') => [
  body(prefix).isArray({ min: 2, max: 6 }).withMessage('Provide 2-6 options'),
  body(`${prefix}.*.optionText`).trim().notEmpty().withMessage('Option text is required'),
  body(`${prefix}.*.isCorrect`).optional().isBoolean()
];

export const createQuestionValidator = [
  param('testId').isUUID().withMessage('Invalid test id'),
  body('questionText').trim().notEmpty().withMessage('Question text is required'),
  body('explanation').optional({ checkFalsy: true }).isString(),
  body('marks').optional().isFloat({ min: 0 }),
  body('negativeMarks').optional().isFloat({ min: 0 }),
  body('difficulty').optional().isIn(DIFFICULTY_LEVELS),
  ...optionRules()
];

export const updateQuestionValidator = [
  param('testId').isUUID(),
  param('id').isUUID(),
  body('questionText').optional().trim().notEmpty(),
  body('explanation').optional({ checkFalsy: true }).isString(),
  body('marks').optional().isFloat({ min: 0 }),
  body('negativeMarks').optional().isFloat({ min: 0 }),
  body('difficulty').optional().isIn(DIFFICULTY_LEVELS),
  body('options').optional().isArray({ min: 2, max: 6 }),
  body('options.*.optionText').optional().trim().notEmpty(),
  body('options.*.isCorrect').optional().isBoolean()
];

export const questionIdParamValidator = [param('testId').isUUID(), param('id').isUUID()];

export const reorderQuestionsValidator = [
  param('testId').isUUID(),
  body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array'),
  body('orderedIds.*').isUUID().withMessage('orderedIds must contain valid UUIDs')
];

export const bulkImportValidator = [
  param('testId').isUUID(),
  body().custom((value) => {
    const hasQuestions = Array.isArray(value.questions) && value.questions.length > 0;
    const hasCsv = typeof value.csv === 'string' && value.csv.trim().length > 0;
    if (!hasQuestions && !hasCsv) {
      throw new Error('Provide either a non-empty "questions" array or a non-empty "csv" string');
    }
    return true;
  })
];

export default {
  createQuestionValidator,
  updateQuestionValidator,
  questionIdParamValidator,
  reorderQuestionsValidator,
  bulkImportValidator
};

import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../config/db.js';
import * as testModel from '../models/testModel.js';
import * as questionModel from '../models/questionModel.js';
import * as optionModel from '../models/questionOptionModel.js';

const assertTestOwnership = async (testId, adminId) => {
  const test = await testModel.findTestByIdForAdmin(testId, adminId);
  if (!test) throw AppError.notFound('Test not found');
  return test;
};

const validateOptions = (options) => {
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    throw AppError.badRequest('Each question needs between 2 and 6 options');
  }
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    throw AppError.badRequest('Each question must have exactly one correct option');
  }
  options.forEach((o) => {
    if (!o.optionText || !o.optionText.trim()) {
      throw AppError.badRequest('Option text cannot be empty');
    }
  });
};

export const createQuestion = async (testId, adminId, payload) => {
  await assertTestOwnership(testId, adminId);
  validateOptions(payload.options);

  const nextOrderIndex = await questionModel.countQuestionsByTest(testId);

  const question = await withTransaction(async (client) => {
    const q = await questionModel.createQuestion(
      {
        testId,
        questionText: payload.questionText,
        explanation: payload.explanation,
        marks: payload.marks ?? 1,
        negativeMarks: payload.negativeMarks ?? 0,
        difficulty: payload.difficulty || 'medium',
        orderIndex: nextOrderIndex
      },
      client
    );
    const options = await optionModel.createOptions(
      q.id,
      payload.options.map((o) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })),
      client
    );
    return { ...q, options };
  });

  await testModel.recalculateTotalMarks(testId);
  return question;
};

export const listQuestions = async (testId, adminId) => {
  await assertTestOwnership(testId, adminId);
  return questionModel.listQuestionsForAdmin(testId);
};

export const updateQuestion = async (questionId, testId, adminId, payload) => {
  await assertTestOwnership(testId, adminId);
  const existing = await questionModel.findQuestionById(questionId);
  if (!existing || existing.test_id !== testId) throw AppError.notFound('Question not found');

  if (payload.options) validateOptions(payload.options);

  const updated = await withTransaction(async (client) => {
    const patch = {};
    if (payload.questionText !== undefined) patch.question_text = payload.questionText;
    if (payload.explanation !== undefined) patch.explanation = payload.explanation;
    if (payload.marks !== undefined) patch.marks = payload.marks;
    if (payload.negativeMarks !== undefined) patch.negative_marks = payload.negativeMarks;
    if (payload.difficulty !== undefined) patch.difficulty = payload.difficulty;

    let q = existing;
    if (Object.keys(patch).length > 0) {
      const setClauses = Object.keys(patch).map((col, i) => `${col} = $${i + 1}`);
      const values = Object.values(patch);
      values.push(questionId, testId);
      const { rows } = await client.query(
        `UPDATE questions SET ${setClauses.join(', ')} WHERE id = $${values.length - 1} AND test_id = $${values.length} RETURNING *`,
        values
      );
      q = rows[0];
    }

    let options = await optionModel.listOptionsByQuestion(questionId);
    if (payload.options) {
      options = await optionModel.replaceOptions(
        questionId,
        payload.options.map((o) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })),
        client
      );
    }
    return { ...q, options };
  });

  await testModel.recalculateTotalMarks(testId);
  return updated;
};

export const deleteQuestion = async (questionId, testId, adminId) => {
  await assertTestOwnership(testId, adminId);
  const removed = await questionModel.deleteQuestion(questionId, testId);
  if (!removed) throw AppError.notFound('Question not found');
  await testModel.recalculateTotalMarks(testId);
};

export const duplicateQuestion = async (questionId, testId, adminId) => {
  await assertTestOwnership(testId, adminId);
  const questions = await questionModel.listQuestionsForAdmin(testId);
  const original = questions.find((q) => q.id === questionId);
  if (!original) throw AppError.notFound('Question not found');

  return createQuestion(testId, adminId, {
    questionText: `${original.question_text} (Copy)`,
    explanation: original.explanation,
    marks: original.marks,
    negativeMarks: original.negative_marks,
    difficulty: original.difficulty,
    options: original.options.map((o) => ({ optionText: o.option_text, isCorrect: o.is_correct }))
  });
};

export const reorderQuestions = async (testId, adminId, orderedIds) => {
  await assertTestOwnership(testId, adminId);
  const existing = await questionModel.listQuestionsForAdmin(testId);
  const existingIds = new Set(existing.map((q) => q.id));
  if (orderedIds.length !== existing.length || !orderedIds.every((id) => existingIds.has(id))) {
    throw AppError.badRequest('orderedIds must contain exactly the current set of question IDs for this test');
  }
  await questionModel.reorderQuestions(testId, orderedIds);
  return questionModel.listQuestionsForAdmin(testId);
};

/**
 * Bulk import from a pre-parsed array of plain objects (the controller is
 * responsible for parsing CSV/JSON into this shape):
 * { questionText, options: [{optionText, isCorrect}], marks, negativeMarks, difficulty, explanation }
 */
export const bulkImportQuestions = async (testId, adminId, questionsPayload) => {
  await assertTestOwnership(testId, adminId);

  if (!Array.isArray(questionsPayload) || questionsPayload.length === 0) {
    throw AppError.badRequest('No questions found to import');
  }

  const errors = [];
  questionsPayload.forEach((q, i) => {
    if (!q.questionText || !q.questionText.trim()) {
      errors.push({ row: i + 1, message: 'questionText is required' });
      return;
    }
    try {
      validateOptions(q.options);
    } catch (err) {
      errors.push({ row: i + 1, message: err.message });
    }
  });

  if (errors.length > 0) {
    throw AppError.badRequest('Some rows failed validation', errors);
  }

  let startIndex = await questionModel.countQuestionsByTest(testId);
  const created = [];

  await withTransaction(async (client) => {
    for (const q of questionsPayload) {
      // eslint-disable-next-line no-await-in-loop
      const question = await questionModel.createQuestion(
        {
          testId,
          questionText: q.questionText,
          explanation: q.explanation,
          marks: q.marks ?? 1,
          negativeMarks: q.negativeMarks ?? 0,
          difficulty: q.difficulty || 'medium',
          orderIndex: startIndex
        },
        client
      );
      // eslint-disable-next-line no-await-in-loop
      const options = await optionModel.createOptions(
        question.id,
        q.options.map((o) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })),
        client
      );
      created.push({ ...question, options });
      startIndex += 1;
    }
  });

  await testModel.recalculateTotalMarks(testId);
  return created;
};

export default {
  createQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
  bulkImportQuestions
};

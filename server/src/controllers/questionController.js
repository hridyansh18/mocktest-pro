import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as questionService from '../services/questionService.js';
import { parseCsv, csvRowsToQuestions } from '../utils/csvParser.js';

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.params.testId, req.user.adminId, req.body);
  res.status(201).json({ success: true, data: { question } });
});

export const listQuestions = asyncHandler(async (req, res) => {
  const questions = await questionService.listQuestions(req.params.testId, req.user.adminId);
  res.status(200).json({ success: true, data: { questions } });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(req.params.id, req.params.testId, req.user.adminId, req.body);
  res.status(200).json({ success: true, data: { question } });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id, req.params.testId, req.user.adminId);
  res.status(200).json({ success: true, data: { message: 'Question deleted' } });
});

export const duplicateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.duplicateQuestion(req.params.id, req.params.testId, req.user.adminId);
  res.status(201).json({ success: true, data: { question } });
});

export const reorderQuestions = asyncHandler(async (req, res) => {
  const questions = await questionService.reorderQuestions(req.params.testId, req.user.adminId, req.body.orderedIds);
  res.status(200).json({ success: true, data: { questions } });
});

/**
 * Accepts EITHER:
 *  - JSON body: { questions: [{ questionText, options: [...], marks, ... }, ...] }
 *  - CSV body:  { csv: "questionText,optionA,optionB,optionC,optionD,correctOption,marks,..." }
 * Returns the created questions, or 400 with per-row validation errors.
 */
export const bulkImportQuestions = asyncHandler(async (req, res) => {
  let questionsPayload = req.body.questions;

  if (!questionsPayload && req.body.csv) {
    const rows = parseCsv(req.body.csv);
    questionsPayload = csvRowsToQuestions(rows);
  }

  if (!questionsPayload) {
    throw AppError.badRequest('Provide either "questions" (JSON array) or "csv" (CSV text) in the request body');
  }

  const created = await questionService.bulkImportQuestions(req.params.testId, req.user.adminId, questionsPayload);
  res.status(201).json({ success: true, data: { imported: created.length, questions: created } });
});

export default {
  createQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
  bulkImportQuestions
};

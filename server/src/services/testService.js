import { AppError } from '../utils/AppError.js';
import { generateTestCodeId, generateAccessCode } from '../utils/generateTestCode.js';
import * as testModel from '../models/testModel.js';
import * as allowedStudentModel from '../models/allowedStudentModel.js';

const MAX_CODE_COLLISION_RETRIES = 5;

const deriveStatus = (test) => {
  // Draft stays draft until the admin explicitly publishes it (status='scheduled'/'active').
  if (test.status === 'draft' || test.status === 'archived') return test.status;
  const now = new Date();
  if (now < new Date(test.start_at)) return 'scheduled';
  if (now > new Date(test.expires_at)) return 'expired';
  return 'active';
};

export const createTest = async (createdBy, payload) => {
  if (new Date(payload.expiresAt) <= new Date(payload.startAt)) {
    throw AppError.badRequest('Expiry date/time must be after the start date/time');
  }

  let testCodeId;
  let attempt = 0;
  let created = null;

  while (attempt < MAX_CODE_COLLISION_RETRIES && !created) {
    testCodeId = generateTestCodeId(payload.category);
    // eslint-disable-next-line no-await-in-loop
    const existing = await testModel.findTestByCodeId(testCodeId);
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      created = await testModel.createTest({
        test_code_id: testCodeId,
        access_code: generateAccessCode(),
        created_by: createdBy,
        title: payload.title,
        description: payload.description,
        subject: payload.subject,
        category: payload.category,
        duration_minutes: payload.durationMinutes,
        total_marks: payload.totalMarks || 0,
        marks_per_question: payload.marksPerQuestion || 1,
        negative_marking: !!payload.negativeMarking,
        negative_marks_value: payload.negativeMarksValue || 0,
        start_at: payload.startAt,
        expires_at: payload.expiresAt,
        max_attempts: payload.maxAttempts || 1,
        passing_percentage: payload.passingPercentage ?? 40,
        instructions: payload.instructions,
        visibility: payload.visibility || 'private',
        require_test_code: payload.requireTestCode ?? true,
        restrict_to_allowed_list: !!payload.restrictToAllowedList,
        college_email_domain: payload.collegeEmailDomain || null,
        max_student_limit: payload.maxStudentLimit || null,
        shuffle_questions: !!payload.shuffleQuestions,
        shuffle_options: !!payload.shuffleOptions,
        result_visibility: payload.resultVisibility || 'after_expiry',
        show_question_review: !!payload.showQuestionReview,
        leaderboard_enabled: payload.leaderboardEnabled ?? true,
        status: payload.status || 'draft'
      });
    }
    attempt += 1;
  }

  if (!created) throw new AppError('Could not generate a unique test code, please retry', 500);

  if (Array.isArray(payload.allowedStudents) && payload.allowedStudents.length > 0) {
    await allowedStudentModel.addAllowedStudents(created.id, payload.allowedStudents);
  }

  return { ...created, status: deriveStatus(created) };
};

export const getTestForAdmin = async (testId, adminId) => {
  const test = await testModel.findTestByIdForAdmin(testId, adminId);
  if (!test) throw AppError.notFound('Test not found');
  return { ...test, status: deriveStatus(test) };
};

export const listTests = async (adminId, filters) => {
  const result = await testModel.listTestsByAdmin(adminId, filters);
  return {
    ...result,
    tests: result.tests.map((t) => ({ ...t, status: deriveStatus(t) }))
  };
};

export const updateTest = async (testId, adminId, patch) => {
  await getTestForAdmin(testId, adminId); // ensures ownership + existence

  if (patch.startAt || patch.expiresAt) {
    const current = await testModel.findTestById(testId);
    const nextStart = patch.startAt ? new Date(patch.startAt) : new Date(current.start_at);
    const nextExpiry = patch.expiresAt ? new Date(patch.expiresAt) : new Date(current.expires_at);
    if (nextExpiry <= nextStart) {
      throw AppError.badRequest('Expiry date/time must be after the start date/time');
    }
  }

  const dbPatch = {};
  const map = {
    title: 'title', description: 'description', subject: 'subject', category: 'category',
    durationMinutes: 'duration_minutes', marksPerQuestion: 'marks_per_question',
    negativeMarking: 'negative_marking', negativeMarksValue: 'negative_marks_value',
    startAt: 'start_at', expiresAt: 'expires_at', maxAttempts: 'max_attempts',
    passingPercentage: 'passing_percentage', instructions: 'instructions',
    visibility: 'visibility', requireTestCode: 'require_test_code',
    restrictToAllowedList: 'restrict_to_allowed_list', collegeEmailDomain: 'college_email_domain',
    maxStudentLimit: 'max_student_limit', shuffleQuestions: 'shuffle_questions',
    shuffleOptions: 'shuffle_options', resultVisibility: 'result_visibility',
    showQuestionReview: 'show_question_review', leaderboardEnabled: 'leaderboard_enabled',
    status: 'status'
  };
  for (const [key, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) dbPatch[col] = patch[key];
  }

  const updated = await testModel.updateTest(testId, adminId, dbPatch);
  return { ...updated, status: deriveStatus(updated) };
};

export const deleteTest = async (testId, adminId) => {
  await getTestForAdmin(testId, adminId);
  await testModel.deleteTest(testId, adminId);
};

export const addAllowedStudents = async (testId, adminId, students) => {
  await getTestForAdmin(testId, adminId);
  return allowedStudentModel.addAllowedStudents(testId, students);
};

export const listAllowedStudents = async (testId, adminId) => {
  await getTestForAdmin(testId, adminId);
  return allowedStudentModel.listAllowedStudents(testId);
};

export const removeAllowedStudent = async (testId, adminId, allowedStudentId) => {
  await getTestForAdmin(testId, adminId);
  const removed = await allowedStudentModel.removeAllowedStudent(testId, allowedStudentId);
  if (!removed) throw AppError.notFound('Allowed student entry not found');
  return removed;
};

export default {
  createTest,
  getTestForAdmin,
  listTests,
  updateTest,
  deleteTest,
  addAllowedStudents,
  listAllowedStudents,
  removeAllowedStudent
};

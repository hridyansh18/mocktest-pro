import crypto from 'crypto';
import { withTransaction, query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { signAttemptToken } from './tokenService.js';
import { calculatePercentage, resolveAttemptStatus } from '../utils/attemptMath.js';
import { emitTestEvent } from './liveMonitorService.js';
import { findTestByCodeId } from '../models/testModel.js';
import { findOrCreateStudent } from '../models/studentModel.js';
import {
  findAttemptById, countStudentAttempts, countDistinctTestStudents, findActiveAttempt
} from '../models/attemptModel.js';

const shuffle = (items) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const assertTestAvailable = (test) => {
  if (!test) throw AppError.notFound('Test not found');
  const now = Date.now();
  if (!['scheduled', 'active'].includes(test.status)) throw AppError.forbidden('Test is not active');
  if (now < new Date(test.start_at).getTime()) throw AppError.forbidden('Test has not started yet');
  if (now >= new Date(test.expires_at).getTime()) throw AppError.forbidden('Test has expired');
};

const assertAccessRules = async (test, identity, accessCode, client = { query }) => {
  if (test.require_test_code && accessCode !== test.access_code) {
    throw AppError.unauthorized('Invalid test code');
  }

  const email = normalizeEmail(identity.email);
  if (test.college_email_domain) {
    const domain = test.college_email_domain.replace(/^@/, '').toLowerCase();
    if (!email.endsWith(`@${domain}`)) throw AppError.forbidden('College email is required for this test');
  }

  if (test.restrict_to_allowed_list) {
    const { rows } = await client.query(
      `SELECT id FROM test_allowed_students
       WHERE test_id = $1 AND lower(email) = $2
         AND (enrollment_number IS NULL OR enrollment_number = $3)
       LIMIT 1`,
      [test.id, email, identity.enrollmentNumber.trim()]
    );
    if (!rows[0]) throw AppError.forbidden('Student is not allowed to take this test');
  }
};

export const validatePublicAccess = async ({ testCodeId, fullName, enrollmentNumber, email, accessCode }) => {
  const test = await findTestByCodeId(testCodeId);
  assertTestAvailable(test);
  await assertAccessRules(test, { fullName, enrollmentNumber, email }, accessCode);

  return {
    testCodeId: test.test_code_id,
    title: test.title,
    durationMinutes: test.duration_minutes,
    totalMarks: test.total_marks,
    passingPercentage: test.passing_percentage,
    negativeMarking: test.negative_marking,
    startsAt: test.start_at,
    expiresAt: test.expires_at
  };
};

export const getInstructions = async (testCodeId) => {
  const test = await findTestByCodeId(testCodeId);
  assertTestAvailable(test);
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM questions WHERE test_id = $1', [test.id]);
  return {
    title: test.title,
    description: test.description,
    instructions: test.instructions,
    questionCount: rows[0].count,
    totalMarks: test.total_marks,
    durationMinutes: test.duration_minutes,
    negativeMarking: test.negative_marking,
    negativeMarksValue: test.negative_marks_value,
    passingPercentage: test.passing_percentage
  };
};

export const startAttempt = async ({ testCodeId, fullName, enrollmentNumber, email, accessCode, ipAddress, userAgent }) =>
  withTransaction(async (client) => {
    const testResult = await client.query('SELECT * FROM tests WHERE test_code_id = $1 FOR UPDATE', [testCodeId]);
    const test = testResult.rows[0];
    assertTestAvailable(test);
    await assertAccessRules(test, { fullName, enrollmentNumber, email }, accessCode, client);

    const student = await findOrCreateStudent({ fullName, enrollmentNumber, email }, client);
    const active = await findActiveAttempt(test.id, student.id, client);
    if (active) {
      const remainingSeconds = Math.max(1, Math.ceil((new Date(active.expires_at).getTime() - Date.now()) / 1000));
      return { attempt: active, attemptToken: signAttemptToken({ attemptId: active.id, testId: test.id, studentId: student.id }, `${remainingSeconds}s`), resumed: true };
    }

    const previousAttempts = await countStudentAttempts(test.id, student.id, client);
    if (previousAttempts >= test.max_attempts) throw AppError.forbidden('Maximum attempts exceeded');

    if (test.max_student_limit) {
      const studentCount = await countDistinctTestStudents(test.id, client);
      if (studentCount >= test.max_student_limit) throw AppError.forbidden('Test student limit has been reached');
    }

    const qResult = await client.query(
      'SELECT id FROM questions WHERE test_id = $1 ORDER BY order_index, created_at',
      [test.id]
    );
    if (!qResult.rows.length) throw AppError.badRequest('This test has no questions');

    let questionOrder = qResult.rows.map((row) => row.id);
    if (test.shuffle_questions) questionOrder = shuffle(questionOrder);

    const optionOrder = {};
    for (const questionId of questionOrder) {
      const oResult = await client.query(
        'SELECT id FROM question_options WHERE question_id = $1 ORDER BY order_index, created_at',
        [questionId]
      );
      let ids = oResult.rows.map((row) => row.id);
      if (test.shuffle_options) ids = shuffle(ids);
      optionOrder[questionId] = ids;
    }

    const startedAt = new Date();
    const durationExpiry = new Date(startedAt.getTime() + test.duration_minutes * 60_000);
    const expiresAt = new Date(Math.min(durationExpiry.getTime(), new Date(test.expires_at).getTime()));

    const insert = await client.query(
      `INSERT INTO test_attempts
       (test_id, student_id, attempt_number, question_order, option_order, started_at, expires_at,
        total_marks_snapshot, ip_address, user_agent)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10)
       RETURNING *`,
      [test.id, student.id, previousAttempts + 1, JSON.stringify(questionOrder), JSON.stringify(optionOrder),
       startedAt, expiresAt, test.total_marks, ipAddress, userAgent]
    );
    const attempt = insert.rows[0];

    await client.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, status)
       SELECT $1, unnest($2::uuid[]), 'not_visited'::question_status_type`,
      [attempt.id, questionOrder]
    );

    const remainingSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
    return {
      attempt,
      attemptToken: signAttemptToken({ attemptId: attempt.id, testId: test.id, studentId: student.id }, `${remainingSeconds}s`),
      resumed: false
    };
  });

const assertAttemptAuth = (attempt, auth) => {
  if (!attempt || attempt.id !== auth.attemptId || attempt.test_id !== auth.testId || attempt.student_id !== auth.studentId) {
    throw AppError.forbidden('Attempt session does not match this attempt');
  }
};

const scoreAttemptTx = async (client, attemptId, status) => {
  const attemptResult = await client.query('SELECT * FROM test_attempts WHERE id = $1 FOR UPDATE', [attemptId]);
  const attempt = attemptResult.rows[0];
  if (!attempt) throw AppError.notFound('Attempt not found');
  if (attempt.status !== 'in_progress') return attempt;

  const rowsResult = await client.query(
    `SELECT aa.id AS answer_id, aa.selected_option_id, q.marks, q.negative_marks,
            qo.is_correct
     FROM attempt_answers aa
     JOIN questions q ON q.id = aa.question_id
     LEFT JOIN question_options qo ON qo.id = aa.selected_option_id AND qo.question_id = q.id
     WHERE aa.attempt_id = $1`,
    [attemptId]
  );

  let score = 0, correct = 0, incorrect = 0, unattempted = 0;
  for (const row of rowsResult.rows) {
    let isCorrect = null;
    let marksAwarded = 0;
    if (!row.selected_option_id) unattempted += 1;
    else if (row.is_correct === true) {
      correct += 1; isCorrect = true; marksAwarded = Number(row.marks); score += marksAwarded;
    } else {
      incorrect += 1; isCorrect = false; marksAwarded = -Number(row.negative_marks || 0); score += marksAwarded;
    }
    await client.query(
      'UPDATE attempt_answers SET is_correct = $1, marks_awarded = $2 WHERE id = $3',
      [isCorrect, marksAwarded, row.answer_id]
    );
  }

  const total = Number(attempt.total_marks_snapshot || 0);
  const percentage = calculatePercentage(score, total);
  const testResult = await client.query('SELECT passing_percentage FROM tests WHERE id = $1', [attempt.test_id]);
  const passing = Number(testResult.rows[0].passing_percentage);
  const submittedAt = new Date();
  const timeTaken = Math.max(0, Math.floor((submittedAt.getTime() - new Date(attempt.started_at).getTime()) / 1000));

  const updated = await client.query(
    `UPDATE test_attempts SET status=$1, submitted_at=$2, score=$3, correct_count=$4,
     incorrect_count=$5, unattempted_count=$6, percentage=$7, passed=$8, time_taken_seconds=$9
     WHERE id=$10 RETURNING *`,
    [status, submittedAt, score, correct, incorrect, unattempted, percentage, percentage >= passing, timeTaken, attemptId]
  );
  return updated.rows[0];
};

export const getAttemptQuestions = async (attemptId, auth) => {
  const attempt = await findAttemptById(attemptId);
  assertAttemptAuth(attempt, auth);
  if (attempt.status !== 'in_progress') throw AppError.conflict('Attempt is no longer active');

  if (Date.now() >= new Date(attempt.expires_at).getTime()) {
    const submitted = await withTransaction((client) => scoreAttemptTx(client, attemptId, 'auto_submitted'));
    throw new AppError('Attempt time has expired and was automatically submitted', 409, { status: submitted.status });
  }

  const { rows } = await query(
    `SELECT q.id, q.question_text, q.marks, q.difficulty,
            aa.status AS answer_status, aa.selected_option_id
     FROM questions q
     JOIN attempt_answers aa ON aa.question_id = q.id AND aa.attempt_id = $1
     WHERE q.id = ANY($2::uuid[])`,
    [attemptId, attempt.question_order]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  const optionResult = await query(
    `SELECT id, question_id, option_text FROM question_options
     WHERE question_id = ANY($1::uuid[])`,
    [attempt.question_order]
  );
  const optionMap = new Map(optionResult.rows.map((o) => [o.id, o]));

  const questions = attempt.question_order.map((questionId) => {
    const q = byId.get(questionId);
    const orderedOptions = (attempt.option_order[questionId] || []).map((id) => optionMap.get(id)).filter(Boolean);
    return { ...q, options: orderedOptions };
  });

  return {
    attemptId: attempt.id,
    serverTime: new Date().toISOString(),
    expiresAt: attempt.expires_at,
    questions
  };
};

export const saveAnswer = async (attemptId, auth, { questionId, selectedOptionId, status }) =>
  withTransaction(async (client) => {
    const attemptResult = await client.query('SELECT * FROM test_attempts WHERE id = $1 FOR UPDATE', [attemptId]);
    const attempt = attemptResult.rows[0];
    assertAttemptAuth(attempt, auth);
    if (attempt.status !== 'in_progress') throw AppError.conflict('Attempt is no longer active');
    if (Date.now() >= new Date(attempt.expires_at).getTime()) {
      await scoreAttemptTx(client, attemptId, 'auto_submitted');
      throw AppError.conflict('Attempt time has expired and was automatically submitted');
    }
    if (!attempt.question_order.includes(questionId)) throw AppError.badRequest('Question does not belong to this attempt');

    if (selectedOptionId) {
      const validOption = await client.query(
        'SELECT id FROM question_options WHERE id = $1 AND question_id = $2',
        [selectedOptionId, questionId]
      );
      if (!validOption.rows[0]) throw AppError.badRequest('Selected option does not belong to this question');
    }

    const safeStatus = status || (selectedOptionId ? 'answered' : 'not_answered');
    const allowedStatuses = ['not_visited', 'not_answered', 'answered', 'marked_for_review', 'answered_marked_for_review'];
    if (!allowedStatuses.includes(safeStatus)) throw AppError.badRequest('Invalid answer status');

    const { rows } = await client.query(
      `UPDATE attempt_answers SET selected_option_id=$1, status=$2,
       answered_at=CASE WHEN $1::uuid IS NULL THEN NULL ELSE now() END
       WHERE attempt_id=$3 AND question_id=$4
       RETURNING question_id, selected_option_id, status, updated_at`,
      [selectedOptionId || null, safeStatus, attemptId, questionId]
    );
    return rows[0];
  });

export const submitAttempt = async (attemptId, auth) =>
  withTransaction(async (client) => {
    const existing = await findAttemptById(attemptId, client);
    assertAttemptAuth(existing, auth);
    if (existing.status !== 'in_progress') return { attempt: existing, alreadySubmitted: true };

    const finalStatus = resolveAttemptStatus(existing.expires_at);
    const attempt = await scoreAttemptTx(client, attemptId, finalStatus);
    return { attempt, alreadySubmitted: false };
  });


export const autoSubmitAttemptById = async (attemptId, reason = 'security_violations') =>
  withTransaction(async (client) => {
    await client.query(
      `UPDATE test_attempts SET terminated_reason=$1 WHERE id=$2 AND status='in_progress'`,
      [reason, attemptId]
    );
    return scoreAttemptTx(client, attemptId, 'auto_submitted');
  });

export default { validatePublicAccess, getInstructions, startAttempt, getAttemptQuestions, saveAnswer, submitAttempt };

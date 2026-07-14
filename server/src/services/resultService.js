import { query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const assertOwnedTest = async (testId, adminId) => {
  const { rows } = await query(
    'SELECT * FROM tests WHERE id=$1 AND created_by=$2',
    [testId, adminId]
  );

  if (!rows[0]) {
    throw AppError.notFound('Test not found');
  }

  return rows[0];
};

export const getAdminResults = async (testId, adminId) => {
  await assertOwnedTest(testId, adminId);

  const { rows } = await query(
    `
    SELECT
      ta.id AS attempt_id,
      s.full_name,
      s.enrollment_number,
      s.email,
      ta.attempt_number,
      ta.status,
      ta.score,
      ta.percentage,
      ta.passed,
      ta.correct_count,
      ta.incorrect_count,
      ta.unattempted_count,
      ta.time_taken_seconds,
      ta.started_at,
      ta.submitted_at,
      ta.violation_count
    FROM test_attempts ta
    JOIN students s ON s.id = ta.student_id
    WHERE ta.test_id = $1
      AND ta.status <> 'in_progress'
    ORDER BY
      ta.score DESC NULLS LAST,
      ta.time_taken_seconds ASC NULLS LAST,
      ta.submitted_at ASC
    `,
    [testId]
  );

  return rows;
};

export const getLeaderboard = async (testId, adminId) => {
  const test = await assertOwnedTest(testId, adminId);

  const { rows } = await query(
    `
    SELECT
      s.full_name,
      s.enrollment_number,
      ta.score,
      ta.percentage,
      ta.time_taken_seconds,
      RANK() OVER (
        ORDER BY
          ta.score DESC NULLS LAST,
          ta.time_taken_seconds ASC NULLS LAST
      ) AS rank
    FROM test_attempts ta
    JOIN students s ON s.id = ta.student_id
    WHERE ta.test_id = $1
      AND ta.status <> 'in_progress'
    ORDER BY rank, ta.submitted_at ASC
    `,
    [testId]
  );

  return {
    enabled: test.leaderboard_enabled,
    entries: rows,
  };
};

export const getStudentLeaderboard = async (
  attemptId,
  auth
) => {
  const { rows: attemptRows } = await query(
    `
    SELECT
      ta.id,
      ta.test_id,
      ta.student_id,
      ta.status,
      t.leaderboard_enabled
    FROM test_attempts ta
    JOIN tests t ON t.id = ta.test_id
    WHERE ta.id = $1
    `,
    [attemptId]
  );

  const attempt = attemptRows[0];

  if (
    !attempt ||
    attempt.id !== auth.attemptId ||
    attempt.student_id !== auth.studentId
  ) {
    throw AppError.forbidden(
      'Leaderboard access denied'
    );
  }

  if (attempt.status === 'in_progress') {
    throw AppError.conflict(
      'Test is still in progress'
    );
  }

  if (!attempt.leaderboard_enabled) {
    return {
      enabled: false,
      yourRank: null,
      entries: [],
    };
  }

  const { rows } = await query(
    `
    SELECT *
    FROM (
      SELECT
        ta.student_id,
        s.full_name,
        s.enrollment_number,
        ta.score,
        ta.percentage,
        ta.time_taken_seconds,

        RANK() OVER (
          ORDER BY
            ta.score DESC NULLS LAST,
            ta.time_taken_seconds ASC NULLS LAST
        )::int AS rank

      FROM test_attempts ta

      JOIN students s
        ON s.id = ta.student_id

      WHERE ta.test_id = $1
        AND ta.status <> 'in_progress'
    ) leaderboard

    ORDER BY rank
    `,
    [attempt.test_id]
  );

  const yourEntry = rows.find(
    (entry) =>
      entry.student_id === auth.studentId
  );

  return {
    enabled: true,
    yourRank: yourEntry?.rank || null,

    entries: rows.slice(0, 10).map((entry) => ({
      rank: entry.rank,
      fullName: entry.full_name,
      enrollmentNumber:
        entry.enrollment_number,
      score: entry.score,
      percentage: entry.percentage,
      timeTakenSeconds:
        entry.time_taken_seconds,
      isCurrentStudent:
        entry.student_id === auth.studentId,
    })),
  };
};

export const getSecurityLogs = async (
  testId,
  adminId
) => {
  await assertOwnedTest(testId, adminId);

  const { rows } = await query(
    `
    SELECT
      sl.id,
      sl.violation_type,
      sl.violation_count_at_time AS violation_count,
      sl.metadata,
      sl.created_at,
      ta.id AS attempt_id,
      s.full_name,
      s.enrollment_number
    FROM security_logs sl
    JOIN test_attempts ta
      ON ta.id = sl.attempt_id
    JOIN students s
      ON s.id = ta.student_id
    WHERE ta.test_id = $1
    ORDER BY sl.created_at DESC
    `,
    [testId]
  );

  return rows;
};

export const getLiveMonitor = async (
  testId,
  adminId
) => {
  await assertOwnedTest(testId, adminId);

  const { rows } = await query(
    `
    SELECT
      ta.id AS attempt_id,
      s.full_name,
      s.enrollment_number,
      ta.started_at,
      ta.expires_at,
      ta.status,
      ta.violation_count,

      COUNT(aa.id)
        FILTER (
          WHERE aa.selected_option_id IS NOT NULL
        )::int AS questions_answered,

      GREATEST(
        0,
        EXTRACT(
          EPOCH FROM (ta.expires_at - now())
        )
      )::int AS remaining_seconds,

      MAX(aa.updated_at) AS last_activity_at

    FROM test_attempts ta

    JOIN students s
      ON s.id = ta.student_id

    LEFT JOIN attempt_answers aa
      ON aa.attempt_id = ta.id

    WHERE ta.test_id = $1
      AND ta.status = 'in_progress'

    GROUP BY ta.id, s.id

    ORDER BY ta.started_at DESC
    `,
    [testId]
  );

  return rows.map((row) => ({
    ...row,

    connectionStatus:
      row.last_activity_at &&
      Date.now() -
        new Date(row.last_activity_at).getTime() <
        30000
        ? 'active'
        : 'idle',
  }));
};

export const getStudentResult = async (
  attemptId,
  auth
) => {
  const { rows } = await query(
    `
    SELECT
      ta.*,
      t.title,
      t.result_visibility,
      t.expires_at AS test_expires_at,
      s.full_name,
      s.enrollment_number

    FROM test_attempts ta

    JOIN tests t
      ON t.id = ta.test_id

    JOIN students s
      ON s.id = ta.student_id

    WHERE ta.id = $1
    `,
    [attemptId]
  );

  const result = rows[0];

  if (
    !result ||
    result.id !== auth.attemptId ||
    result.student_id !== auth.studentId
  ) {
    throw AppError.forbidden(
      'Result access denied'
    );
  }

  if (result.status === 'in_progress') {
    throw AppError.conflict(
      'Test is still in progress'
    );
  }

  if (result.result_visibility === 'hidden') {
    throw AppError.forbidden(
      'Result is hidden by the administrator'
    );
  }

  if (
    result.result_visibility === 'after_expiry' &&
    Date.now() <
      new Date(result.test_expires_at).getTime()
  ) {
    throw AppError.forbidden(
      'Result will be available after the test expires'
    );
  }

  return {
    attemptId: result.id,
    studentName: result.full_name,
    enrollmentNumber: result.enrollment_number,
    testName: result.title,
    score: result.score,
    totalMarks: result.total_marks_snapshot,
    percentage: result.percentage,
    correct: result.correct_count,
    incorrect: result.incorrect_count,
    unattempted: result.unattempted_count,
    passed: result.passed,
    timeTakenSeconds: result.time_taken_seconds,
  };
};
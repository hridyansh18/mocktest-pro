import { withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { emitTestEvent } from './liveMonitorService.js';
import { autoSubmitAttemptById } from './attemptService.js';

const TYPES = ['TAB_SWITCH','WINDOW_BLUR','FULLSCREEN_EXIT','COPY_ATTEMPT','PASTE_ATTEMPT','DEVTOOLS_SHORTCUT','PAGE_REFRESH'];

export const logViolation = async (attemptId, auth, { violationType, metadata = {} }) => {
  if (!TYPES.includes(violationType)) throw AppError.badRequest('Invalid violation type');
  const result = await withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM test_attempts WHERE id=$1 FOR UPDATE', [attemptId]);
    const attempt = rows[0];
    if (!attempt || attempt.id !== auth.attemptId || attempt.student_id !== auth.studentId) throw AppError.forbidden('Attempt access denied');
    if (attempt.status !== 'in_progress') throw AppError.conflict('Attempt is no longer active');

    const count = Number(attempt.violation_count) + 1;
    await client.query('UPDATE test_attempts SET violation_count=$1 WHERE id=$2', [count, attemptId]);
    const inserted = await client.query(
      `INSERT INTO security_logs (attempt_id, student_id, test_id, violation_type, violation_count_at_time, metadata)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
      [attemptId, attempt.student_id, attempt.test_id, violationType, count, JSON.stringify(metadata)]
    );
    return { attempt, log: inserted.rows[0], violationCount: count, action: count >= 3 ? 'AUTO_SUBMIT' : count === 2 ? 'FINAL_WARNING' : 'WARNING' };
  });

  emitTestEvent(result.attempt.test_id, 'attempt:violation', {
    attemptId, violationType, violationCount: result.violationCount, action: result.action
  });

  let submittedAttempt = null;
  if (result.violationCount >= 3) {
    submittedAttempt = await autoSubmitAttemptById(attemptId, 'security_violations');
    emitTestEvent(result.attempt.test_id, 'attempt:submitted', {
      attemptId, status: submittedAttempt.status, score: submittedAttempt.score, reason: 'security_violations'
    });
  }

  return { log: result.log, violationCount: result.violationCount, action: result.action, submitted: Boolean(submittedAttempt) };
};

import { query } from '../config/db.js';

export const findAttemptById = async (id, client = { query }) => {
  const { rows } = await client.query('SELECT * FROM test_attempts WHERE id = $1', [id]);
  return rows[0] || null;
};

export const countStudentAttempts = async (testId, studentId, client = { query }) => {
  const { rows } = await client.query(
    'SELECT COUNT(*)::int AS count FROM test_attempts WHERE test_id = $1 AND student_id = $2',
    [testId, studentId]
  );
  return rows[0].count;
};

export const countDistinctTestStudents = async (testId, client = { query }) => {
  const { rows } = await client.query(
    'SELECT COUNT(DISTINCT student_id)::int AS count FROM test_attempts WHERE test_id = $1',
    [testId]
  );
  return rows[0].count;
};

export const findActiveAttempt = async (testId, studentId, client = { query }) => {
  const { rows } = await client.query(
    `SELECT * FROM test_attempts
     WHERE test_id = $1 AND student_id = $2 AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [testId, studentId]
  );
  return rows[0] || null;
};

export default { findAttemptById, countStudentAttempts, countDistinctTestStudents, findActiveAttempt };

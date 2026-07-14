import { query } from '../config/db.js';

export const addAllowedStudents = async (testId, students) => {
  const inserted = [];
  for (const s of students) {
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await query(
      `INSERT INTO test_allowed_students (test_id, email, enrollment_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (test_id, email) DO UPDATE SET enrollment_number = EXCLUDED.enrollment_number
       RETURNING *`,
      [testId, s.email.toLowerCase(), s.enrollmentNumber || null]
    );
    inserted.push(rows[0]);
  }
  return inserted;
};

export const listAllowedStudents = async (testId) => {
  const { rows } = await query(
    'SELECT * FROM test_allowed_students WHERE test_id = $1 ORDER BY created_at ASC',
    [testId]
  );
  return rows;
};

export const removeAllowedStudent = async (testId, allowedStudentId) => {
  const { rows } = await query(
    'DELETE FROM test_allowed_students WHERE id = $1 AND test_id = $2 RETURNING id',
    [allowedStudentId, testId]
  );
  return rows[0] || null;
};

export const isEmailAllowed = async (testId, email) => {
  const { rows } = await query(
    'SELECT 1 FROM test_allowed_students WHERE test_id = $1 AND email = $2',
    [testId, email.toLowerCase()]
  );
  return rows.length > 0;
};

export default { addAllowedStudents, listAllowedStudents, removeAllowedStudent, isEmailAllowed };

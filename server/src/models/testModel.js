import { query } from '../config/db.js';

const INSERT_COLUMNS = [
  'test_code_id', 'access_code', 'created_by', 'title', 'description', 'subject', 'category',
  'duration_minutes', 'total_marks', 'marks_per_question', 'negative_marking', 'negative_marks_value',
  'start_at', 'expires_at', 'max_attempts', 'passing_percentage', 'instructions',
  'visibility', 'require_test_code', 'restrict_to_allowed_list', 'college_email_domain', 'max_student_limit',
  'shuffle_questions', 'shuffle_options', 'result_visibility', 'show_question_review', 'leaderboard_enabled',
  'status'
];

export const createTest = async (data, client = { query }) => {
  const values = INSERT_COLUMNS.map((col) => data[col] ?? null);
  const placeholders = INSERT_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await client.query(
    `INSERT INTO tests (${INSERT_COLUMNS.join(', ')})
     VALUES (${placeholders})
     RETURNING *`,
    values
  );
  return rows[0];
};

export const findTestById = async (id) => {
  const { rows } = await query('SELECT * FROM tests WHERE id = $1', [id]);
  return rows[0] || null;
};

export const findTestByCodeId = async (testCodeId) => {
  const { rows } = await query('SELECT * FROM tests WHERE test_code_id = $1', [testCodeId]);
  return rows[0] || null;
};

export const findTestByIdForAdmin = async (id, createdBy) => {
  const { rows } = await query('SELECT * FROM tests WHERE id = $1 AND created_by = $2', [id, createdBy]);
  return rows[0] || null;
};

export const listTestsByAdmin = async (createdBy, { status, category, search, page = 1, limit = 20 }) => {
  const conditions = ['created_by = $1'];
  const values = [createdBy];
  let idx = 2;

  if (status) {
    conditions.push(`status = $${idx}`);
    values.push(status);
    idx += 1;
  }
  if (category) {
    conditions.push(`category = $${idx}`);
    values.push(category);
    idx += 1;
  }
  if (search) {
    conditions.push(`(title ILIKE $${idx} OR test_code_id ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx += 1;
  }

  const offset = (page - 1) * limit;
  const whereClause = conditions.join(' AND ');

  const { rows } = await query(
    `SELECT t.*,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t
     WHERE ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  const countResult = await query(`SELECT COUNT(*) FROM tests WHERE ${whereClause}`, values);

  return {
    tests: rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit
  };
};

const UPDATABLE_COLUMNS = [
  'title', 'description', 'subject', 'category',
  'duration_minutes', 'total_marks', 'marks_per_question', 'negative_marking', 'negative_marks_value',
  'start_at', 'expires_at', 'max_attempts', 'passing_percentage', 'instructions',
  'visibility', 'require_test_code', 'restrict_to_allowed_list', 'college_email_domain', 'max_student_limit',
  'shuffle_questions', 'shuffle_options', 'result_visibility', 'show_question_review', 'leaderboard_enabled',
  'status'
];

export const updateTest = async (id, createdBy, patch) => {
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const col of UPDATABLE_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(patch, col)) {
      setClauses.push(`${col} = $${idx}`);
      values.push(patch[col]);
      idx += 1;
    }
  }

  if (setClauses.length === 0) {
    return findTestByIdForAdmin(id, createdBy);
  }

  values.push(id, createdBy);
  const { rows } = await query(
    `UPDATE tests SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND created_by = $${idx + 1}
     RETURNING *`,
    values
  );
  return rows[0] || null;
};

export const deleteTest = async (id, createdBy) => {
  const { rows } = await query(
    'DELETE FROM tests WHERE id = $1 AND created_by = $2 RETURNING id',
    [id, createdBy]
  );
  return rows[0] || null;
};

export const recalculateTotalMarks = async (testId) => {
  await query(
    `UPDATE tests SET total_marks = COALESCE(
        (SELECT SUM(marks) FROM questions WHERE test_id = $1), 0
     )
     WHERE id = $1`,
    [testId]
  );
};

export default {
  createTest,
  findTestById,
  findTestByCodeId,
  findTestByIdForAdmin,
  listTestsByAdmin,
  updateTest,
  deleteTest,
  recalculateTotalMarks
};

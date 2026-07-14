import { query } from '../config/db.js';

export const createQuestion = async (
  { testId, questionText, explanation, marks, negativeMarks, difficulty, orderIndex },
  client = { query }
) => {
  const { rows } = await client.query(
    `INSERT INTO questions (test_id, question_text, explanation, marks, negative_marks, difficulty, order_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [testId, questionText, explanation || null, marks, negativeMarks || 0, difficulty || 'medium', orderIndex ?? 0]
  );
  return rows[0];
};

export const findQuestionById = async (id) => {
  const { rows } = await query('SELECT * FROM questions WHERE id = $1', [id]);
  return rows[0] || null;
};

/**
 * Full question list for the admin (includes is_correct on options) —
 * never call this from a student-facing / active-attempt code path.
 */
export const listQuestionsForAdmin = async (testId) => {
  const { rows: questions } = await query(
    'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_index ASC, created_at ASC',
    [testId]
  );
  if (questions.length === 0) return [];

  const { rows: options } = await query(
    `SELECT * FROM question_options WHERE question_id = ANY($1::uuid[]) ORDER BY order_index ASC`,
    [questions.map((q) => q.id)]
  );

  return questions.map((q) => ({
    ...q,
    options: options.filter((o) => o.question_id === q.id)
  }));
};

const UPDATABLE_COLUMNS = ['question_text', 'explanation', 'marks', 'negative_marks', 'difficulty', 'order_index'];

export const updateQuestion = async (id, testId, patch) => {
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
  if (setClauses.length === 0) return findQuestionById(id);

  values.push(id, testId);
  const { rows } = await query(
    `UPDATE questions SET ${setClauses.join(', ')}
     WHERE id = $${idx} AND test_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return rows[0] || null;
};

export const deleteQuestion = async (id, testId) => {
  const { rows } = await query(
    'DELETE FROM questions WHERE id = $1 AND test_id = $2 RETURNING id',
    [id, testId]
  );
  return rows[0] || null;
};

export const reorderQuestions = async (testId, orderedIds) => {
  await Promise.all(
    orderedIds.map((questionId, index) =>
      query('UPDATE questions SET order_index = $1 WHERE id = $2 AND test_id = $3', [index, questionId, testId])
    )
  );
};

export const countQuestionsByTest = async (testId) => {
  const { rows } = await query('SELECT COUNT(*) FROM questions WHERE test_id = $1', [testId]);
  return parseInt(rows[0].count, 10);
};

export default {
  createQuestion,
  findQuestionById,
  listQuestionsForAdmin,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  countQuestionsByTest
};

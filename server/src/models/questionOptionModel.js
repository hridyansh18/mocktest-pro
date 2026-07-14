import { query } from '../config/db.js';

export const createOptions = async (questionId, options, client = { query }) => {
  const inserted = [];
  for (let i = 0; i < options.length; i += 1) {
    const opt = options[i];
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await client.query(
      `INSERT INTO question_options (question_id, option_text, is_correct, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [questionId, opt.optionText, !!opt.isCorrect, i]
    );
    inserted.push(rows[0]);
  }
  return inserted;
};

export const replaceOptions = async (questionId, options, client) => {
  await client.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);
  return createOptions(questionId, options, client);
};

export const listOptionsByQuestion = async (questionId) => {
  const { rows } = await query(
    'SELECT * FROM question_options WHERE question_id = $1 ORDER BY order_index ASC',
    [questionId]
  );
  return rows;
};

export default { createOptions, replaceOptions, listOptionsByQuestion };

import { query } from '../config/db.js';

export const findUserByEmail = async (email) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

export const createUser = async ({ email, passwordHash, role }, client = { query }) => {
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email.toLowerCase(), passwordHash, role]
  );
  return rows[0];
};

export default { findUserByEmail, findUserById, createUser };

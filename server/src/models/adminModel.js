import { query } from '../config/db.js';

export const createAdmin = async ({ userId, fullName, institution, designation }, client = { query }) => {
  const { rows } = await client.query(
    `INSERT INTO admins (user_id, full_name, institution, designation)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, fullName, institution || null, designation || null]
  );
  return rows[0];
};

export const findAdminByUserId = async (userId) => {
  const { rows } = await query('SELECT * FROM admins WHERE user_id = $1', [userId]);
  return rows[0] || null;
};

export const findAdminById = async (id) => {
  const { rows } = await query('SELECT * FROM admins WHERE id = $1', [id]);
  return rows[0] || null;
};

export default { createAdmin, findAdminByUserId, findAdminById };

import { query } from '../config/db.js';

export const findOrCreateStudent = async ({ fullName, enrollmentNumber, email }, client = { query }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await client.query(
    `INSERT INTO students (full_name, enrollment_number, email)
     VALUES ($1, $2, $3)
     ON CONFLICT (enrollment_number, email)
     DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = now()
     RETURNING *`,
    [fullName.trim(), enrollmentNumber.trim(), normalizedEmail]
  );
  return rows[0];
};

export default { findOrCreateStudent };

import bcrypt from 'bcryptjs';

import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

import { createUser } from '../models/userModel.js';
import { createAdmin } from '../models/adminModel.js';

export const listAdmins = async () => {
  const { rows } = await query(`
    SELECT
      a.id,
      a.full_name,
      a.institution,
      a.designation,
      a.role,
      a.is_active,
      a.created_at,
      u.email
    FROM admins a
    JOIN users u ON u.id = a.user_id
    ORDER BY
      CASE WHEN a.role = 'super_admin' THEN 0 ELSE 1 END,
      a.created_at DESC
  `);

  return rows;
};

export const createManagedAdmin = async ({
  fullName,
  email,
  password,
  institution,
  designation,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await query(
    'SELECT id FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );

  if (existing.rows[0]) {
    throw AppError.conflict(
      'An account with this email already exists'
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    env.bcryptSaltRounds
  );

  return withTransaction(async (client) => {
    const user = await createUser(
      {
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
      },
      client
    );

    const admin = await createAdmin(
      {
        userId: user.id,
        fullName,
        institution,
        designation,
      },
      client
    );

    return {
      id: admin.id,
      fullName: admin.full_name,
      email: user.email,
      institution: admin.institution,
      designation: admin.designation,
      role: admin.role,
      isActive: admin.is_active,
    };
  });
};

export const setAdminStatus = async (
  adminId,
  superAdminId,
  isActive
) => {
  if (adminId === superAdminId) {
    throw AppError.forbidden(
      'You cannot disable your own Super Admin account'
    );
  }

  const { rows } = await query(
    `
    UPDATE admins
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1
      AND role <> 'super_admin'
    RETURNING *
    `,
    [adminId, isActive]
  );

  if (!rows[0]) {
    throw AppError.notFound(
      'Admin not found or protected account'
    );
  }

  return rows[0];
};
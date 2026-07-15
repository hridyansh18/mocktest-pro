import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool, withTransaction } from '../config/db.js';
import { findUserByEmail, createUser } from '../models/userModel.js';
import { createAdmin } from '../models/adminModel.js';

const run = async () => {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'MockTest Pro Admin';

  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (minimum 12 characters).');
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`Admin bootstrap skipped: ${email} already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  await withTransaction(async (client) => {
    const user = await createUser({ email, passwordHash, role: 'admin' }, client);
    const admin = await createAdmin({ userId: user.id, fullName }, client);
    await client.query(`UPDATE admins SET role = 'super_admin' WHERE id = $1`, [admin.id]);
  });
  console.log(`Super Admin created: ${email}`);
};

try {
  await run();
} finally {
  await pool.end();
}

import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../config/db.js';

import {
  findUserByEmail,
  findUserById,
  createUser,
} from '../models/userModel.js';

import {
  createAdmin,
  findAdminByUserId,
} from '../models/adminModel.js';

import { signAccessToken } from './tokenService.js';

import {
  createRefreshSession,
  rotateRefreshSession,
  revokeRefreshSession,
} from './refreshSessionService.js';

const buildAuthPayload = (user, admin) => ({
  sub: user.id,

  // Existing application role
  role: user.role,

  // Admin permission level
  adminRole: admin.role,

  adminId: admin.id,
  email: user.email,
});

const buildAdminPayload = (user, admin) => ({
  id: admin.id,
  fullName: admin.full_name,
  email: user.email,
  institution: admin.institution,
  designation: admin.designation,
  role: admin.role,
  isActive: admin.is_active,
});

export const registerAdmin = async ({
  email,
  password,
  fullName,
  institution,
  designation,
}) => {
  const existing = await findUserByEmail(email);

  if (existing) {
    throw AppError.conflict(
      'An account with this email already exists'
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    env.bcryptSaltRounds
  );

  const { user, admin } = await withTransaction(
    async (client) => {
      const newUser = await createUser(
        {
          email,
          passwordHash,
          role: 'admin',
        },
        client
      );

      const newAdmin = await createAdmin(
        {
          userId: newUser.id,
          fullName,
          institution,
          designation,
        },
        client
      );

      return {
        user: newUser,
        admin: newAdmin,
      };
    }
  );

  const refreshToken = await createRefreshSession(
    user.id
  );

  return {
    accessToken: signAccessToken(
      buildAuthPayload(user, admin)
    ),

    refreshToken,

    admin: buildAdminPayload(user, admin),
  };
};

export const loginAdmin = async ({
  email,
  password,
}) => {
  const user = await findUserByEmail(email);

  if (!user || user.role !== 'admin') {
    throw AppError.unauthorized(
      'Invalid email or password'
    );
  }

  if (!user.is_active) {
    throw AppError.forbidden(
      'This account has been deactivated'
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw AppError.unauthorized(
      'Invalid email or password'
    );
  }

  const admin = await findAdminByUserId(user.id);

  if (!admin) {
    throw AppError.unauthorized(
      'Admin profile not found for this account'
    );
  }

  if (!admin.is_active) {
    throw AppError.forbidden(
      'Admin access has been disabled'
    );
  }

  const refreshToken = await createRefreshSession(
    user.id
  );

  return {
    accessToken: signAccessToken(
      buildAuthPayload(user, admin)
    ),

    refreshToken,

    admin: buildAdminPayload(user, admin),
  };
};

export const refreshAccessToken = async (
  refreshToken
) => {
  if (!refreshToken) {
    throw AppError.unauthorized(
      'Refresh token missing'
    );
  }

  const rotated = await rotateRefreshSession(
    refreshToken
  );

  const foundUser = await findUserById(
    rotated.userId
  );

  if (!foundUser || !foundUser.is_active) {
    throw AppError.unauthorized(
      'Account no longer active'
    );
  }

  const admin = await findAdminByUserId(
    foundUser.id
  );

  if (!admin || !admin.is_active) {
    throw AppError.unauthorized(
      'Admin access is no longer active'
    );
  }

  return {
    accessToken: signAccessToken(
      buildAuthPayload(foundUser, admin)
    ),

    refreshToken: rotated.refreshToken,
  };
};

export const logoutAdmin = async (
  refreshToken
) => {
  await revokeRefreshSession(refreshToken);

  return {
    message:
      'Logged out and refresh session revoked',
  };
};

export default {
  registerAdmin,
  loginAdmin,
  refreshAccessToken,
  logoutAdmin,
};
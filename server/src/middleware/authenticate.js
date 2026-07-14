import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken, verifyAttemptToken } from '../services/tokenService.js';

const extractBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

/**
 * Verifies an admin/user access token and attaches req.user = { id, role, ... }.
 * Use on all /api/admin/* routes.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw AppError.unauthorized('Authentication token missing');

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { sub, role, adminId, email }
    next();
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired token');
  }
});

/**
 * Verifies a short-lived attempt token and attaches req.attemptAuth.
 * Use on all /api/attempts/* routes (the student-facing exam engine).
 */
export const authenticateAttempt = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw AppError.unauthorized('Attempt token missing');

  try {
    const decoded = verifyAttemptToken(token);
    req.attemptAuth = decoded; // { attemptId, testId, studentId }
    next();
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired attempt session');
  }
});

/**
 * Like authenticate, but does not fail if no token is present — used for
 * endpoints that behave differently for logged-in vs anonymous callers.
 */
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();
  try {
    req.user = verifyAccessToken(token);
  } catch (err) {
    // ignore invalid token in optional mode
  }
  next();
});

export default authenticate;

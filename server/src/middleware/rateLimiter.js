import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * General API limiter — applied globally in app.js.
 */
export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests. Please slow down and try again shortly.' }
  }
});

/**
 * Stricter limiter for auth endpoints (login/register) to blunt
 * credential-stuffing / brute-force attempts.
 */
export const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many authentication attempts. Please try again later.' }
  }
});

/**
 * Limiter for the public test-access endpoint (name/roll/email/code
 * validation) — a plausible brute-force target for guessing access codes.
 */
export const testAccessLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many attempts to access this test. Please wait and try again.' }
  }
});

export default generalLimiter;

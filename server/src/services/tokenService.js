import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: 'mocktest-pro',
    audience: 'mocktest-pro-admin'
  });

export const signRefreshToken = (payload, jti = crypto.randomUUID()) => ({
  token: jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: 'mocktest-pro',
    audience: 'mocktest-pro-refresh',
    jwtid: jti
  }),
  jti
});

export const signAttemptToken = (payload, expiresIn) =>
  jwt.sign(payload, env.jwt.attemptSecret, {
    expiresIn: expiresIn || '6h',
    issuer: 'mocktest-pro',
    audience: 'mocktest-pro-attempt'
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.accessSecret, { issuer: 'mocktest-pro', audience: 'mocktest-pro-admin' });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret, { issuer: 'mocktest-pro', audience: 'mocktest-pro-refresh' });

export const verifyAttemptToken = (token) =>
  jwt.verify(token, env.jwt.attemptSecret, { issuer: 'mocktest-pro', audience: 'mocktest-pro-attempt' });

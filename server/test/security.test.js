import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';

test('JWT audience rejects token for wrong client', async () => {
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(64);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(64);
  process.env.JWT_ATTEMPT_SECRET = 'c'.repeat(64);
  const { verifyAccessToken } = await import('../src/services/tokenService.js');
  const token = jwt.sign({ sub: 'user' }, process.env.JWT_ACCESS_SECRET, {
    issuer: 'mocktest-pro', audience: 'wrong-audience'
  });
  assert.throws(() => verifyAccessToken(token));
});

test('JWT issuer rejects foreign token', async () => {
  const { verifyAttemptToken } = await import('../src/services/tokenService.js');
  const token = jwt.sign({ attemptId: 'x' }, process.env.JWT_ATTEMPT_SECRET, {
    issuer: 'foreign-service', audience: 'mocktest-pro-attempt'
  });
  assert.throws(() => verifyAttemptToken(token));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePercentage, resolveAttemptStatus } from '../src/utils/attemptMath.js';

test('percentage never goes below zero after negative marking', () => {
  assert.equal(calculatePercentage(-3, 30), 0);
});

test('percentage calculates normal score', () => {
  assert.equal(calculatePercentage(21, 30), 70);
});

test('submission becomes auto_submitted at expiry', () => {
  assert.equal(resolveAttemptStatus('2026-01-01T10:00:00.000Z', Date.parse('2026-01-01T10:00:00.000Z')), 'auto_submitted');
});

test('submission remains manual before expiry', () => {
  assert.equal(resolveAttemptStatus('2026-01-01T10:00:01.000Z', Date.parse('2026-01-01T10:00:00.000Z')), 'submitted');
});

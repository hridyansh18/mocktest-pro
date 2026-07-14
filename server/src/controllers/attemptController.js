import { asyncHandler } from '../utils/asyncHandler.js';
import * as attemptService from '../services/attemptService.js';
import { emitTestEvent } from '../services/liveMonitorService.js';

export const start = asyncHandler(async (req, res) => {
  const data = await attemptService.startAttempt({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  });
  res.status(data.resumed ? 200 : 201).json({
    success: true,
    data: {
      attemptId: data.attempt.id,
      attemptToken: data.attemptToken,
      resumed: data.resumed,
      startedAt: data.attempt.started_at,
      expiresAt: data.attempt.expires_at,
      serverTime: new Date().toISOString()
    }
  });
});

export const questions = asyncHandler(async (req, res) => {
  const data = await attemptService.getAttemptQuestions(req.params.attemptId, req.attemptAuth);
  res.status(200).json({ success: true, data });
});

export const saveAnswer = asyncHandler(async (req, res) => {
  const data = await attemptService.saveAnswer(req.params.attemptId, req.attemptAuth, req.body);
  emitTestEvent(req.attemptAuth.testId, 'attempt:update', { attemptId: req.params.attemptId, questionId: data.question_id, status: data.status, savedAt: new Date().toISOString() });
  res.status(200).json({ success: true, data, meta: { savedAt: new Date().toISOString() } });
});

export const submit = asyncHandler(async (req, res) => {
  const data = await attemptService.submitAttempt(req.params.attemptId, req.attemptAuth);
  emitTestEvent(req.attemptAuth.testId, 'attempt:submitted', { attemptId: req.params.attemptId, status: data.attempt.status, score: data.attempt.score });
  res.status(200).json({ success: true, data });
});

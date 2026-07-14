import { asyncHandler } from '../utils/asyncHandler.js';
import * as attemptService from '../services/attemptService.js';

export const validateAccess = asyncHandler(async (req, res) => {
  const data = await attemptService.validatePublicAccess({ testCodeId: req.params.testCodeId, ...req.body });
  res.status(200).json({ success: true, data });
});

export const instructions = asyncHandler(async (req, res) => {
  const data = await attemptService.getInstructions(req.params.testCodeId);
  res.status(200).json({ success: true, data });
});

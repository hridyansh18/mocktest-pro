import { asyncHandler } from '../utils/asyncHandler.js';
import { logViolation } from '../services/violationService.js';

export const violation = asyncHandler(async (req,res) => {
  const data=await logViolation(req.params.attemptId,req.attemptAuth,req.body);
  res.status(201).json({success:true,data});
});

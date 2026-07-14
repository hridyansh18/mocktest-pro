import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/resultService.js';

export const results = asyncHandler(
  async (req, res) =>
    res.json({
      success: true,
      data: await service.getAdminResults(
        req.params.id,
        req.user.adminId
      ),
    })
);

export const leaderboard = asyncHandler(
  async (req, res) =>
    res.json({
      success: true,
      data: await service.getLeaderboard(
        req.params.id,
        req.user.adminId
      ),
    })
);

export const studentLeaderboard = asyncHandler(
  async (req, res) =>
    res.json({
      success: true,
      data: await service.getStudentLeaderboard(
        req.params.attemptId,
        req.attemptAuth
      ),
    })
);

export const securityLogs = asyncHandler(
  async (req, res) =>
    res.json({
      success: true,
      data: await service.getSecurityLogs(
        req.params.id,
        req.user.adminId
      ),
    })
);

export const liveMonitor = asyncHandler(
  async (req, res) =>
    res.json({
      success: true,
      data: await service.getLiveMonitor(
        req.params.id,
        req.user.adminId
      ),
    })
);

export const studentResult = asyncHandler(
  async (req, res) =>
    res.json({
      success: true,
      data: await service.getStudentResult(
        req.params.attemptId,
        req.attemptAuth
      ),
    })
);
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, institution, designation } = req.body;
  const result = await authService.registerAdmin({ fullName, email, password, institution, designation });
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginAdmin({ email, password });
  res.status(200).json({ success: true, data: result });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.status(200).json({ success: true, data: result });
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logoutAdmin(req.body.refreshToken);
  res.status(200).json({ success: true, data: result });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

export default { register, login, refresh, logout, me };

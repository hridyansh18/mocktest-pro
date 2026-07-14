import { asyncHandler } from '../utils/asyncHandler.js';
import * as service from '../services/adminManagementService.js';

export const list = asyncHandler(async (req, res) => {
  const admins = await service.listAdmins();

  res.status(200).json({
    success: true,
    data: {
      admins,
    },
  });
});

export const create = asyncHandler(async (req, res) => {
  const admin = await service.createManagedAdmin(
    req.body
  );

  res.status(201).json({
    success: true,
    data: {
      admin,
    },
  });
});

export const status = asyncHandler(async (req, res) => {
  const admin = await service.setAdminStatus(
    req.params.adminId,
    req.user.adminId,
    req.body.isActive
  );

  res.status(200).json({
    success: true,
    data: {
      admin,
    },
  });
});
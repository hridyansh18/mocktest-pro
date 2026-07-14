import { asyncHandler } from '../utils/asyncHandler.js';
import * as studentService from '../services/studentService.js';

export const listStudents = asyncHandler(async (req, res) => {
  const search = req.query.search || '';

  const limit = Math.min(
    parseInt(req.query.limit, 10) || 100,
    500
  );

  const students = await studentService.listStudents(
    req.user.adminId,
    {
      search,
      limit,
    }
  );

  res.status(200).json({
    success: true,
    data: {
      students,
    },
  });
});

export default {
  listStudents,
};
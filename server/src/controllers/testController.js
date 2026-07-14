import { asyncHandler } from '../utils/asyncHandler.js';
import * as testService from '../services/testService.js';

export const createTest = asyncHandler(async (req, res) => {
  const test = await testService.createTest(req.user.adminId, req.body);
  res.status(201).json({
    success: true,
    data: {
      test,
      shareUrl: `${req.protocol}://${req.get('host').replace(/:\d+$/, '')}/test/${test.test_code_id}`,
      testCode: test.access_code
    }
  });
});

export const listTests = asyncHandler(async (req, res) => {
  const { status, category, search, page, limit } = req.query;
  const result = await testService.listTests(req.user.adminId, {
    status,
    category,
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20
  });
  res.status(200).json({ success: true, data: result });
});

export const getTest = asyncHandler(async (req, res) => {
  const test = await testService.getTestForAdmin(req.params.id, req.user.adminId);
  res.status(200).json({ success: true, data: { test } });
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = await testService.updateTest(req.params.id, req.user.adminId, req.body);
  res.status(200).json({ success: true, data: { test } });
});

export const deleteTest = asyncHandler(async (req, res) => {
  await testService.deleteTest(req.params.id, req.user.adminId);
  res.status(200).json({ success: true, data: { message: 'Test deleted' } });
});

export const addAllowedStudents = asyncHandler(async (req, res) => {
  const students = await testService.addAllowedStudents(req.params.id, req.user.adminId, req.body.students);
  res.status(201).json({ success: true, data: { students } });
});

export const listAllowedStudents = asyncHandler(async (req, res) => {
  const students = await testService.listAllowedStudents(req.params.id, req.user.adminId);
  res.status(200).json({ success: true, data: { students } });
});

export const removeAllowedStudent = asyncHandler(async (req, res) => {
  await testService.removeAllowedStudent(req.params.id, req.user.adminId, req.params.studentEntryId);
  res.status(200).json({ success: true, data: { message: 'Removed' } });
});

export default {
  createTest,
  listTests,
  getTest,
  updateTest,
  deleteTest,
  addAllowedStudents,
  listAllowedStudents,
  removeAllowedStudent
};

import { Router } from 'express';
import * as staffController from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

// All staff routes require authentication
router.use(authenticate);

// ==================== ATTENDANCE (Self-service) ====================

/**
 * @route   POST /api/v1/staff/attendance/check-in
 * @desc    Check in for the day
 * @access  Private (any authenticated user)
 */
router.post('/attendance/check-in', staffController.checkIn);

/**
 * @route   POST /api/v1/staff/attendance/check-out
 * @desc    Check out for the day
 * @access  Private (any authenticated user)
 */
router.post('/attendance/check-out', staffController.checkOut);

/**
 * @route   GET /api/v1/staff/attendance/today
 * @desc    Get today's attendance status
 * @access  Private (any authenticated user)
 */
router.get('/attendance/today', staffController.getTodayStatus);

/**
 * @route   GET /api/v1/staff/attendance
 * @desc    Get user's own attendance history
 * @access  Private (any authenticated user)
 */
router.get('/attendance', staffController.getMyAttendance);

/**
 * @route   GET /api/v1/staff/attendance/:userId/summary
 * @desc    Get attendance summary for a user (for payroll)
 * @access  Private (staff read permission)
 */
router.get(
    '/attendance/:userId/summary',
    authorize(PERMISSIONS.STAFF_READ),
    staffController.getAttendanceSummary
);

// ==================== LEAVE REQUESTS ====================

/**
 * @route   POST /api/v1/staff/leave
 * @desc    Request leave
 * @access  Private (any authenticated user)
 */
router.post('/leave', staffController.requestLeave);

/**
 * @route   GET /api/v1/staff/leave
 * @desc    Get user's own leave requests
 * @access  Private (any authenticated user)
 */
router.get('/leave', staffController.getMyLeaveRequests);

/**
 * @route   GET /api/v1/staff/leave/pending
 * @desc    Get all pending leave requests (for managers)
 * @access  Private (staff write permission)
 */
router.get(
    '/leave/pending',
    authorize(PERMISSIONS.STAFF_WRITE),
    staffController.getPendingLeaveRequests
);

/**
 * @route   POST /api/v1/staff/leave/:id/process
 * @desc    Approve or reject leave request
 * @access  Private (staff write permission)
 */
router.post(
    '/leave/:id/process',
    authorize(PERMISSIONS.STAFF_WRITE),
    staffController.processLeaveRequest
);

export default router;

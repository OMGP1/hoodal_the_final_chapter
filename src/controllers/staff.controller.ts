import { Request, Response } from 'express';
import { staffService } from '../services/staff.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

// ==================== STAFF LISTING ====================

export const listStaff = asyncHandler(async (req: Request, res: Response) => {
    const result = await staffService.listStaff({
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 50,
    });
    sendSuccess(res, result);
});

// ==================== ATTENDANCE ====================

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const attendance = await staffService.checkIn(user.id, req.body);
    sendSuccess(res, attendance, 'Checked in successfully', 201);
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const attendance = await staffService.checkOut(user.id, req.body);
    sendSuccess(res, attendance, 'Checked out successfully');
});

export const getTodayStatus = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const status = await staffService.getTodayStatus(user.id);
    sendSuccess(res, status);
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    const attendance = await staffService.getAttendance(
        user.id,
        startDate ? new Date(startDate as string) : new Date(new Date().setDate(1)),
        endDate ? new Date(endDate as string) : new Date()
    );
    sendSuccess(res, attendance);
});

export const getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { month, year } = req.query;

    const now = new Date();
    const summary = await staffService.getAttendanceSummary(
        userId,
        month ? parseInt(month as string) : now.getMonth() + 1,
        year ? parseInt(year as string) : now.getFullYear()
    );
    sendSuccess(res, summary);
});

// ==================== LEAVE REQUESTS ====================

export const requestLeave = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { startDate, endDate, type, reason } = req.body;

    const leave = await staffService.requestLeave(user.id, {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        reason,
    });
    sendSuccess(res, leave, 'Leave request submitted', 201);
});

export const getMyLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { status } = req.query;

    const leaves = await staffService.getLeaveRequests(user.id, status as string);
    sendSuccess(res, leaves);
});

export const getPendingLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
    const leaves = await staffService.getPendingLeaveRequests();
    sendSuccess(res, leaves);
});

export const processLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { action } = req.body;

    const leave = await staffService.processLeaveRequest(id, action, user.id);
    sendSuccess(res, leave, `Leave request ${action}`);
});

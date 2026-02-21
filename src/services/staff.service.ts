import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';

interface CheckInInput {
    notes?: string;
}

interface CheckOutInput {
    notes?: string;
}

interface LeaveRequestInput {
    startDate: Date;
    endDate: Date;
    type: string;
    reason?: string;
}

export class StaffService {
    /**
     * Clock in for the day
     */
    async checkIn(userId: string, data?: CheckInInput) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        const existing = await prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        });

        if (existing) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Already checked in for today',
                400
            );
        }

        const now = new Date();

        // Determine status based on check-in time (e.g., late if after 9:30 AM)
        const lateThreshold = new Date(today);
        lateThreshold.setHours(9, 30, 0, 0);

        const status = now > lateThreshold ? 'late' : 'present';

        return prisma.attendance.create({
            data: {
                userId,
                date: today,
                checkIn: now,
                status,
                notes: data?.notes,
            },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }

    /**
     * Clock out for the day
     */
    async checkOut(userId: string, data?: CheckOutInput) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        });

        if (!attendance) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'No check-in found for today. Check in first.',
                400
            );
        }

        if (attendance.checkOut) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Already checked out for today',
                400
            );
        }

        const now = new Date();

        // Calculate work hours
        const checkInTime = new Date(attendance.checkIn);
        const diffMs = now.getTime() - checkInTime.getTime();
        const workHours = new Decimal(diffMs / (1000 * 60 * 60)).toDecimalPlaces(2);

        // Update status if worked less than 4 hours
        let status = attendance.status;
        if (workHours.lessThan(4)) {
            status = 'half_day';
        }

        return prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: now,
                workHours,
                status,
                notes: data?.notes ? `${attendance.notes ?? ''} | ${data.notes}` : attendance.notes,
            },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }

    /**
     * Get attendance for a user within a date range
     */
    async getAttendance(userId: string, startDate: Date, endDate: Date) {
        return prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get attendance summary for payroll (total hours/days worked)
     */
    async getAttendanceSummary(userId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        const records = await prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const summary = {
            totalDays: records.length,
            presentDays: records.filter((r) => r.status === 'present').length,
            lateDays: records.filter((r) => r.status === 'late').length,
            halfDays: records.filter((r) => r.status === 'half_day').length,
            absentDays: records.filter((r) => r.status === 'absent').length,
            totalHours: records.reduce(
                (sum, r) => sum.plus(r.workHours ?? 0),
                new Decimal(0)
            ),
        };

        return summary;
    }

    /**
     * Get today's attendance status for user
     */
    async getTodayStatus(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        });
    }

    // ==================== LEAVE MANAGEMENT ====================

    /**
     * Request leave
     */
    async requestLeave(userId: string, data: LeaveRequestInput) {
        // Validate dates
        if (data.endDate < data.startDate) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'End date cannot be before start date',
                400
            );
        }

        // Check for overlapping leave requests
        const overlapping = await prisma.leaveRequest.findFirst({
            where: {
                userId,
                status: { not: 'rejected' },
                OR: [
                    {
                        startDate: { lte: data.endDate },
                        endDate: { gte: data.startDate },
                    },
                ],
            },
        });

        if (overlapping) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Overlapping leave request already exists',
                400
            );
        }

        return prisma.leaveRequest.create({
            data: {
                userId,
                startDate: data.startDate,
                endDate: data.endDate,
                type: data.type,
                reason: data.reason,
            },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }

    /**
     * Approve or reject leave request
     */
    async processLeaveRequest(
        requestId: string,
        action: 'approved' | 'rejected',
        approverId: string
    ) {
        const request = await prisma.leaveRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Leave request not found', 404);
        }

        if (request.status !== 'pending') {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Leave request already processed',
                400
            );
        }

        return prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: action,
                approvedBy: approverId,
            },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
                approvedByUser: { select: { id: true, email: true, firstName: true } },
            },
        });
    }

    /**
     * Get leave requests for a user
     */
    async getLeaveRequests(userId: string, status?: string) {
        const where: Prisma.LeaveRequestWhereInput = { userId };
        if (status) {
            where.status = status;
        }

        return prisma.leaveRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                approvedByUser: { select: { id: true, email: true, firstName: true } },
            },
        });
    }

    /**
     * Get pending leave requests (for managers)
     */
    async getPendingLeaveRequests() {
        return prisma.leaveRequest.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }
}

export const staffService = new StaffService();

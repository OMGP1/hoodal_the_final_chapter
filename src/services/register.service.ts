import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';
import { OpenRegisterInput, CloseRegisterInput } from '../validators/pos.validator';

// User select fields for includes
const userSelect = { id: true, email: true, firstName: true, lastName: true };

export class RegisterService {
    /**
     * Open a new register session
     */
    async openRegister(data: OpenRegisterInput, userId: string) {
        // Check if user has an open register already
        const existingOpen = await prisma.registerSession.findFirst({
            where: {
                openedBy: userId,
                status: 'open',
            },
        });

        if (existingOpen) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'You already have an open register session. Close it first.',
                400
            );
        }

        const session = await prisma.registerSession.create({
            data: {
                registerName: data.registerName ?? 'Main',
                openedBy: userId,
                openingCash: new Decimal(data.openingCash),
                notes: data.notes,
                status: 'open',
            },
            include: {
                openedByUser: { select: userSelect },
            },
        });

        return session;
    }

    /**
     * Close a register session with variance calculation
     */
    async closeRegister(sessionId: string, data: CloseRegisterInput, userId: string) {
        const session = await prisma.registerSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Register session not found', 404);
        }

        if (session.status === 'closed') {
            throw new AppError(ErrorCodes.BUSINESS_ERROR, 'Register session already closed', 400);
        }

        // Calculate expected cash
        // Expected = Opening + Cash Sales - Cash Returns (returns not implemented yet)
        const expectedCash = session.openingCash.plus(session.cashSales);
        const closingCash = new Decimal(data.closingCash);
        const variance = closingCash.minus(expectedCash);

        const closedSession = await prisma.registerSession.update({
            where: { id: sessionId },
            data: {
                closedBy: userId,
                closingCash,
                expectedCash,
                variance,
                status: 'closed',
                closedAt: new Date(),
                notes: data.notes ? `${session.notes ?? ''}\n[Close]: ${data.notes}` : session.notes,
            },
            include: {
                openedByUser: { select: userSelect },
                closedByUser: { select: userSelect },
            },
        });

        return {
            ...closedSession,
            summary: {
                openingCash: Number(session.openingCash),
                cashSales: Number(session.cashSales),
                expectedCash: Number(expectedCash),
                actualCash: Number(closingCash),
                variance: Number(variance),
                varianceStatus: variance.equals(0) ? 'balanced' : variance.greaterThan(0) ? 'over' : 'short',
                totalSales: Number(session.totalSales),
                transactionCount: session.transactionCount,
                breakdown: {
                    cash: Number(session.cashSales),
                    card: Number(session.cardSales),
                    upi: Number(session.upiSales),
                    credit: Number(session.creditSales),
                },
            },
        };
    }

    /**
     * Get current open register for user
     */
    async getCurrentRegister(userId: string) {
        const session = await prisma.registerSession.findFirst({
            where: {
                openedBy: userId,
                status: 'open',
            },
            include: {
                openedByUser: { select: userSelect },
            },
        });

        return session;
    }

    /**
     * Get register session by ID
     */
    async getRegisterById(sessionId: string) {
        const session = await prisma.registerSession.findUnique({
            where: { id: sessionId },
            include: {
                openedByUser: { select: userSelect },
                closedByUser: { select: userSelect },
            },
        });

        if (!session) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Register session not found', 404);
        }

        return session;
    }

    /**
     * List register sessions with filters
     */
    async listRegisterSessions(filters: {
        status?: 'open' | 'closed';
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (filters.status) where.status = filters.status;
        if (filters.userId) where.openedBy = filters.userId;
        if (filters.startDate || filters.endDate) {
            where.openedAt = {};
            if (filters.startDate) (where.openedAt as Record<string, Date>).gte = filters.startDate;
            if (filters.endDate) (where.openedAt as Record<string, Date>).lte = filters.endDate;
        }

        const [sessions, total] = await Promise.all([
            prisma.registerSession.findMany({
                where,
                include: {
                    openedByUser: { select: userSelect },
                    closedByUser: { select: userSelect },
                },
                orderBy: { openedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.registerSession.count({ where }),
        ]);

        return {
            data: sessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export const registerService = new RegisterService();

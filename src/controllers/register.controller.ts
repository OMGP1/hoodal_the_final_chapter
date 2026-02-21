import { Request, Response } from 'express';
import { registerService } from '../services/register.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Open a new register session
 */
export const openRegister = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const session = await registerService.openRegister(req.body, user.id);
    sendSuccess(res, session, 'Register opened successfully', 201);
});

/**
 * Close current register session
 */
export const closeRegister = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const session = await registerService.closeRegister(req.params.id, req.body, user.id);
    sendSuccess(res, session, 'Register closed successfully');
});

/**
 * Get current open register for user
 */
export const getCurrentRegister = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const session = await registerService.getCurrentRegister(user.id);
    sendSuccess(res, session);
});

/**
 * Get register session by ID
 */
export const getRegisterById = asyncHandler(async (req: Request, res: Response) => {
    const session = await registerService.getRegisterById(req.params.id);
    sendSuccess(res, session);
});

/**
 * List register sessions
 */
export const listRegisterSessions = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
        status: req.query.status as 'open' | 'closed' | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };
    const result = await registerService.listRegisterSessions(filters);
    sendSuccess(res, result);
});

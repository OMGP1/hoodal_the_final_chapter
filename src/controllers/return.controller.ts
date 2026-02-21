import { Request, Response } from 'express';
import { returnService } from '../services/return.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Process a return/refund
 */
export const processReturn = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const returnOrder = await returnService.processReturn(req.body, user.id);
    sendSuccess(res, returnOrder, 'Return processed successfully', 201);
});

/**
 * Get return by ID
 */
export const getReturnById = asyncHandler(async (req: Request, res: Response) => {
    const returnOrder = await returnService.getReturnById(req.params.id);
    sendSuccess(res, returnOrder);
});

/**
 * Get return by return number
 */
export const getReturnByNumber = asyncHandler(async (req: Request, res: Response) => {
    const returnOrder = await returnService.getReturnByNumber(req.params.returnNumber);
    sendSuccess(res, returnOrder);
});

/**
 * Get all returns for an order
 */
export const getReturnsForOrder = asyncHandler(async (req: Request, res: Response) => {
    const returns = await returnService.getReturnsForOrder(req.params.orderId);
    sendSuccess(res, returns);
});

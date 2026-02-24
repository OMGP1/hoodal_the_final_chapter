import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await auditService.getLogs(page, limit);
    sendSuccess(res, result);
});

import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    // Default to current month if not provided
    const now = new Date();
    const start = startDate
        ? new Date(startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
        ? new Date(endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const report = await reportService.getSalesReport({ startDate: start, endDate: end });
    sendSuccess(res, report);
});

export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.getInventoryReport();
    sendSuccess(res, report);
});

export const getProfitLossReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const now = new Date();
    const start = startDate
        ? new Date(startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
        ? new Date(endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const report = await reportService.getProfitLossReport({ startDate: start, endDate: end });
    sendSuccess(res, report);
});

export const getRegisterSummary = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const now = new Date();
    const start = startDate
        ? new Date(startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
        ? new Date(endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const report = await reportService.getRegisterSummary({ startDate: start, endDate: end });
    sendSuccess(res, report);
});

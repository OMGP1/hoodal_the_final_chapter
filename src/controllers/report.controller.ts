import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/** Parse date string into start-of-day and end-of-day Date objects */
function parseDateRange(startStr?: string, endStr?: string) {
    const now = new Date();

    // Start of day
    const start = startStr
        ? new Date(startStr as string + 'T00:00:00')
        : new Date(now.getFullYear(), now.getMonth(), 1);

    // End of day (23:59:59.999)
    const end = endStr
        ? new Date(endStr as string + 'T23:59:59.999')
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { start, end };
}

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const { start, end } = parseDateRange(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined
    );
    const report = await reportService.getSalesReport({ startDate: start, endDate: end });
    sendSuccess(res, report);
});

export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.getInventoryReport();
    sendSuccess(res, report);
});

export const getProfitLossReport = asyncHandler(async (req: Request, res: Response) => {
    const { start, end } = parseDateRange(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined
    );
    const report = await reportService.getProfitLossReport({ startDate: start, endDate: end });
    sendSuccess(res, report);
});

export const getRegisterSummary = asyncHandler(async (req: Request, res: Response) => {
    const { start, end } = parseDateRange(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined
    );
    const report = await reportService.getRegisterSummary({ startDate: start, endDate: end });
    sendSuccess(res, report);
});

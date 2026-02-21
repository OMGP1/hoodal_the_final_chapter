import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await dashboardService.getOverview();
    sendSuccess(res, metrics);
});

export const getSalesTrend = asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const trend = await dashboardService.getSalesTrend(days);
    sendSuccess(res, trend);
});

export const getAlerts = asyncHandler(async (_req: Request, res: Response) => {
    const alerts = await dashboardService.getAlerts();
    sendSuccess(res, alerts);
});

export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const products = await dashboardService.getTopProducts(limit);
    sendSuccess(res, products);
});

import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

// All report routes require authentication and reports permission
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/sales
 * @desc    Get sales report (revenue, orders, top products)
 * @access  Private (reports view permission)
 */
router.get(
    '/sales',
    authorize(PERMISSIONS.REPORTS_VIEW),
    reportController.getSalesReport
);

/**
 * @route   GET /api/v1/reports/inventory
 * @desc    Get inventory report (stock levels, low stock alerts)
 * @access  Private (reports view permission)
 */
router.get(
    '/inventory',
    authorize(PERMISSIONS.REPORTS_VIEW),
    reportController.getInventoryReport
);

/**
 * @route   GET /api/v1/reports/profit-loss
 * @desc    Get P&L report (revenue - COGS - expenses)
 * @access  Private (reports financial permission)
 */
router.get(
    '/profit-loss',
    authorize(PERMISSIONS.REPORTS_FINANCIAL),
    reportController.getProfitLossReport
);

/**
 * @route   GET /api/v1/reports/register
 * @desc    Get register session summary (variance, payment methods)
 * @access  Private (reports financial permission)
 */
router.get(
    '/register',
    authorize(PERMISSIONS.REPORTS_FINANCIAL),
    reportController.getRegisterSummary
);

export default router;

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard/overview
 * @desc    Get dashboard metrics overview
 * @access  Private (dashboard.view)
 */
router.get(
    '/overview',
    authorize(PERMISSIONS.DASHBOARD_VIEW),
    dashboardController.getOverview
);

/**
 * @route   GET /api/v1/dashboard/sales-trend
 * @desc    Get sales trend for charts
 * @access  Private (dashboard.view)
 */
router.get(
    '/sales-trend',
    authorize(PERMISSIONS.DASHBOARD_VIEW),
    dashboardController.getSalesTrend
);

/**
 * @route   GET /api/v1/dashboard/alerts
 * @desc    Get system alerts
 * @access  Private (dashboard.view)
 */
router.get(
    '/alerts',
    authorize(PERMISSIONS.DASHBOARD_VIEW),
    dashboardController.getAlerts
);

/**
 * @route   GET /api/v1/dashboard/top-products
 * @desc    Get top selling products
 * @access  Private (dashboard.view)
 */
router.get(
    '/top-products',
    authorize(PERMISSIONS.DASHBOARD_VIEW),
    dashboardController.getTopProducts
);

export default router;

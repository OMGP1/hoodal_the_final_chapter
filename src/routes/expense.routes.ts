import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

// All expense routes require authentication
router.use(authenticate);

// ==================== EXPENSE CATEGORIES ====================

/**
 * @route   GET /api/v1/expenses/categories
 * @desc    List expense categories
 * @access  Private (expense read permission)
 */
router.get(
    '/categories',
    authorize(PERMISSIONS.EXPENSES_READ),
    expenseController.listCategories
);

/**
 * @route   POST /api/v1/expenses/categories
 * @desc    Create expense category
 * @access  Private (expense write permission)
 */
router.post(
    '/categories',
    authorize(PERMISSIONS.EXPENSES_WRITE),
    expenseController.createCategory
);

// ==================== EXPENSE DASHBOARD ====================

/**
 * @route   GET /api/v1/expenses/dashboard
 * @desc    Get expense dashboard (current vs previous month)
 * @access  Private (expense read permission)
 */
router.get(
    '/dashboard',
    authorize(PERMISSIONS.EXPENSES_READ),
    expenseController.getExpenseDashboard
);

// ==================== EXPENSES ====================

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense
 * @access  Private (expense write permission)
 */
router.post(
    '/',
    authorize(PERMISSIONS.EXPENSES_WRITE),
    expenseController.createExpense
);

/**
 * @route   GET /api/v1/expenses
 * @desc    List expenses with filters
 * @access  Private (expense read permission)
 */
router.get(
    '/',
    authorize(PERMISSIONS.EXPENSES_READ),
    expenseController.listExpenses
);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get expense by ID
 * @access  Private (expense read permission)
 */
router.get(
    '/:id',
    authorize(PERMISSIONS.EXPENSES_READ),
    expenseController.getExpense
);

/**
 * @route   POST /api/v1/expenses/:id/process
 * @desc    Approve or reject expense
 * @access  Private (expense approve permission)
 */
router.post(
    '/:id/process',
    authorize(PERMISSIONS.EXPENSES_APPROVE),
    expenseController.processExpense
);

export default router;

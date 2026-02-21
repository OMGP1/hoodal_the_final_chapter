import { Router } from 'express';
import * as registerController from '../controllers/register.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import { openRegisterSchema, closeRegisterSchema } from '../validators/pos.validator';
import { z } from 'zod';

const router = Router();

// All register routes require authentication
router.use(authenticate);

// ==================== REGISTER SESSIONS ====================

/**
 * @route   POST /api/v1/register/open
 * @desc    Open a new register session
 * @access  Private (POS access)
 */
router.post(
    '/open',
    authorize(PERMISSIONS.POS_ACCESS),
    validate(openRegisterSchema),
    registerController.openRegister
);

/**
 * @route   GET /api/v1/register/current
 * @desc    Get current open register for the user
 * @access  Private (POS access)
 */
router.get(
    '/current',
    authorize(PERMISSIONS.POS_ACCESS),
    registerController.getCurrentRegister
);

/**
 * @route   POST /api/v1/register/:id/close
 * @desc    Close a register session with cash count
 * @access  Private (POS access)
 */
router.post(
    '/:id/close',
    authorize(PERMISSIONS.POS_ACCESS),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    validate(closeRegisterSchema),
    registerController.closeRegister
);

/**
 * @route   GET /api/v1/register/:id
 * @desc    Get register session by ID
 * @access  Private (POS access)
 */
router.get(
    '/:id',
    authorize(PERMISSIONS.POS_ACCESS),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    registerController.getRegisterById
);

/**
 * @route   GET /api/v1/register
 * @desc    List register sessions with filters
 * @access  Private (Reports access)
 */
router.get(
    '/',
    authorize(PERMISSIONS.REPORTS_VIEW),
    registerController.listRegisterSessions
);

export default router;

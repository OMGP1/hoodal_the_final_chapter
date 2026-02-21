import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    createPurchaseOrderSchema,
    updatePurchaseOrderSchema,
    receiveGoodsSchema,
} from '../validators/purchase.validator';
import { z } from 'zod';

const router = Router();

// All purchase routes require authentication
router.use(authenticate);

// ==================== PURCHASE ORDER ROUTES ====================

/**
 * @route   POST /api/v1/purchase-orders
 * @desc    Create a new purchase order (draft)
 * @access  Private (purchase create permission)
 */
router.post(
    '/',
    authorize(PERMISSIONS.PURCHASE_CREATE),
    validate(createPurchaseOrderSchema),
    purchaseController.createPurchaseOrder
);

/**
 * @route   GET /api/v1/purchase-orders
 * @desc    List purchase orders with filters
 * @access  Private (purchase read permission)
 */
router.get(
    '/',
    authorize(PERMISSIONS.PURCHASE_READ),
    purchaseController.listPurchaseOrders
);

/**
 * @route   GET /api/v1/purchase-orders/:id
 * @desc    Get purchase order by ID
 * @access  Private (purchase read permission)
 */
router.get(
    '/:id',
    authorize(PERMISSIONS.PURCHASE_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    purchaseController.getPurchaseOrder
);

/**
 * @route   PUT /api/v1/purchase-orders/:id
 * @desc    Update a draft purchase order
 * @access  Private (purchase update permission)
 */
router.put(
    '/:id',
    authorize(PERMISSIONS.PURCHASE_UPDATE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    validate(updatePurchaseOrderSchema),
    purchaseController.updatePurchaseOrder
);

/**
 * @route   POST /api/v1/purchase-orders/:id/submit
 * @desc    Submit purchase order (mark as ordered)
 * @access  Private (purchase update permission)
 */
router.post(
    '/:id/submit',
    authorize(PERMISSIONS.PURCHASE_UPDATE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    purchaseController.submitPurchaseOrder
);

/**
 * @route   POST /api/v1/purchase-orders/:id/cancel
 * @desc    Cancel a purchase order
 * @access  Private (purchase update permission)
 */
router.post(
    '/:id/cancel',
    authorize(PERMISSIONS.PURCHASE_UPDATE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    purchaseController.cancelPurchaseOrder
);

// ==================== GRN ROUTES ====================

/**
 * @route   POST /api/v1/purchase-orders/:id/receive
 * @desc    Receive goods (create GRN)
 * @access  Private (purchase receive permission)
 */
router.post(
    '/:id/receive',
    authorize(PERMISSIONS.PURCHASE_RECEIVE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    validate(receiveGoodsSchema),
    purchaseController.receiveGoods
);

/**
 * @route   GET /api/v1/purchase-orders/:id/grns
 * @desc    List GRNs for a purchase order
 * @access  Private (purchase read permission)
 */
router.get(
    '/:id/grns',
    authorize(PERMISSIONS.PURCHASE_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    purchaseController.listGRNsForPO
);

/**
 * @route   GET /api/v1/grn/:id
 * @desc    Get GRN by ID (Note: separate base path)
 * @access  Private (purchase read permission)
 */
// This will be mounted separately in main routes

export default router;

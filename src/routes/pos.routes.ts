import { Router } from 'express';
import * as posController from '../controllers/pos.controller';
import * as holdCartController from '../controllers/holdCart.controller';
import * as returnController from '../controllers/return.controller';
import * as invoiceController from '../controllers/invoice.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    validateCartSchema,
    checkoutSchema,
    holdCartSchema,
    processReturnSchema,
} from '../validators/pos.validator';
import { z } from 'zod';

const router = Router();

// All POS routes require authentication
router.use(authenticate);

// ==================== CART VALIDATION ====================

/**
 * @route   POST /api/v1/pos/validate-cart
 * @desc    Validate cart items (check stock, calculate prices)
 * @access  Private (sales permission)
 */
router.post(
    '/validate-cart',
    authorize(PERMISSIONS.SALES_WRITE),
    validate(validateCartSchema),
    posController.validateCart
);

// ==================== CHECKOUT ====================

/**
 * @route   POST /api/v1/pos/checkout
 * @desc    Complete checkout - create order with payment
 * @access  Private (sales permission)
 */
router.post(
    '/checkout',
    authorize(PERMISSIONS.SALES_WRITE),
    validate(checkoutSchema),
    posController.checkout
);

// ==================== HOLD CART (PARK) ====================

/**
 * @route   POST /api/v1/pos/hold
 * @desc    Hold (park) a cart for later retrieval
 * @access  Private (sales permission)
 */
router.post(
    '/hold',
    authorize(PERMISSIONS.SALES_WRITE),
    validate(holdCartSchema),
    holdCartController.holdCart
);

/**
 * @route   GET /api/v1/pos/held
 * @desc    Get all held carts (user's own, or all with ?all=true for managers)
 * @access  Private (sales permission)
 */
router.get(
    '/held',
    authorize(PERMISSIONS.SALES_READ),
    holdCartController.getHeldCarts
);

/**
 * @route   GET /api/v1/pos/held/:holdNumber
 * @desc    Get held cart by hold number
 * @access  Private (sales permission)
 */
router.get(
    '/held/:holdNumber',
    authorize(PERMISSIONS.SALES_READ),
    holdCartController.getHeldCartByNumber
);

/**
 * @route   POST /api/v1/pos/retrieve/:holdNumber
 * @desc    Retrieve a held cart to continue checkout
 * @access  Private (sales permission)
 */
router.post(
    '/retrieve/:holdNumber',
    authorize(PERMISSIONS.SALES_WRITE),
    holdCartController.retrieveCart
);

/**
 * @route   DELETE /api/v1/pos/held/:holdNumber
 * @desc    Delete a held cart (cancel hold)
 * @access  Private (sales permission)
 */
router.delete(
    '/held/:holdNumber',
    authorize(PERMISSIONS.SALES_WRITE),
    holdCartController.deleteHeldCart
);

// ==================== ORDER RETRIEVAL ====================

/**
 * @route   GET /api/v1/pos/orders
 * @desc    List all orders with pagination and filters
 * @access  Private (sales permission)
 */
router.get(
    '/orders',
    authorize(PERMISSIONS.SALES_READ),
    posController.listOrders
);

/**
 * @route   GET /api/v1/pos/orders/:id
 * @desc    Get order by ID
 * @access  Private (sales permission)
 */
router.get(
    '/orders/:id',
    authorize(PERMISSIONS.SALES_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    posController.getOrderById
);

/**
 * @route   GET /api/v1/pos/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Private (sales permission)
 */
router.get(
    '/orders/number/:orderNumber',
    authorize(PERMISSIONS.SALES_READ),
    posController.getOrderByNumber
);

// ==================== RETURNS ====================

/**
 * @route   POST /api/v1/pos/returns
 * @desc    Process a return/refund
 * @access  Private (refund permission)
 */
router.post(
    '/returns',
    authorize(PERMISSIONS.POS_REFUND),
    validate(processReturnSchema),
    returnController.processReturn
);

/**
 * @route   GET /api/v1/pos/returns/:id
 * @desc    Get return by ID
 * @access  Private (sales permission)
 */
router.get(
    '/returns/:id',
    authorize(PERMISSIONS.SALES_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    returnController.getReturnById
);

/**
 * @route   GET /api/v1/pos/returns/number/:returnNumber
 * @desc    Get return by return number
 * @access  Private (sales permission)
 */
router.get(
    '/returns/number/:returnNumber',
    authorize(PERMISSIONS.SALES_READ),
    returnController.getReturnByNumber
);

/**
 * @route   GET /api/v1/pos/orders/:orderId/returns
 * @desc    Get all returns for an order
 * @access  Private (sales permission)
 */
router.get(
    '/orders/:orderId/returns',
    authorize(PERMISSIONS.SALES_READ),
    validate(z.object({ orderId: z.string().uuid() }), 'params'),
    returnController.getReturnsForOrder
);

// ==================== INVOICES (PDF) ====================

/**
 * @route   GET /api/v1/pos/orders/:id/invoice
 * @desc    Generate and download PDF invoice for order (80mm thermal format)
 * @access  Private (sales permission)
 */
router.get(
    '/orders/:id/invoice',
    authorize(PERMISSIONS.SALES_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    invoiceController.getOrderInvoice
);

/**
 * @route   GET /api/v1/pos/returns/:id/receipt
 * @desc    Generate and download PDF receipt for return (80mm thermal format)
 * @access  Private (sales permission)
 */
router.get(
    '/returns/:id/receipt',
    authorize(PERMISSIONS.SALES_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    invoiceController.getReturnReceipt
);

export default router;

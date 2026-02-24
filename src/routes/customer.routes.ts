import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    createCustomerSchema,
    updateCustomerSchema,
    adjustBalanceSchema,
} from '../validators/customer.validator';
import { z } from 'zod';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// ==================== CUSTOMERS ====================

/**
 * @route   GET /api/v1/customers
 * @desc    List customers (paginated, searchable)
 * @access  Private (customers read permission)
 */
router.get(
    '/',
    authorize(PERMISSIONS.CUSTOMERS_READ),
    customerController.listCustomers
);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private (customers read permission)
 */
router.get(
    '/:id',
    authorize(PERMISSIONS.CUSTOMERS_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    customerController.getCustomer
);

/**
 * @route   POST /api/v1/customers
 * @desc    Create a new customer
 * @access  Private (customers write permission)
 */
router.post(
    '/',
    authorize(PERMISSIONS.CUSTOMERS_WRITE),
    validate(createCustomerSchema),
    customerController.createCustomer
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private (customers write permission)
 */
router.put(
    '/:id',
    authorize(PERMISSIONS.CUSTOMERS_WRITE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    validate(updateCustomerSchema),
    customerController.updateCustomer
);

/**
 * @route   POST /api/v1/customers/:id/balance
 * @desc    Adjust customer credit balance (udhaari)
 * @access  Private (customers write permission)
 */
router.post(
    '/:id/balance',
    authorize(PERMISSIONS.CUSTOMERS_WRITE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    validate(adjustBalanceSchema),
    customerController.adjustBalance
);

/**
 * @route   PATCH /api/v1/customers/:id/toggle
 * @desc    Toggle customer active/inactive
 * @access  Private (customers write permission)
 */
router.patch(
    '/:id/toggle',
    authorize(PERMISSIONS.CUSTOMERS_WRITE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    customerController.toggleCustomer
);

export default router;

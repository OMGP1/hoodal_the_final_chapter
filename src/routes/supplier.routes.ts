import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../config/constants';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplier.validator';
import { z } from 'zod';

const router = Router();

// All supplier routes require authentication
router.use(authenticate);

// ==================== SUPPLIERS ====================

/**
 * @route   GET /api/v1/suppliers
 * @desc    List suppliers (paginated, searchable)
 * @access  Private (suppliers read permission)
 */
router.get(
    '/',
    authorize(PERMISSIONS.SUPPLIERS_READ),
    supplierController.listSuppliers
);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private (suppliers read permission)
 */
router.get(
    '/:id',
    authorize(PERMISSIONS.SUPPLIERS_READ),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    supplierController.getSupplier
);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create a new supplier
 * @access  Private (suppliers write permission)
 */
router.post(
    '/',
    authorize(PERMISSIONS.SUPPLIERS_WRITE),
    validate(createSupplierSchema),
    supplierController.createSupplier
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Update supplier
 * @access  Private (suppliers write permission)
 */
router.put(
    '/:id',
    authorize(PERMISSIONS.SUPPLIERS_WRITE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    validate(updateSupplierSchema),
    supplierController.updateSupplier
);

/**
 * @route   PATCH /api/v1/suppliers/:id/toggle
 * @desc    Toggle supplier active/inactive
 * @access  Private (suppliers write permission)
 */
router.patch(
    '/:id/toggle',
    authorize(PERMISSIONS.SUPPLIERS_WRITE),
    validate(z.object({ id: z.string().uuid() }), 'params'),
    supplierController.toggleSupplier
);

export default router;

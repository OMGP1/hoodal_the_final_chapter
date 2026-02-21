import { Router } from 'express';
import * as variantController from '../controllers/variant.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    createVariantSchema,
    updateVariantSchema,
    variantIdParamSchema,
    productIdParamSchema,
    bulkCreateVariantsSchema,
} from '../validators/variant.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== LOOKUP ROUTE (for POS) ====================

/**
 * @route   GET /api/v1/variants/lookup/:code
 * @desc    Find product or variant by SKU/barcode (for POS scanning)
 * @access  Private (inventory.read)
 */
router.get(
    '/lookup/:code',
    authorize(PERMISSIONS.INVENTORY_READ),
    variantController.findBySkuOrBarcode
);

// ==================== VARIANT CRUD ROUTES ====================

/**
 * @route   GET /api/v1/variants/:id
 * @desc    Get variant by ID
 * @access  Private (products.read)
 */
router.get(
    '/:id',
    validate(variantIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_READ),
    variantController.getVariantById
);

/**
 * @route   PUT /api/v1/variants/:id
 * @desc    Update variant
 * @access  Private (products.write)
 */
router.put(
    '/:id',
    validate(variantIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    validate(updateVariantSchema),
    variantController.updateVariant
);

/**
 * @route   DELETE /api/v1/variants/:id
 * @desc    Delete variant (soft delete)
 * @access  Private (products.delete)
 */
router.delete(
    '/:id',
    validate(variantIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_DELETE),
    variantController.deleteVariant
);

// ==================== PRODUCT VARIANT ROUTES ====================

/**
 * @route   GET /api/v1/variants/product/:productId
 * @desc    Get all variants for a product
 * @access  Private (products.read)
 */
router.get(
    '/product/:productId',
    validate(productIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_READ),
    variantController.getVariantsByProduct
);

/**
 * @route   POST /api/v1/variants/product/:productId
 * @desc    Create new variant for a product
 * @access  Private (products.write)
 */
router.post(
    '/product/:productId',
    validate(productIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    validate(createVariantSchema.omit({ productId: true })),
    variantController.createVariant
);

/**
 * @route   POST /api/v1/variants/product/:productId/bulk
 * @desc    Bulk create variants for a product
 * @access  Private (products.write)
 */
router.post(
    '/product/:productId/bulk',
    validate(productIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    variantController.bulkCreateVariants
);

export default router;

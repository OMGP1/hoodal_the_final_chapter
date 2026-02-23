import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    createProductSchema,
    updateProductSchema,
    productIdParamSchema,
    productQuerySchema,
    createCategorySchema,
    updateCategorySchema,
    categoryIdParamSchema,
} from '../validators/product.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== CATEGORY ROUTES ====================

/**
 * @route   GET /api/v1/products/categories
 * @desc    Get all categories (tree)
 * @access  Private (products.read)
 */
router.get(
    '/categories',
    authorize(PERMISSIONS.PRODUCTS_READ),
    productController.getCategories
);

/**
 * @route   POST /api/v1/products/categories
 * @desc    Create new category
 * @access  Private (products.write)
 */
router.post(
    '/categories',
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    validate(createCategorySchema),
    productController.createCategory
);

/**
 * @route   PUT /api/v1/products/categories/:id
 * @desc    Update category
 * @access  Private (products.write)
 */
router.put(
    '/categories/:id',
    validate(categoryIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    validate(updateCategorySchema),
    productController.updateCategory
);

/**
 * @route   DELETE /api/v1/products/categories/:id
 * @desc    Delete category
 * @access  Private (products.delete)
 */
router.delete(
    '/categories/:id',
    validate(categoryIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_DELETE),
    productController.deleteCategory
);

// ==================== PRODUCT ROUTES ====================

/**
 * @route   POST /api/v1/products/upload-image
 * @desc    Upload a product image
 * @access  Private (products.write)
 */
router.post(
    '/upload-image',
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    (req, res, next) => {
        const { uploadProductImage } = require('../middleware/upload.middleware');
        uploadProductImage(req, res, (err: any) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'UPLOAD_ERROR', message: err.message },
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'UPLOAD_ERROR', message: 'No image file provided' },
                });
            }
            const imageUrl = `/uploads/products/${req.file.filename}`;
            res.json({ success: true, data: { imageUrl } });
        });
    }
);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Get products below reorder level
 * @access  Private (inventory.read)
 */
router.get(
    '/low-stock',
    authorize(PERMISSIONS.INVENTORY_READ),
    productController.getLowStockProducts
);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products
 * @access  Private (products.read)
 */
router.get(
    '/',
    authorize(PERMISSIONS.PRODUCTS_READ),
    validate(productQuerySchema, 'query'),
    productController.getProducts
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Private (products.read)
 */
router.get(
    '/:id',
    validate(productIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_READ),
    productController.getProductById
);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (products.write)
 */
router.post(
    '/',
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    validate(createProductSchema),
    productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (products.write)
 */
router.put(
    '/:id',
    validate(productIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    validate(updateProductSchema),
    productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (products.delete)
 */
router.delete(
    '/:id',
    validate(productIdParamSchema, 'params'),
    authorize(PERMISSIONS.PRODUCTS_DELETE),
    productController.deleteProduct
);

// ==================== BULK OPERATIONS ====================

/**
 * @route   POST /api/v1/products/bulk-import
 * @desc    Bulk import products (up to 500 at a time)
 * @access  Private (products.write)
 */
router.post(
    '/bulk-import',
    authorize(PERMISSIONS.PRODUCTS_WRITE),
    productController.bulkImportProducts
);

/**
 * @route   GET /api/v1/products/export
 * @desc    Export products to CSV
 * @access  Private (products.read)
 */
router.get(
    '/export',
    authorize(PERMISSIONS.PRODUCTS_READ),
    productController.exportProducts
);

export default router;


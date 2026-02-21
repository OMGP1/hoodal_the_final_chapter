import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    inventoryItemIdParamSchema,
    inventoryQuerySchema,
    movementQuerySchema,
    adjustStockSchema,
    recordDamageSchema,
    createLocationSchema,
    updateLocationSchema,
    locationIdParamSchema,
} from '../validators/inventory.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== INVENTORY ITEM ROUTES ====================

/**
 * @route   GET /api/v1/inventory/overview
 * @desc    Get inventory overview stats
 * @access  Private (inventory.read)
 */
router.get(
    '/overview',
    authorize(PERMISSIONS.INVENTORY_READ),
    inventoryController.getInventoryOverview
);

/**
 * @route   GET /api/v1/inventory/expiring
 * @desc    Get items expiring soon
 * @access  Private (inventory.read)
 */
router.get(
    '/expiring',
    authorize(PERMISSIONS.INVENTORY_READ),
    inventoryController.getExpiringItems
);

/**
 * @route   GET /api/v1/inventory/expired
 * @desc    Get expired items
 * @access  Private (inventory.read)
 */
router.get(
    '/expired',
    authorize(PERMISSIONS.INVENTORY_READ),
    inventoryController.getExpiredItems
);

/**
 * @route   GET /api/v1/inventory/movements
 * @desc    Get stock movements
 * @access  Private (inventory.read)
 */
router.get(
    '/movements',
    authorize(PERMISSIONS.INVENTORY_READ),
    validate(movementQuerySchema, 'query'),
    inventoryController.getStockMovements
);

/**
 * @route   GET /api/v1/inventory/locations
 * @desc    Get all locations
 * @access  Private (inventory.read)
 */
router.get(
    '/locations',
    authorize(PERMISSIONS.INVENTORY_READ),
    inventoryController.getLocations
);

/**
 * @route   POST /api/v1/inventory/locations
 * @desc    Create new location
 * @access  Private (inventory.write)
 */
router.post(
    '/locations',
    authorize(PERMISSIONS.INVENTORY_WRITE),
    validate(createLocationSchema),
    inventoryController.createLocation
);

/**
 * @route   PUT /api/v1/inventory/locations/:id
 * @desc    Update location
 * @access  Private (inventory.write)
 */
router.put(
    '/locations/:id',
    validate(locationIdParamSchema, 'params'),
    authorize(PERMISSIONS.INVENTORY_WRITE),
    validate(updateLocationSchema),
    inventoryController.updateLocation
);

/**
 * @route   DELETE /api/v1/inventory/locations/:id
 * @desc    Delete location
 * @access  Private (inventory.write)
 */
router.delete(
    '/locations/:id',
    validate(locationIdParamSchema, 'params'),
    authorize(PERMISSIONS.INVENTORY_WRITE),
    inventoryController.deleteLocation
);

/**
 * @route   POST /api/v1/inventory/damage
 * @desc    Record damaged stock
 * @access  Private (inventory.adjust)
 */
router.post(
    '/damage',
    authorize(PERMISSIONS.INVENTORY_ADJUST),
    validate(recordDamageSchema),
    inventoryController.recordDamage
);

/**
 * @route   POST /api/v1/inventory
 * @desc    Add new inventory item
 * @access  Private (inventory.write)
 */
router.post(
    '/',
    authorize(PERMISSIONS.INVENTORY_WRITE),
    inventoryController.addInventoryItem
);

/**
 * @route   GET /api/v1/inventory
 * @desc    Get all inventory items
 * @access  Private (inventory.read)
 */
router.get(
    '/',
    authorize(PERMISSIONS.INVENTORY_READ),
    validate(inventoryQuerySchema, 'query'),
    inventoryController.getInventoryItems
);

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get inventory item by ID
 * @access  Private (inventory.read)
 */
router.get(
    '/:id',
    validate(inventoryItemIdParamSchema, 'params'),
    authorize(PERMISSIONS.INVENTORY_READ),
    inventoryController.getInventoryItemById
);

/**
 * @route   PUT /api/v1/inventory/:id/adjust
 * @desc    Adjust stock for inventory item
 * @access  Private (inventory.adjust)
 */
router.put(
    '/:id/adjust',
    validate(inventoryItemIdParamSchema, 'params'),
    authorize(PERMISSIONS.INVENTORY_ADJUST),
    validate(adjustStockSchema),
    inventoryController.adjustStock
);

export default router;

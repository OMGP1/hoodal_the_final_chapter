import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../config/constants';
import { upsertSettingSchema, bulkUpsertSchema } from '../validators/settings.validator';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// ==================== SETTINGS ====================

/**
 * @route   GET /api/v1/settings
 * @desc    Get all settings
 * @access  Private (settings read permission)
 */
router.get(
    '/',
    authorize(PERMISSIONS.SETTINGS_READ),
    settingsController.getAllSettings
);

/**
 * @route   GET /api/v1/settings/group/:prefix
 * @desc    Get settings by prefix (e.g., shop, tax, inventory)
 * @access  Private (settings read permission)
 */
router.get(
    '/group/:prefix',
    authorize(PERMISSIONS.SETTINGS_READ),
    settingsController.getSettingsByPrefix
);

/**
 * @route   GET /api/v1/settings/:key
 * @desc    Get a single setting by key
 * @access  Private (settings read permission)
 */
router.get(
    '/:key',
    authorize(PERMISSIONS.SETTINGS_READ),
    settingsController.getSetting
);

/**
 * @route   PUT /api/v1/settings/:key
 * @desc    Create or update a setting
 * @access  Private (settings write permission)
 */
router.put(
    '/:key',
    authorize(PERMISSIONS.SETTINGS_WRITE),
    validate(upsertSettingSchema),
    settingsController.upsertSetting
);

/**
 * @route   POST /api/v1/settings/bulk
 * @desc    Bulk create/update settings
 * @access  Private (settings write permission)
 */
router.post(
    '/bulk',
    authorize(PERMISSIONS.SETTINGS_WRITE),
    validate(bulkUpsertSchema),
    settingsController.bulkUpsertSettings
);

export default router;

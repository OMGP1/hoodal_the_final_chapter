import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';
import {
    createUserSchema,
    updateUserSchema,
    assignRoleSchema,
    userIdParamSchema,
} from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/roles
 * @desc    Get all roles
 * @access  Private (admin, manager)
 */
router.get(
    '/roles',
    authorize(PERMISSIONS.USERS_READ),
    userController.getRoles
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (admin, manager)
 */
router.get(
    '/',
    authorize(PERMISSIONS.USERS_READ),
    userController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (admin, manager, or self)
 */
router.get(
    '/:id',
    validate(userIdParamSchema, 'params'),
    authorize(PERMISSIONS.USERS_READ),
    userController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (admin)
 */
router.post(
    '/',
    authorize(PERMISSIONS.USERS_WRITE),
    validate(createUserSchema),
    userController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (admin, or self)
 */
router.put(
    '/:id',
    validate(userIdParamSchema, 'params'),
    authorize(PERMISSIONS.USERS_WRITE),
    validate(updateUserSchema),
    userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (admin)
 */
router.delete(
    '/:id',
    validate(userIdParamSchema, 'params'),
    authorize(PERMISSIONS.USERS_DELETE),
    userController.deleteUser
);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Assign role to user
 * @access  Private (admin)
 */
router.put(
    '/:id/role',
    validate(userIdParamSchema, 'params'),
    authorize(PERMISSIONS.USERS_WRITE),
    validate(assignRoleSchema),
    userController.assignRole
);

export default router;

import { Request, Response, NextFunction } from 'express';
import { sendError, ErrorCodes } from '../utils/response';
import { ROLE_PERMISSIONS } from '../config/constants';

/**
 * Authorization middleware factory - checks if user has required permission
 */
export function authorize(...requiredPermissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(
                res,
                ErrorCodes.AUTHENTICATION_ERROR,
                'Authentication required',
                401
            );
            return;
        }

        const userPermissions = req.user.permissions;

        // Check if user has at least one of the required permissions
        const hasPermission = requiredPermissions.some((permission) =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            sendError(
                res,
                ErrorCodes.AUTHORIZATION_ERROR,
                'Insufficient permissions',
                403
            );
            return;
        }

        next();
    };
}

/**
 * Role-based authorization middleware
 */
export function authorizeRoles(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(
                res,
                ErrorCodes.AUTHENTICATION_ERROR,
                'Authentication required',
                401
            );
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            sendError(
                res,
                ErrorCodes.AUTHORIZATION_ERROR,
                'Role not authorized for this action',
                403
            );
            return;
        }

        next();
    };
}

/**
 * Check if user is the resource owner or has admin/manager role
 */
export function authorizeOwnerOrAdmin(userIdParam = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(
                res,
                ErrorCodes.AUTHENTICATION_ERROR,
                'Authentication required',
                401
            );
            return;
        }

        const resourceUserId = req.params[userIdParam];
        const isOwner = req.user.id === resourceUserId;
        const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);

        if (!isOwner && !isAdminOrManager) {
            sendError(
                res,
                ErrorCodes.AUTHORIZATION_ERROR,
                'Not authorized to access this resource',
                403
            );
            return;
        }

        next();
    };
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
}

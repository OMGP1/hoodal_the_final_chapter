import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { sendError, ErrorCodes } from '../utils/response';
import { prisma } from '../config/database';
import { ROLE_PERMISSIONS } from '../config/constants';
import { AuthenticatedUser } from '../types/express';

/**
 * Authentication middleware - verifies JWT and attaches user to request
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            sendError(
                res,
                ErrorCodes.AUTHENTICATION_ERROR,
                'Access token required',
                401
            );
            return;
        }

        const decoded = verifyAccessToken(token);

        // Optionally verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true },
        });

        if (!user || !user.isActive) {
            sendError(
                res,
                ErrorCodes.AUTHENTICATION_ERROR,
                'User not found or inactive',
                401
            );
            return;
        }

        // Attach user to request
        const authenticatedUser: AuthenticatedUser = {
            id: user.id,
            email: user.email,
            role: user.role?.name || 'customer',
            permissions: decoded.permissions || [],
        };

        req.user = authenticatedUser;
        next();
    } catch (error) {
        if ((error as Error).name === 'TokenExpiredError') {
            sendError(
                res,
                ErrorCodes.AUTHENTICATION_ERROR,
                'Token expired',
                401
            );
            return;
        }
        sendError(
            res,
            ErrorCodes.AUTHENTICATION_ERROR,
            'Invalid token',
            401
        );
    }
}

/**
 * Optional authentication - doesn't fail if token is missing
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const decoded = verifyAccessToken(token);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: { role: true },
            });

            if (user && user.isActive) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role?.name || 'customer',
                    permissions: decoded.permissions || [],
                };
            }
        }
        next();
    } catch {
        // Token invalid, but we continue without user
        next();
    }
}

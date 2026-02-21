import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError, ErrorCodes } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Custom error class for application errors
export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: unknown[];

    constructor(
        code: string,
        message: string,
        statusCode = 400,
        details?: unknown[]
    ) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Log the error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Handle custom application errors
    if (err instanceof AppError) {
        sendError(res, err.code, err.message, err.statusCode, err.details);
        return;
    }

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                const target = (err.meta?.target as string[]) || [];
                sendError(
                    res,
                    ErrorCodes.DUPLICATE_ENTRY,
                    `Duplicate entry for ${target.join(', ')}`,
                    409
                );
                return;
            case 'P2025':
                // Record not found
                sendError(res, ErrorCodes.NOT_FOUND, 'Record not found', 404);
                return;
            case 'P2003':
                // Foreign key constraint failed
                sendError(
                    res,
                    ErrorCodes.BUSINESS_ERROR,
                    'Related record not found',
                    400
                );
                return;
            default:
                sendError(
                    res,
                    ErrorCodes.INTERNAL_ERROR,
                    'Database error',
                    500
                );
                return;
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        sendError(
            res,
            ErrorCodes.VALIDATION_ERROR,
            'Invalid data provided',
            400
        );
        return;
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Invalid JSON', 400);
        return;
    }

    // Generic error handler
    const message = env.isDevelopment
        ? err.message
        : 'An unexpected error occurred';

    sendError(res, ErrorCodes.INTERNAL_ERROR, message, 500);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    sendError(
        res,
        ErrorCodes.NOT_FOUND,
        `Route ${req.method} ${req.path} not found`,
        404
    );
}

/**
 * Async wrapper to catch errors in async route handlers
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

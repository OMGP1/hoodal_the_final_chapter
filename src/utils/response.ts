import { Response } from 'express';

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: unknown[];
    };
    pagination?: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalRecords: number;
    };
    timestamp: string;
}

export interface PaginationParams {
    page: number;
    pageSize: number;
    totalRecords: number;
}

/**
 * Send a successful response
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
): Response {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationParams,
    message?: string
): Response {
    const { page, pageSize, totalRecords } = pagination;
    const totalPages = Math.ceil(totalRecords / pageSize);

    const response: ApiResponse<T[]> = {
        success: true,
        data,
        message,
        pagination: {
            page,
            pageSize,
            totalPages,
            totalRecords,
        },
        timestamp: new Date().toISOString(),
    };
    return res.status(200).json(response);
}

/**
 * Send an error response
 */
export function sendError(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown[]
): Response {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
}

/**
 * Error codes
 */
export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    BUSINESS_ERROR: 'BUSINESS_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const;

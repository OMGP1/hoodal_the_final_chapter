import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';

export interface PaginationOptions {
    page?: number;
    pageSize?: number;
}

export interface PaginationResult {
    skip: number;
    take: number;
    page: number;
    pageSize: number;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(options: PaginationOptions): PaginationResult {
    let page = Math.max(1, options.page || 1);
    let pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, options.pageSize || DEFAULT_PAGE_SIZE)
    );

    return {
        skip: (page - 1) * pageSize,
        take: pageSize,
        page,
        pageSize,
    };
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(
    totalRecords: number,
    pageSize: number
): number {
    return Math.ceil(totalRecords / pageSize);
}

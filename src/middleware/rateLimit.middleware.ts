/**
 * Tiered Rate Limiting Middleware
 *
 * Different rate limits for different route categories:
 * - AUTH:    Strict  — prevents brute-force attacks
 * - WRITE:   Moderate — protects mutation endpoints
 * - READ:    Generous — allows dashboard/listing pages to load freely
 * - GENERAL: Fallback for anything not categorized
 *
 * Rate limiting is disabled in development to avoid friction.
 */
import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env';
import type { RequestHandler } from 'express';

// ── Response shape ─────────────────────────────────────────────
function rateLimitMessage(retryAfterSeconds?: number) {
    return {
        success: false,
        error: {
            code: 'RATE_LIMIT_ERROR',
            message: 'Too many requests, please try again later',
            ...(retryAfterSeconds && { retryAfter: retryAfterSeconds }),
        },
        timestamp: new Date().toISOString(),
    };
}

// ── Factory ────────────────────────────────────────────────────
function createLimiter(opts: Partial<Options>): RequestHandler {
    return rateLimit({
        standardHeaders: true,   // Return rate-limit info in `RateLimit-*` headers
        legacyHeaders: false,    // Disable `X-RateLimit-*` headers
        message: rateLimitMessage(),
        ...opts,
    });
}

// ── Noop middleware for dev ─────────────────────────────────────
const noop: RequestHandler = (_req, _res, next) => next();

// ══════════════════════════════════════════════════════════════════
//  Tier Definitions
// ══════════════════════════════════════════════════════════════════

/**
 * AUTH – Very strict
 * Login / Register / Password Reset
 * 10 requests per 15 minutes per IP
 */
export const authLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 15 * 60 * 1000,   // 15 minutes
        max: 10,
        message: rateLimitMessage(900),
        skipSuccessfulRequests: false,
    });

/**
 * AUTH_STRICT – Extra strict for sensitive endpoints
 * Login specifically: 5 per 15 minutes
 */
export const loginLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: rateLimitMessage(900),
    });

/**
 * PASSWORD_RESET – 3 per 15 minutes
 * Prevents email flooding
 */
export const passwordResetLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 3,
        message: rateLimitMessage(900),
    });

/**
 * WRITE – Moderate
 * POST/PUT/DELETE on resources (create order, update product, etc.)
 * 60 requests per minute per IP
 */
export const writeLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 60 * 1000,   // 1 minute
        max: 60,
    });

/**
 * READ – Generous
 * GET requests for dashboard, products, categories, etc.
 * 200 requests per minute per IP
 */
export const readLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 60 * 1000,
        max: 200,
    });

/**
 * GENERAL – Fallback
 * Applied globally as a safety net
 * 500 requests per 15 minutes per IP
 */
export const generalLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 500,
    });

/**
 * UPLOAD – File uploads
 * 20 uploads per 15 minutes
 */
export const uploadLimiter: RequestHandler = env.isDevelopment
    ? noop
    : createLimiter({
        windowMs: 15 * 60 * 1000,
        max: 20,
    });

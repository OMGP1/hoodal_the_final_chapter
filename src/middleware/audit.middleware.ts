import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Audit logging middleware.
 * Automatically logs all mutating requests (POST, PUT, PATCH, DELETE)
 * to the AuditLog table.
 *
 * Captures:
 *  - userId (from authenticated user)
 *  - action (HTTP method + route path)
 *  - resourceType (first path segment after /api/v1/)
 *  - resourceId (from route params)
 *  - ipAddress, userAgent
 *  - changes (request body for POST/PUT/PATCH)
 *  - response status
 *
 * Non-blocking: logging happens after the response is sent.
 */
export function auditLog() {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Only log mutating methods
        const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!mutatingMethods.includes(req.method)) {
            next();
            return;
        }

        // Capture the original end to intercept response
        const originalEnd = res.end;
        const originalJson = res.json;
        let responseBody: any = null;

        // Intercept res.json to capture response data
        res.json = function (body: any) {
            responseBody = body;
            return originalJson.call(this, body);
        };

        // When the response finishes, log the audit entry (non-blocking)
        res.on('finish', () => {
            // Fire and forget — don't block the response
            setImmediate(async () => {
                try {
                    const user = (req as any).user;
                    const userId = user?.id || null;

                    // Extract resource type from URL path
                    // e.g., /api/v1/suppliers/123 → "suppliers"
                    const pathParts = req.originalUrl
                        .replace(/^\/api\/v\d+\//, '')
                        .split('/')
                        .filter(Boolean);
                    const resourceType = pathParts[0] || 'unknown';
                    const resourceId = pathParts[1] || req.params?.id || null;

                    // Build the action string
                    const action = `${req.method} ${req.originalUrl}`;

                    // Build changes object
                    const changes: any = {};

                    // Capture request body (POST/PUT/PATCH)
                    if (req.body && Object.keys(req.body).length > 0) {
                        changes.requestBody = sanitizeBody(req.body);
                    }

                    // Determine status from response
                    const status = res.statusCode >= 200 && res.statusCode < 400
                        ? 'success'
                        : 'failure';

                    await prisma.auditLog.create({
                        data: {
                            userId,
                            action,
                            resourceType,
                            resourceId,
                            ipAddress: req.ip || req.socket?.remoteAddress || null,
                            userAgent: req.headers['user-agent'] || null,
                            changes: Object.keys(changes).length > 0 ? changes : null,
                            status,
                        },
                    });
                } catch (error) {
                    // Never let audit logging break the application
                    console.error('Audit log error:', error);
                }
            });
        });

        next();
    };
}

/**
 * Sanitize request body to remove sensitive fields before logging
 */
function sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

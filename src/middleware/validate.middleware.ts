import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError, ErrorCodes } from '../utils/response';

/**
 * Validation middleware factory using Zod schemas
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const result = schema.parse(data);

            // Replace the source with parsed/transformed data
            if (source === 'body') {
                req.body = result;
            } else if (source === 'query') {
                req.query = result;
            } else {
                req.params = result;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                console.error('Validation failure details:', JSON.stringify(details, null, 2));

                sendError(
                    res,
                    ErrorCodes.VALIDATION_ERROR,
                    'Validation failed',
                    400,
                    details
                );
                return;
            }
            next(error);
        }
    };
}

/**
 * Validate multiple sources at once
 */
export function validateAll(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: { field: string; message: string }[] = [];

        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(
                    ...error.errors.map((err) => ({
                        field: `body.${err.path.join('.')}`,
                        message: err.message,
                    }))
                );
            }
        }

        try {
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(
                    ...error.errors.map((err) => ({
                        field: `query.${err.path.join('.')}`,
                        message: err.message,
                    }))
                );
            }
        }

        try {
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
        } catch (error) {
            if (error instanceof ZodError) {
                errors.push(
                    ...error.errors.map((err) => ({
                        field: `params.${err.path.join('.')}`,
                        message: err.message,
                    }))
                );
            }
        }

        if (errors.length > 0) {
            sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, errors);
            return;
        }

        next();
    };
}

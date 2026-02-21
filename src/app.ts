import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { API_PREFIX } from './config/constants';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_ERROR',
            message: 'Too many requests, please try again later',
        },
        timestamp: new Date().toISOString(),
    },
});
app.use(limiter);

// Request logging middleware
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// API routes
app.use(API_PREFIX, routes);

// Welcome route
app.get('/', (_req, res) => {
    res.json({
        message: 'Shop Inventory Management API',
        version: '1.0.0',
        documentation: `${API_PREFIX}/docs`,
        health: `${API_PREFIX}/health`,
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

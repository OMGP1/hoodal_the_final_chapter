import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';

import { env } from './config/env';
import { API_PREFIX } from './config/constants';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { auditLog } from './middleware/audit.middleware';
import { logger } from './utils/logger';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Rate limiting — general safety net (tiered limiters applied per-route)
import { generalLimiter } from './middleware/rateLimit.middleware';
app.use(generalLimiter);

// Request logging middleware
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Audit logging (non-blocking, logs all mutations)
app.use(auditLog());

// Static file serving (uploaded product images etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

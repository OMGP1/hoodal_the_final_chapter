import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Console output
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
        // File output for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        // File output for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),
    ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

export default logger;

import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
    userId: string;
    role: string;
    permissions: string[];
}

export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}

/**
 * Parse duration string (e.g., '15m', '7d') to seconds
 */
function parseDurationToSeconds(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 60 * 60;
        case 'd': return value * 24 * 60 * 60;
        default: return 900;
    }
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
        expiresIn: parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN),
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(userId: string): string {
    const options: SignOptions = {
        expiresIn: parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN),
    };
    return jwt.sign({ userId }, env.JWT_SECRET, options);
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): DecodedToken {
    return jwt.verify(token, env.JWT_SECRET) as DecodedToken;
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_SECRET) as { userId: string };
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
    authHeader: string | undefined
): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            return 0;
    }
}

/**
 * Calculate token expiry date
 */
export function getTokenExpiry(duration: string): Date {
    return new Date(Date.now() + parseDuration(duration));
}

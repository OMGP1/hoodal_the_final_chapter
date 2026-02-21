import { prisma } from '../config/database';
import { env } from '../config/env';
import { ROLE_PERMISSIONS, ROLES } from '../config/constants';
import { hashPassword, comparePassword } from '../utils/password';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getTokenExpiry,
} from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthTokens } from '../types/auth.types';

export class AuthService {
    /**
     * Register a new user
     */
    async register(data: RegisterInput): Promise<{ user: object; tokens: AuthTokens }> {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError(
                ErrorCodes.DUPLICATE_ENTRY,
                'User with this email already exists',
                409
            );
        }

        // Get default customer role
        let defaultRole = await prisma.role.findUnique({
            where: { name: ROLES.CUSTOMER },
        });

        // Create default role if it doesn't exist
        if (!defaultRole) {
            defaultRole = await prisma.role.create({
                data: {
                    name: ROLES.CUSTOMER,
                    description: 'Default customer role',
                    permissions: ROLE_PERMISSIONS[ROLES.CUSTOMER],
                },
            });
        }

        // Hash password
        const passwordHash = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                roleId: defaultRole.id,
            },
            include: { role: true },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, defaultRole.name);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role?.name,
            },
            tokens,
        };
    }

    /**
     * Login user
     */
    async login(data: LoginInput): Promise<{ user: object; tokens: AuthTokens }> {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { role: true },
        });

        if (!user) {
            throw new AppError(
                ErrorCodes.AUTHENTICATION_ERROR,
                'Invalid email or password',
                401
            );
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AppError(
                ErrorCodes.AUTHENTICATION_ERROR,
                'Account is deactivated',
                401
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError(
                ErrorCodes.AUTHENTICATION_ERROR,
                'Invalid email or password',
                401
            );
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Generate tokens
        const roleName = user.role?.name || ROLES.CUSTOMER;
        const tokens = await this.generateTokens(user.id, roleName);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role?.name,
            },
            tokens,
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(token: string): Promise<AuthTokens> {
        // Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            throw new AppError(
                ErrorCodes.AUTHENTICATION_ERROR,
                'Invalid refresh token',
                401
            );
        }

        // Check if refresh token exists in database
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token,
                userId: decoded.userId,
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            throw new AppError(
                ErrorCodes.AUTHENTICATION_ERROR,
                'Refresh token expired or invalid',
                401
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true },
        });

        if (!user || !user.isActive) {
            throw new AppError(
                ErrorCodes.AUTHENTICATION_ERROR,
                'User not found or inactive',
                401
            );
        }

        // Delete old refresh token
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // Generate new tokens
        const roleName = user.role?.name || ROLES.CUSTOMER;
        return this.generateTokens(user.id, roleName);
    }

    /**
     * Logout user - invalidate refresh token
     */
    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            // Delete specific refresh token
            await prisma.refreshToken.deleteMany({
                where: { userId, token: refreshToken },
            });
        } else {
            // Delete all refresh tokens for user
            await prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role?.name,
            permissions: user.role ? ROLE_PERMISSIONS[user.role.name] || [] : [],
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
        };
    }

    /**
     * Generate access and refresh tokens
     */
    private async generateTokens(userId: string, role: string): Promise<AuthTokens> {
        const permissions = ROLE_PERMISSIONS[role] || [];

        const accessToken = generateAccessToken({
            userId,
            role,
            permissions,
        });

        const refreshToken = generateRefreshToken(userId);

        // Store refresh token in database
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt: getTokenExpiry(env.JWT_REFRESH_EXPIRES_IN),
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: env.JWT_ACCESS_EXPIRES_IN,
        };
    }
}

export const authService = new AuthService();

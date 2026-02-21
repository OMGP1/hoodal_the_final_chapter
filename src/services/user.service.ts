import { prisma } from '../config/database';
import { ROLE_PERMISSIONS } from '../config/constants';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { CreateUserInput, UpdateUserInput, UserQuery } from '../validators/user.validator';

export class UserService {
    /**
     * Get all users with pagination and filters
     */
    async findAll(query: UserQuery) {
        const { skip, take, page, pageSize } = parsePagination(query);

        const where: Record<string, unknown> = {};

        if (query.search) {
            where.OR = [
                { email: { contains: query.search, mode: 'insensitive' } },
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        if (query.roleId) {
            where.roleId = query.roleId;
        }

        if (query.isActive !== undefined) {
            where.isActive = query.isActive;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                include: { role: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users: users.map((user) => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role?.name,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            })),
            pagination: { page, pageSize, totalRecords: total },
        };
    }

    /**
     * Get user by ID
     */
    async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
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
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    /**
     * Create a new user
     */
    async create(data: CreateUserInput) {
        // Check if email already exists
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

        const passwordHash = await hashPassword(data.password);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                roleId: data.roleId,
                isActive: data.isActive ?? true,
            },
            include: { role: true },
        });

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role?.name,
            isActive: user.isActive,
            createdAt: user.createdAt,
        };
    }

    /**
     * Update user
     */
    async update(id: string, data: UpdateUserInput) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
        }

        // Check email uniqueness if updating email
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (emailExists) {
                throw new AppError(
                    ErrorCodes.DUPLICATE_ENTRY,
                    'Email already in use',
                    409
                );
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role?.name,
            isActive: user.isActive,
            updatedAt: user.updatedAt,
        };
    }

    /**
     * Soft delete user (deactivate)
     */
    async delete(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
        }

        await prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'User deactivated successfully' };
    }

    /**
     * Assign role to user
     */
    async assignRole(userId: string, roleId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
        }

        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { roleId },
            include: { role: true },
        });

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role?.name,
            permissions: ROLE_PERMISSIONS[updatedUser.role?.name || ''] || [],
        };
    }

    /**
     * Get all roles
     */
    async getRoles() {
        const roles = await prisma.role.findMany({
            orderBy: { name: 'asc' },
        });

        return roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
        }));
    }
}

export const userService = new UserService();

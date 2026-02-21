import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
});

export const assignRoleSchema = z.object({
    roleId: z.string().uuid('Invalid role ID'),
});

export const userIdParamSchema = z.object({
    id: z.string().uuid('Invalid user ID'),
});

export const userQuerySchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    search: z.string().optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.string().optional().transform((val) => val === 'true'),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;

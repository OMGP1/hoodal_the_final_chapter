import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';

interface CustomerFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

class CustomerService {
    /**
     * Create a new customer
     */
    async create(data: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
        creditLimit?: number;
        notes?: string;
    }) {
        // Check for duplicate phone
        if (data.phone) {
            const existing = await prisma.customer.findUnique({
                where: { phone: data.phone },
            });
            if (existing) {
                throw new AppError(
                    ErrorCodes.DUPLICATE_ENTRY,
                    'A customer with this phone number already exists',
                    400
                );
            }
        }

        return prisma.customer.create({
            data: {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                creditLimit: data.creditLimit ?? 0,
                notes: data.notes || null,
            },
        });
    }

    /**
     * Update customer by ID
     */
    async update(id: string, data: Partial<{
        name: string;
        email: string;
        phone: string;
        address: string;
        creditLimit: number;
        notes: string;
    }>) {
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
        }

        // Check phone uniqueness if changed
        if (data.phone && data.phone !== customer.phone) {
            const existing = await prisma.customer.findUnique({
                where: { phone: data.phone },
            });
            if (existing) {
                throw new AppError(
                    ErrorCodes.DUPLICATE_ENTRY,
                    'A customer with this phone number already exists',
                    400
                );
            }
        }

        return prisma.customer.update({
            where: { id },
            data,
        });
    }

    /**
     * Get customer by ID with sales order count and balance info
     */
    async getById(id: string) {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        salesOrders: true,
                        returnOrders: true,
                    },
                },
            },
        });

        if (!customer) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
        }

        return customer;
    }

    /**
     * List customers with search, pagination, and active filter
     */
    async list(filters: CustomerFilters) {
        const {
            search,
            isActive,
            page = 1,
            limit = 20,
        } = filters;

        const where: any = {};

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    _count: { select: { salesOrders: true } },
                },
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.customer.count({ where }),
        ]);

        return {
            data,
            pagination: { total },
        };
    }

    /**
     * Adjust customer credit balance (udhaari).
     * Uses Prisma transaction to ensure atomicity.
     *
     * - type='credit': Customer took goods on credit → balance increases
     * - type='payment': Customer paid back → balance decreases
     */
    async adjustBalance(
        id: string,
        amount: number,
        type: 'credit' | 'payment',
        notes?: string
    ) {
        return prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id } });
            if (!customer) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
            }

            const currentBalance = customer.currentBalance.toNumber();
            let newBalance: number;

            if (type === 'credit') {
                newBalance = currentBalance + amount;

                // Check credit limit
                const creditLimit = customer.creditLimit.toNumber();
                if (creditLimit > 0 && newBalance > creditLimit) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Credit limit exceeded. Limit: ₹${creditLimit}, Current: ₹${currentBalance}, Requested: ₹${amount}`,
                        400
                    );
                }
            } else {
                // payment — reduce balance
                newBalance = currentBalance - amount;
                if (newBalance < 0) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Payment amount ₹${amount} exceeds outstanding balance ₹${currentBalance}`,
                        400
                    );
                }
            }

            const updated = await tx.customer.update({
                where: { id },
                data: { currentBalance: newBalance },
            });

            // Log to audit via the AuditLog model
            await tx.auditLog.create({
                data: {
                    action: `customer_balance_${type}`,
                    resourceType: 'customer',
                    resourceId: id,
                    changes: {
                        before: { currentBalance: currentBalance },
                        after: { currentBalance: newBalance },
                        amount,
                        type,
                        notes: notes || null,
                    },
                    status: 'success',
                },
            });

            return updated;
        });
    }

    /**
     * Toggle customer active status (soft delete)
     */
    async toggleActive(id: string) {
        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found', 404);
        }

        return prisma.customer.update({
            where: { id },
            data: { isActive: !customer.isActive },
        });
    }
}

export const customerService = new CustomerService();

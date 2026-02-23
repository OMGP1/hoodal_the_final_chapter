import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';

interface SupplierFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

class SupplierService {
    /**
     * Create a new supplier
     */
    async create(data: {
        name: string;
        contactName?: string;
        email?: string;
        phone?: string;
        address?: string;
        gstNumber?: string;
        panNumber?: string;
        notes?: string;
    }) {
        // Check for duplicate GST number
        if (data.gstNumber) {
            const existing = await prisma.supplier.findFirst({
                where: { gstNumber: data.gstNumber },
            });
            if (existing) {
                throw new AppError(
                    ErrorCodes.DUPLICATE_ENTRY,
                    'A supplier with this GSTIN already exists',
                    400
                );
            }
        }

        return prisma.supplier.create({
            data: {
                name: data.name,
                contactName: data.contactName || null,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                gstNumber: data.gstNumber || null,
                panNumber: data.panNumber || null,
                notes: data.notes || null,
            },
        });
    }

    /**
     * Update supplier by ID
     */
    async update(id: string, data: Partial<{
        name: string;
        contactName: string;
        email: string;
        phone: string;
        address: string;
        gstNumber: string;
        panNumber: string;
        notes: string;
    }>) {
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
        }

        // Check GST uniqueness if changed
        if (data.gstNumber && data.gstNumber !== supplier.gstNumber) {
            const existing = await prisma.supplier.findFirst({
                where: { gstNumber: data.gstNumber, NOT: { id } },
            });
            if (existing) {
                throw new AppError(
                    ErrorCodes.DUPLICATE_ENTRY,
                    'A supplier with this GSTIN already exists',
                    400
                );
            }
        }

        return prisma.supplier.update({
            where: { id },
            data,
        });
    }

    /**
     * Get supplier by ID with purchase order count
     */
    async getById(id: string) {
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { purchaseOrders: true },
                },
            },
        });

        if (!supplier) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
        }

        return supplier;
    }

    /**
     * List suppliers with search, pagination, and active filter
     */
    async list(filters: SupplierFilters) {
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
                { contactName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { gstNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                include: {
                    _count: { select: { purchaseOrders: true } },
                },
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.supplier.count({ where }),
        ]);

        return {
            data,
            pagination: { total },
        };
    }

    /**
     * Toggle supplier active status (soft delete)
     */
    async toggleActive(id: string) {
        const supplier = await prisma.supplier.findUnique({ where: { id } });
        if (!supplier) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
        }

        return prisma.supplier.update({
            where: { id },
            data: { isActive: !supplier.isActive },
        });
    }
}

export const supplierService = new SupplierService();

import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';

interface PurchaseOrderItemInput {
    productId: string;
    variantId?: string;
    orderedQty: number;
    unitCost: number;
    taxRate?: number;
}

interface CreatePurchaseOrderInput {
    supplierId: string;
    expectedDate?: Date;
    notes?: string;
    items: PurchaseOrderItemInput[];
}

interface UpdatePurchaseOrderInput {
    expectedDate?: Date;
    notes?: string;
    items?: PurchaseOrderItemInput[];
}

// Generate PO number: PO-001, PO-002, etc.
async function generatePONumber(): Promise<string> {
    const count = await prisma.purchaseOrder.count();
    return `PO-${(count + 1).toString().padStart(3, '0')}`;
}

export class PurchaseService {
    /**
     * Create a new purchase order (draft status)
     */
    async createPurchaseOrder(data: CreatePurchaseOrderInput, userId: string) {
        const poNumber = await generatePONumber();

        // Validate supplier exists
        const supplier = await prisma.supplier.findUnique({
            where: { id: data.supplierId },
        });

        if (!supplier) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Supplier not found', 404);
        }

        // Validate products exist and calculate totals
        let subtotal = new Decimal(0);
        let totalTax = new Decimal(0);

        const itemsData: Array<{
            productId: string;
            variantId: string | null;
            orderedQty: number;
            unitCost: Decimal;
            taxRate: Decimal;
            taxAmount: Decimal;
            totalCost: Decimal;
        }> = [];

        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                throw new AppError(
                    ErrorCodes.NOT_FOUND,
                    `Product not found: ${item.productId}`,
                    404
                );
            }

            if (item.variantId) {
                const variant = await prisma.productVariant.findUnique({
                    where: { id: item.variantId },
                });
                if (!variant) {
                    throw new AppError(
                        ErrorCodes.NOT_FOUND,
                        `Variant not found: ${item.variantId}`,
                        404
                    );
                }
            }

            const unitCost = new Decimal(item.unitCost);
            const taxRate = new Decimal(item.taxRate ?? 0);
            const lineSubtotal = unitCost.times(item.orderedQty);
            const lineTax = lineSubtotal.times(taxRate).dividedBy(100);
            const lineTotalCost = lineSubtotal.plus(lineTax);

            subtotal = subtotal.plus(lineSubtotal);
            totalTax = totalTax.plus(lineTax);

            itemsData.push({
                productId: item.productId,
                variantId: item.variantId ?? null,
                orderedQty: item.orderedQty,
                unitCost,
                taxRate,
                taxAmount: lineTax,
                totalCost: lineTotalCost,
            });
        }

        const totalAmount = subtotal.plus(totalTax);

        // Create PO with items in transaction
        return prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: data.supplierId,
                expectedDate: data.expectedDate,
                status: 'draft',
                subtotal,
                taxAmount: totalTax,
                totalAmount,
                notes: data.notes,
                createdBy: userId,
                items: {
                    create: itemsData,
                },
            },
            include: {
                supplier: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                        variant: { select: { id: true, name: true, sku: true } },
                    },
                },
            },
        });
    }

    /**
     * Update a draft purchase order
     */
    async updatePurchaseOrder(poId: string, data: UpdatePurchaseOrderInput) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
        });

        if (!po) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase order not found', 404);
        }

        if (po.status !== 'draft') {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Only draft purchase orders can be edited',
                400
            );
        }

        // If items are being replaced, recalculate totals
        if (data.items && data.items.length > 0) {
            let subtotal = new Decimal(0);
            let totalTax = new Decimal(0);

            const itemsData: Array<{
                productId: string;
                variantId: string | null;
                orderedQty: number;
                unitCost: Decimal;
                taxRate: Decimal;
                taxAmount: Decimal;
                totalCost: Decimal;
            }> = [];

            for (const item of data.items) {
                const unitCost = new Decimal(item.unitCost);
                const taxRate = new Decimal(item.taxRate ?? 0);
                const lineSubtotal = unitCost.times(item.orderedQty);
                const lineTax = lineSubtotal.times(taxRate).dividedBy(100);
                const lineTotalCost = lineSubtotal.plus(lineTax);

                subtotal = subtotal.plus(lineSubtotal);
                totalTax = totalTax.plus(lineTax);

                itemsData.push({
                    productId: item.productId,
                    variantId: item.variantId ?? null,
                    orderedQty: item.orderedQty,
                    unitCost,
                    taxRate,
                    taxAmount: lineTax,
                    totalCost: lineTotalCost,
                });
            }

            const totalAmount = subtotal.plus(totalTax);

            // Delete existing items and create new ones
            return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.purchaseOrderItem.deleteMany({
                    where: { purchaseOrderId: poId },
                });

                return tx.purchaseOrder.update({
                    where: { id: poId },
                    data: {
                        expectedDate: data.expectedDate,
                        notes: data.notes,
                        subtotal,
                        taxAmount: totalTax,
                        totalAmount,
                        items: { create: itemsData },
                    },
                    include: {
                        supplier: { select: { id: true, name: true } },
                        items: {
                            include: {
                                product: { select: { id: true, name: true, sku: true } },
                                variant: { select: { id: true, name: true, sku: true } },
                            },
                        },
                    },
                });
            });
        }

        // Just update metadata
        return prisma.purchaseOrder.update({
            where: { id: poId },
            data: {
                expectedDate: data.expectedDate,
                notes: data.notes,
            },
            include: {
                supplier: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                        variant: { select: { id: true, name: true, sku: true } },
                    },
                },
            },
        });
    }

    /**
     * Submit a purchase order (change status to "ordered")
     */
    async submitOrder(poId: string) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: { items: true },
        });

        if (!po) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase order not found', 404);
        }

        if (po.status !== 'draft') {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Only draft purchase orders can be submitted',
                400
            );
        }

        if (po.items.length === 0) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Cannot submit purchase order with no items',
                400
            );
        }

        return prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: 'ordered' },
            include: {
                supplier: { select: { id: true, name: true } },
                items: true,
            },
        });
    }

    /**
     * Cancel a purchase order
     */
    async cancelOrder(poId: string) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: { goodsReceivedNotes: true },
        });

        if (!po) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase order not found', 404);
        }

        if (po.status === 'received' || po.status === 'cancelled') {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                `Cannot cancel ${po.status} purchase order`,
                400
            );
        }

        if (po.goodsReceivedNotes.length > 0) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Cannot cancel purchase order with received goods. Process a return instead.',
                400
            );
        }

        return prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: 'cancelled' },
        });
    }

    /**
     * Get purchase order by ID
     */
    async getPurchaseOrder(poId: string) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                        variant: { select: { id: true, name: true, sku: true } },
                    },
                },
                goodsReceivedNotes: {
                    include: {
                        items: true,
                        receivedByUser: { select: { id: true, email: true, firstName: true } },
                    },
                },
                createdByUser: { select: { id: true, email: true, firstName: true } },
            },
        });

        if (!po) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase order not found', 404);
        }

        return po;
    }

    /**
     * List purchase orders with filters
     */
    async listPurchaseOrders(filters: {
        status?: string;
        supplierId?: string;
        fromDate?: Date;
        toDate?: Date;
        page?: number;
        limit?: number;
    }) {
        const where: Prisma.PurchaseOrderWhereInput = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.supplierId) {
            where.supplierId = filters.supplierId;
        }

        if (filters.fromDate || filters.toDate) {
            where.orderDate = {};
            if (filters.fromDate) {
                where.orderDate.gte = filters.fromDate;
            }
            if (filters.toDate) {
                where.orderDate.lte = filters.toDate;
            }
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const skip = (page - 1) * limit;

        const [total, purchaseOrders] = await Promise.all([
            prisma.purchaseOrder.count({ where }),
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    supplier: { select: { id: true, name: true } },
                    _count: { select: { items: true, goodsReceivedNotes: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: purchaseOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export const purchaseService = new PurchaseService();

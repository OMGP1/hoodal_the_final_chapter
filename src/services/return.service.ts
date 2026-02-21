import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';
import { MOVEMENT_TYPES } from '../config/constants';

interface ReturnItemInput {
    productId: string;
    variantId?: string;
    quantity: number;
    reason?: string;
}

interface ProcessReturnInput {
    originalOrderId: string;
    items: ReturnItemInput[];
    refundMethod: 'cash' | 'card' | 'upi' | 'credit' | 'store_credit';
    reason?: string;
    notes?: string;
    registerSessionId?: string;
}

// Generate return number: RTN-001, RTN-002, etc.
async function generateReturnNumber(): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.returnOrder.count({
        where: { createdAt: { gte: today } },
    });

    return `RTN-${(count + 1).toString().padStart(3, '0')}`;
}

export class ReturnService {
    /**
     * Process a return/refund
     * - Creates ReturnOrder linked to original SalesOrder
     * - Restocks inventory to current active batch
     * - Handles financial reversal (cash/credit/etc)
     * - Updates register session if applicable
     */
    async processReturn(data: ProcessReturnInput, userId: string) {
        const returnNumber = await generateReturnNumber();

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Validate original order exists
            const originalOrder = await tx.salesOrder.findUnique({
                where: { id: data.originalOrderId },
                include: {
                    items: true,
                    customer: true,
                },
            });

            if (!originalOrder) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Original order not found', 404);
            }

            // 2. Validate return items against original order
            let subtotal = new Decimal(0);
            let totalTax = new Decimal(0);
            const returnItems: Array<{
                productId: string;
                variantId: string | null;
                quantity: number;
                unitPrice: Decimal;
                taxAmount: Decimal;
                totalRefund: Decimal;
            }> = [];

            for (const item of data.items) {
                // Find matching item in original order
                const originalItem = originalOrder.items.find(
                    (oi: { productId: string; variantId: string | null; quantity: number; unitPrice: Decimal; taxRate: Decimal }) =>
                        oi.productId === item.productId &&
                        (item.variantId ? oi.variantId === item.variantId : !oi.variantId)
                );

                if (!originalItem) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Item not found in original order: ${item.productId}`,
                        400
                    );
                }

                if (item.quantity > originalItem.quantity) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Cannot return more than purchased quantity`,
                        400
                    );
                }

                const unitPrice = originalItem.unitPrice;
                const taxRate = originalItem.taxRate;
                const itemTax = unitPrice.times(item.quantity).times(taxRate).dividedBy(100);
                const itemRefund = unitPrice.times(item.quantity).plus(itemTax);

                subtotal = subtotal.plus(unitPrice.times(item.quantity));
                totalTax = totalTax.plus(itemTax);

                returnItems.push({
                    productId: item.productId,
                    variantId: item.variantId ?? null,
                    quantity: item.quantity,
                    unitPrice,
                    taxAmount: itemTax,
                    totalRefund: itemRefund,
                });
            }

            const totalAmount = subtotal.plus(totalTax);

            // 3. Create return order
            const returnOrder = await tx.returnOrder.create({
                data: {
                    returnNumber,
                    originalOrderId: data.originalOrderId,
                    customerId: originalOrder.customerId,
                    returnType: 'refund',
                    reason: data.reason,
                    subtotal,
                    taxAmount: totalTax,
                    totalAmount,
                    refundMethod: data.refundMethod,
                    refundStatus: 'processed',
                    registerSessionId: data.registerSessionId,
                    processedBy: userId,
                    notes: data.notes,
                },
            });

            // 4. Create return items and restock inventory
            for (const item of returnItems) {
                await tx.returnOrderItem.create({
                    data: {
                        returnOrderId: returnOrder.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxAmount: item.taxAmount,
                        totalRefund: item.totalRefund,
                        restockStatus: 'restocked',
                    },
                });

                // Restock to current active batch (or create new "Returns" batch)
                // MVP: Add to most recent available batch for this product/variant
                const existingBatch = await tx.inventoryItem.findFirst({
                    where: item.variantId
                        ? { variantId: item.variantId, status: 'available' }
                        : { productId: item.productId, variantId: null, status: 'available' },
                    orderBy: { createdAt: 'desc' },
                });

                if (existingBatch) {
                    // Add to existing batch
                    await tx.inventoryItem.update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: { increment: item.quantity },
                            availableQuantity: { increment: item.quantity },
                        },
                    });
                } else {
                    // Create new "Returns" batch
                    // Find first active location (no isDefault field in schema)
                    const defaultLocation = await tx.inventoryLocation.findFirst({
                        where: { isActive: true },
                    });

                    await tx.inventoryItem.create({
                        data: {
                            productId: item.productId,
                            variantId: item.variantId,
                            locationId: defaultLocation?.id ?? null,
                            quantity: item.quantity,
                            availableQuantity: item.quantity,
                            batchNumber: `RTN-${new Date().toISOString().slice(0, 10)}`,
                            status: 'available',
                        },
                    });
                }

                // Create stock movement for return
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        variantId: item.variantId,
                        movementType: MOVEMENT_TYPES.RETURN,
                        quantity: item.quantity, // Positive for return (adding back)
                        referenceType: 'return_order',
                        referenceId: returnOrder.id,
                        notes: `Return from order ${originalOrder.orderNumber}`,
                        createdBy: userId,
                    },
                });
            }

            // 5. Handle financial reversal
            if (data.refundMethod === 'credit' && originalOrder.customerId) {
                // Reduce customer's credit balance
                await tx.customer.update({
                    where: { id: originalOrder.customerId },
                    data: {
                        currentBalance: { decrement: totalAmount },
                    },
                });
            }

            // 6. Update register session if cash refund
            if (data.refundMethod === 'cash') {
                // CRITICAL: Cannot process cash refund without an open register
                if (!data.registerSessionId) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        'Cash refund requires an open register session. Open a register first.',
                        400
                    );
                }

                // Verify the session is actually open
                const session = await tx.registerSession.findUnique({
                    where: { id: data.registerSessionId },
                });

                if (!session || session.status !== 'open') {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        'Register session is not open. Cannot process cash refund.',
                        400
                    );
                }

                await tx.registerSession.update({
                    where: { id: data.registerSessionId },
                    data: {
                        cashSales: { decrement: totalAmount },
                        totalSales: { decrement: totalAmount },
                    },
                });
            }

            // 7. Return the complete return order
            return tx.returnOrder.findUnique({
                where: { id: returnOrder.id },
                include: {
                    items: true,
                    originalOrder: {
                        select: {
                            orderNumber: true,
                            orderDate: true,
                        },
                    },
                    customer: {
                        select: { id: true, name: true, phone: true },
                    },
                },
            });
        });
    }

    /**
     * Get return order by ID
     */
    async getReturnById(returnId: string) {
        const returnOrder = await prisma.returnOrder.findUnique({
            where: { id: returnId },
            include: {
                items: true,
                originalOrder: {
                    select: {
                        id: true,
                        orderNumber: true,
                        orderDate: true,
                        totalAmount: true,
                    },
                },
                customer: {
                    select: { id: true, name: true, phone: true },
                },
            },
        });

        if (!returnOrder) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Return order not found', 404);
        }

        return returnOrder;
    }

    /**
     * Get return order by return number
     */
    async getReturnByNumber(returnNumber: string) {
        const returnOrder = await prisma.returnOrder.findUnique({
            where: { returnNumber },
            include: {
                items: true,
                originalOrder: {
                    select: {
                        id: true,
                        orderNumber: true,
                        orderDate: true,
                        totalAmount: true,
                    },
                },
                customer: {
                    select: { id: true, name: true, phone: true },
                },
            },
        });

        if (!returnOrder) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Return order not found', 404);
        }

        return returnOrder;
    }

    /**
     * List returns for an order
     */
    async getReturnsForOrder(orderId: string) {
        return prisma.returnOrder.findMany({
            where: { originalOrderId: orderId },
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const returnService = new ReturnService();

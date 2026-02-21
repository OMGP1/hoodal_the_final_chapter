import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';
import { MOVEMENT_TYPES } from '../config/constants';

interface GRNItemInput {
    purchaseOrderItemId: string;
    quantityReceived: number;
    batchNumber?: string;
    expiryDate?: Date;
    manufacturingDate?: Date;
}

interface CreateGRNInput {
    purchaseOrderId: string;
    items: GRNItemInput[];
    notes?: string;
}

// Generate GRN number: GRN-001, GRN-002, etc.
async function generateGRNNumber(): Promise<string> {
    const count = await prisma.goodsReceivedNote.count();
    return `GRN-${(count + 1).toString().padStart(3, '0')}`;
}

export class GRNService {
    /**
     * Receive goods against a purchase order
     * This is an atomic transaction that:
     * 1. Creates GRN record
     * 2. Creates InventoryItem (batch) for each item
     * 3. Updates PurchaseOrderItem.receivedQty
     * 4. Updates Product.purchasePrice (optional, recommended)
     * 5. Creates StockMovement records
     * 6. Updates PO status (partial/received)
     */
    async receiveGoods(data: CreateGRNInput, userId: string) {
        const grnNumber = await generateGRNNumber();

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Validate PO exists and is in correct status
            const po = await tx.purchaseOrder.findUnique({
                where: { id: data.purchaseOrderId },
                include: { items: true },
            });

            if (!po) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Purchase order not found', 404);
            }

            if (po.status === 'draft') {
                throw new AppError(
                    ErrorCodes.BUSINESS_ERROR,
                    'Cannot receive goods for a draft PO. Submit the order first.',
                    400
                );
            }

            if (po.status === 'cancelled') {
                throw new AppError(
                    ErrorCodes.BUSINESS_ERROR,
                    'Cannot receive goods for a cancelled PO',
                    400
                );
            }

            if (po.status === 'received') {
                throw new AppError(
                    ErrorCodes.BUSINESS_ERROR,
                    'All items in this PO have already been received',
                    400
                );
            }

            // Build PO item lookup
            const poItemMap = new Map(po.items.map((item) => [item.id, item]));

            // 2. Validate received items
            for (const item of data.items) {
                const poItem = poItemMap.get(item.purchaseOrderItemId);

                if (!poItem) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Invalid PO item: ${item.purchaseOrderItemId}`,
                        400
                    );
                }

                const remainingQty = poItem.orderedQty - poItem.receivedQty;
                if (item.quantityReceived > remainingQty) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Cannot receive ${item.quantityReceived} units. Only ${remainingQty} remaining for this item.`,
                        400
                    );
                }

                if (item.quantityReceived <= 0) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        'Quantity received must be greater than 0',
                        400
                    );
                }
            }

            // 3. Get default location for inventory
            const defaultLocation = await tx.inventoryLocation.findFirst({
                where: { isActive: true },
            });

            // 4. Create GRN record
            const grn = await tx.goodsReceivedNote.create({
                data: {
                    grnNumber,
                    purchaseOrderId: data.purchaseOrderId,
                    receivedBy: userId,
                    notes: data.notes,
                },
            });

            // 5. Process each item
            for (const item of data.items) {
                const poItem = poItemMap.get(item.purchaseOrderItemId)!;

                // a. Create new InventoryItem (batch)
                const inventoryItem = await tx.inventoryItem.create({
                    data: {
                        productId: poItem.productId,
                        variantId: poItem.variantId,
                        locationId: defaultLocation?.id ?? null,
                        batchNumber: item.batchNumber ?? grnNumber, // Use GRN as batch if not provided
                        quantity: item.quantityReceived,
                        availableQuantity: item.quantityReceived,
                        expiryDate: item.expiryDate,
                        manufacturingDate: item.manufacturingDate,
                        status: 'available',
                    },
                });

                // b. Create GRN item linked to inventory
                await tx.gRNItem.create({
                    data: {
                        grnId: grn.id,
                        purchaseOrderItemId: item.purchaseOrderItemId,
                        productId: poItem.productId,
                        variantId: poItem.variantId,
                        quantityReceived: item.quantityReceived,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                        manufacturingDate: item.manufacturingDate,
                        inventoryItemId: inventoryItem.id,
                    },
                });

                // c. Update PO item received quantity
                await tx.purchaseOrderItem.update({
                    where: { id: item.purchaseOrderItemId },
                    data: {
                        receivedQty: { increment: item.quantityReceived },
                    },
                });

                // d. Update Product.purchasePrice to latest cost
                await tx.product.update({
                    where: { id: poItem.productId },
                    data: { purchasePrice: poItem.unitCost },
                });

                // e. Create stock movement
                await tx.stockMovement.create({
                    data: {
                        productId: poItem.productId,
                        variantId: poItem.variantId,
                        inventoryItemId: inventoryItem.id,
                        movementType: MOVEMENT_TYPES.PURCHASE,
                        quantity: item.quantityReceived, // Positive for inbound
                        toLocationId: defaultLocation?.id ?? null,
                        referenceType: 'goods_received_note',
                        referenceId: grn.id,
                        notes: `Received against PO ${po.poNumber}`,
                        createdBy: userId,
                    },
                });
            }

            // 6. Update PO status
            const updatedPO = await tx.purchaseOrder.findUnique({
                where: { id: data.purchaseOrderId },
                include: { items: true },
            });

            // Check if all items are fully received
            const allReceived = updatedPO!.items.every(
                (item) => item.receivedQty >= item.orderedQty
            );

            const anyReceived = updatedPO!.items.some((item) => item.receivedQty > 0);

            let newStatus = po.status;
            if (allReceived) {
                newStatus = 'received';
            } else if (anyReceived) {
                newStatus = 'partial';
            }

            if (newStatus !== po.status) {
                await tx.purchaseOrder.update({
                    where: { id: data.purchaseOrderId },
                    data: { status: newStatus },
                });
            }

            // 7. Return complete GRN
            return tx.goodsReceivedNote.findUnique({
                where: { id: grn.id },
                include: {
                    items: {
                        include: {
                            inventoryItem: true,
                        },
                    },
                    purchaseOrder: {
                        select: {
                            poNumber: true,
                            status: true,
                            supplier: { select: { name: true } },
                        },
                    },
                    receivedByUser: { select: { id: true, email: true, firstName: true } },
                },
            });
        });
    }

    /**
     * Get GRN by ID
     */
    async getGRN(grnId: string) {
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { id: grnId },
            include: {
                items: {
                    include: {
                        purchaseOrderItem: true,
                        inventoryItem: true,
                    },
                },
                purchaseOrder: {
                    include: {
                        supplier: true,
                    },
                },
                receivedByUser: { select: { id: true, email: true, firstName: true } },
            },
        });

        if (!grn) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'GRN not found', 404);
        }

        return grn;
    }

    /**
     * List GRNs for a purchase order
     */
    async listGRNsForPO(purchaseOrderId: string) {
        return prisma.goodsReceivedNote.findMany({
            where: { purchaseOrderId },
            include: {
                items: true,
                receivedByUser: { select: { id: true, email: true, firstName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get GRN by number
     */
    async getGRNByNumber(grnNumber: string) {
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { grnNumber },
            include: {
                items: {
                    include: {
                        purchaseOrderItem: true,
                        inventoryItem: true,
                    },
                },
                purchaseOrder: {
                    include: {
                        supplier: true,
                    },
                },
                receivedByUser: { select: { id: true, email: true, firstName: true } },
            },
        });

        if (!grn) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'GRN not found', 404);
        }

        return grn;
    }
}

export const grnService = new GRNService();

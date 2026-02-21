import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { MOVEMENT_TYPES, INVENTORY_STATUS } from '../config/constants';
import {
    CreateLocationInput,
    UpdateLocationInput,
    AdjustStockInput,
    RecordDamageInput,
    InventoryQuery,
    MovementQuery,
} from '../validators/inventory.validator';
import { Prisma } from '@prisma/client';

export class InventoryService {
    /**
     * Get inventory overview stats
     */
    async getOverview() {
        const [
            totalProducts,
            itemsWithStock,
            lowStockItems,
            expiringItems,
            recentMovements,
        ] = await Promise.all([
            // 1. Total unique products
            prisma.product.count({ where: { isActive: true } }),

            // 2. All items for value calculation
            prisma.inventoryItem.findMany({
                where: { quantity: { gt: 0 } },
                include: {
                    product: { select: { purchasePrice: true } },
                    variant: { select: { purchasePrice: true } },
                },
            }),

            // 3. Low stock items
            prisma.inventoryItem.findMany({
                where: {
                    status: { not: INVENTORY_STATUS.EXPIRED },
                    product: {
                        isActive: true,
                    },
                    // We need to filter this in memory or raw query because reorderLevel is on Product
                },
                include: {
                    product: { select: { id: true, name: true, sku: true, reorderLevel: true } },
                    variant: { select: { name: true, sku: true } },
                },
            }),

            // 4. Expiring in 7 days
            this.getExpiringItems(7),

            // 5. Recent movements
            prisma.stockMovement.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: { name: true, sku: true } },
                    createdByUser: { select: { firstName: true, lastName: true } },
                },
            }),
        ]);

        // Calculate total value
        const totalValue = itemsWithStock.reduce((acc: number, item: any) => {
            const price = item.variant?.purchasePrice ?? item.product.purchasePrice;
            return acc + (Number(price) * item.quantity);
        }, 0);

        // Filter low stock items (where available <= reorderLevel)
        // Note: This is an in-memory filter. For production with huge data, use raw SQL or computed columns.
        const actualLowStockItems = lowStockItems.filter((item: any) => {
            return item.availableQuantity <= item.product.reorderLevel;
        });

        return {
            totalProducts,
            totalValue,
            lowStockItems: actualLowStockItems.slice(0, 5), // Top 5 for dashboard
            expiringItems: expiringItems.slice(0, 5),      // Top 5 for dashboard
            recentMovements,
        };
    }

    /**
     * Get all inventory items with pagination and filters
     */
    async findAll(query: InventoryQuery) {
        const { skip, take, page, pageSize } = parsePagination(query);

        const where: any = {};

        if (query.productId) {
            where.productId = query.productId;
        }

        if (query.locationId) {
            where.locationId = query.locationId;
        }

        if (query.status) {
            where.status = query.status;
        }

        // Expiring in X days
        if (query.expiringInDays) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + query.expiringInDays);
            where.expiryDate = {
                gte: new Date(),
                lte: futureDate,
            };
        }

        const [items, total] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                skip,
                take,
                include: {
                    product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
                    location: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.inventoryItem.count({ where }),
        ]);

        return {
            items,
            pagination: { page, pageSize, totalRecords: total },
        };
    }

    /**
     * Get inventory item by ID
     */
    async findById(id: string) {
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            include: {
                product: true,
                location: true,
                stockMovements: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { createdByUser: { select: { id: true, email: true, firstName: true } } },
                },
            },
        });

        if (!item) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Inventory item not found', 404);
        }

        return item;
    }

    /**
     * Adjust stock for an inventory item
     */
    async adjustStock(id: string, data: AdjustStockInput, userId: string) {
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            include: { product: true },
        });

        if (!item) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Inventory item not found', 404);
        }

        // Calculate new quantities based on movement type
        let newQuantity = item.quantity;
        let newAvailableQuantity = item.availableQuantity;

        switch (data.movementType) {
            case MOVEMENT_TYPES.PURCHASE:
            case MOVEMENT_TYPES.RETURN:
                newQuantity += data.quantity;
                newAvailableQuantity += data.quantity;
                break;
            case MOVEMENT_TYPES.SALE:
                if (data.quantity > item.availableQuantity) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        'Insufficient stock available',
                        400
                    );
                }
                newQuantity -= data.quantity;
                newAvailableQuantity -= data.quantity;
                break;
            case MOVEMENT_TYPES.ADJUSTMENT:
                // Adjustment can be positive or negative
                newQuantity += data.quantity;
                newAvailableQuantity += data.quantity;
                break;
            case MOVEMENT_TYPES.DAMAGE:
            case MOVEMENT_TYPES.EXPIRY:
                if (data.quantity > item.quantity) {
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        'Cannot mark more items as damaged/expired than available',
                        400
                    );
                }
                newQuantity -= data.quantity;
                newAvailableQuantity -= data.quantity;
                break;
        }

        // Ensure quantities don't go negative
        if (newQuantity < 0 || newAvailableQuantity < 0) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Stock adjustment would result in negative quantity',
                400
            );
        }

        // Update inventory item and create movement record
        const [updatedItem] = await prisma.$transaction([
            prisma.inventoryItem.update({
                where: { id },
                data: {
                    quantity: newQuantity,
                    availableQuantity: newAvailableQuantity,
                    damagedQuantity:
                        data.movementType === MOVEMENT_TYPES.DAMAGE
                            ? item.damagedQuantity + data.quantity
                            : item.damagedQuantity,
                    status:
                        newAvailableQuantity === 0
                            ? INVENTORY_STATUS.EXPIRED
                            : data.movementType === MOVEMENT_TYPES.DAMAGE
                                ? INVENTORY_STATUS.DAMAGED
                                : item.status,
                },
                include: { product: true, location: true },
            }),
            prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    inventoryItemId: id,
                    movementType: data.movementType,
                    quantity: data.quantity,
                    notes: data.notes,
                    createdBy: userId,
                },
            }),
        ]);

        return updatedItem;
    }

    /**
     * Record damaged stock
     */
    async recordDamage(data: RecordDamageInput, userId: string) {
        // If inventoryItemId provided, use that item
        if (data.inventoryItemId) {
            const item = await prisma.inventoryItem.findUnique({
                where: { id: data.inventoryItemId },
            });

            if (!item || item.productId !== data.productId) {
                throw new AppError(
                    ErrorCodes.NOT_FOUND,
                    'Inventory item not found or product mismatch',
                    404
                );
            }

            return this.adjustStock(
                data.inventoryItemId,
                {
                    quantity: data.quantity,
                    movementType: MOVEMENT_TYPES.DAMAGE,
                    notes: data.reason,
                },
                userId
            );
        }

        // Otherwise, create a damaged stock record
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        const damagedStock = await prisma.damagedStock.create({
            data: {
                productId: data.productId,
                quantity: data.quantity,
                reason: data.reason,
                imageUrl: data.imageUrl,
                notes: data.notes,
                createdBy: userId,
            },
        });

        // Create stock movement
        await prisma.stockMovement.create({
            data: {
                productId: data.productId,
                movementType: MOVEMENT_TYPES.DAMAGE,
                quantity: -data.quantity,
                notes: `Damaged: ${data.reason}`,
                createdBy: userId,
            },
        });

        return damagedStock;
    }

    /**
     * Get stock movements with filters
     */
    async getMovements(query: MovementQuery) {
        const { skip, take, page, pageSize } = parsePagination(query);

        const where: any = {};

        if (query.productId) {
            where.productId = query.productId;
        }

        if (query.movementType) {
            where.movementType = query.movementType;
        }

        if (query.fromDate || query.toDate) {
            where.createdAt = {};
            if (query.fromDate) {
                where.createdAt.gte = new Date(query.fromDate);
            }
            if (query.toDate) {
                where.createdAt.lte = new Date(query.toDate);
            }
        }

        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                skip,
                take,
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                    createdByUser: { select: { id: true, email: true, firstName: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.stockMovement.count({ where }),
        ]);

        return {
            movements,
            pagination: { page, pageSize, totalRecords: total },
        };
    }

    /**
     * Get expiring items (within specified days)
     */
    async getExpiringItems(days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const items = await prisma.inventoryItem.findMany({
            where: {
                expiryDate: {
                    gte: new Date(),
                    lte: futureDate,
                },
                quantity: { gt: 0 },
            },
            include: {
                product: { select: { id: true, name: true, sku: true } },
                location: { select: { id: true, name: true } },
            },
            orderBy: { expiryDate: 'asc' },
        });

        return items;
    }

    /**
     * Get expired items
     */
    async getExpiredItems() {
        const items = await prisma.inventoryItem.findMany({
            where: {
                expiryDate: { lt: new Date() },
                quantity: { gt: 0 },
            },
            include: {
                product: { select: { id: true, name: true, sku: true } },
                location: { select: { id: true, name: true } },
            },
            orderBy: { expiryDate: 'asc' },
        });

        return items;
    }

    // ==================== LOCATION METHODS ====================

    /**
     * Get all locations
     */
    async getLocations() {
        const locations = await prisma.inventoryLocation.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return locations;
    }

    /**
     * Create location
     */
    async createLocation(data: CreateLocationInput) {
        const location = await prisma.inventoryLocation.create({
            data,
        });

        return location;
    }

    /**
     * Update location
     */
    async updateLocation(id: string, data: UpdateLocationInput) {
        const location = await prisma.inventoryLocation.findUnique({
            where: { id },
        });

        if (!location) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Location not found', 404);
        }

        const updated = await prisma.inventoryLocation.update({
            where: { id },
            data,
        });

        return updated;
    }

    /**
     * Delete location
     */
    async deleteLocation(id: string) {
        const location = await prisma.inventoryLocation.findUnique({
            where: { id },
            include: { inventoryItems: true },
        });

        if (!location) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Location not found', 404);
        }

        if (location.inventoryItems.length > 0) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Cannot delete location with inventory items',
                400
            );
        }

        await prisma.inventoryLocation.delete({
            where: { id },
        });

        return { message: 'Location deleted successfully' };
    }

    /**
     * Add inventory item (initial stock)
     */
    async addInventoryItem(data: {
        productId: string;
        variantId?: string;
        locationId?: string;
        quantity: number;
        batchNumber?: string;
        expiryDate?: Date;
        manufacturingDate?: Date;
    }, userId: string) {
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        // INVENTORY SPLIT RULE: If product has variants, inventory must go to variants
        if (product.hasVariants && !data.variantId) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Cannot add inventory to parent product with variants. Add inventory to specific variant instead.',
                400
            );
        }

        // Verify variant belongs to product if provided
        if (data.variantId) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: data.variantId },
            });
            if (!variant || variant.productId !== data.productId) {
                throw new AppError(
                    ErrorCodes.NOT_FOUND,
                    'Variant not found or does not belong to this product',
                    404
                );
            }
        }

        if (data.locationId) {
            const location = await prisma.inventoryLocation.findUnique({
                where: { id: data.locationId },
            });
            if (!location) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Location not found', 404);
            }
        }

        const item = await prisma.inventoryItem.create({
            data: {
                productId: data.productId,
                variantId: data.variantId,
                locationId: data.locationId,
                quantity: data.quantity,
                availableQuantity: data.quantity,
                batchNumber: data.batchNumber,
                expiryDate: data.expiryDate,
                manufacturingDate: data.manufacturingDate,
                status: INVENTORY_STATUS.AVAILABLE,
            },
            include: { product: true, variant: true, location: true },
        });

        // Create stock movement
        await prisma.stockMovement.create({
            data: {
                productId: data.productId,
                variantId: data.variantId,
                inventoryItemId: item.id,
                movementType: MOVEMENT_TYPES.PURCHASE,
                quantity: data.quantity,
                toLocationId: data.locationId,
                notes: 'Initial stock entry',
                createdBy: userId,
            },
        });

        return item;
    }
}

export const inventoryService = new InventoryService();

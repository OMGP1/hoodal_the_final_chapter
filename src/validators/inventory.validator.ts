import { z } from 'zod';
import { MOVEMENT_TYPES, INVENTORY_STATUS } from '../config/constants';

export const createLocationSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const updateLocationSchema = createLocationSchema.partial();

export const locationIdParamSchema = z.object({
    id: z.string().uuid('Invalid location ID'),
});

export const inventoryItemIdParamSchema = z.object({
    id: z.string().uuid('Invalid inventory item ID'),
});

export const adjustStockSchema = z.object({
    quantity: z.number().int(),
    movementType: z.enum([
        MOVEMENT_TYPES.PURCHASE,
        MOVEMENT_TYPES.SALE,
        MOVEMENT_TYPES.RETURN,
        MOVEMENT_TYPES.ADJUSTMENT,
        MOVEMENT_TYPES.DAMAGE,
        MOVEMENT_TYPES.EXPIRY,
        MOVEMENT_TYPES.TRANSFER,
    ]),
    notes: z.string().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    locationId: z.string().uuid().optional(),
});

export const recordDamageSchema = z.object({
    productId: z.string().uuid(),
    inventoryItemId: z.string().uuid().optional(),
    quantity: z.number().int().min(1),
    reason: z.string().min(1),
    imageUrl: z.string().url().optional(),
    notes: z.string().optional(),
});

export const inventoryQuerySchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    productId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    status: z.enum([
        INVENTORY_STATUS.AVAILABLE,
        INVENTORY_STATUS.RESERVED,
        INVENTORY_STATUS.DAMAGED,
        INVENTORY_STATUS.EXPIRED,
    ]).optional(),
    expiringInDays: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export const movementQuerySchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    productId: z.string().uuid().optional(),
    movementType: z.string().optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
});

// Type exports
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type RecordDamageInput = z.infer<typeof recordDamageSchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type MovementQuery = z.infer<typeof movementQuerySchema>;

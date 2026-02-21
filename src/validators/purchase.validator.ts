import { z } from 'zod';

// ==================== PURCHASE ORDER VALIDATORS ====================

const purchaseOrderItemSchema = z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    orderedQty: z.number().int().positive(),
    unitCost: z.number().positive(),
    taxRate: z.number().min(0).max(100).optional(),
});

export const createPurchaseOrderSchema = z.object({
    supplierId: z.string().uuid(),
    expectedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderSchema = z.object({
    expectedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    items: z.array(purchaseOrderItemSchema).optional(),
});

// ==================== GRN VALIDATORS ====================

const grnItemSchema = z.object({
    purchaseOrderItemId: z.string().uuid(),
    quantityReceived: z.number().int().positive(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    manufacturingDate: z.string().datetime().optional(),
});

export const receiveGoodsSchema = z.object({
    items: z.array(grnItemSchema).min(1, 'At least one item is required'),
    notes: z.string().optional(),
});

// Type exports
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type ReceiveGoodsInput = z.infer<typeof receiveGoodsSchema>;

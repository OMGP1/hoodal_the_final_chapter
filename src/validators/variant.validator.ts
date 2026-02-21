import { z } from 'zod';

// Variant attribute (e.g., { name: "Size", value: "M" })
export const variantAttributeSchema = z.object({
    name: z.string().min(1).max(50),
    value: z.string().min(1).max(100),
});

// Create variant input
export const createVariantSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    sku: z.string().min(1).max(100),
    name: z.string().min(1).max(255),
    barcode: z.string().max(100).optional().nullable(),
    purchasePrice: z.number().min(0).optional().nullable(),
    sellingPrice: z.number().min(0).optional().nullable(),
    mrp: z.number().min(0).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().default(true),
    attributes: z.array(variantAttributeSchema).optional().default([]),
});

// Update variant (productId cannot be changed)
export const updateVariantSchema = createVariantSchema.partial().omit({ productId: true });

// ID params
export const variantIdParamSchema = z.object({
    id: z.string().uuid('Invalid variant ID'),
});

export const productIdParamSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
});

// Bulk create variants
export const bulkCreateVariantsSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    variants: z.array(createVariantSchema.omit({ productId: true })).min(1).max(100),
});

// Type exports
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type VariantAttribute = z.infer<typeof variantAttributeSchema>;
export type BulkCreateVariantsInput = z.infer<typeof bulkCreateVariantsSchema>;

import { z } from 'zod';

export const createProductSchema = z.object({
    sku: z.string().min(1).max(100),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    barcode: z.string().max(100).optional().nullable(),
    unitOfMeasure: z.enum(['kg', 'liter', 'piece', 'box', 'dozen', 'gram', 'ml']).default('piece'),
    purchasePrice: z.number().min(0).default(0),
    sellingPrice: z.number().min(0).default(0),
    mrp: z.number().min(0).optional().nullable(),
    taxRate: z.number().min(0).max(100).default(0),
    reorderLevel: z.number().int().min(0).default(0),
    maxStockLevel: z.number().int().min(0).optional().nullable(),
    isPerishable: z.boolean().default(false),
    shelfLifeDays: z.number().int().min(1).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().omit({ sku: true });

export const productIdParamSchema = z.object({
    id: z.string().uuid('Invalid product ID'),
});

export const productQuerySchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    q: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    isActive: z.string().optional().transform((val) => val === 'true'),
    isPerishable: z.string().optional().transform((val) => val === 'true'),
    lowStock: z.string().optional().transform((val) => val === 'true'),
    sortBy: z.enum(['name', 'sku', 'sellingPrice', 'createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Category schemas
export const createCategorySchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
    id: z.string().uuid('Invalid category ID'),
});

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

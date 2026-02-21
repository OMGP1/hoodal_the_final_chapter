import { z } from 'zod';
import { createProductSchema } from './product.validator';

// Single product import item (reuse existing product schema)
export const bulkProductItemSchema = createProductSchema;

// Bulk import request schema
export const bulkImportSchema = z.object({
    products: z.array(createProductSchema).min(1).max(500),
    options: z.object({
        skipDuplicates: z.boolean().default(false),
        updateExisting: z.boolean().default(false),
    }).optional().default({ skipDuplicates: false, updateExisting: false }),
});

// CSV import schema (for file upload)
export const csvImportSchema = z.object({
    skipHeader: z.boolean().default(true),
    columnMapping: z.record(z.string()).optional(),
});

// Type exports
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type CsvImportOptions = z.infer<typeof csvImportSchema>;

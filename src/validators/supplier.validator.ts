import { z } from 'zod';

// ==================== GSTIN VALIDATION ====================

/**
 * Indian GSTIN format: 2-digit state code + 10-char PAN + 1-digit entity + Z + 1 checksum
 * Example: 27AAPFU0939F1ZV (Maharashtra)
 */
const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/;

// PAN format: 5 letters + 4 digits + 1 letter
const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;

// ==================== SUPPLIER VALIDATORS ====================

export const createSupplierSchema = z.object({
    name: z.string().min(1, 'Supplier name is required').max(200),
    contactName: z.string().max(200).optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    gstNumber: z
        .string()
        .regex(gstinRegex, 'Invalid GSTIN format (e.g., 27AAPFU0939F1ZV)')
        .optional()
        .or(z.literal('')),
    panNumber: z
        .string()
        .regex(panRegex, 'Invalid PAN format (e.g., ABCDE1234F)')
        .optional()
        .or(z.literal('')),
    notes: z.string().max(1000).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// Type exports
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

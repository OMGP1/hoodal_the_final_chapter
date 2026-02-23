import { z } from 'zod';

// ==================== CUSTOMER VALIDATORS ====================

export const createCustomerSchema = z.object({
    name: z.string().min(1, 'Customer name is required').max(200),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    creditLimit: z.number().min(0, 'Credit limit cannot be negative').optional(),
    notes: z.string().max(1000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const adjustBalanceSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['credit', 'payment'], {
        errorMap: () => ({ message: "Type must be 'credit' (add to balance) or 'payment' (deduct from balance)" }),
    }),
    notes: z.string().max(500).optional(),
});

// Type exports
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;

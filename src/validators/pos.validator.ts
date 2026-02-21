import { z } from 'zod';

// Cart item for POS
export const cartItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid('Invalid variant ID').optional().nullable(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0).optional(), // Optional override
    discount: z.number().min(0).default(0),
});

// Payment input
export const paymentSchema = z.object({
    method: z.enum(['cash', 'card', 'upi', 'credit']),
    amount: z.number().min(0.01, 'Payment amount must be positive'),
    transactionId: z.string().optional(), // For card/UPI
    receivedAmount: z.number().min(0).optional(), // For cash (customer gives)
});

// Checkout input
export const checkoutSchema = z.object({
    items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
    customerId: z.string().uuid().optional().nullable(),
    payments: z.array(paymentSchema).min(1, 'At least one payment required'),
    discountAmount: z.number().min(0).default(0),
    discountPercent: z.number().min(0).max(100).default(0),
    notes: z.string().optional(),
    registerSessionId: z.string().uuid().optional(),
});

// Validate cart input (pre-checkout)
export const validateCartSchema = z.object({
    items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
});

// Hold cart input
export const holdCartSchema = z.object({
    items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
    customerId: z.string().uuid().optional().nullable(),
    notes: z.string().optional(),
});

// Return item
export const returnItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid('Invalid variant ID').optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    reason: z.string().optional(),
});

// Process return input
export const processReturnSchema = z.object({
    originalOrderId: z.string().uuid('Invalid order ID'),
    items: z.array(returnItemSchema).min(1, 'At least one item required'),
    refundMethod: z.enum(['cash', 'card', 'upi', 'credit', 'store_credit']),
    reason: z.string().optional(),
    notes: z.string().optional(),
    registerSessionId: z.string().uuid().optional(),
});

// Register session input
export const openRegisterSchema = z.object({
    registerName: z.string().default('Main'),
    openingCash: z.number().min(0),
    notes: z.string().optional(),
});

export const closeRegisterSchema = z.object({
    closingCash: z.number().min(0),
    notes: z.string().optional(),
});

// Type exports
export type CartItem = z.infer<typeof cartItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type HoldCartInput = z.infer<typeof holdCartSchema>;
export type ProcessReturnInput = z.infer<typeof processReturnSchema>;
export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;
export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;

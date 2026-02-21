import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { MOVEMENT_TYPES, PAYMENT_METHODS } from '../config/constants';
import { CheckoutInput, CartItem, PaymentInput } from '../validators/pos.validator';
import { Decimal } from '@prisma/client/runtime/library';

// Order number format: ORD-YYYYMMDD-XXXX
function generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
}

interface ItemWithPrice extends CartItem {
    calculatedPrice: number;
    taxRate: number;
    taxAmount: number;
    totalPrice: number;
    productName: string;
}

export class OrderService {
    /**
     * Validate cart items - check stock availability
     * Returns validated items with current prices
     */
    async validateCart(items: CartItem[]) {
        const validatedItems: ItemWithPrice[] = [];
        const errors: Array<{ productId: string; variantId?: string; error: string }> = [];

        for (const item of items) {
            try {
                // Get product/variant details
                const { product, variant, availableQuantity, price, taxRate } =
                    await this.getItemDetails(item.productId, item.variantId);

                if (availableQuantity < item.quantity) {
                    errors.push({
                        productId: item.productId,
                        variantId: item.variantId ?? undefined,
                        error: `Insufficient stock. Available: ${availableQuantity}, Requested: ${item.quantity}`,
                    });
                    continue;
                }

                const unitPrice = item.unitPrice ?? price;
                const discountedPrice = unitPrice - (item.discount || 0);
                const taxAmount = (discountedPrice * item.quantity * Number(taxRate)) / 100;
                const totalPrice = discountedPrice * item.quantity + taxAmount;

                validatedItems.push({
                    ...item,
                    calculatedPrice: unitPrice,
                    taxRate: Number(taxRate),
                    taxAmount,
                    totalPrice,
                    productName: variant?.name ? `${product.name} - ${variant.name}` : product.name,
                });
            } catch (error) {
                errors.push({
                    productId: item.productId,
                    variantId: item.variantId ?? undefined,
                    error: (error as Error).message,
                });
            }
        }

        const subtotal = validatedItems.reduce((sum, item) => sum + item.calculatedPrice * item.quantity, 0);
        const totalTax = validatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        return {
            valid: errors.length === 0,
            items: validatedItems,
            errors,
            summary: {
                subtotal,
                totalTax,
                total,
                itemCount: validatedItems.length,
            },
        };
    }

    /**
     * Create order with atomic transaction
     * All-or-nothing: if any step fails, entire transaction rolls back
     */
    async createOrder(data: CheckoutInput, userId: string) {
        const orderNumber = generateOrderNumber();

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Validate all items and calculate totals
            let subtotal = new Decimal(0);
            let totalTax = new Decimal(0);
            const orderItems: Array<{
                productId: string;
                variantId: string | null;
                quantity: number;
                unitPrice: Decimal;
                taxRate: Decimal;
                taxAmount: Decimal;
                discount: Decimal;
                totalPrice: Decimal;
                batchDeductions: Array<{ inventoryItemId: string; batchNumber: string | null; quantity: number }>;
            }> = [];

            // 2. Process each cart item - validate and prepare
            for (const item of data.items) {
                const { product, variant, price, taxRate } =
                    await this.getItemDetails(item.productId, item.variantId);

                // Find ALL available inventory batches (FIFO by expiry date)
                const inventoryWhere = item.variantId
                    ? { variantId: item.variantId, status: 'available', availableQuantity: { gt: 0 } }
                    : { productId: item.productId, variantId: null, status: 'available', availableQuantity: { gt: 0 } };

                const inventoryBatches = await tx.inventoryItem.findMany({
                    where: inventoryWhere,
                    orderBy: [
                        { expiryDate: 'asc' },  // FIFO: earliest expiry first
                        { createdAt: 'asc' },   // Then by oldest received
                    ],
                });

                // Calculate total available across all batches
                const totalAvailable = inventoryBatches.reduce(
                    (sum: number, batch: { availableQuantity: number }) => sum + batch.availableQuantity, 0
                );

                if (totalAvailable < item.quantity) {
                    const itemName = variant?.name ? `${product.name} - ${variant.name}` : product.name;
                    throw new AppError(
                        ErrorCodes.BUSINESS_ERROR,
                        `Insufficient stock for "${itemName}". Available: ${totalAvailable}, Requested: ${item.quantity}`,
                        400
                    );
                }

                // Deduct from batches in FIFO order (batch splitting)
                let remainingToDeduct = item.quantity;
                const batchDeductions: Array<{ inventoryItemId: string; batchNumber: string | null; quantity: number }> = [];

                for (const batch of inventoryBatches) {
                    if (remainingToDeduct <= 0) break;

                    const deductFromBatch = Math.min(batch.availableQuantity, remainingToDeduct);

                    // Atomic decrement this batch
                    const updatedBatch = await tx.inventoryItem.update({
                        where: { id: batch.id },
                        data: {
                            availableQuantity: { decrement: deductFromBatch },
                            quantity: { decrement: deductFromBatch },
                        },
                    });

                    // Race condition check
                    if (updatedBatch.availableQuantity < 0 || updatedBatch.quantity < 0) {
                        throw new AppError(
                            ErrorCodes.BUSINESS_ERROR,
                            `Stock depleted during checkout. Please try again.`,
                            409
                        );
                    }

                    batchDeductions.push({
                        inventoryItemId: batch.id,
                        batchNumber: batch.batchNumber,
                        quantity: deductFromBatch,
                    });

                    remainingToDeduct -= deductFromBatch;
                }

                // Store batch deductions for StockMovement creation later
                const unitPrice = new Decimal(item.unitPrice ?? price);
                const discount = new Decimal(item.discount ?? 0);
                const itemTaxRate = new Decimal(taxRate);
                const discountedPrice = unitPrice.minus(discount);
                const taxAmount = discountedPrice.times(item.quantity).times(itemTaxRate).dividedBy(100);
                const totalPrice = discountedPrice.times(item.quantity).plus(taxAmount);

                subtotal = subtotal.plus(unitPrice.times(item.quantity));
                totalTax = totalTax.plus(taxAmount);

                orderItems.push({
                    productId: item.productId,
                    variantId: item.variantId ?? null,
                    quantity: item.quantity,
                    unitPrice,
                    taxRate: itemTaxRate,
                    taxAmount,
                    discount,
                    totalPrice,
                    batchDeductions, // Now tracking multiple batches
                });
            }


            // Apply order-level discounts
            let discountAmount = new Decimal(data.discountAmount ?? 0);
            if (data.discountPercent && data.discountPercent > 0) {
                discountAmount = discountAmount.plus(subtotal.times(data.discountPercent).dividedBy(100));
            }

            const grandTotal = subtotal.plus(totalTax).minus(discountAmount);

            // 3. Validate payments cover total
            const totalPayment = data.payments.reduce((sum, p) => sum + p.amount, 0);
            if (totalPayment < Number(grandTotal)) {
                throw new AppError(
                    ErrorCodes.BUSINESS_ERROR,
                    `Payment insufficient. Required: ${grandTotal.toFixed(2)}, Received: ${totalPayment.toFixed(2)}`,
                    400
                );
            }

            // 4. Create the order
            const order = await tx.salesOrder.create({
                data: {
                    orderNumber,
                    customerId: data.customerId,
                    orderDate: new Date(),
                    subtotal,
                    taxAmount: totalTax,
                    discountAmount,
                    totalAmount: grandTotal,
                    orderStatus: 'completed',
                    paymentStatus: 'paid',
                    notes: data.notes,
                    createdBy: userId,
                },
            });

            // 5. Create order items and stock movements
            for (const item of orderItems) {
                await tx.salesOrderItem.create({
                    data: {
                        salesOrderId: order.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        taxAmount: item.taxAmount,
                        discount: item.discount,
                        totalPrice: item.totalPrice,
                    },
                });

                // Create stock movement records - one per batch for traceability
                for (const batch of item.batchDeductions) {
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            variantId: item.variantId,
                            inventoryItemId: batch.inventoryItemId,
                            movementType: MOVEMENT_TYPES.SALE,
                            quantity: -batch.quantity,
                            referenceType: 'sales_order',
                            referenceId: order.id,
                            notes: batch.batchNumber ? `Batch: ${batch.batchNumber}` : undefined,
                            createdBy: userId,
                        },
                    });
                }
            }

            // 6. Create payment records
            for (const payment of data.payments) {
                await tx.payment.create({
                    data: {
                        salesOrderId: order.id,
                        amount: new Decimal(payment.amount),
                        paymentMethod: payment.method,
                        transactionId: payment.transactionId,
                        status: 'completed',
                    },
                });

                // Handle credit payment - update customer balance
                if (payment.method === 'credit' && data.customerId) {
                    const customer = await tx.customer.findUnique({
                        where: { id: data.customerId },
                    });

                    if (!customer) {
                        throw new AppError(ErrorCodes.NOT_FOUND, 'Customer not found for credit payment', 400);
                    }

                    // Check credit limit
                    const newBalance = customer.currentBalance.plus(new Decimal(payment.amount));
                    if (newBalance.greaterThan(customer.creditLimit) && customer.creditLimit.greaterThan(0)) {
                        throw new AppError(
                            ErrorCodes.BUSINESS_ERROR,
                            `Credit limit exceeded. Limit: ${customer.creditLimit}, Current: ${customer.currentBalance}, Requested: ${payment.amount}`,
                            400
                        );
                    }

                    await tx.customer.update({
                        where: { id: data.customerId },
                        data: { currentBalance: { increment: payment.amount } },
                    });
                }
            }

            // 7. Update register session if provided
            if (data.registerSessionId) {
                const paymentTotals = this.calculatePaymentTotals(data.payments);
                await tx.registerSession.update({
                    where: { id: data.registerSessionId },
                    data: {
                        totalSales: { increment: Number(grandTotal) },
                        cashSales: { increment: paymentTotals.cash },
                        cardSales: { increment: paymentTotals.card },
                        upiSales: { increment: paymentTotals.upi },
                        creditSales: { increment: paymentTotals.credit },
                        transactionCount: { increment: 1 },
                    },
                });
            }

            // Return order with items
            return tx.salesOrder.findUnique({
                where: { id: order.id },
                include: {
                    items: true,
                    payments: true,
                    customer: { select: { id: true, name: true, phone: true } },
                },
            });
        });
    }

    /**
     * Get order by ID
     */
    async getOrderById(id: string) {
        const order = await prisma.salesOrder.findUnique({
            where: { id },
            include: {
                items: true,
                payments: true,
                customer: true,
            },
        });

        if (!order) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Order not found', 404);
        }

        return order;
    }

    /**
     * Get order by order number
     */
    async getOrderByNumber(orderNumber: string) {
        const order = await prisma.salesOrder.findUnique({
            where: { orderNumber },
            include: {
                items: true,
                payments: true,
                customer: true,
            },
        });

        if (!order) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Order not found', 404);
        }

        return order;
    }

    // Helper: Get product/variant details with available quantity
    private async getItemDetails(productId: string, variantId?: string | null) {
        if (variantId) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: variantId },
                include: {
                    product: true,
                    inventoryItems: {
                        where: { status: 'available' },
                        select: { availableQuantity: true },
                    },
                },
            });

            if (!variant || variant.productId !== productId) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Variant not found', 404);
            }

            const availableQuantity = variant.inventoryItems.reduce(
                (sum: number, item: { availableQuantity: number }) => sum + item.availableQuantity, 0
            );

            return {
                product: variant.product,
                variant,
                availableQuantity,
                price: Number(variant.sellingPrice ?? variant.product.sellingPrice),
                taxRate: variant.product.taxRate,
            };
        }

        // No variant - get product directly
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                inventoryItems: {
                    where: { status: 'available', variantId: null },
                    select: { availableQuantity: true },
                },
            },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        // Check if product has variants (shouldn't be sold directly)
        if (product.hasVariants) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'This product has variants. Please select a specific variant.',
                400
            );
        }

        const availableQuantity = product.inventoryItems.reduce(
            (sum: number, item: { availableQuantity: number }) => sum + item.availableQuantity, 0
        );

        return {
            product,
            variant: null,
            availableQuantity,
            price: Number(product.sellingPrice),
            taxRate: product.taxRate,
        };
    }

    // Helper: Calculate payment totals by method
    private calculatePaymentTotals(payments: PaymentInput[]) {
        return payments.reduce(
            (acc, p) => {
                acc[p.method] = (acc[p.method] || 0) + p.amount;
                return acc;
            },
            { cash: 0, card: 0, upi: 0, credit: 0 } as Record<string, number>
        );
    }
}

export const orderService = new OrderService();

import { prisma } from '../config/database';
import { Prisma, type HeldCart } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';
import { HoldCartInput, CartItem } from '../validators/pos.validator';

// Generate hold number: HOLD-001, HOLD-002, etc.
async function generateHoldNumber(): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.heldCart.count({
        where: { createdAt: { gte: today } },
    });

    return `HOLD-${(count + 1).toString().padStart(3, '0')}`;
}

export class HoldCartService {
    /**
     * Hold (park) a cart for later retrieval
     * Does NOT reserve inventory - just saves the cart state
     */
    async holdCart(data: HoldCartInput, userId: string) {
        const holdNumber = await generateHoldNumber();

        // Calculate subtotal for display
        const subtotal = data.items.reduce((sum, item) => {
            const price = item.unitPrice ?? 0;
            return sum + (price - (item.discount ?? 0)) * item.quantity;
        }, 0);

        // Set expiry to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const heldCart = await prisma.heldCart.create({
            data: {
                holdNumber,
                customerId: data.customerId,
                items: data.items as Prisma.InputJsonValue,
                subtotal: new Decimal(subtotal),
                notes: data.notes,
                heldBy: userId,
                expiresAt,
            },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                heldByUser: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });

        return heldCart;
    }

    /**
     * Get all held carts for current user (or all if manager)
     */
    async getHeldCarts(userId: string, showAll: boolean = false) {
        // Clean up expired carts first
        await this.cleanupExpiredCarts();

        const where: Prisma.HeldCartWhereInput = {
            retrievedAt: null, // Not yet retrieved
        };

        if (!showAll) {
            where.heldBy = userId;
        }

        const carts = await prisma.heldCart.findMany({
            where,
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                heldByUser: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return carts.map(cart => ({
            ...cart,
            items: cart.items as unknown as CartItem[],
            itemCount: (cart.items as unknown as CartItem[]).length,
        }));
    }

    /**
     * Retrieve a held cart and mark it as retrieved
     */
    async retrieveCart(holdNumber: string, userId: string) {
        const cart = await prisma.heldCart.findUnique({
            where: { holdNumber },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
            },
        });

        if (!cart) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Held cart not found', 404);
        }

        if (cart.retrievedAt) {
            throw new AppError(ErrorCodes.BUSINESS_ERROR, 'Cart already retrieved', 400);
        }

        if (cart.expiresAt < new Date()) {
            throw new AppError(ErrorCodes.BUSINESS_ERROR, 'Cart has expired', 400);
        }

        // Mark as retrieved
        await prisma.heldCart.update({
            where: { id: cart.id },
            data: { retrievedAt: new Date() },
        });

        return {
            items: cart.items as unknown as CartItem[],
            customerId: cart.customerId,
            customer: cart.customer,
            notes: cart.notes,
            originalHoldNumber: cart.holdNumber,
        };
    }

    /**
     * Delete a held cart (cancel hold)
     */
    async deleteHeldCart(holdNumber: string, userId: string) {
        const cart = await prisma.heldCart.findUnique({
            where: { holdNumber },
        });

        if (!cart) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Held cart not found', 404);
        }

        // Only allow deletion by the user who held it or a manager
        // (Manager check should be done at controller/middleware level)
        if (cart.heldBy !== userId) {
            throw new AppError(ErrorCodes.AUTHORIZATION_ERROR, 'Cannot delete another user\'s held cart', 403);
        }

        await prisma.heldCart.delete({
            where: { id: cart.id },
        });

        return { deleted: true, holdNumber };
    }

    /**
     * Clean up expired carts (called automatically)
     */
    private async cleanupExpiredCarts() {
        await prisma.heldCart.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
                retrievedAt: null,
            },
        });
    }

    /**
     * Get held cart by hold number (for display)
     */
    async getByHoldNumber(holdNumber: string) {
        const cart = await prisma.heldCart.findUnique({
            where: { holdNumber },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                heldByUser: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });

        if (!cart) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Held cart not found', 404);
        }

        return {
            ...cart,
            items: cart.items as unknown as CartItem[],
            itemCount: (cart.items as unknown as CartItem[]).length,
        };
    }
}

export const holdCartService = new HoldCartService();

import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import {
    CreateVariantInput,
    UpdateVariantInput,
    VariantAttribute,
} from '../validators/variant.validator';

export class VariantService {
    /**
     * Get all variants for a product
     */
    async getVariantsByProduct(productId: string) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        const variants = await prisma.productVariant.findMany({
            where: { productId },
            include: {
                attributes: true,
                inventoryItems: {
                    select: {
                        quantity: true,
                        availableQuantity: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return variants.map((variant) => ({
            ...variant,
            totalQuantity: variant.inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
            availableQuantity: variant.inventoryItems.reduce((sum, item) => sum + item.availableQuantity, 0),
        }));
    }

    /**
     * Get variant by ID
     */
    async getVariantById(id: string) {
        const variant = await prisma.productVariant.findUnique({
            where: { id },
            include: {
                product: { select: { id: true, name: true, sku: true } },
                attributes: true,
                inventoryItems: {
                    include: { location: true },
                },
            },
        });

        if (!variant) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Variant not found', 404);
        }

        return {
            ...variant,
            totalQuantity: variant.inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
            availableQuantity: variant.inventoryItems.reduce((sum, item) => sum + item.availableQuantity, 0),
        };
    }

    /**
     * Get variant by SKU or barcode (for POS scanning)
     */
    async findBySkuOrBarcode(code: string) {
        const variant = await prisma.productVariant.findFirst({
            where: {
                OR: [
                    { sku: code },
                    { barcode: code },
                ],
                isActive: true,
            },
            include: {
                product: true,
                attributes: true,
                inventoryItems: {
                    where: { status: 'available' },
                    select: { availableQuantity: true },
                },
            },
        });

        if (!variant) {
            // Also check parent product SKU/barcode
            const product = await prisma.product.findFirst({
                where: {
                    OR: [
                        { sku: code },
                        { barcode: code },
                    ],
                    isActive: true,
                    hasVariants: false, // Only match products without variants
                },
                include: {
                    inventoryItems: {
                        where: { status: 'available' },
                        select: { availableQuantity: true },
                    },
                },
            });

            if (product) {
                return {
                    type: 'product' as const,
                    product,
                    availableQuantity: product.inventoryItems.reduce((sum, item) => sum + item.availableQuantity, 0),
                };
            }

            throw new AppError(ErrorCodes.NOT_FOUND, 'Product or variant not found', 404);
        }

        return {
            type: 'variant' as const,
            variant,
            product: variant.product,
            availableQuantity: variant.inventoryItems.reduce((sum, item) => sum + item.availableQuantity, 0),
        };
    }

    /**
     * Create a new variant
     */
    async createVariant(data: CreateVariantInput) {
        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        // Check SKU uniqueness
        const existingSku = await prisma.productVariant.findUnique({
            where: { sku: data.sku },
        });

        if (existingSku) {
            throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'SKU already exists', 409);
        }

        // Check barcode uniqueness if provided (across variants AND products)
        if (data.barcode) {
            const existingBarcode = await prisma.productVariant.findUnique({
                where: { barcode: data.barcode },
            });

            if (existingBarcode) {
                throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'Barcode already exists on another variant', 409);
            }

            // Also check Product table to prevent cross-table collision
            const productWithBarcode = await prisma.product.findFirst({
                where: { barcode: data.barcode },
            });

            if (productWithBarcode) {
                throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'Barcode already exists on a product', 409);
            }
        }

        const { attributes, ...variantData } = data;

        const variant = await prisma.$transaction(async (tx) => {
            // Create variant
            const newVariant = await tx.productVariant.create({
                data: {
                    ...variantData,
                    attributes: attributes && attributes.length > 0 ? {
                        createMany: {
                            data: attributes.map((attr: VariantAttribute) => ({
                                name: attr.name,
                                value: attr.value,
                            })),
                        },
                    } : undefined,
                },
                include: { attributes: true },
            });

            // Update product to mark as having variants
            if (!product.hasVariants) {
                await tx.product.update({
                    where: { id: data.productId },
                    data: { hasVariants: true },
                });
            }

            return newVariant;
        });

        return variant;
    }

    /**
     * Update variant
     */
    async updateVariant(id: string, data: UpdateVariantInput) {
        const existing = await prisma.productVariant.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Variant not found', 404);
        }

        // Check SKU uniqueness if changing
        if (data.sku && data.sku !== existing.sku) {
            const existingSku = await prisma.productVariant.findUnique({
                where: { sku: data.sku },
            });

            if (existingSku) {
                throw new AppError(ErrorCodes.DUPLICATE_ENTRY, 'SKU already exists', 409);
            }
        }

        const { attributes, ...variantData } = data;

        const variant = await prisma.$transaction(async (tx) => {
            // Update variant
            const updated = await tx.productVariant.update({
                where: { id },
                data: variantData,
                include: { attributes: true },
            });

            // Update attributes if provided
            if (attributes !== undefined) {
                // Delete existing attributes
                await tx.variantAttribute.deleteMany({
                    where: { variantId: id },
                });

                // Create new attributes
                if (attributes.length > 0) {
                    await tx.variantAttribute.createMany({
                        data: attributes.map((attr: VariantAttribute) => ({
                            variantId: id,
                            name: attr.name,
                            value: attr.value,
                        })),
                    });
                }
            }

            return tx.productVariant.findUnique({
                where: { id },
                include: { attributes: true },
            });
        });

        return variant;
    }

    /**
     * Delete variant (soft delete)
     */
    async deleteVariant(id: string) {
        const variant = await prisma.productVariant.findUnique({
            where: { id },
            include: { product: true },
        });

        if (!variant) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Variant not found', 404);
        }

        await prisma.$transaction(async (tx) => {
            await tx.productVariant.update({
                where: { id },
                data: { isActive: false },
            });

            // Check if product has any active variants left
            const activeVariants = await tx.productVariant.count({
                where: { productId: variant.productId, isActive: true },
            });

            if (activeVariants === 0) {
                await tx.product.update({
                    where: { id: variant.productId },
                    data: { hasVariants: false },
                });
            }
        });

        return { message: 'Variant deleted successfully' };
    }

    /**
     * Bulk create variants for a product
     */
    async bulkCreateVariants(
        productId: string,
        variants: Array<Omit<CreateVariantInput, 'productId'>>
    ) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        const results = {
            created: 0,
            errors: [] as Array<{ sku: string; error: string }>,
        };

        for (const variantData of variants) {
            try {
                await this.createVariant({ ...variantData, productId });
                results.created++;
            } catch (error) {
                results.errors.push({
                    sku: variantData.sku,
                    error: (error as Error).message,
                });
            }
        }

        return results;
    }
}

export const variantService = new VariantService();

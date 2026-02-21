import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import {
    CreateProductInput,
    UpdateProductInput,
    ProductQuery,
    CreateCategoryInput,
    UpdateCategoryInput,
} from '../validators/product.validator';
import { Prisma } from '@prisma/client';

export class ProductService {
    /**
     * Get all products with pagination and filters
     */
    async findAll(query: ProductQuery) {
        const { skip, take, page, pageSize } = parsePagination(query);

        const where: Prisma.ProductWhereInput = {};

        // Search by name, SKU, or barcode
        if (query.q) {
            where.OR = [
                { name: { contains: query.q, mode: 'insensitive' } },
                { sku: { contains: query.q, mode: 'insensitive' } },
                { barcode: { contains: query.q, mode: 'insensitive' } },
            ];
        }

        if (query.categoryId) {
            where.categoryId = query.categoryId;
        }

        if (query.isActive !== undefined) {
            where.isActive = query.isActive;
        }

        if (query.isPerishable !== undefined) {
            where.isPerishable = query.isPerishable;
        }

        // Low stock filter - products below reorder level
        if (query.lowStock) {
            where.inventoryItems = {
                some: {
                    availableQuantity: {
                        lte: prisma.product.fields.reorderLevel as unknown as number,
                    },
                },
            };
        }

        const orderBy: Prisma.ProductOrderByWithRelationInput = {};
        if (query.sortBy) {
            orderBy[query.sortBy as keyof Prisma.ProductOrderByWithRelationInput] = query.sortOrder || 'desc';
        } else {
            orderBy.createdAt = 'desc';
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                include: {
                    category: { select: { id: true, name: true } },
                    inventoryItems: {
                        select: {
                            quantity: true,
                            availableQuantity: true,
                        },
                    },
                },
                orderBy,
            }),
            prisma.product.count({ where }),
        ]);

        // Calculate total stock for each product
        const productsWithStock = products.map((product) => {
            const totalQuantity = product.inventoryItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            const availableQuantity = product.inventoryItems.reduce(
                (sum, item) => sum + item.availableQuantity,
                0
            );

            return {
                id: product.id,
                sku: product.sku,
                name: product.name,
                description: product.description,
                category: product.category,
                barcode: product.barcode,
                unitOfMeasure: product.unitOfMeasure,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                mrp: product.mrp,
                taxRate: product.taxRate,
                reorderLevel: product.reorderLevel,
                isPerishable: product.isPerishable,
                imageUrl: product.imageUrl,
                isActive: product.isActive,
                totalQuantity,
                availableQuantity,
                isLowStock: availableQuantity <= product.reorderLevel,
                createdAt: product.createdAt,
            };
        });

        return {
            products: productsWithStock,
            pagination: { page, pageSize, totalRecords: total },
        };
    }

    /**
     * Get product by ID
     */
    async findById(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                inventoryItems: {
                    include: { location: true },
                },
            },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        const totalQuantity = product.inventoryItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
        const availableQuantity = product.inventoryItems.reduce(
            (sum, item) => sum + item.availableQuantity,
            0
        );

        return {
            ...product,
            totalQuantity,
            availableQuantity,
            isLowStock: availableQuantity <= product.reorderLevel,
        };
    }

    /**
     * Create a new product
     */
    async create(data: CreateProductInput) {
        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
            where: { sku: data.sku },
        });

        if (existingProduct) {
            throw new AppError(
                ErrorCodes.DUPLICATE_ENTRY,
                'Product with this SKU already exists',
                409
            );
        }

        // Verify category exists if provided
        if (data.categoryId) {
            const category = await prisma.productCategory.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Category not found', 404);
            }
        }

        const product = await prisma.product.create({
            data: {
                sku: data.sku,
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                barcode: data.barcode,
                unitOfMeasure: data.unitOfMeasure,
                purchasePrice: data.purchasePrice,
                sellingPrice: data.sellingPrice,
                mrp: data.mrp,
                taxRate: data.taxRate,
                reorderLevel: data.reorderLevel,
                maxStockLevel: data.maxStockLevel,
                isPerishable: data.isPerishable,
                shelfLifeDays: data.shelfLifeDays,
                imageUrl: data.imageUrl,
                isActive: data.isActive,
            },
            include: { category: true },
        });

        return product;
    }

    /**
     * Update product
     */
    async update(id: string, data: UpdateProductInput) {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        // Verify category exists if updating
        if (data.categoryId) {
            const category = await prisma.productCategory.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Category not found', 404);
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data,
            include: { category: true },
        });

        return product;
    }

    /**
     * Delete product (soft delete)
     */
    async delete(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);
        }

        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Product deleted successfully' };
    }

    /**
     * Get low stock products
     */
    async getLowStockProducts() {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                category: { select: { id: true, name: true } },
                inventoryItems: {
                    select: { availableQuantity: true },
                },
            },
        });

        const lowStockProducts = products.filter((product) => {
            const totalAvailable = product.inventoryItems.reduce(
                (sum, item) => sum + item.availableQuantity,
                0
            );
            return totalAvailable <= product.reorderLevel;
        });

        return lowStockProducts.map((product) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            reorderLevel: product.reorderLevel,
            availableQuantity: product.inventoryItems.reduce(
                (sum, item) => sum + item.availableQuantity,
                0
            ),
        }));
    }

    // ==================== CATEGORY METHODS ====================

    /**
     * Get all categories (tree structure)
     */
    async getCategories() {
        const categories = await prisma.productCategory.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        children: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return categories;
    }

    /**
     * Create category
     */
    async createCategory(data: CreateCategoryInput) {
        if (data.parentId) {
            const parent = await prisma.productCategory.findUnique({
                where: { id: data.parentId },
            });
            if (!parent) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Parent category not found', 404);
            }
        }

        const category = await prisma.productCategory.create({
            data,
        });

        return category;
    }

    /**
     * Update category
     */
    async updateCategory(id: string, data: UpdateCategoryInput) {
        const category = await prisma.productCategory.findUnique({
            where: { id },
        });

        if (!category) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Category not found', 404);
        }

        // Prevent setting self as parent
        if (data.parentId === id) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Category cannot be its own parent',
                400
            );
        }

        const updated = await prisma.productCategory.update({
            where: { id },
            data,
        });

        return updated;
    }

    /**
     * Delete category
     */
    async deleteCategory(id: string) {
        const category = await prisma.productCategory.findUnique({
            where: { id },
            include: { products: true, children: true },
        });

        if (!category) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Category not found', 404);
        }

        if (category.products.length > 0) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Cannot delete category with products',
                400
            );
        }

        if (category.children.length > 0) {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Cannot delete category with subcategories',
                400
            );
        }

        await prisma.productCategory.delete({
            where: { id },
        });

        return { message: 'Category deleted successfully' };
    }

    // ==================== BULK IMPORT METHODS ====================

    /**
     * Bulk import products
     * @param products Array of product data
     * @param options Import options (skipDuplicates, updateExisting)
     */
    async bulkImport(
        products: Array<{
            sku: string;
            name: string;
            description?: string;
            categoryId?: string | null;
            barcode?: string | null;
            unitOfMeasure?: string;
            purchasePrice?: number;
            sellingPrice?: number;
            mrp?: number | null;
            taxRate?: number;
            reorderLevel?: number;
            maxStockLevel?: number | null;
            isPerishable?: boolean;
            shelfLifeDays?: number | null;
            imageUrl?: string | null;
            isActive?: boolean;
        }>,
        options: { skipDuplicates?: boolean; updateExisting?: boolean } = {}
    ) {
        const { skipDuplicates = false, updateExisting = false } = options;

        const results = {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [] as Array<{ sku: string; error: string }>,
        };

        // Get existing SKUs
        const existingSkus = await prisma.product.findMany({
            where: { sku: { in: products.map((p) => p.sku) } },
            select: { id: true, sku: true },
        });
        const existingSkuMap = new Map(existingSkus.map((p) => [p.sku, p.id]));

        // Process in batches of 50 for transaction safety
        const batchSize = 50;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            await prisma.$transaction(async (tx) => {
                for (const productData of batch) {
                    const existingId = existingSkuMap.get(productData.sku);

                    try {
                        if (existingId) {
                            // SKU exists
                            if (updateExisting) {
                                await tx.product.update({
                                    where: { id: existingId },
                                    data: {
                                        name: productData.name,
                                        description: productData.description,
                                        categoryId: productData.categoryId,
                                        barcode: productData.barcode,
                                        unitOfMeasure: productData.unitOfMeasure || 'piece',
                                        purchasePrice: productData.purchasePrice || 0,
                                        sellingPrice: productData.sellingPrice || 0,
                                        mrp: productData.mrp,
                                        taxRate: productData.taxRate || 0,
                                        reorderLevel: productData.reorderLevel || 0,
                                        maxStockLevel: productData.maxStockLevel,
                                        isPerishable: productData.isPerishable || false,
                                        shelfLifeDays: productData.shelfLifeDays,
                                        imageUrl: productData.imageUrl,
                                        isActive: productData.isActive ?? true,
                                    },
                                });
                                results.updated++;
                            } else if (skipDuplicates) {
                                results.skipped++;
                            } else {
                                results.errors.push({
                                    sku: productData.sku,
                                    error: 'SKU already exists',
                                });
                            }
                        } else {
                            // Create new product
                            await tx.product.create({
                                data: {
                                    sku: productData.sku,
                                    name: productData.name,
                                    description: productData.description,
                                    categoryId: productData.categoryId,
                                    barcode: productData.barcode,
                                    unitOfMeasure: productData.unitOfMeasure || 'piece',
                                    purchasePrice: productData.purchasePrice || 0,
                                    sellingPrice: productData.sellingPrice || 0,
                                    mrp: productData.mrp,
                                    taxRate: productData.taxRate || 0,
                                    reorderLevel: productData.reorderLevel || 0,
                                    maxStockLevel: productData.maxStockLevel,
                                    isPerishable: productData.isPerishable || false,
                                    shelfLifeDays: productData.shelfLifeDays,
                                    imageUrl: productData.imageUrl,
                                    isActive: productData.isActive ?? true,
                                },
                            });
                            results.created++;
                        }
                    } catch (error) {
                        results.errors.push({
                            sku: productData.sku,
                            error: (error as Error).message,
                        });
                    }
                }
            });
        }

        return results;
    }

    /**
     * Export products to CSV format
     */
    async exportProducts(query: Partial<ProductQuery> = {}) {
        const { products } = await this.findAll({ ...query, pageSize: 10000 } as ProductQuery);

        // CSV header
        const headers = [
            'SKU', 'Name', 'Description', 'Category', 'Barcode',
            'Unit', 'Purchase Price', 'Selling Price', 'MRP', 'Tax Rate',
            'Reorder Level', 'Max Stock', 'Is Perishable', 'Shelf Life Days',
            'Available Quantity', 'Is Active'
        ];

        const rows = products.map((p: {
            sku: string;
            name: string;
            description?: string | null;
            category?: { name: string } | null;
            barcode?: string | null;
            unitOfMeasure: string;
            purchasePrice: number | { toString(): string };
            sellingPrice: number | { toString(): string };
            mrp?: number | { toString(): string } | null;
            taxRate: number | { toString(): string };
            reorderLevel: number;
            maxStockLevel?: number | null;
            isPerishable: boolean;
            shelfLifeDays?: number | null;
            availableQuantity: number;
            isActive: boolean;
        }) => [
            p.sku,
            p.name,
            p.description || '',
            p.category?.name || '',
            p.barcode || '',
            p.unitOfMeasure,
            String(p.purchasePrice),
            String(p.sellingPrice),
            p.mrp ? String(p.mrp) : '',
            String(p.taxRate),
            String(p.reorderLevel),
            p.maxStockLevel ? String(p.maxStockLevel) : '',
            String(p.isPerishable),
            p.shelfLifeDays ? String(p.shelfLifeDays) : '',
            String(p.availableQuantity),
            String(p.isActive),
        ].map(v => `"${v.replace(/"/g, '""')}"`).join(','));

        return [headers.join(','), ...rows].join('\n');
    }
}

export const productService = new ProductService();

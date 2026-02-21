import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

// Product endpoints
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.findAll(req.query as any);
    sendPaginated(res, result.products, result.pagination);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.findById(req.params.id);
    sendSuccess(res, product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.create(req.body);
    sendSuccess(res, product, 'Product created successfully', 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, product, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.delete(req.params.id);
    sendSuccess(res, result);
});

export const getLowStockProducts = asyncHandler(async (_req: Request, res: Response) => {
    const products = await productService.getLowStockProducts();
    sendSuccess(res, products);
});

// Category endpoints
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await productService.getCategories();
    sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await productService.createCategory(req.body);
    sendSuccess(res, category, 'Category created successfully', 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await productService.updateCategory(req.params.id, req.body);
    sendSuccess(res, category, 'Category updated successfully');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.deleteCategory(req.params.id);
    sendSuccess(res, result);
});

// Bulk operations
export const bulkImportProducts = asyncHandler(async (req: Request, res: Response) => {
    const { products, options } = req.body;
    const result = await productService.bulkImport(products, options);
    sendSuccess(res, result, `Imported ${result.created} products, updated ${result.updated}, skipped ${result.skipped}`);
});

export const exportProducts = asyncHandler(async (req: Request, res: Response) => {
    const csv = await productService.exportProducts(req.query as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.csv');
    res.send(csv);
});


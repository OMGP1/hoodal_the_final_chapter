import { Request, Response } from 'express';
import { variantService } from '../services/variant.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Get all variants for a product
 */
export const getVariantsByProduct = asyncHandler(async (req: Request, res: Response) => {
    const variants = await variantService.getVariantsByProduct(req.params.productId);
    sendSuccess(res, variants);
});

/**
 * Get variant by ID
 */
export const getVariantById = asyncHandler(async (req: Request, res: Response) => {
    const variant = await variantService.getVariantById(req.params.id);
    sendSuccess(res, variant);
});

/**
 * Find product/variant by SKU or barcode (for POS)
 */
export const findBySkuOrBarcode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;
    const result = await variantService.findBySkuOrBarcode(code);
    sendSuccess(res, result);
});

/**
 * Create new variant
 */
export const createVariant = asyncHandler(async (req: Request, res: Response) => {
    const variant = await variantService.createVariant({
        ...req.body,
        productId: req.params.productId,
    });
    sendSuccess(res, variant, 'Variant created successfully', 201);
});

/**
 * Update variant
 */
export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
    const variant = await variantService.updateVariant(req.params.id, req.body);
    sendSuccess(res, variant, 'Variant updated successfully');
});

/**
 * Delete variant (soft delete)
 */
export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
    const result = await variantService.deleteVariant(req.params.id);
    sendSuccess(res, result);
});

/**
 * Bulk create variants for a product
 */
export const bulkCreateVariants = asyncHandler(async (req: Request, res: Response) => {
    const result = await variantService.bulkCreateVariants(
        req.params.productId,
        req.body.variants
    );
    sendSuccess(res, result, `Created ${result.created} variants`);
});

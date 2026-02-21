import { Request, Response } from 'express';
import { purchaseService } from '../services/purchase.service';
import { grnService } from '../services/grn.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

// ==================== PURCHASE ORDER CONTROLLERS ====================

/**
 * Create a new purchase order (draft)
 */
export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const po = await purchaseService.createPurchaseOrder(req.body, user.id);
    sendSuccess(res, po, 'Purchase order created', 201);
});

/**
 * Update a draft purchase order
 */
export const updatePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseService.updatePurchaseOrder(req.params.id, req.body);
    sendSuccess(res, po, 'Purchase order updated');
});

/**
 * Submit a purchase order (mark as ordered)
 */
export const submitPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseService.submitOrder(req.params.id);
    sendSuccess(res, po, 'Purchase order submitted');
});

/**
 * Cancel a purchase order
 */
export const cancelPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseService.cancelOrder(req.params.id);
    sendSuccess(res, po, 'Purchase order cancelled');
});

/**
 * Get purchase order by ID
 */
export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const po = await purchaseService.getPurchaseOrder(req.params.id);
    sendSuccess(res, po);
});

/**
 * List purchase orders with filters
 */
export const listPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
    const { status, supplierId, fromDate, toDate, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const pageSize = limit ? parseInt(limit as string) : 20;

    const result = await purchaseService.listPurchaseOrders({
        status: status as string,
        supplierId: supplierId as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        page: pageNum,
        limit: pageSize,
    });

    sendPaginated(res, result.data, {
        page: pageNum,
        pageSize,
        totalRecords: result.pagination.total,
    });
});

// ==================== GRN CONTROLLERS ====================

/**
 * Receive goods against a purchase order
 */
export const receiveGoods = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const grn = await grnService.receiveGoods(
        {
            purchaseOrderId: req.params.id,
            ...req.body,
        },
        user.id
    );
    sendSuccess(res, grn, 'Goods received successfully', 201);
});

/**
 * Get GRN by ID
 */
export const getGRN = asyncHandler(async (req: Request, res: Response) => {
    const grn = await grnService.getGRN(req.params.id);
    sendSuccess(res, grn);
});

/**
 * Get GRN by number
 */
export const getGRNByNumber = asyncHandler(async (req: Request, res: Response) => {
    const grn = await grnService.getGRNByNumber(req.params.grnNumber);
    sendSuccess(res, grn);
});

/**
 * List GRNs for a purchase order
 */
export const listGRNsForPO = asyncHandler(async (req: Request, res: Response) => {
    const grns = await grnService.listGRNsForPO(req.params.id);
    sendSuccess(res, grns);
});

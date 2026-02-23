import { Request, Response } from 'express';
import { supplierService } from '../services/supplier.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.create(req.body);
    sendSuccess(res, supplier, 'Supplier created', 201);
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.update(req.params.id, req.body);
    sendSuccess(res, supplier, 'Supplier updated');
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.getById(req.params.id);
    sendSuccess(res, supplier);
});

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
    const { search, isActive, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const pageSize = limit ? parseInt(limit as string) : 20;

    const result = await supplierService.list({
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: pageNum,
        limit: pageSize,
    });

    sendPaginated(res, result.data, {
        page: pageNum,
        pageSize,
        totalRecords: result.pagination.total,
    });
});

export const toggleSupplier = asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierService.toggleActive(req.params.id);
    sendSuccess(res, supplier, `Supplier ${supplier.isActive ? 'activated' : 'deactivated'}`);
});

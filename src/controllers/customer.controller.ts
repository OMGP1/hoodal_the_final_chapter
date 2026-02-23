import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.create(req.body);
    sendSuccess(res, customer, 'Customer created', 201);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.update(req.params.id, req.body);
    sendSuccess(res, customer, 'Customer updated');
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.getById(req.params.id);
    sendSuccess(res, customer);
});

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
    const { search, isActive, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const pageSize = limit ? parseInt(limit as string) : 20;

    const result = await customerService.list({
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

export const adjustBalance = asyncHandler(async (req: Request, res: Response) => {
    const { amount, type, notes } = req.body;
    const customer = await customerService.adjustBalance(
        req.params.id,
        amount,
        type,
        notes
    );
    sendSuccess(res, customer, `Balance ${type === 'credit' ? 'credited' : 'payment recorded'}`);
});

export const toggleCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.toggleActive(req.params.id);
    sendSuccess(res, customer, `Customer ${customer.isActive ? 'activated' : 'deactivated'}`);
});

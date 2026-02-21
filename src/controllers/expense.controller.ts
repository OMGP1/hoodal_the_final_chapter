import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const expense = await expenseService.createExpense(req.body, user.id);
    sendSuccess(res, expense, 'Expense created', 201);
});

export const processExpense = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { action } = req.body;

    const expense = await expenseService.processExpense(id, action, user.id);
    sendSuccess(res, expense, `Expense ${action}`);
});

export const getExpense = asyncHandler(async (req: Request, res: Response) => {
    const expense = await expenseService.getExpense(req.params.id);
    sendSuccess(res, expense);
});

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, status, startDate, endDate, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const pageSize = limit ? parseInt(limit as string) : 20;

    const result = await expenseService.listExpenses({
        categoryId: categoryId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: pageNum,
        limit: pageSize,
    });

    sendPaginated(res, result.data, {
        page: pageNum,
        pageSize,
        totalRecords: result.pagination.total,
    });
});

export const getExpenseDashboard = asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await expenseService.getExpenseDashboard();
    sendSuccess(res, dashboard);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const category = await expenseService.createCategory(name, description);
    sendSuccess(res, category, 'Category created', 201);
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await expenseService.listCategories();
    sendSuccess(res, categories);
});

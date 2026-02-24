import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateExpenseInput {
    categoryId: string;
    amount: number;
    description?: string;
    expenseDate?: Date;
    paymentMethod: string;
    receiptUrl?: string;
    vendorName?: string;
}

interface ExpenseFilters {
    categoryId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

export class ExpenseService {
    /**
     * Create a new expense
     */
    async createExpense(data: CreateExpenseInput, userId: string) {
        // Validate category exists
        if (data.categoryId) {
            const category = await prisma.expenseCategory.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new AppError(ErrorCodes.NOT_FOUND, 'Expense category not found', 404);
            }
        }

        return prisma.expense.create({
            data: {
                categoryId: data.categoryId,
                amount: data.amount,
                description: data.description,
                expenseDate: data.expenseDate ?? new Date(),
                paymentMethod: data.paymentMethod,
                receiptUrl: data.receiptUrl,
                vendorName: data.vendorName,
                status: 'pending',
                createdBy: userId,
            },
            include: {
                category: true,
                createdByUser: { select: { id: true, email: true, firstName: true } },
            },
        });
    }

    /**
     * Update an expense
     */
    async updateExpense(expenseId: string, data: Partial<CreateExpenseInput>, userId: string) {
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
        });

        if (!expense) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Expense not found', 404);
        }

        if (expense.status !== 'pending') {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Only pending expenses can be edited',
                400
            );
        }

        return prisma.expense.update({
            where: { id: expenseId },
            data: {
                categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
                amount: data.amount !== undefined ? data.amount : undefined,
                description: data.description !== undefined ? data.description : undefined,
                expenseDate: data.expenseDate !== undefined ? data.expenseDate : undefined,
                paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : undefined,
                receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl : undefined,
                vendorName: data.vendorName !== undefined ? data.vendorName : undefined,
            },
            include: {
                category: true,
                createdByUser: { select: { id: true, email: true, firstName: true } },
            },
        });
    }

    /**
     * Approve or reject an expense
     */
    async processExpense(
        expenseId: string,
        action: 'approved' | 'rejected',
        approverId: string
    ) {
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
        });

        if (!expense) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Expense not found', 404);
        }

        if (expense.status !== 'pending') {
            throw new AppError(
                ErrorCodes.BUSINESS_ERROR,
                'Expense already processed',
                400
            );
        }

        return prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: action,
                approvedBy: approverId,
            },
            include: {
                category: true,
                createdByUser: { select: { id: true, email: true, firstName: true } },
                approvedByUser: { select: { id: true, email: true, firstName: true } },
            },
        });
    }

    /**
     * Get expense by ID
     */
    async getExpense(expenseId: string) {
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            include: {
                category: true,
                createdByUser: { select: { id: true, email: true, firstName: true } },
                approvedByUser: { select: { id: true, email: true, firstName: true } },
            },
        });

        if (!expense) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Expense not found', 404);
        }

        return expense;
    }

    /**
     * List expenses with filters
     */
    async listExpenses(filters: ExpenseFilters) {
        const where: Prisma.ExpenseWhereInput = {};

        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.startDate || filters.endDate) {
            where.expenseDate = {};
            if (filters.startDate) {
                where.expenseDate.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.expenseDate.lte = filters.endDate;
            }
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const skip = (page - 1) * limit;

        const [total, expenses] = await Promise.all([
            prisma.expense.count({ where }),
            prisma.expense.findMany({
                where,
                include: {
                    category: true,
                    createdByUser: { select: { id: true, email: true, firstName: true } },
                },
                orderBy: { expenseDate: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: expenses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get expense dashboard summary
     * Total this month vs previous month, by category
     */
    async getExpenseDashboard() {
        const now = new Date();

        // Current month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Previous month
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Get totals for current month (approved only)
        const currentMonthExpenses = await prisma.expense.findMany({
            where: {
                expenseDate: { gte: currentMonthStart, lte: currentMonthEnd },
                status: 'approved',
            },
            include: { category: true },
        });

        const prevMonthExpenses = await prisma.expense.findMany({
            where: {
                expenseDate: { gte: prevMonthStart, lte: prevMonthEnd },
                status: 'approved',
            },
        });

        // Calculate totals
        const currentTotal = currentMonthExpenses.reduce(
            (sum: Decimal, e) => sum.plus(e.amount),
            new Decimal(0)
        );

        const prevTotal = prevMonthExpenses.reduce(
            (sum: Decimal, e) => sum.plus(e.amount),
            new Decimal(0)
        );

        // Group by category
        const byCategory: Record<string, { name: string; amount: Decimal }> = {};
        for (const expense of currentMonthExpenses) {
            const categoryName = expense.category?.name ?? 'Uncategorized';
            const categoryId = expense.categoryId ?? 'uncategorized';

            if (!byCategory[categoryId]) {
                byCategory[categoryId] = { name: categoryName, amount: new Decimal(0) };
            }
            byCategory[categoryId].amount = byCategory[categoryId].amount.plus(expense.amount);
        }

        // Pending expenses count
        const pendingCount = await prisma.expense.count({
            where: { status: 'pending' },
        });

        return {
            currentMonth: {
                total: currentTotal,
                count: currentMonthExpenses.length,
                period: `${currentMonthStart.toLocaleDateString()} - ${currentMonthEnd.toLocaleDateString()}`,
            },
            previousMonth: {
                total: prevTotal,
                count: prevMonthExpenses.length,
            },
            change: currentTotal.minus(prevTotal),
            changePercent: prevTotal.isZero()
                ? null
                : currentTotal.minus(prevTotal).dividedBy(prevTotal).times(100).toDecimalPlaces(2),
            byCategory: Object.values(byCategory).sort((a, b) =>
                b.amount.minus(a.amount).toNumber()
            ),
            pendingApproval: pendingCount,
        };
    }

    // ==================== EXPENSE CATEGORIES ====================

    /**
     * Create expense category
     */
    async createCategory(name: string, description?: string) {
        return prisma.expenseCategory.create({
            data: { name, description },
        });
    }

    /**
     * List expense categories
     */
    async listCategories() {
        return prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }
}

export const expenseService = new ExpenseService();

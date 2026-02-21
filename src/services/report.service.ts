import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

export class ReportService {
    /**
     * Sales Report
     * Total Revenue, Total Orders, Average Order Value, Top Products
     */
    async getSalesReport(range: DateRange) {
        const { startDate, endDate } = range;

        // Get all completed orders in range
        const orders = await prisma.salesOrder.findMany({
            where: {
                orderDate: { gte: startDate, lte: endDate },
                orderStatus: { in: ['completed', 'delivered'] },
            },
            include: {
                items: true,
            },
        });

        // Calculate totals
        const totalRevenue = orders.reduce(
            (sum: Decimal, o) => sum.plus(o.totalAmount),
            new Decimal(0)
        );
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0
            ? totalRevenue.dividedBy(totalOrders).toDecimalPlaces(2)
            : new Decimal(0);

        // Get product details for all product IDs in items
        const productIds = new Set<string>();
        for (const order of orders) {
            for (const item of order.items) {
                productIds.add(item.productId);
            }
        }

        const products = await prisma.product.findMany({
            where: { id: { in: Array.from(productIds) } },
            select: { id: true, name: true, sku: true, purchasePrice: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Top selling products
        const productSales: Record<string, {
            productId: string;
            name: string;
            sku: string;
            quantity: number;
            revenue: Decimal
        }> = {};

        for (const order of orders) {
            for (const item of order.items) {
                const key = item.productId;
                const product = productMap.get(item.productId);
                if (!productSales[key]) {
                    productSales[key] = {
                        productId: item.productId,
                        name: product?.name ?? 'Unknown',
                        sku: product?.sku ?? '',
                        quantity: 0,
                        revenue: new Decimal(0),
                    };
                }
                productSales[key].quantity += item.quantity;
                productSales[key].revenue = productSales[key].revenue.plus(item.totalPrice);
            }
        }

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue.minus(a.revenue).toNumber())
            .slice(0, 10);

        // Daily breakdown
        const dailySales: Record<string, { date: string; orders: number; revenue: Decimal }> = {};
        for (const order of orders) {
            const dateKey = order.orderDate.toISOString().split('T')[0];
            if (!dailySales[dateKey]) {
                dailySales[dateKey] = { date: dateKey, orders: 0, revenue: new Decimal(0) };
            }
            dailySales[dateKey].orders += 1;
            dailySales[dateKey].revenue = dailySales[dateKey].revenue.plus(order.totalAmount);
        }

        return {
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
            },
            topProducts,
            dailyBreakdown: Object.values(dailySales).sort((a, b) =>
                a.date.localeCompare(b.date)
            ),
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        };
    }

    /**
     * Inventory Report
     * Current stock levels, low stock alerts, stock value
     */
    async getInventoryReport() {
        // Get all products with inventory
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                inventoryItems: {
                    where: { status: 'available' },
                },
                category: { select: { name: true } },
            },
        });

        const report = products.map((product) => {
            const totalStock = product.inventoryItems.reduce(
                (sum: number, item) => sum + item.availableQuantity,
                0
            );
            const stockValue = new Decimal(totalStock).times(product.purchasePrice);

            return {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                category: product.category?.name ?? 'Uncategorized',
                totalStock,
                reorderLevel: product.reorderLevel,
                isLowStock: totalStock <= product.reorderLevel,
                stockValue,
                sellingPrice: product.sellingPrice,
                potentialRevenue: new Decimal(totalStock).times(product.sellingPrice),
            };
        });

        // Summary
        const totalProducts = report.length;
        const lowStockCount = report.filter((r) => r.isLowStock).length;
        const totalStockValue = report.reduce(
            (sum: Decimal, r) => sum.plus(r.stockValue),
            new Decimal(0)
        );
        const totalPotentialRevenue = report.reduce(
            (sum: Decimal, r) => sum.plus(r.potentialRevenue),
            new Decimal(0)
        );

        // Low stock items
        const lowStockItems = report
            .filter((r) => r.isLowStock)
            .sort((a, b) => a.totalStock - b.totalStock);

        return {
            summary: {
                totalProducts,
                lowStockCount,
                totalStockValue,
                totalPotentialRevenue,
            },
            lowStockItems,
            allProducts: report.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }

    /**
     * Profit & Loss Report
     * Revenue - Cost of Goods Sold - Expenses = Profit
     */
    async getProfitLossReport(range: DateRange) {
        const { startDate, endDate } = range;

        // Revenue from sales
        const orders = await prisma.salesOrder.findMany({
            where: {
                orderDate: { gte: startDate, lte: endDate },
                orderStatus: { in: ['completed', 'delivered'] },
            },
            include: {
                items: true,
            },
        });

        const totalRevenue = orders.reduce(
            (sum: Decimal, o) => sum.plus(o.totalAmount),
            new Decimal(0)
        );

        // Get product purchase prices
        const productIds = new Set<string>();
        for (const order of orders) {
            for (const item of order.items) {
                productIds.add(item.productId);
            }
        }

        const products = await prisma.product.findMany({
            where: { id: { in: Array.from(productIds) } },
            select: { id: true, purchasePrice: true },
        });

        const purchasePriceMap = new Map(products.map((p) => [p.id, p.purchasePrice]));

        // Cost of Goods Sold (COGS) - using purchasePrice for simplicity
        let cogs = new Decimal(0);
        for (const order of orders) {
            for (const item of order.items) {
                const purchasePrice = purchasePriceMap.get(item.productId) ?? new Decimal(0);
                const itemCost = purchasePrice.times(item.quantity);
                cogs = cogs.plus(itemCost);
            }
        }

        // Expenses (approved only)
        const expenses = await prisma.expense.findMany({
            where: {
                expenseDate: { gte: startDate, lte: endDate },
                status: 'approved',
            },
            include: { category: true },
        });

        const totalExpenses = expenses.reduce(
            (sum: Decimal, e) => sum.plus(e.amount),
            new Decimal(0)
        );

        // Group expenses by category
        const expensesByCategory: Record<string, { name: string; amount: Decimal }> = {};
        for (const expense of expenses) {
            const categoryName = expense.category?.name ?? 'Uncategorized';
            const categoryId = expense.categoryId ?? 'uncategorized';
            if (!expensesByCategory[categoryId]) {
                expensesByCategory[categoryId] = { name: categoryName, amount: new Decimal(0) };
            }
            expensesByCategory[categoryId].amount = expensesByCategory[categoryId].amount.plus(
                expense.amount
            );
        }

        // Returns/Refunds
        const returns = await prisma.returnOrder.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                refundStatus: 'processed',
            },
        });

        const totalRefunds = returns.reduce(
            (sum: Decimal, r) => sum.plus(r.totalAmount),
            new Decimal(0)
        );

        // Calculate profit
        const grossProfit = totalRevenue.minus(cogs);
        const netProfit = grossProfit.minus(totalExpenses).minus(totalRefunds);
        const grossMargin = totalRevenue.isZero()
            ? new Decimal(0)
            : grossProfit.dividedBy(totalRevenue).times(100).toDecimalPlaces(2);
        const netMargin = totalRevenue.isZero()
            ? new Decimal(0)
            : netProfit.dividedBy(totalRevenue).times(100).toDecimalPlaces(2);

        return {
            revenue: {
                total: totalRevenue,
                orderCount: orders.length,
            },
            costOfGoodsSold: cogs,
            grossProfit,
            grossMargin: `${grossMargin}%`,
            expenses: {
                total: totalExpenses,
                byCategory: Object.values(expensesByCategory).sort((a, b) =>
                    b.amount.minus(a.amount).toNumber()
                ),
            },
            refunds: {
                total: totalRefunds,
                count: returns.length,
            },
            netProfit,
            netMargin: `${netMargin}%`,
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        };
    }

    /**
     * Register Session Summary
     * Cash variance, sales by payment method
     */
    async getRegisterSummary(range: DateRange) {
        const { startDate, endDate } = range;

        const sessions = await prisma.registerSession.findMany({
            where: {
                openedAt: { gte: startDate, lte: endDate },
            },
            include: {
                openedByUser: { select: { firstName: true, lastName: true } },
            },
            orderBy: { openedAt: 'desc' },
        });

        const completedSessions = sessions.filter((s) => s.status === 'closed');

        const totalVariance = completedSessions.reduce(
            (sum: Decimal, s) => sum.plus(s.variance ?? 0),
            new Decimal(0)
        );

        const totalCashSales = completedSessions.reduce(
            (sum: Decimal, s) => sum.plus(s.cashSales),
            new Decimal(0)
        );

        const totalCardSales = completedSessions.reduce(
            (sum: Decimal, s) => sum.plus(s.cardSales),
            new Decimal(0)
        );

        const totalUpiSales = completedSessions.reduce(
            (sum: Decimal, s) => sum.plus(s.upiSales),
            new Decimal(0)
        );

        return {
            summary: {
                totalSessions: sessions.length,
                closedSessions: completedSessions.length,
                openSessions: sessions.filter((s) => s.status === 'open').length,
                totalVariance,
            },
            salesByMethod: {
                cash: totalCashSales,
                card: totalCardSales,
                upi: totalUpiSales,
                total: totalCashSales.plus(totalCardSales).plus(totalUpiSales),
            },
            sessions: sessions.map((s) => ({
                id: s.id,
                openedBy: `${s.openedByUser.firstName ?? ''} ${s.openedByUser.lastName ?? ''}`.trim(),
                openedAt: s.openedAt,
                closedAt: s.closedAt,
                status: s.status,
                totalSales: s.totalSales,
                variance: s.variance,
            })),
        };
    }
}

export const reportService = new ReportService();

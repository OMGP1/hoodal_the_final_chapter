import { prisma } from '../config/database';
import { DashboardMetrics, SalesTrend } from '../types/api.types';

// Helper type for products with inventory
interface ProductWithInventory {
    id: string;
    reorderLevel: number;
    inventoryItems: { availableQuantity: number }[];
}

export class DashboardService {
    /**
     * Get dashboard overview metrics
     */
    async getOverview(): Promise<DashboardMetrics> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);

        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        // Today's sales
        const todaySales = await prisma.salesOrder.aggregate({
            where: {
                orderDate: { gte: today, lt: tomorrow },
                paymentStatus: { in: ['paid', 'partial'] },
            },
            _sum: { totalAmount: true },
            _count: { id: true },
        });

        const todayItems = await prisma.salesOrderItem.aggregate({
            where: {
                salesOrder: {
                    orderDate: { gte: today, lt: tomorrow },
                    paymentStatus: { in: ['paid', 'partial'] },
                },
            },
            _sum: { quantity: true },
        });

        // This week's sales
        const weekSales = await prisma.salesOrder.aggregate({
            where: {
                orderDate: { gte: weekStart, lt: tomorrow },
                paymentStatus: { in: ['paid', 'partial'] },
            },
            _sum: { totalAmount: true },
        });

        const lastWeekSales = await prisma.salesOrder.aggregate({
            where: {
                orderDate: { gte: lastWeekStart, lt: weekStart },
                paymentStatus: { in: ['paid', 'partial'] },
            },
            _sum: { totalAmount: true },
        });

        // This month's sales
        const monthSales = await prisma.salesOrder.aggregate({
            where: {
                orderDate: { gte: monthStart, lt: tomorrow },
                paymentStatus: { in: ['paid', 'partial'] },
            },
            _sum: { totalAmount: true },
        });

        const lastMonthSales = await prisma.salesOrder.aggregate({
            where: {
                orderDate: { gte: lastMonthStart, lt: lastMonthEnd },
                paymentStatus: { in: ['paid', 'partial'] },
            },
            _sum: { totalAmount: true },
        });

        // Low stock count
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                inventoryItems: { select: { availableQuantity: true } },
            },
        });

        const lowStockCount = products.filter((product: ProductWithInventory) => {
            const totalAvailable = product.inventoryItems.reduce(
                (sum: number, item: { availableQuantity: number }) => sum + item.availableQuantity,
                0
            );
            return totalAvailable <= product.reorderLevel;
        }).length;

        // Expiring items (within 7 days)
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + 7);

        const expiringCount = await prisma.inventoryItem.count({
            where: {
                expiryDate: { gte: new Date(), lte: expiringDate },
                quantity: { gt: 0 },
            },
        });

        // Pending orders
        const pendingOrders = await prisma.salesOrder.count({
            where: {
                orderStatus: { in: ['pending', 'confirmed', 'processing'] },
            },
        });

        // Outstanding payments
        const outstandingPayments = await prisma.salesOrder.aggregate({
            where: {
                paymentStatus: { in: ['pending', 'partial'] },
            },
            _sum: { totalAmount: true },
        });

        // Calculate week and month changes
        const weekRevenue = Number(weekSales._sum.totalAmount) || 0;
        const lastWeekRevenue = Number(lastWeekSales._sum.totalAmount) || 0;
        const weekChange = lastWeekRevenue > 0
            ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
            : 0;

        const monthRevenue = Number(monthSales._sum.totalAmount) || 0;
        const lastMonthRevenue = Number(lastMonthSales._sum.totalAmount) || 0;
        const monthChange = lastMonthRevenue > 0
            ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        return {
            todaySales: {
                revenue: Number(todaySales._sum.totalAmount ?? 0),
                orders: todaySales._count.id ?? 0,
                items: Number(todayItems._sum.quantity ?? 0),
            },
            weeklySales: {
                revenue: weekRevenue,
                change: Math.round(weekChange * 100) / 100,
            },
            monthlySales: {
                revenue: monthRevenue,
                change: Math.round(monthChange * 100) / 100,
            },
            lowStockCount,
            expiringCount,
            pendingOrders,
            outstandingPayments: Number(outstandingPayments._sum.totalAmount ?? 0),
        };
    }

    /**
     * Get sales trend data for charts
     */
    async getSalesTrend(days = 30): Promise<SalesTrend[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const orders = await prisma.salesOrder.findMany({
            where: {
                orderDate: { gte: startDate },
                paymentStatus: { in: ['paid', 'partial'] },
            },
            select: {
                orderDate: true,
                totalAmount: true,
            },
        });

        // Group by date
        const trendMap = new Map<string, { revenue: number; orders: number }>();

        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            trendMap.set(dateStr, { revenue: 0, orders: 0 });
        }

        orders.forEach((order: { orderDate: Date; totalAmount: any }) => {
            const dateStr = order.orderDate.toISOString().split('T')[0];
            const current = trendMap.get(dateStr) || { revenue: 0, orders: 0 };
            trendMap.set(dateStr, {
                revenue: current.revenue + Number(order.totalAmount),
                orders: current.orders + 1,
            });
        });

        return Array.from(trendMap.entries()).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            orders: data.orders,
        }));
    }

    /**
     * Get system alerts
     */
    async getAlerts() {
        const alerts: Array<{
            type: string;
            severity: 'info' | 'warning' | 'error';
            message: string;
            count?: number;
        }> = [];

        // Low stock alerts
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                inventoryItems: { select: { availableQuantity: true } },
            },
        });

        const lowStockProducts = products.filter((product: ProductWithInventory) => {
            const totalAvailable = product.inventoryItems.reduce(
                (sum: number, item: { availableQuantity: number }) => sum + item.availableQuantity,
                0
            );
            return totalAvailable <= product.reorderLevel;
        });

        if (lowStockProducts.length > 0) {
            alerts.push({
                type: 'low_stock',
                severity: 'warning',
                message: `${lowStockProducts.length} products are below reorder level`,
                count: lowStockProducts.length,
            });
        }

        // Expiring items
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + 7);

        const expiringItems = await prisma.inventoryItem.count({
            where: {
                expiryDate: { gte: new Date(), lte: expiringDate },
                quantity: { gt: 0 },
            },
        });

        if (expiringItems > 0) {
            alerts.push({
                type: 'expiring',
                severity: 'warning',
                message: `${expiringItems} items expiring within 7 days`,
                count: expiringItems,
            });
        }

        // Expired items
        const expiredItems = await prisma.inventoryItem.count({
            where: {
                expiryDate: { lt: new Date() },
                quantity: { gt: 0 },
            },
        });

        if (expiredItems > 0) {
            alerts.push({
                type: 'expired',
                severity: 'error',
                message: `${expiredItems} items have expired`,
                count: expiredItems,
            });
        }

        // Pending orders
        const pendingOrders = await prisma.salesOrder.count({
            where: {
                orderStatus: 'pending',
            },
        });

        if (pendingOrders > 0) {
            alerts.push({
                type: 'pending_orders',
                severity: 'info',
                message: `${pendingOrders} orders awaiting processing`,
                count: pendingOrders,
            });
        }

        return alerts;
    }

    /**
     * Get top selling products
     */
    async getTopProducts(limit = 10) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topProducts = await prisma.salesOrderItem.groupBy({
            by: ['productId'],
            where: {
                salesOrder: {
                    orderDate: { gte: thirtyDaysAgo },
                    paymentStatus: { in: ['paid', 'partial'] },
                },
            },
            _sum: {
                quantity: true,
                totalPrice: true,
            },
            orderBy: {
                _sum: { totalPrice: 'desc' },
            },
            take: limit,
        });

        const productIds = topProducts.map((p: { productId: string }) => p.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, sku: true },
        });

        return topProducts.map((item: { productId: string; _sum: { quantity: number | null; totalPrice: any } }) => {
            const product = products.find((p: { id: string }) => p.id === item.productId);
            return {
                product,
                totalQuantity: item._sum.quantity,
                totalRevenue: Number(item._sum.totalPrice),
            };
        });
    }
}

export const dashboardService = new DashboardService();

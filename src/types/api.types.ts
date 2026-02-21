// Generic API types
export interface PaginationQuery {
    page?: string;
    pageSize?: string;
}

export interface SearchQuery extends PaginationQuery {
    q?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Filter types for various entities
export interface ProductFilters extends SearchQuery {
    categoryId?: string;
    isActive?: string;
    isPerishable?: string;
    lowStock?: string;
}

export interface InventoryFilters extends SearchQuery {
    productId?: string;
    locationId?: string;
    status?: string;
    expiringInDays?: string;
}

export interface OrderFilters extends SearchQuery {
    customerId?: string;
    orderStatus?: string;
    paymentStatus?: string;
    orderType?: string;
    fromDate?: string;
    toDate?: string;
}

export interface ExpenseFilters extends SearchQuery {
    categoryId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
}

// Dashboard types
export interface DashboardMetrics {
    todaySales: {
        revenue: number;
        orders: number;
        items: number;
    };
    weeklySales: {
        revenue: number;
        change: number;
    };
    monthlySales: {
        revenue: number;
        change: number;
    };
    lowStockCount: number;
    expiringCount: number;
    pendingOrders: number;
    outstandingPayments: number;
}

export interface SalesTrend {
    date: string;
    revenue: number;
    orders: number;
}

// API Versioning
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Pagination Defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// User Roles
export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    CUSTOMER: 'customer',
} as const;

// Permissions
export const PERMISSIONS = {
    // Products
    PRODUCTS_READ: 'products.read',
    PRODUCTS_WRITE: 'products.write',
    PRODUCTS_DELETE: 'products.delete',

    // Inventory
    INVENTORY_READ: 'inventory.read',
    INVENTORY_WRITE: 'inventory.write',
    INVENTORY_ADJUST: 'inventory.adjust',

    // POS
    POS_ACCESS: 'pos.access',
    POS_REFUND: 'pos.refund',

    // Sales (POS transactions)
    SALES_READ: 'sales.read',
    SALES_WRITE: 'sales.write',

    // Orders
    ORDERS_READ: 'orders.read',
    ORDERS_WRITE: 'orders.write',
    ORDERS_CANCEL: 'orders.cancel',

    // Reports
    REPORTS_VIEW: 'reports.view',
    REPORTS_FINANCIAL: 'reports.financial',

    // Users
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
    USERS_DELETE: 'users.delete',

    // Staff
    STAFF_READ: 'staff.read',
    STAFF_WRITE: 'staff.write',
    STAFF_SALARY: 'staff.salary',

    // Expenses
    EXPENSES_READ: 'expenses.read',
    EXPENSES_WRITE: 'expenses.write',
    EXPENSES_APPROVE: 'expenses.approve',

    // Suppliers
    SUPPLIERS_READ: 'suppliers.read',
    SUPPLIERS_WRITE: 'suppliers.write',

    // Purchase Orders
    PURCHASE_CREATE: 'purchase.create',
    PURCHASE_READ: 'purchase.read',
    PURCHASE_UPDATE: 'purchase.update',
    PURCHASE_RECEIVE: 'purchase.receive',

    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',
} as const;

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.PRODUCTS_WRITE,
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.INVENTORY_WRITE,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.POS_ACCESS,
        PERMISSIONS.POS_REFUND,
        PERMISSIONS.ORDERS_READ,
        PERMISSIONS.ORDERS_WRITE,
        PERMISSIONS.ORDERS_CANCEL,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.STAFF_READ,
        PERMISSIONS.EXPENSES_READ,
        PERMISSIONS.EXPENSES_WRITE,
        PERMISSIONS.SUPPLIERS_READ,
        PERMISSIONS.SUPPLIERS_WRITE,
        PERMISSIONS.DASHBOARD_VIEW,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.POS_ACCESS,
        PERMISSIONS.ORDERS_READ,
        PERMISSIONS.ORDERS_WRITE,
        PERMISSIONS.DASHBOARD_VIEW,
    ],
    [ROLES.CUSTOMER]: [
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.ORDERS_READ,
    ],
};

// Stock Movement Types
export const MOVEMENT_TYPES = {
    PURCHASE: 'purchase',
    SALE: 'sale',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    DAMAGE: 'damage',
    EXPIRY: 'expiry',
    TRANSFER: 'transfer',
} as const;

// Order Status
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    READY: 'ready',
    DISPATCHED: 'dispatched',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    REFUNDED: 'refunded',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    UPI: 'upi',
    CREDIT: 'credit',
} as const;

// Inventory Status
export const INVENTORY_STATUS = {
    AVAILABLE: 'available',
    RESERVED: 'reserved',
    DAMAGED: 'damaged',
    EXPIRED: 'expired',
} as const;

// Expense Status
export const EXPENSE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

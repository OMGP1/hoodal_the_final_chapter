// Mirrors the backend PERMISSIONS constants
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

    // Customers
    CUSTOMERS_READ: 'customers.read',
    CUSTOMERS_WRITE: 'customers.write',
    CUSTOMERS_DELETE: 'customers.delete',

    // Purchase Orders
    PURCHASE_CREATE: 'purchase.create',
    PURCHASE_READ: 'purchase.read',
    PURCHASE_UPDATE: 'purchase.update',
    PURCHASE_RECEIVE: 'purchase.receive',

    // Settings
    SETTINGS_READ: 'settings.read',
    SETTINGS_WRITE: 'settings.write',

    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',
} as const;

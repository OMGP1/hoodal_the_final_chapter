// App constants
export const APP_NAME = 'Shop Inventory';

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SALES_STAFF: 'sales_staff',
    DELIVERY: 'delivery',
    CUSTOMER: 'customer',
} as const;

export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'credit', label: 'Credit' },
] as const;

export const UNITS_OF_MEASURE = [
    { value: 'piece', label: 'Piece' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'liter', label: 'Liter' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'dozen', label: 'Dozen' },
] as const;

export const STOCK_STATUS = {
    AVAILABLE: 'available',
    RESERVED: 'reserved',
    DAMAGED: 'damaged',
    EXPIRED: 'expired',
} as const;

export const MOVEMENT_TYPES = {
    PURCHASE: 'purchase',
    SALE: 'sale',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    DAMAGE: 'damage',
    EXPIRY: 'expiry',
} as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

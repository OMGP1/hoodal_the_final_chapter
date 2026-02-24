export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    category: ProductCategory | null;
    barcode: string | null;
    unitOfMeasure: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number | null;
    taxRate: number;
    reorderLevel: number;
    maxStockLevel: number | null;
    isPerishable: boolean;
    shelfLifeDays: number | null;
    imageUrl: string | null;
    hasVariants: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    inventoryItems?: InventoryItem[];
    availableQuantity?: number;
    isLowStock?: boolean;
}

export interface ProductCategory {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    parent?: ProductCategory | null;
    children?: ProductCategory[];
    isActive: boolean;
}

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    name: string;
    barcode: string | null;
    purchasePrice: number | null;
    sellingPrice: number | null;
    mrp: number | null;
    imageUrl: string | null;
    isActive: boolean;
}

export interface InventoryItem {
    id: string;
    productId: string;
    variantId: string | null;
    locationId: string | null;
    batchNumber: string | null;
    quantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    damagedQuantity: number;
    expiryDate: string | null;
    manufacturingDate: string | null;
    status: 'available' | 'reserved' | 'damaged' | 'expired';
}

export interface StockMovement {
    id: string;
    productId: string;
    variantId: string | null;
    inventoryItemId: string | null;
    movementType: 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage' | 'expiry';
    quantity: number;
    fromLocationId: string | null;
    toLocationId: string | null;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    createdBy: string | null;
    createdAt: string;
}

export interface CreateProductData {
    sku: string;
    name: string;
    description?: string;
    categoryId?: string;
    barcode?: string;
    unitOfMeasure?: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp?: number;
    taxRate?: number;
    reorderLevel?: number;
    maxStockLevel?: number;
    isPerishable?: boolean;
    shelfLifeDays?: number;
    imageUrl?: string;
    isActive?: boolean;
}

export interface ProductQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

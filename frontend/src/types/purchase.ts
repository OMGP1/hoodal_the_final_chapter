import type { Supplier } from './supplier';


// ==================== PURCHASE ORDER ====================
export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierId: string;
    supplier?: Supplier;
    orderDate: string;
    expectedDate: string | null;
    status: PurchaseOrderStatus;
    totalAmount: number;
    notes: string | null;
    createdBy: string;
    createdByUser?: { firstName: string | null; lastName: string | null };
    createdAt: string;
    updatedAt: string;
    items?: PurchaseOrderItem[];
    goodsReceivedNotes?: GoodsReceivedNote[];
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    variantId: string | null;
    product?: { id: string; name: string; sku: string };
    variant?: { id: string; name: string; sku: string } | null;
    quantity: number;
    receivedQuantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface CreatePurchaseOrderData {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    items: {
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
    }[];
}

export interface UpdatePurchaseOrderData {
    supplierId?: string;
    expectedDate?: string;
    notes?: string;
    items?: {
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
    }[];
}

// ==================== GRN ====================
export interface GoodsReceivedNote {
    id: string;
    grnNumber: string;
    purchaseOrderId: string;
    receivedDate: string;
    notes: string | null;
    receivedBy: string;
    receivedByUser?: { firstName: string | null; lastName: string | null };
    createdAt: string;
    items?: GRNItem[];
}

export interface GRNItem {
    id: string;
    grnId: string;
    purchaseOrderItemId: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    batchNumber: string | null;
    expiryDate: string | null;
    notes: string | null;
}

export interface ReceiveGoodsData {
    notes?: string;
    items: {
        purchaseOrderItemId: string;
        receivedQuantity: number;
        acceptedQuantity: number;
        rejectedQuantity?: number;
        batchNumber?: string;
        expiryDate?: string;
        notes?: string;
    }[];
}

export interface PurchaseOrderQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

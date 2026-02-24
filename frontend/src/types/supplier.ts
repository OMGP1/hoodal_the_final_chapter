// Supplier types — canonical definition (matches Prisma + frontend field names)

export interface Supplier {
    id: string;
    name: string;
    contactName: string | null;
    // Aliases used by frontend UI:
    contactPerson?: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstNumber: string | null;
    panNumber?: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        purchaseOrders: number;
    };
}

export interface CreateSupplierInput {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> { }

export interface SupplierQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

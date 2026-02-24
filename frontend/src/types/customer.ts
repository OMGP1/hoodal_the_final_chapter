// Customer types — mirrors Prisma Customer model

export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    currentBalance: number;   // Decimal → number via API serialization
    creditLimit: number;
    loyaltyPoints: number;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    // Virtual fields from includes
    _count?: {
        salesOrders: number;
        returnOrders: number;
    };
}

export interface CreateCustomerInput {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
    notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> { }

export interface AdjustBalanceInput {
    amount: number;
    type: 'credit' | 'payment';
    notes?: string;
}

export interface CustomerQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface Expense {
    id: string;
    categoryId: string | null;
    category?: ExpenseCategory;
    expenseDate: string;
    amount: number;
    description: string;
    vendor: string | null;
    referenceNumber: string | null;
    paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque';
    isRecurring: boolean;
    status: 'pending' | 'approved' | 'rejected';
    createdBy: string;
    createdByUser?: { firstName: string | null; lastName: string | null };
    approvedBy: string | null;
    approvedByUser?: { firstName: string | null; lastName: string | null } | null;
    receiptUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpenseData {
    categoryId?: string;
    expenseDate: string;
    amount: number;
    description: string;
    vendor?: string;
    referenceNumber?: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque';
    isRecurring?: boolean;
}

export interface ExpenseQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

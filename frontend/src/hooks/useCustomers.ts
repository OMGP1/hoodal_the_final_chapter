import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
    Customer,
    CreateCustomerInput,
    UpdateCustomerInput,
    AdjustBalanceInput,
    CustomerQueryParams,
    ApiResponse,
    PaginatedResponse,
} from '@/types';

const CUSTOMERS_KEY = 'customers';

/**
 * Fetch paginated customer list with optional search
 */
export function useCustomers(params: CustomerQueryParams = {}) {
    return useQuery({
        queryKey: [CUSTOMERS_KEY, params],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<Customer>>('/customers', {
                params: {
                    search: params.search || undefined,
                    page: params.page || 1,
                    limit: params.limit || 20,
                    isActive: params.isActive,
                },
            });
            return data;
        },
    });
}

/**
 * Fetch a single customer by ID with order counts
 */
export function useCustomer(id: string | undefined) {
    return useQuery({
        queryKey: [CUSTOMERS_KEY, id],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateCustomerInput) => {
            const { data } = await api.post<ApiResponse<Customer>>('/customers', input);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] });
        },
    });
}

/**
 * Update a customer
 */
export function useUpdateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...input }: UpdateCustomerInput & { id: string }) => {
            const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, input);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] });
        },
    });
}

/**
 * Adjust customer credit balance (udhaari/payment).
 * The most critical mutation — server enforces atomicity via Prisma $transaction.
 */
export function useAdjustBalance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...input }: AdjustBalanceInput & { id: string }) => {
            const { data } = await api.post<ApiResponse<Customer>>(
                `/customers/${id}/balance`,
                input
            );
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] });
        },
    });
}

/**
 * Toggle customer active status — optimistic update
 */
export function useToggleCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}/toggle`);
            return data.data;
        },
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: [CUSTOMERS_KEY] });
            const previous = qc.getQueriesData({ queryKey: [CUSTOMERS_KEY] });

            qc.setQueriesData<PaginatedResponse<Customer>>(
                { queryKey: [CUSTOMERS_KEY] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((c) =>
                            c.id === id ? { ...c, isActive: !c.isActive } : c
                        ),
                    };
                }
            );
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                for (const [key, data] of context.previous) {
                    qc.setQueryData(key, data);
                }
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] });
        },
    });
}

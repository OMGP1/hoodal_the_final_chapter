import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
    Supplier,
    CreateSupplierInput,
    UpdateSupplierInput,
    SupplierQueryParams,
    ApiResponse,
    PaginatedResponse,
} from '@/types';

const SUPPLIERS_KEY = 'suppliers';

/**
 * Fetch paginated supplier list with optional search
 */
export function useSuppliers(params: SupplierQueryParams = {}) {
    return useQuery({
        queryKey: [SUPPLIERS_KEY, params],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<Supplier>>('/suppliers', {
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
 * Fetch a single supplier by ID
 */
export function useSupplier(id: string | undefined) {
    return useQuery({
        queryKey: [SUPPLIERS_KEY, id],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
}

/**
 * Create a new supplier — invalidates list cache on success
 */
export function useCreateSupplier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateSupplierInput) => {
            const { data } = await api.post<ApiResponse<Supplier>>('/suppliers', input);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
        },
    });
}

/**
 * Update an existing supplier
 */
export function useUpdateSupplier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...input }: UpdateSupplierInput & { id: string }) => {
            const { data } = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, input);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
        },
    });
}

/**
 * Toggle supplier active status — optimistic update for instant UI
 */
export function useToggleSupplier() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.patch<ApiResponse<Supplier>>(`/suppliers/${id}/toggle`);
            return data.data;
        },
        // Optimistic update: toggle UI immediately, rollback on error
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: [SUPPLIERS_KEY] });
            const previous = qc.getQueriesData({ queryKey: [SUPPLIERS_KEY] });

            qc.setQueriesData<PaginatedResponse<Supplier>>(
                { queryKey: [SUPPLIERS_KEY] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((s) =>
                            s.id === id ? { ...s, isActive: !s.isActive } : s
                        ),
                    };
                }
            );
            return { previous };
        },
        onError: (_err, _id, context) => {
            // Rollback on failure
            if (context?.previous) {
                for (const [key, data] of context.previous) {
                    qc.setQueryData(key, data);
                }
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
        },
    });
}

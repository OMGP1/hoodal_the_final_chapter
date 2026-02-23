import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
    UpsertSettingInput,
    SettingsMap,
    ApiResponse,
} from '@/types';

const SETTINGS_KEY = 'settings';

/**
 * Fetch all settings as a flat key→value map
 */
export function useSettings() {
    return useQuery({
        queryKey: [SETTINGS_KEY, 'all'],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<SettingsMap>>('/settings');
            return data.data;
        },
    });
}

/**
 * Fetch settings by prefix (e.g., 'shop', 'tax', 'inventory', 'invoice')
 */
export function useSettingsByPrefix(prefix: string) {
    return useQuery({
        queryKey: [SETTINGS_KEY, 'prefix', prefix],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<SettingsMap>>(
                `/settings/group/${prefix}`
            );
            return data.data;
        },
        enabled: !!prefix,
    });
}

/**
 * Upsert a single setting by key
 */
export function useUpsertSetting() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpsertSettingInput) => {
            const { data } = await api.put<ApiResponse<unknown>>(
                `/settings/${input.key}`,
                { value: input.value }
            );
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [SETTINGS_KEY] });
        },
    });
}

/**
 * Bulk upsert multiple settings in a single transaction
 */
export function useBulkUpsertSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (settings: UpsertSettingInput[]) => {
            const { data } = await api.post<ApiResponse<unknown>>(
                '/settings/bulk',
                { settings }
            );
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [SETTINGS_KEY] });
        },
    });
}

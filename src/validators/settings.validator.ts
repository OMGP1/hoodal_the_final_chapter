import { z } from 'zod';

// ==================== SETTINGS VALIDATORS ====================

export const upsertSettingSchema = z.object({
    value: z.any().refine((val) => val !== undefined, 'Value is required'),
});

export const bulkUpsertSchema = z.object({
    settings: z
        .array(
            z.object({
                key: z.string().min(1, 'Key is required').max(100),
                value: z.any().refine((val) => val !== undefined, 'Value is required'),
            })
        )
        .min(1, 'At least one setting is required'),
});

// Type exports
export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
export type BulkUpsertInput = z.infer<typeof bulkUpsertSchema>;

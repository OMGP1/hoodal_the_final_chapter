// Settings types — mirrors Prisma SystemSetting model

export interface SystemSetting {
    id: string;
    key: string;
    value: unknown;  // Json type from Prisma
    createdAt: string;
    updatedAt: string;
}

export interface UpsertSettingInput {
    key: string;
    value: unknown;
}

export interface BulkUpsertInput {
    settings: UpsertSettingInput[];
}

/** Flat key-value map returned by `getByPrefix` and `getAll` */
export type SettingsMap = Record<string, unknown>;

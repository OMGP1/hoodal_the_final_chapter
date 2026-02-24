import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Prisma } from '@prisma/client';

class SettingsService {
    /**
     * Get a single setting by key
     */
    async get(key: string) {
        const setting = await prisma.systemSetting.findUnique({
            where: { key },
        });

        if (!setting) {
            throw new AppError(ErrorCodes.NOT_FOUND, `Setting '${key}' not found`, 404);
        }

        return setting;
    }

    /**
     * Get all settings matching a prefix (e.g., 'shop.*', 'tax.*')
     * Returns as a flat Record<string, Json> for easy frontend consumption
     */
    async getByPrefix(prefix: string) {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { startsWith: prefix },
            },
            orderBy: { key: 'asc' },
        });

        // Convert to flat object: { "shop.name": "My Shop", "shop.address": "..." }
        const result: Record<string, any> = {};
        for (const s of settings) {
            result[s.key] = s.value;
        }
        return result;
    }

    /**
     * Get all settings as a flattened Record<string, Json>
     */
    async getAll() {
        const settings = await prisma.systemSetting.findMany({
            orderBy: { key: 'asc' },
        });

        const result: Record<string, any> = {};
        for (const s of settings) {
            result[s.key] = s.value;
        }
        return result;
    }

    /**
     * Create or update a single setting
     */
    async upsert(key: string, value: any) {
        return prisma.systemSetting.upsert({
            where: { key },
            create: { key, value: value as Prisma.InputJsonValue },
            update: { value: value as Prisma.InputJsonValue },
        });
    }

    /**
     * Bulk create/update settings in a single transaction
     */
    async bulkUpsert(settings: Array<{ key: string; value: any }>) {
        return prisma.$transaction(
            settings.map((s) =>
                prisma.systemSetting.upsert({
                    where: { key: s.key },
                    create: { key: s.key, value: s.value as Prisma.InputJsonValue },
                    update: { value: s.value as Prisma.InputJsonValue },
                })
            )
        );
    }
}

export const settingsService = new SettingsService();

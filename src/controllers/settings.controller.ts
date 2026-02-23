import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getAllSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.getAll();
    sendSuccess(res, settings);
});

export const getSettingsByPrefix = asyncHandler(async (req: Request, res: Response) => {
    const { prefix } = req.params;
    const settings = await settingsService.getByPrefix(prefix);
    sendSuccess(res, settings);
});

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
    const setting = await settingsService.get(req.params.key);
    sendSuccess(res, setting);
});

export const upsertSetting = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value } = req.body;
    const setting = await settingsService.upsert(key, value);
    sendSuccess(res, setting, 'Setting saved');
});

export const bulkUpsertSettings = asyncHandler(async (req: Request, res: Response) => {
    const { settings } = req.body;
    const result = await settingsService.bulkUpsert(settings);
    sendSuccess(res, result, `${result.length} settings saved`);
});

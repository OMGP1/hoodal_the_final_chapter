import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

// Inventory item endpoints
export const getInventoryOverview = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await inventoryService.getOverview();
    sendSuccess(res, stats);
});

export const getInventoryItems = asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.findAll(req.query as any);
    sendPaginated(res, result.items, result.pagination);
});

export const getInventoryItemById = asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.findById(req.params.id);
    sendSuccess(res, item);
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.adjustStock(
        req.params.id,
        req.body,
        req.user!.id
    );
    sendSuccess(res, item, 'Stock adjusted successfully');
});

export const recordDamage = asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.recordDamage(req.body, req.user!.id);
    sendSuccess(res, result, 'Damage recorded successfully');
});

export const getStockMovements = asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.getMovements(req.query as any);
    sendPaginated(res, result.movements, result.pagination);
});

export const getExpiringItems = asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const items = await inventoryService.getExpiringItems(days);
    sendSuccess(res, items);
});

export const getExpiredItems = asyncHandler(async (_req: Request, res: Response) => {
    const items = await inventoryService.getExpiredItems();
    sendSuccess(res, items);
});

export const addInventoryItem = asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.addInventoryItem(req.body, req.user!.id);
    sendSuccess(res, item, 'Inventory item added successfully', 201);
});

// Location endpoints
export const getLocations = asyncHandler(async (_req: Request, res: Response) => {
    const locations = await inventoryService.getLocations();
    sendSuccess(res, locations);
});

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await inventoryService.createLocation(req.body);
    sendSuccess(res, location, 'Location created successfully', 201);
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await inventoryService.updateLocation(req.params.id, req.body);
    sendSuccess(res, location, 'Location updated successfully');
});

export const deleteLocation = asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.deleteLocation(req.params.id);
    sendSuccess(res, result);
});

import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.findAll(req.query as any);
    sendPaginated(res, result.users, result.pagination);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.findById(req.params.id);
    sendSuccess(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.body);
    sendSuccess(res, user, 'User created successfully', 201);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id, req.body);
    sendSuccess(res, user, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.delete(req.params.id);
    sendSuccess(res, result);
});

export const assignRole = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.assignRole(req.params.id, req.body.roleId);
    sendSuccess(res, result, 'Role assigned successfully');
});

export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await userService.getRoles();
    sendSuccess(res, roles);
});

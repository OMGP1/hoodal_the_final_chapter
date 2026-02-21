import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    sendSuccess(res, tokens, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { refreshToken } = req.body;
    await authService.logout(userId, refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);
    sendSuccess(res, profile);
});

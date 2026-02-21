import { Request, Response } from 'express';
import { holdCartService } from '../services/holdCart.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Hold (park) a cart for later
 */
export const holdCart = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cart = await holdCartService.holdCart(req.body, user.id);
    sendSuccess(res, cart, 'Cart held successfully', 201);
});

/**
 * Get all held carts (user's own or all for manager)
 */
export const getHeldCarts = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const showAll = req.query.all === 'true';
    const carts = await holdCartService.getHeldCarts(user.id, showAll);
    sendSuccess(res, carts);
});

/**
 * Retrieve a held cart to continue checkout
 */
export const retrieveCart = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cart = await holdCartService.retrieveCart(req.params.holdNumber, user.id);
    sendSuccess(res, cart, 'Cart retrieved successfully');
});

/**
 * Delete a held cart (cancel hold)
 */
export const deleteHeldCart = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await holdCartService.deleteHeldCart(req.params.holdNumber, user.id);
    sendSuccess(res, result, 'Held cart deleted');
});

/**
 * Get held cart by hold number
 */
export const getHeldCartByNumber = asyncHandler(async (req: Request, res: Response) => {
    const cart = await holdCartService.getByHoldNumber(req.params.holdNumber);
    sendSuccess(res, cart);
});

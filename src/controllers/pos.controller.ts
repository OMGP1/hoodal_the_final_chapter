import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Validate cart before checkout
 */
export const validateCart = asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.validateCart(req.body.items);
    sendSuccess(res, result);
});

/**
 * Checkout - create order with payment
 */
export const checkout = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const order = await orderService.createOrder(req.body, user.id);
    sendSuccess(res, order, 'Order created successfully', 201);
});

/**
 * Get order by ID
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(req.params.id);
    sendSuccess(res, order);
});

/**
 * Get order by order number
 */
export const getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrderByNumber(req.params.orderNumber);
    sendSuccess(res, order);
});

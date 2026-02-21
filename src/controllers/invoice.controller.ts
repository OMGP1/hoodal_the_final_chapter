import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';

/**
 * Generate and return PDF invoice for an order
 * GET /api/v1/pos/orders/:id/invoice
 */
export const getOrderInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Order ID is required', 400);
    }

    const pdfBuffer = await invoiceService.generateOrderInvoice(id);

    // Set headers for PDF download/display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
});

/**
 * Generate and return PDF receipt for a return
 * GET /api/v1/pos/returns/:id/receipt
 */
export const getReturnReceipt = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Return ID is required', 400);
    }

    const pdfBuffer = await invoiceService.generateReturnReceipt(id);

    // Set headers for PDF download/display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="return-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
});

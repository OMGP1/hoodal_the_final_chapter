import PDFDocument from 'pdfkit';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { ErrorCodes } from '../utils/response';
import { Decimal } from '@prisma/client/runtime/library';

// 80mm thermal printer specs
const RECEIPT_WIDTH = 226; // 80mm in points
const FONT_SIZE_HEADER = 12;
const FONT_SIZE_NORMAL = 9;
const FONT_SIZE_SMALL = 7;
const LINE_HEIGHT = 12;

interface InvoiceData {
    order: {
        id: string;
        orderNumber: string;
        orderDate: Date;
        orderType: string;
        subtotal: Decimal;
        taxAmount: Decimal;
        discountAmount: Decimal;
        totalAmount: Decimal;
        paymentStatus: string;
        notes: string | null;
    };
    customer: {
        name: string;
        phone: string | null;
    } | null;
    items: Array<{
        productName: string;
        variantName: string | null;
        quantity: number;
        unitPrice: Decimal;
        discount: Decimal;
        taxAmount: Decimal;
        totalPrice: Decimal;
    }>;
    payments: Array<{
        method: string;
        amount: Decimal;
    }>;
}

export class InvoiceService {
    private shopName = 'SHOP NAME'; // TODO: Make configurable
    private shopAddress = '123 Main Street\nCity, State 123456';
    private shopPhone = '+91 98765 43210';
    private gstNumber = 'GST: XXXXXXXXXXXX'; // TODO: Make configurable

    /**
     * Generate PDF invoice for an order (80mm thermal format)
     */
    async generateOrderInvoice(orderId: string): Promise<Buffer> {
        // Fetch order with all related data
        const order = await prisma.salesOrder.findUnique({
            where: { id: orderId },
            include: {
                customer: { select: { name: true, phone: true } },
                items: {
                    include: {
                        salesOrder: false,
                    },
                },
                payments: { select: { paymentMethod: true, amount: true } },
            },
        });

        if (!order) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Order not found', 404);
        }

        // Fetch product names for items
        const productIds = order.items.map((i) => i.productId);
        const variantIds = order.items.filter((i) => i.variantId).map((i) => i.variantId!);

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });

        const variants = variantIds.length > 0
            ? await prisma.productVariant.findMany({
                where: { id: { in: variantIds } },
                select: { id: true, name: true },
            })
            : [];

        const productMap = new Map(products.map((p) => [p.id, p.name]));
        const variantMap = new Map(variants.map((v) => [v.id, v.name]));

        const invoiceData: InvoiceData = {
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                orderDate: order.orderDate,
                orderType: order.orderType,
                subtotal: order.subtotal,
                taxAmount: order.taxAmount,
                discountAmount: order.discountAmount,
                totalAmount: order.totalAmount,
                paymentStatus: order.paymentStatus,
                notes: order.notes,
            },
            customer: order.customer,
            items: order.items.map((item) => ({
                productName: productMap.get(item.productId) || 'Unknown',
                variantName: item.variantId ? variantMap.get(item.variantId) || null : null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                taxAmount: item.taxAmount,
                totalPrice: item.totalPrice,
            })),
            payments: order.payments.map((p) => ({
                method: p.paymentMethod,
                amount: p.amount,
            })),
        };

        return this.createThermalPDF(invoiceData);
    }

    /**
     * Generate PDF for return receipt
     */
    async generateReturnReceipt(returnId: string): Promise<Buffer> {
        const returnOrder = await prisma.returnOrder.findUnique({
            where: { id: returnId },
            include: {
                customer: { select: { name: true, phone: true } },
                items: true,
                originalOrder: { select: { orderNumber: true } },
            },
        });

        if (!returnOrder) {
            throw new AppError(ErrorCodes.NOT_FOUND, 'Return order not found', 404);
        }

        // Fetch product names
        const productIds = returnOrder.items.map((i) => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p.name]));

        return this.createReturnPDF(returnOrder, productMap);
    }

    /**
     * Create thermal receipt PDF
     */
    private createThermalPDF(data: InvoiceData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            const doc = new PDFDocument({
                size: [RECEIPT_WIDTH, 842], // 80mm width, A4 height (will auto-size)
                margins: { top: 10, bottom: 10, left: 5, right: 5 },
                autoFirstPage: true,
            });

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            let y = 10;

            // === HEADER ===
            doc.fontSize(FONT_SIZE_HEADER).font('Helvetica-Bold');
            doc.text(this.shopName, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT + 2;

            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
            doc.text(this.shopAddress, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT * 2;

            doc.text(`Tel: ${this.shopPhone}`, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT;

            doc.text(this.gstNumber, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT + 5;

            // Divider
            this.drawDivider(doc, y);
            y += 8;

            // === ORDER INFO ===
            doc.fontSize(FONT_SIZE_NORMAL).font('Helvetica-Bold');
            doc.text('TAX INVOICE', 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT + 3;

            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
            doc.text(`Invoice #: ${data.order.orderNumber}`, 5, y);
            y += LINE_HEIGHT;

            const dateStr = data.order.orderDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            doc.text(`Date: ${dateStr}`, 5, y);
            y += LINE_HEIGHT;

            if (data.customer) {
                doc.text(`Customer: ${data.customer.name}`, 5, y);
                y += LINE_HEIGHT;
                if (data.customer.phone) {
                    doc.text(`Phone: ${data.customer.phone}`, 5, y);
                    y += LINE_HEIGHT;
                }
            }

            y += 3;
            this.drawDivider(doc, y);
            y += 8;

            // === ITEMS HEADER ===
            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica-Bold');
            doc.text('Item', 5, y, { width: 100 });
            doc.text('Qty', 105, y, { width: 30, align: 'center' });
            doc.text('Rate', 135, y, { width: 40, align: 'right' });
            doc.text('Amt', 175, y, { width: 46, align: 'right' });
            y += LINE_HEIGHT;

            this.drawDivider(doc, y, '-');
            y += 5;

            // === ITEMS ===
            doc.font('Helvetica');
            for (const item of data.items) {
                const itemName = item.variantName
                    ? `${item.productName} (${item.variantName})`
                    : item.productName;

                // Truncate long names
                const displayName = itemName.length > 18 ? itemName.substring(0, 17) + '..' : itemName;

                doc.text(displayName, 5, y, { width: 100 });
                doc.text(String(item.quantity), 105, y, { width: 30, align: 'center' });
                doc.text(this.formatCurrency(item.unitPrice), 135, y, { width: 40, align: 'right' });
                doc.text(this.formatCurrency(item.totalPrice), 175, y, { width: 46, align: 'right' });
                y += LINE_HEIGHT;

                // Show discount if any
                if (Number(item.discount) > 0) {
                    doc.fontSize(FONT_SIZE_SMALL - 1);
                    doc.text(`  Disc: -${this.formatCurrency(item.discount)}`, 5, y);
                    y += LINE_HEIGHT - 2;
                    doc.fontSize(FONT_SIZE_SMALL);
                }
            }

            y += 3;
            this.drawDivider(doc, y);
            y += 8;

            // === TOTALS ===
            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');

            // Subtotal
            doc.text('Subtotal:', 5, y, { width: 120 });
            doc.text(this.formatCurrency(data.order.subtotal), 125, y, { width: 96, align: 'right' });
            y += LINE_HEIGHT;

            // Discount
            if (Number(data.order.discountAmount) > 0) {
                doc.text('Discount:', 5, y, { width: 120 });
                doc.text(`-${this.formatCurrency(data.order.discountAmount)}`, 125, y, { width: 96, align: 'right' });
                y += LINE_HEIGHT;
            }

            // Tax
            doc.text('Tax:', 5, y, { width: 120 });
            doc.text(this.formatCurrency(data.order.taxAmount), 125, y, { width: 96, align: 'right' });
            y += LINE_HEIGHT;

            this.drawDivider(doc, y, '-');
            y += 5;

            // Grand Total
            doc.fontSize(FONT_SIZE_NORMAL).font('Helvetica-Bold');
            doc.text('TOTAL:', 5, y, { width: 120 });
            doc.text(`₹${this.formatCurrency(data.order.totalAmount)}`, 125, y, { width: 96, align: 'right' });
            y += LINE_HEIGHT + 5;

            this.drawDivider(doc, y);
            y += 8;

            // === PAYMENT INFO ===
            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
            doc.text('Payment Method:', 5, y);
            y += LINE_HEIGHT;

            for (const payment of data.payments) {
                const methodLabel = payment.method.charAt(0).toUpperCase() + payment.method.slice(1);
                doc.text(`  ${methodLabel}: ₹${this.formatCurrency(payment.amount)}`, 5, y);
                y += LINE_HEIGHT;
            }

            y += 5;
            this.drawDivider(doc, y);
            y += 10;

            // === FOOTER ===
            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
            doc.text('Thank you for shopping with us!', 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT;

            doc.text('Please keep this receipt for returns.', 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT + 10;

            // Barcode placeholder (order number in text)
            doc.fontSize(FONT_SIZE_SMALL);
            doc.text(data.order.orderNumber, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });

            doc.end();
        });
    }

    /**
     * Create return receipt PDF
     */
    private createReturnPDF(
        returnOrder: any,
        productMap: Map<string, string>
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            const doc = new PDFDocument({
                size: [RECEIPT_WIDTH, 600],
                margins: { top: 10, bottom: 10, left: 5, right: 5 },
            });

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            let y = 10;

            // Header
            doc.fontSize(FONT_SIZE_HEADER).font('Helvetica-Bold');
            doc.text(this.shopName, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT + 5;

            doc.fontSize(FONT_SIZE_NORMAL).font('Helvetica-Bold');
            doc.text('RETURN RECEIPT', 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
            y += LINE_HEIGHT + 5;

            this.drawDivider(doc, y);
            y += 8;

            // Return info
            doc.fontSize(FONT_SIZE_SMALL).font('Helvetica');
            doc.text(`Return #: ${returnOrder.returnNumber}`, 5, y);
            y += LINE_HEIGHT;
            doc.text(`Original Order: ${returnOrder.originalOrder.orderNumber}`, 5, y);
            y += LINE_HEIGHT;
            doc.text(`Date: ${returnOrder.createdAt.toLocaleDateString('en-IN')}`, 5, y);
            y += LINE_HEIGHT;

            if (returnOrder.reason) {
                doc.text(`Reason: ${returnOrder.reason}`, 5, y);
                y += LINE_HEIGHT;
            }

            y += 5;
            this.drawDivider(doc, y);
            y += 8;

            // Items
            doc.font('Helvetica-Bold');
            doc.text('Returned Items:', 5, y);
            y += LINE_HEIGHT;

            doc.font('Helvetica');
            for (const item of returnOrder.items) {
                const name = productMap.get(item.productId) || 'Unknown';
                doc.text(`${name} x${item.quantity}`, 5, y, { width: 130 });
                doc.text(this.formatCurrency(item.totalRefund), 135, y, { width: 86, align: 'right' });
                y += LINE_HEIGHT;
            }

            y += 5;
            this.drawDivider(doc, y);
            y += 8;

            // Refund total
            doc.font('Helvetica-Bold');
            doc.text('REFUND TOTAL:', 5, y, { width: 130 });
            doc.text(`₹${this.formatCurrency(returnOrder.totalAmount)}`, 135, y, { width: 86, align: 'right' });
            y += LINE_HEIGHT;

            doc.font('Helvetica');
            doc.text(`Refund via: ${returnOrder.refundMethod.toUpperCase()}`, 5, y);

            doc.end();
        });
    }

    /**
     * Draw a divider line
     */
    private drawDivider(doc: PDFKit.PDFDocument, y: number, char: string = '='): void {
        doc.fontSize(FONT_SIZE_SMALL);
        const line = char.repeat(Math.floor((RECEIPT_WIDTH - 10) / 4));
        doc.text(line, 5, y, { width: RECEIPT_WIDTH - 10, align: 'center' });
    }

    /**
     * Format currency without symbol
     */
    private formatCurrency(amount: Decimal | number): string {
        const num = typeof amount === 'number' ? amount : Number(amount);
        return num.toFixed(2);
    }
}

export const invoiceService = new InvoiceService();

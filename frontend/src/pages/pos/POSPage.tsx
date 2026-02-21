import { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { POSLayout } from '@/components/pos/POSLayout';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal, type PaymentData } from '@/components/pos/PaymentModal';
import { HeldOrdersModal } from '@/components/pos/HeldOrdersModal';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePOSKeyboard, POS_SHORTCUTS } from '@/hooks/usePOSKeyboard';
import { useCartStore, useCartTotals } from '@/stores/cartStore';
import { useHeldOrdersStore, type HeldOrder } from '@/stores/heldOrdersStore';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { Product } from '@/types';

export default function POSPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Modal states
    const [showPayment, setShowPayment] = useState(false);
    const [showHeldOrders, setShowHeldOrders] = useState(false);

    // Cart store
    const addItem = useCartStore((state) => state.addItem);
    const clearCart = useCartStore((state) => state.clearCart);
    const items = useCartStore((state) => state.items);
    const customer = useCartStore((state) => state.customer);
    const notes = useCartStore((state) => state.notes);
    const { grandTotal, taxTotal, subtotal } = useCartTotals();

    // Held orders store
    const holdOrder = useHeldOrdersStore((state) => state.holdOrder);

    // Handle product selection
    const handleProductSelect = useCallback(
        (product: Product) => {
            addItem(product, 1);
            toast.success(`Added ${product.name} to cart`);
        },
        [addItem]
    );

    // Barcode scanner integration
    const { data: productByBarcode } = useQuery({
        queryKey: ['product-by-barcode'],
        queryFn: () => null,
        enabled: false,
    });

    useBarcodeScanner({
        onScan: async (barcode) => {
            try {
                // Search for product by barcode
                const response = await api.get<{ success: boolean; data: { products: Product[] } }>(
                    '/products',
                    { params: { search: barcode, pageSize: 1 } }
                );

                const products = response.data.data.products;
                if (products.length > 0) {
                    handleProductSelect(products[0]);
                } else {
                    toast.error(`No product found for barcode: ${barcode}`);
                }
            } catch {
                toast.error('Failed to search product by barcode');
            }
        },
        enabled: !showPayment && !showHeldOrders,
    });

    // Keyboard shortcuts
    usePOSKeyboard({
        enabled: !showPayment && !showHeldOrders,
        shortcuts: [
            {
                ...POS_SHORTCUTS.NEW_SALE,
                action: () => {
                    if (items.length > 0) {
                        if (window.confirm('Clear current cart and start a new sale?')) {
                            clearCart();
                        }
                    }
                },
            },
            {
                ...POS_SHORTCUTS.HOLD_ORDER,
                action: () => handleHoldOrder(),
            },
            {
                ...POS_SHORTCUTS.RECALL_ORDER,
                action: () => setShowHeldOrders(true),
            },
            {
                ...POS_SHORTCUTS.PAYMENT,
                action: () => items.length > 0 && setShowPayment(true),
            },
            {
                ...POS_SHORTCUTS.CANCEL,
                action: () => {
                    // Close modals or navigate back
                    if (showPayment) setShowPayment(false);
                    else if (showHeldOrders) setShowHeldOrders(false);
                },
            },
            {
                ...POS_SHORTCUTS.SEARCH_FOCUS,
                action: () => searchInputRef.current?.focus(),
            },
        ],
    });

    // Hold current order
    const handleHoldOrder = () => {
        if (items.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        const orderId = holdOrder({
            items,
            customer,
            notes,
            subtotal,
            taxTotal,
            grandTotal,
        });

        clearCart();
        toast.success(`Order ${orderId} held successfully`);
    };

    // Recall held order
    const handleRecallOrder = (order: HeldOrder) => {
        if (items.length > 0) {
            if (!window.confirm('Replace current cart with recalled order?')) {
                return;
            }
        }

        // Restore cart state
        for (const item of order.items) {
            // We need to reconstruct the product object
            const product: Product = {
                id: item.productId,
                name: item.name,
                sku: item.sku,
                barcode: item.barcode || null,
                sellingPrice: item.unitPrice,
                taxRate: item.taxRate,
                // Other fields will be ignored by addItem
            } as Product;

            useCartStore.getState().addItem(product, item.quantity);
        }

        if (order.notes) {
            useCartStore.getState().setNotes(order.notes);
        }

        toast.success('Order recalled successfully');
    };

    // Create sale mutation
    const createSaleMutation = useMutation({
        mutationFn: async (paymentData: PaymentData) => {
            const response = await api.post('/sales', {
                items: items.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    taxRate: item.taxRate,
                })),
                customerId: customer?.id,
                notes,
                payment: {
                    method: paymentData.method,
                    amount: paymentData.amountPaid,
                    reference: paymentData.reference,
                },
                subtotal,
                taxAmount: taxTotal,
                grandTotal,
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            clearCart();
            setShowPayment(false);
            toast.success('Sale completed successfully!');
            // TODO: Show receipt or print
        },
        onError: () => {
            toast.error('Failed to complete sale');
        },
    });

    const handlePaymentComplete = (paymentData: PaymentData) => {
        createSaleMutation.mutate(paymentData);
    };

    return (
        <>
            <POSLayout
                leftPanel={
                    <div className="flex flex-col h-full">
                        {/* Search bar */}
                        <div className="p-4 border-b">
                            <ProductSearch
                                onProductSelect={handleProductSelect}
                                inputRef={searchInputRef}
                            />
                            {/* Keyboard shortcuts hint */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                        Alt+N
                                    </kbd>{' '}
                                    New
                                </span>
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                        Alt+H
                                    </kbd>{' '}
                                    Hold
                                </span>
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                        Alt+R
                                    </kbd>{' '}
                                    Recall
                                </span>
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                        Alt+P
                                    </kbd>{' '}
                                    Pay
                                </span>
                                <span>
                                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                        /
                                    </kbd>{' '}
                                    Search
                                </span>
                            </div>
                        </div>

                        {/* Product grid */}
                        <ProductGrid onProductSelect={handleProductSelect} />
                    </div>
                }
                rightPanel={
                    <CartPanel
                        onPayment={() => setShowPayment(true)}
                        onHold={handleHoldOrder}
                        onRecall={() => setShowHeldOrders(true)}
                    />
                }
            >
                {null}
            </POSLayout>

            {/* Payment modal */}
            <PaymentModal
                open={showPayment}
                onClose={() => setShowPayment(false)}
                onComplete={handlePaymentComplete}
            />

            {/* Held orders modal */}
            <HeldOrdersModal
                open={showHeldOrders}
                onClose={() => setShowHeldOrders(false)}
                onRecall={handleRecallOrder}
            />
        </>
    );
}

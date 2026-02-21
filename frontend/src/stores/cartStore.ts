import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    barcode?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount: number; // per item discount amount
    lineTotal: number; // (unitPrice * quantity) - discount
    lineTax: number; // tax on this line
}

export interface CartCustomer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    gstin?: string; // For B2B GST invoices
}

interface CartState {
    items: CartItem[];
    customer: CartCustomer | null;
    orderDiscount: number; // Flat discount on entire order
    orderDiscountPercent: number; // Percentage discount on entire order
    notes: string;

    // Actions
    addItem: (product: Product, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    setItemDiscount: (productId: string, discount: number) => void;
    setOrderDiscount: (amount: number) => void;
    setOrderDiscountPercent: (percent: number) => void;
    setCustomer: (customer: CartCustomer | null) => void;
    setNotes: (notes: string) => void;
    clearCart: () => void;

    // Computed (implemented as getters in component or selectors)
}

// Helper to calculate line totals
function calculateLineItem(
    unitPrice: number,
    quantity: number,
    taxRate: number,
    discount: number
): { lineTotal: number; lineTax: number } {
    const subtotal = unitPrice * quantity;
    const afterDiscount = subtotal - discount;
    const lineTax = afterDiscount * (taxRate / 100);
    const lineTotal = afterDiscount + lineTax;
    return { lineTotal, lineTax };
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            customer: null,
            orderDiscount: 0,
            orderDiscountPercent: 0,
            notes: '',

            addItem: (product: Product, quantity = 1) => {
                const { items } = get();
                const existingIndex = items.findIndex(
                    (item) => item.productId === product.id
                );

                if (existingIndex >= 0) {
                    // Update existing item quantity
                    const updatedItems = [...items];
                    const existing = updatedItems[existingIndex];
                    const newQuantity = existing.quantity + quantity;
                    const { lineTotal, lineTax } = calculateLineItem(
                        existing.unitPrice,
                        newQuantity,
                        existing.taxRate,
                        existing.discount
                    );
                    updatedItems[existingIndex] = {
                        ...existing,
                        quantity: newQuantity,
                        lineTotal,
                        lineTax,
                    };
                    set({ items: updatedItems });
                } else {
                    // Add new item
                    const unitPrice = Number(product.sellingPrice);
                    const taxRate = Number(product.taxRate);
                    const { lineTotal, lineTax } = calculateLineItem(
                        unitPrice,
                        quantity,
                        taxRate,
                        0
                    );

                    const newItem: CartItem = {
                        productId: product.id,
                        name: product.name,
                        sku: product.sku,
                        barcode: product.barcode || undefined,
                        quantity,
                        unitPrice,
                        taxRate,
                        discount: 0,
                        lineTotal,
                        lineTax,
                    };
                    set({ items: [...items, newItem] });
                }
            },

            updateQuantity: (productId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.productId !== productId) return item;
                        const { lineTotal, lineTax } = calculateLineItem(
                            item.unitPrice,
                            quantity,
                            item.taxRate,
                            item.discount
                        );
                        return { ...item, quantity, lineTotal, lineTax };
                    }),
                }));
            },

            removeItem: (productId: string) => {
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                }));
            },

            setItemDiscount: (productId: string, discount: number) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.productId !== productId) return item;
                        const { lineTotal, lineTax } = calculateLineItem(
                            item.unitPrice,
                            item.quantity,
                            item.taxRate,
                            discount
                        );
                        return { ...item, discount, lineTotal, lineTax };
                    }),
                }));
            },

            setOrderDiscount: (orderDiscount: number) => {
                set({ orderDiscount, orderDiscountPercent: 0 });
            },

            setOrderDiscountPercent: (orderDiscountPercent: number) => {
                set({ orderDiscountPercent, orderDiscount: 0 });
            },

            setCustomer: (customer: CartCustomer | null) => {
                set({ customer });
            },

            setNotes: (notes: string) => {
                set({ notes });
            },

            clearCart: () => {
                set({
                    items: [],
                    customer: null,
                    orderDiscount: 0,
                    orderDiscountPercent: 0,
                    notes: '',
                });
            },
        }),
        {
            name: 'pos-cart-storage',
            // Only persist items and customer, not transient state
            partialize: (state) => ({
                items: state.items,
                customer: state.customer,
                notes: state.notes,
            }),
        }
    )
);

// Selector functions for computed values
export function useCartTotals() {
    const items = useCartStore((state) => state.items);
    const orderDiscount = useCartStore((state) => state.orderDiscount);
    const orderDiscountPercent = useCartStore((state) => state.orderDiscountPercent);

    const subtotal = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
    );

    const itemDiscountTotal = items.reduce((sum, item) => sum + item.discount, 0);

    const taxableAmount = subtotal - itemDiscountTotal;

    const taxTotal = items.reduce((sum, item) => sum + item.lineTax, 0);

    // Apply order-level discount
    let finalDiscount = orderDiscount;
    if (orderDiscountPercent > 0) {
        finalDiscount = (taxableAmount + taxTotal) * (orderDiscountPercent / 100);
    }

    const grandTotal = taxableAmount + taxTotal - finalDiscount;

    return {
        subtotal,
        itemDiscountTotal,
        taxTotal,
        orderDiscount: finalDiscount,
        grandTotal: Math.max(0, grandTotal),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartCustomer } from './cartStore';

export interface HeldOrder {
    id: string;
    items: CartItem[];
    customer: CartCustomer | null;
    notes: string;
    heldAt: string; // ISO date string
    heldBy?: string; // User ID who held the order
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
}

interface HeldOrdersState {
    orders: HeldOrder[];

    // Actions
    holdOrder: (order: Omit<HeldOrder, 'id' | 'heldAt'>) => string;
    recallOrder: (orderId: string) => HeldOrder | null;
    deleteOrder: (orderId: string) => void;
    clearAllOrders: () => void;
}

// Generate unique ID for held orders
function generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `HOLD-${timestamp}-${random}`.toUpperCase();
}

export const useHeldOrdersStore = create<HeldOrdersState>()(
    persist(
        (set, get) => ({
            orders: [],

            holdOrder: (orderData) => {
                const id = generateOrderId();
                const newOrder: HeldOrder = {
                    ...orderData,
                    id,
                    heldAt: new Date().toISOString(),
                };

                set((state) => ({
                    orders: [newOrder, ...state.orders],
                }));

                return id;
            },

            recallOrder: (orderId: string) => {
                const { orders } = get();
                const order = orders.find((o) => o.id === orderId);

                if (order) {
                    // Remove the order from held list when recalled
                    set((state) => ({
                        orders: state.orders.filter((o) => o.id !== orderId),
                    }));
                    return order;
                }

                return null;
            },

            deleteOrder: (orderId: string) => {
                set((state) => ({
                    orders: state.orders.filter((o) => o.id !== orderId),
                }));
            },

            clearAllOrders: () => {
                set({ orders: [] });
            },
        }),
        {
            name: 'pos-held-orders-storage',
        }
    )
);

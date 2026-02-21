import { Minus, Plus, Trash2, User, MessageSquare, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore, useCartTotals, type CartItem } from '@/stores/cartStore';

interface CartPanelProps {
    onPayment: () => void;
    onHold: () => void;
    onRecall: () => void;
}

export function CartPanel({ onPayment, onHold, onRecall }: CartPanelProps) {
    const items = useCartStore((state) => state.items);
    const customer = useCartStore((state) => state.customer);
    const notes = useCartStore((state) => state.notes);
    const setNotes = useCartStore((state) => state.setNotes);
    const clearCart = useCartStore((state) => state.clearCart);
    const orderDiscountPercent = useCartStore((state) => state.orderDiscountPercent);
    const setOrderDiscountPercent = useCartStore((state) => state.setOrderDiscountPercent);

    const { subtotal, itemDiscountTotal, taxTotal, orderDiscount, grandTotal, itemCount } =
        useCartTotals();

    return (
        <div className="flex flex-col h-full">
            {/* Cart header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Current Sale</h2>
                    <span className="text-sm text-muted-foreground">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Customer selection */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 justify-start"
                >
                    <User className="h-4 w-4 mr-2" />
                    {customer ? customer.name : 'Add Customer (Optional)'}
                </Button>
            </div>

            {/* Cart items */}
            <ScrollArea className="flex-1">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p className="text-lg mb-1">Cart is empty</p>
                        <p className="text-sm">Search or select products to add</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map((item) => (
                            <CartItemRow key={item.productId} item={item} />
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Order notes */}
            {items.length > 0 && (
                <div className="px-4 py-2 border-t">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Add order notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Totals */}
            {items.length > 0 && (
                <div className="p-4 border-t bg-muted/30 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>

                    {itemDiscountTotal > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Item Discounts</span>
                            <span>-₹{itemDiscountTotal.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (GST)</span>
                        <span>₹{taxTotal.toFixed(2)}</span>
                    </div>

                    {/* Order discount */}
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder="Discount %"
                            value={orderDiscountPercent || ''}
                            onChange={(e) =>
                                setOrderDiscountPercent(Number(e.target.value) || 0)
                            }
                            className="h-8 w-24 text-sm"
                            min={0}
                            max={100}
                        />
                        {orderDiscount > 0 && (
                            <span className="text-sm text-green-600">
                                -₹{orderDiscount.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <Separator className="my-2" />

                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="p-4 border-t space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRecall}
                    >
                        Recall
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onHold}
                        disabled={items.length === 0}
                    >
                        Hold
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearCart}
                        disabled={items.length === 0}
                    >
                        Clear
                    </Button>
                </div>

                <Button
                    className="w-full h-12 text-lg font-semibold"
                    disabled={items.length === 0}
                    onClick={onPayment}
                >
                    Pay ₹{grandTotal.toFixed(2)}
                </Button>
            </div>
        </div>
    );
}

interface CartItemRowProps {
    item: CartItem;
}

function CartItemRow({ item }: CartItemRowProps) {
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);

    return (
        <div className="p-3 hover:bg-muted/50">
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {item.sku} • ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                    </div>
                    {item.discount > 0 && (
                        <div className="text-xs text-green-600">
                            Discount: -₹{item.discount.toFixed(2)}
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <div className="font-semibold text-sm">
                        ₹{item.lineTotal.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        incl. ₹{item.lineTax.toFixed(2)} tax
                    </div>
                </div>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default CartPanel;

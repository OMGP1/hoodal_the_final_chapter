import { formatDistanceToNow } from 'date-fns';
import { Clock, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useHeldOrdersStore, type HeldOrder } from '@/stores/heldOrdersStore';

interface HeldOrdersModalProps {
    open: boolean;
    onClose: () => void;
    onRecall: (order: HeldOrder) => void;
}

export function HeldOrdersModal({ open, onClose, onRecall }: HeldOrdersModalProps) {
    const orders = useHeldOrdersStore((state) => state.orders);
    const deleteOrder = useHeldOrdersStore((state) => state.deleteOrder);

    const handleRecall = (order: HeldOrder) => {
        onRecall(order);
        onClose();
    };

    const handleDelete = (orderId: string) => {
        if (window.confirm('Are you sure you want to delete this held order?')) {
            deleteOrder(orderId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Held Orders
                        <Badge variant="secondary">{orders.length}</Badge>
                    </DialogTitle>
                </DialogHeader>

                {orders.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">No held orders</p>
                        <p className="text-sm">
                            Hold an order to save it for later
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <HeldOrderCard
                                    key={order.id}
                                    order={order}
                                    onRecall={() => handleRecall(order)}
                                    onDelete={() => handleDelete(order.id)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface HeldOrderCardProps {
    order: HeldOrder;
    onRecall: () => void;
    onDelete: () => void;
}

function HeldOrderCard({ order, onRecall, onDelete }: HeldOrderCardProps) {
    const timeAgo = formatDistanceToNow(new Date(order.heldAt), {
        addSuffix: true,
    });

    return (
        <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="font-medium flex items-center gap-2">
                        <span>{order.id}</span>
                        {order.customer && (
                            <Badge variant="outline">{order.customer.name}</Badge>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-semibold text-lg">
                        ₹{order.grandTotal.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Preview items */}
            <div className="text-sm text-muted-foreground mb-3">
                {order.items.slice(0, 3).map((item, i) => (
                    <span key={item.productId}>
                        {i > 0 && ', '}
                        {item.name} ×{item.quantity}
                    </span>
                ))}
                {order.items.length > 3 && (
                    <span>, +{order.items.length - 3} more</span>
                )}
            </div>

            {order.notes && (
                <div className="text-sm text-muted-foreground italic mb-3">
                    "{order.notes}"
                </div>
            )}

            <Separator className="my-3" />

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </Button>
                <Button size="sm" className="flex-1" onClick={onRecall}>
                    Recall to Cart
                    <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

export default HeldOrdersModal;

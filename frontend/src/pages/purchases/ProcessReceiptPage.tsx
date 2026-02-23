import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Package, Save } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function ProcessReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [notes, setNotes] = useState('');
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

    // Fetch PO
    const { data: poResponse, isLoading } = useQuery({
        queryKey: ['purchase-order', id],
        queryFn: async () => {
            const response = await api.get(`/purchase-orders/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const order = poResponse?.data;

    // Receive Mutation
    const receiveGoods = useMutation({
        mutationFn: async (payload: { items: any[], notes?: string }) => {
            await api.post(`/purchase-orders/${id}/receive`, payload);
        },
        onSuccess: () => {
            toast.success('Goods received successfully');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
            navigate('/purchases/receive');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to process receipt');
        },
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading order details...</div>;
    }

    if (!order) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Order not found.</p>
                <Button variant="outline" onClick={() => navigate('/purchases/receive')}>
                    Go Back
                </Button>
            </div>
        );
    }

    const items = order.items || [];
    const isFullyReceived = order.status === 'received';

    const handleQuantityChange = (itemId: string, value: string, maxPending: number) => {
        const qty = parseInt(value, 10);
        if (isNaN(qty) || qty < 0) {
            setReceivedQuantities((prev) => ({ ...prev, [itemId]: 0 }));
            return;
        }
        setReceivedQuantities((prev) => ({
            ...prev,
            [itemId]: Math.min(qty, maxPending) // cap at max pending
        }));
    };

    const handleReceiveAll = () => {
        const newQuantities: Record<string, number> = {};
        items.forEach((item: any) => {
            const pending = item.orderedQty - (item.receivedQty || 0);
            if (pending > 0) {
                newQuantities[item.id] = pending;
            }
        });
        setReceivedQuantities(newQuantities);
    };

    const handleSubmit = () => {
        const receiveItems = Object.entries(receivedQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, qty]) => ({
                purchaseOrderItemId: itemId,
                quantityReceived: qty,
            }));

        if (receiveItems.length === 0) {
            toast.error('Please enter quantities to receive.');
            return;
        }

        receiveGoods.mutate({
            items: receiveItems,
            notes: notes || undefined,
        });
    };

    const hasItemsToReceive = items.some((item: any) => item.orderedQty > (item.receivedQty || 0));

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/purchases/receive')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Process Receipt: {order.poNumber}</h1>
                    <p className="text-muted-foreground">
                        Supplier: {order.supplier?.name} | Ordered: {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {isFullyReceived ? (
                <Card className="bg-emerald-50/50 border-emerald-200">
                    <CardContent className="pt-6 flex flex-col items-center justify-center p-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                        <h2 className="text-xl font-semibold text-emerald-900 mb-2">Order Fully Received</h2>
                        <p className="text-emerald-700">All items for this purchase order have been received into inventory.</p>
                        <Button className="mt-6" variant="outline" onClick={() => navigate('/purchases/receive')}>
                            Return to Receiving List
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Items to Receive</CardTitle>
                            {hasItemsToReceive && (
                                <Button variant="secondary" size="sm" onClick={handleReceiveAll}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Receive All Pending
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Ordered</TableHead>
                                            <TableHead className="text-right">Received</TableHead>
                                            <TableHead className="text-right">Pending</TableHead>
                                            <TableHead className="w-40 text-right">To Receive</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item: any) => {
                                            const pending = item.orderedQty - (item.receivedQty || 0);
                                            const isComplete = pending === 0;

                                            return (
                                                <TableRow key={item.id} className={isComplete ? 'bg-muted/50' : ''}>
                                                    <TableCell>
                                                        <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                                                        <div className="text-xs text-muted-foreground">SKU: {item.product?.sku}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{item.orderedQty}</TableCell>
                                                    <TableCell className="text-right text-emerald-600 font-medium">{item.receivedQty || 0}</TableCell>
                                                    <TableCell className="text-right font-medium">{pending}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={pending}
                                                                disabled={isComplete || receiveGoods.isPending}
                                                                value={receivedQuantities[item.id] === undefined ? '' : receivedQuantities[item.id]}
                                                                onChange={(e) => handleQuantityChange(item.id, e.target.value, pending)}
                                                                className="w-24 text-right"
                                                                placeholder={isComplete ? "Done" : "0"}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {hasItemsToReceive && (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Receiving Notes (Optional)</Label>
                                    <Textarea
                                        placeholder="Add any notes about this delivery (e.g. damages, carrier info)..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={receiveGoods.isPending || Object.values(receivedQuantities).every(q => !q)}
                                    >
                                        <Package className="mr-2 h-5 w-5" />
                                        Confirm Receipt
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

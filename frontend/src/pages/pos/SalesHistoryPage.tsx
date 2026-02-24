import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Search, ShoppingCart, ChevronDown, ChevronUp,
    Printer, RotateCcw, Calendar, Filter,
} from 'lucide-react';
import { format } from 'date-fns';

import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface OrderListItem {
    id: string;
    orderNumber: string;
    orderDate: string;
    orderType: string;
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    paymentStatus: string;
    orderStatus: string;
    customer: { id: string; name: string; phone: string | null } | null;
    _count: { items: number };
}

interface OrderDetail {
    id: string;
    orderNumber: string;
    items: {
        id: string;
        productName: string;
        variantName: string | null;
        quantity: number;
        unitPrice: string;
        discount: string;
        taxAmount: string;
        totalPrice: string;
    }[];
    payments: {
        id: string;
        method: string;
        amount: string;
    }[];
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function SalesHistoryPage() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Debounce search
    const handleSearchChange = (value: string) => {
        setSearch(value);
        clearTimeout((window as any).__salesSearchTimeout);
        (window as any).__salesSearchTimeout = setTimeout(() => {
            setDebouncedSearch(value);
            setPage(1);
        }, 400);
    };

    // List orders query
    const { data, isLoading } = useQuery({
        queryKey: ['pos-orders', page, debouncedSearch, paymentFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '25');
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);

            const res = await api.get<{
                success: boolean;
                data: { orders: OrderListItem[]; pagination: PaginationInfo };
            }>(`/pos/orders?${params.toString()}`);
            return res.data.data;
        },
    });

    // Fetch order details on expand
    const { data: orderDetail, isLoading: loadingDetail } = useQuery({
        queryKey: ['pos-order-detail', expandedOrderId],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: OrderDetail }>(
                `/pos/orders/${expandedOrderId}`
            );
            return res.data.data;
        },
        enabled: !!expandedOrderId,
    });

    const orders = data?.orders || [];
    const pagination = data?.pagination;

    const statusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'default' as const;
            case 'partial': return 'secondary' as const;
            case 'refunded': return 'destructive' as const;
            default: return 'outline' as const;
        }
    };

    const handlePrintInvoice = async (orderId: string) => {
        try {
            const res = await api.get(`/pos/orders/${orderId}/invoice`, {
                responseType: 'blob',
            });
            const url = URL.createObjectURL(res.data);
            window.open(url, '_blank');
        } catch {
            // Silently handle — PDF generation may not be available
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
                    <p className="text-muted-foreground">
                        View and manage all POS transactions
                    </p>
                </div>
                {pagination && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                        {pagination.total} Total Orders
                    </Badge>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by order number..."
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-48">
                            <Select
                                value={paymentFilter}
                                onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}
                            >
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Payment Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>Click a row to view line items and payment details</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                            <p className="text-lg font-medium">No orders found</p>
                            <p className="text-sm">Sales made through POS will appear here.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead></TableHead>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-center">Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-center">Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <>
                                            <TableRow
                                                key={order.id}
                                                className="cursor-pointer hover:bg-muted/60"
                                                onClick={() => toggleExpand(order.id)}
                                            >
                                                <TableCell className="w-8">
                                                    {expandedOrderId === order.id
                                                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                </TableCell>
                                                <TableCell className="font-medium font-mono">
                                                    {order.orderNumber}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(order.orderDate), 'dd MMM yyyy, hh:mm a')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {order.customer?.name || 'Walk-in Customer'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">{order._count.items}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    ₹{Number(order.totalAmount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={statusColor(order.paymentStatus)}>
                                                        {order.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            title="Reprint invoice"
                                                            onClick={() => handlePrintInvoice(order.id)}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded detail row */}
                                            {expandedOrderId === order.id && (
                                                <TableRow key={`${order.id}-detail`}>
                                                    <TableCell colSpan={8} className="bg-muted/30 p-0">
                                                        <div className="p-4 space-y-4">
                                                            {loadingDetail ? (
                                                                <div className="space-y-2">
                                                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8" />)}
                                                                </div>
                                                            ) : orderDetail ? (
                                                                <div className="grid md:grid-cols-3 gap-6">
                                                                    {/* Line items */}
                                                                    <div className="md:col-span-2">
                                                                        <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                                                                        <div className="rounded-md border bg-background">
                                                                            <Table>
                                                                                <TableHeader>
                                                                                    <TableRow>
                                                                                        <TableHead>Product</TableHead>
                                                                                        <TableHead className="text-center">Qty</TableHead>
                                                                                        <TableHead className="text-right">Unit Price</TableHead>
                                                                                        <TableHead className="text-right">Total</TableHead>
                                                                                    </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {orderDetail.items.map((item) => (
                                                                                        <TableRow key={item.id}>
                                                                                            <TableCell>
                                                                                                <span className="font-medium">{item.productName}</span>
                                                                                                {item.variantName && (
                                                                                                    <span className="text-xs text-muted-foreground ml-1">
                                                                                                        ({item.variantName})
                                                                                                    </span>
                                                                                                )}
                                                                                            </TableCell>
                                                                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                                                                            <TableCell className="text-right">₹{Number(item.unitPrice).toLocaleString()}</TableCell>
                                                                                            <TableCell className="text-right font-medium">₹{Number(item.totalPrice).toLocaleString()}</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </div>
                                                                    </div>

                                                                    {/* Payments */}
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold mb-2">Payments</h4>
                                                                        <div className="space-y-2">
                                                                            {orderDetail.payments.map((payment) => (
                                                                                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                                                                    <Badge variant="outline" className="capitalize">{payment.method}</Badge>
                                                                                    <span className="font-bold">₹{Number(payment.amount).toLocaleString()}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Order summary */}
                                                                        <div className="mt-4 space-y-1 text-sm border-t pt-3">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-muted-foreground">Subtotal</span>
                                                                                <span>₹{Number(order.subtotal).toLocaleString()}</span>
                                                                            </div>
                                                                            {Number(order.taxAmount) > 0 && (
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Tax</span>
                                                                                    <span>₹{Number(order.taxAmount).toLocaleString()}</span>
                                                                                </div>
                                                                            )}
                                                                            {Number(order.discountAmount) > 0 && (
                                                                                <div className="flex justify-between text-green-600">
                                                                                    <span>Discount</span>
                                                                                    <span>-₹{Number(order.discountAmount).toLocaleString()}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between font-bold text-base pt-1 border-t">
                                                                                <span>Total</span>
                                                                                <span>₹{Number(order.totalAmount).toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, Key, Box, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplier?: {
        name: string;
    };
    status: string;
    totalAmount: number;
    expectedDate?: string;
}

export default function ReceiveGoodsPage() {
    const [search, setSearch] = useState('');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['purchase-orders', 'receiving'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: { data: PurchaseOrder[] } }>('/purchase-orders', {
                params: {
                    status: 'ordered,partially_received'
                }
            });
            // Mock data fallback if endpoint fails or returns empty while developing
            return response.data?.data?.data?.length ? response.data.data.data : [
                { id: '1', poNumber: 'PO-2023-001', supplier: { name: 'Acme Corp' }, status: 'ordered', totalAmount: 15400, expectedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
                { id: '2', poNumber: 'PO-2023-002', supplier: { name: 'Global Supplies' }, status: 'partially_received', totalAmount: 8500, expectedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() },
            ];
        },
        placeholderData: [
            { id: '1', poNumber: 'PO-2023-001', supplier: { name: 'Acme Corp' }, status: 'ordered', totalAmount: 15400, expectedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
            { id: '2', poNumber: 'PO-2023-002', supplier: { name: 'Global Supplies' }, status: 'partially_received', totalAmount: 8500, expectedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() },
        ],
    });

    const filteredOrders = orders?.filter(o => o.poNumber.toLowerCase().includes(search.toLowerCase()) || o.supplier?.name.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Receive Goods</h1>
                    <p className="text-muted-foreground">Select a purchase order to process incoming inventory</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Box className="h-5 w-5 text-emerald-600" />
                        Pending Deliveries
                    </CardTitle>
                    <CardDescription>Orders awaiting receiving or partially received</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by PO number or supplier name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 max-w-md"
                        />
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Expected Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                                    <p>All clear! No pending deliveries.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order) => {
                                            const expectedDate = order.expectedDate ? new Date(order.expectedDate) : null;
                                            const isOverdue = expectedDate ? expectedDate < new Date() : false;

                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 font-mono font-medium text-primary">
                                                            <Key className="h-4 w-4 text-muted-foreground" />
                                                            {order.poNumber}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {order.supplier?.name || 'Unknown Supplier'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {expectedDate ? (
                                                            <div className="flex flex-col">
                                                                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                                                    {format(expectedDate, 'dd MMM yyyy')}
                                                                </span>
                                                                {isOverdue && <span className="text-xs text-destructive">Overdue</span>}
                                                            </div>
                                                        ) : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={order.status === 'partially_received' ? 'secondary' : 'default'}
                                                            className={order.status === 'partially_received' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}>
                                                            {order.status === 'partially_received' ? 'Partial' : 'Awaiting'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button asChild size="sm">
                                                            <Link to={`/purchases/${order.id}/receive`}>
                                                                <Package className="mr-2 h-4 w-4" />
                                                                Process Receipt
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

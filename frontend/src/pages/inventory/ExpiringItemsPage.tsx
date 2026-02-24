import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Clock, Package } from 'lucide-react';
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

interface InventoryItemWithProduct {
    id: string;
    product: {
        id: string;
        name: string;
        sku: string;
    };
    availableQuantity: number;
    expiryDate: string | null;
}

function getDaysUntilExpiry(expiryDate: string): number {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ExpiringItemsPage() {
    const [search, setSearch] = useState('');

    const { data: items, isLoading } = useQuery({
        queryKey: ['expiring-items'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: { expiringItems: InventoryItemWithProduct[] } }>('/inventory/overview');
            return response.data.data.expiringItems;
        },
        placeholderData: [
            { id: '4', product: { id: '4', name: 'Fresh Paneer 200g', sku: 'PNR-001' }, availableQuantity: 25, expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: '5', product: { id: '5', name: 'Mother Dairy Curd', sku: 'CRD-001' }, availableQuantity: 18, expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        ],
    });

    const filteredItems = items?.filter(item => item.product.name.toLowerCase().includes(search.toLowerCase()) || item.product.sku.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expiring Inventory</h1>
                    <p className="text-muted-foreground">Monitor products nearing their expiration date</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-500" />
                        Expiration Alert
                    </CardTitle>
                    <CardDescription>Items expiring within the next 7-30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search expiring products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 max-w-md"
                        />
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product details</TableHead>
                                        <TableHead>Batch Quantity</TableHead>
                                        <TableHead>Expiration Date</TableHead>
                                        <TableHead>Time Remaining</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No items are currently nearing expiration.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const daysLeft = item.expiryDate ? getDaysUntilExpiry(item.expiryDate) : null;
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-red-500/10 rounded-md">
                                                                <Package className="h-4 w-4 text-red-500" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900">{item.product.name}</p>
                                                                <p className="text-xs text-slate-500 font-mono">{item.product.sku}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium text-slate-700">{item.availableQuantity} units</span>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-700">
                                                        {item.expiryDate ? format(new Date(item.expiryDate), 'dd MMM yyyy') : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={daysLeft !== null && daysLeft <= 2 ? 'destructive' : 'secondary'} className={daysLeft !== null && daysLeft <= 2 ? "" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                                                            {daysLeft} days left
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">Apply Discount</Button>
                                                            <Button size="sm" variant="destructive">Remove</Button>
                                                        </div>
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

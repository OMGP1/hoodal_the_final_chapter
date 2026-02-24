import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowUpDown, Package } from 'lucide-react';
import { format } from 'date-fns';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface StockMovementWithDetails {
    id: string;
    productId: string;
    product: {
        name: string;
        sku: string;
    };
    movementType: string;
    quantity: number;
    notes: string | null;
    createdAt: string;
    createdByUser?: {
        firstName: string;
        lastName: string;
    };
}

export default function InventoryMovementsPage() {
    const [search, setSearch] = useState('');

    const { data: movements, isLoading } = useQuery({
        queryKey: ['inventory-movements'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: { recentMovements: StockMovementWithDetails[] } }>('/inventory/overview');
            return response.data.data.recentMovements;
        },
        placeholderData: [
            { id: '1', productId: '1', product: { name: 'Amul Milk 1L', sku: 'MILK-001' }, movementType: 'sale', quantity: -5, notes: 'POS Sale', createdAt: new Date().toISOString() },
            { id: '2', productId: '2', product: { name: 'Fortune Oil 1L', sku: 'OIL-001' }, movementType: 'purchase', quantity: 24, notes: 'PO-0045', createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
            { id: '3', productId: '3', product: { name: 'Maggi Noodles', sku: 'MAG-001' }, movementType: 'adjustment', quantity: -2, notes: 'Damaged items removed', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        ],
    });

    const filteredMovements = movements?.filter(m => m.product.name.toLowerCase().includes(search.toLowerCase()) || m.product.sku.toLowerCase().includes(search.toLowerCase())) || [];

    const MovementTypeBadge = ({ type }: { type: string }) => {
        const styles: Record<string, string> = {
            purchase: 'bg-green-100 text-green-700',
            sale: 'bg-blue-100 text-blue-700',
            return: 'bg-purple-100 text-purple-700',
            adjustment: 'bg-amber-100 text-amber-700',
            damage: 'bg-red-100 text-red-700',
            expiry: 'bg-red-100 text-red-700',
        };

        return (
            <Badge className={cn('capitalize', styles[type] || 'bg-gray-100 text-gray-700')}>
                {type}
            </Badge>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
                    <p className="text-muted-foreground">Comprehensive log of all inventory changes</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpDown className="h-5 w-5" />
                        Movement History
                    </CardTitle>
                    <CardDescription>Track all product additions, sales, and adjustments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by product name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 max-w-md"
                        />
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product details</TableHead>
                                        <TableHead>Movement Type</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Reference Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMovements.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No movement records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMovements.map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 rounded-md">
                                                            <Package className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{movement.product.name}</p>
                                                            <p className="text-xs text-slate-500 font-mono">{movement.product.sku}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <MovementTypeBadge type={movement.movementType} />
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn('font-semibold text-lg', movement.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                                                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-600 font-medium">
                                                    {format(new Date(movement.createdAt), 'dd MMM yyyy, HH:mm')}
                                                </TableCell>
                                                <TableCell className="text-slate-500 max-w-[250px] truncate">
                                                    {movement.notes || '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
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

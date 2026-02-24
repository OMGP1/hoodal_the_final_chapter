import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, AlertTriangle, TrendingDown } from 'lucide-react';

import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface LowStockItem {
    id: string;
    product: {
        id: string;
        name: string;
        sku: string;
        reorderLevel: number;
    };
    availableQuantity: number;
}

export default function LowStockPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: items, isLoading } = useQuery({
        queryKey: ['low-stock'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: { lowStockItems: LowStockItem[] } }>('/inventory/overview');
            return response.data.data.lowStockItems;
        },
        placeholderData: [
            { id: '1', product: { id: '1', name: 'Amul Milk 1L', sku: 'MILK-001', reorderLevel: 50 }, availableQuantity: 12 },
            { id: '2', product: { id: '2', name: 'Britannia Bread', sku: 'BRD-001', reorderLevel: 20 }, availableQuantity: 8 },
            { id: '3', product: { id: '3', name: 'Tata Salt 1kg', sku: 'SALT-001', reorderLevel: 30 }, availableQuantity: 15 },
        ],
    });

    const filteredItems = items?.filter(item => item.product.name.toLowerCase().includes(search.toLowerCase()) || item.product.sku.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Low Stock Products</h1>
                    <p className="text-muted-foreground">Items that have fallen below their minimum required reorder level</p>
                </div>
                <Button onClick={() => {
                    const allItemsToOrder = filteredItems.map(item => {
                        const deficit = item.product.reorderLevel - item.availableQuantity;
                        return {
                            productId: item.product.id || item.id, // Fallback to item.id 
                            productName: item.product.name,
                            sku: item.product.sku,
                            quantity: deficit > 0 ? deficit : 1,
                            unitPrice: 0 // Price needs to be set manually or via API enrichments
                        };
                    });
                    navigate('/purchases/new', { state: { prefilledItems: allItemsToOrder } });
                }}>
                    <Package className="mr-2 h-4 w-4" /> Create PO for All
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Critical Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredItems.filter(i => i.availableQuantity === 0).length}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-destructive">Completely Out of Stock</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredItems.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total items needing restock</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-amber-500" />
                        Low Stock Alert
                    </CardTitle>
                    <CardDescription>Review and replenish stock levels immediately</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by product name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 max-w-sm"
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
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Current Stock</TableHead>
                                        <TableHead>Reorder Threshold</TableHead>
                                        <TableHead>Deficit</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No low stock products found. You are fully stocked!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const deficit = item.product.reorderLevel - item.availableQuantity;
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-amber-500/10 rounded-md">
                                                                <Package className="h-4 w-4 text-amber-500" />
                                                            </div>
                                                            {item.product.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground font-mono">{item.product.sku}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.availableQuantity === 0 ? "destructive" : "secondary"} className={item.availableQuantity > 0 ? "text-amber-600 bg-amber-500/10" : ""}>
                                                            {item.availableQuantity}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{item.product.reorderLevel}</TableCell>
                                                    <TableCell>
                                                        <span className="text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">-{deficit}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => {
                                                            navigate('/purchases/new', {
                                                                state: {
                                                                    prefilledItems: [{
                                                                        productId: item.product.id || item.id,
                                                                        productName: item.product.name,
                                                                        sku: item.product.sku,
                                                                        quantity: deficit > 0 ? deficit : 1,
                                                                        unitPrice: 0
                                                                    }]
                                                                }
                                                            });
                                                        }}>Create PO</Button>
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

import { useQuery } from '@tanstack/react-query';
import {
    Boxes,
    AlertTriangle,
    Clock,
    Package,
    TrendingDown,
    Download,
} from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryReportPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['inventory-report'],
        queryFn: async () => {
            try {
                const response = await api.get('/reports/inventory');
                return response.data;
            } catch {
                return { data: null };
            }
        },
    });

    const report = data?.data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Report</h1>
                    <p className="text-muted-foreground">Current stock levels, alerts, and inventory valuation</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>

            {/* KPI Cards */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                                    <p className="text-2xl font-bold">{report?.totalProducts || 0}</p>
                                </div>
                                <Package className="h-8 w-8 text-blue-400/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Stock Value</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        ₹{(report?.totalStockValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <Boxes className="h-8 w-8 text-emerald-400/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-700">Low Stock Items</p>
                                    <p className="text-2xl font-bold text-amber-600">{report?.lowStockCount || 0}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-400/30" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-700">Expiring Soon</p>
                                    <p className="text-2xl font-bold text-red-600">{report?.expiringCount || 0}</p>
                                </div>
                                <Clock className="h-8 w-8 text-red-400/30" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Low Stock Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Low Stock Products
                    </CardTitle>
                    <CardDescription>Items below their reorder level that need restocking</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                    ) : report?.lowStockItems?.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Current Stock</TableHead>
                                        <TableHead>Reorder Level</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.lowStockItems.map((item: any) => (
                                        <TableRow key={item.id || item.productId}>
                                            <TableCell className="font-medium">{item.name || item.productName}</TableCell>
                                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                                            <TableCell>
                                                <span className={cn('font-bold', item.currentStock === 0 ? 'text-red-600' : 'text-amber-600')}>
                                                    {item.currentStock ?? item.stock ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.reorderLevel || 0}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    (item.currentStock ?? item.stock ?? 0) === 0
                                                        ? 'bg-red-100 text-red-700 border-red-200'
                                                        : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }>
                                                    {(item.currentStock ?? item.stock ?? 0) === 0 ? 'Out of Stock' : 'Low Stock'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">All products are well-stocked!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expiring items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-red-500" /> Expiring Products
                    </CardTitle>
                    <CardDescription>Products expiring within the next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    {report?.expiringItems?.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Batch</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Days Left</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.expiringItems.map((item: any, i: number) => {
                                        const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000);
                                        return (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{item.name || item.productName}</TableCell>
                                                <TableCell className="font-mono text-sm">{item.batchNumber || '—'}</TableCell>
                                                <TableCell>{item.quantity || 0}</TableCell>
                                                <TableCell>{new Date(item.expiryDate).toLocaleDateString('en-IN')}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                                                        {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No products expiring soon.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

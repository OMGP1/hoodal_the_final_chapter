import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Boxes,
    AlertTriangle,
    Clock,
    TrendingDown,
    Package,
    ArrowUpDown,
    Search,
} from 'lucide-react';
import { format } from 'date-fns';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface InventoryOverview {
    totalProducts: number;
    totalValue: number;
    lowStockItems: InventoryItemWithProduct[];
    expiringItems: InventoryItemWithProduct[];
    recentMovements: StockMovementWithDetails[];
}

interface InventoryItemWithProduct {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
        sku: string;
        reorderLevel: number;
    };
    quantity: number;
    availableQuantity: number;
    expiryDate: string | null;
    status: string;
}

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

function useInventoryOverview() {
    return useQuery({
        queryKey: ['inventory-overview'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: InventoryOverview }>(
                '/inventory/overview'
            );
            return response.data.data;
        },
        placeholderData: {
            totalProducts: 156,
            totalValue: 245000,
            lowStockItems: [
                {
                    id: '1',
                    productId: '1',
                    product: { id: '1', name: 'Amul Milk 1L', sku: 'MILK-001', reorderLevel: 50 },
                    quantity: 12,
                    availableQuantity: 12,
                    expiryDate: null,
                    status: 'available',
                },
                {
                    id: '2',
                    productId: '2',
                    product: { id: '2', name: 'Britannia Bread', sku: 'BRD-001', reorderLevel: 20 },
                    quantity: 8,
                    availableQuantity: 8,
                    expiryDate: null,
                    status: 'available',
                },
                {
                    id: '3',
                    productId: '3',
                    product: { id: '3', name: 'Tata Salt 1kg', sku: 'SALT-001', reorderLevel: 30 },
                    quantity: 15,
                    availableQuantity: 15,
                    expiryDate: null,
                    status: 'available',
                },
            ],
            expiringItems: [
                {
                    id: '4',
                    productId: '4',
                    product: { id: '4', name: 'Fresh Paneer 200g', sku: 'PNR-001', reorderLevel: 10 },
                    quantity: 25,
                    availableQuantity: 25,
                    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'available',
                },
                {
                    id: '5',
                    productId: '5',
                    product: { id: '5', name: 'Mother Dairy Curd', sku: 'CRD-001', reorderLevel: 15 },
                    quantity: 18,
                    availableQuantity: 18,
                    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'available',
                },
            ],
            recentMovements: [
                {
                    id: '1',
                    productId: '1',
                    product: { name: 'Amul Milk 1L', sku: 'MILK-001' },
                    movementType: 'sale',
                    quantity: -5,
                    notes: 'POS Sale',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: '2',
                    productId: '2',
                    product: { name: 'Fortune Oil 1L', sku: 'OIL-001' },
                    movementType: 'purchase',
                    quantity: 24,
                    notes: 'PO-0045',
                    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                },
                {
                    id: '3',
                    productId: '3',
                    product: { name: 'Maggi Noodles', sku: 'MAG-001' },
                    movementType: 'adjustment',
                    quantity: -2,
                    notes: 'Damaged items removed',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                },
            ],
        },
    });
}

function StatCard({
    title,
    value,
    icon: Icon,
    variant = 'default',
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    variant?: 'default' | 'warning' | 'danger';
}) {
    const colors = {
        default: 'bg-primary/10 text-primary',
        warning: 'bg-amber-500/10 text-amber-600',
        danger: 'bg-red-500/10 text-red-600',
    };

    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-6">
                <div className={cn('p-3 rounded-lg', colors[variant])}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function MovementTypeBadge({ type }: { type: string }) {
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

function getDaysUntilExpiry(expiryDate: string): number {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useInventoryOverview();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                <p className="text-muted-foreground">Track and manage your stock levels</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Products"
                    value={data?.totalProducts || 0}
                    icon={Package}
                />
                <StatCard
                    title="Total Value"
                    value={`₹${(data?.totalValue || 0).toLocaleString()}`}
                    icon={Boxes}
                />
                <StatCard
                    title="Low Stock Items"
                    value={data?.lowStockItems.length || 0}
                    icon={TrendingDown}
                    variant="warning"
                />
                <StatCard
                    title="Expiring Soon"
                    value={data?.expiringItems.length || 0}
                    icon={Clock}
                    variant="danger"
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="low-stock">
                        Low Stock
                        {data?.lowStockItems.length ? (
                            <Badge variant="secondary" className="ml-2">
                                {data.lowStockItems.length}
                            </Badge>
                        ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="expiring">
                        Expiring
                        {data?.expiringItems.length ? (
                            <Badge variant="destructive" className="ml-2">
                                {data.expiringItems.length}
                            </Badge>
                        ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="movements">Movements</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Low Stock Alert */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Low Stock Alert
                                </CardTitle>
                                <CardDescription>Products below reorder level</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                        {data?.lowStockItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-amber-600">
                                                        {item.availableQuantity}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Min: {item.product.reorderLevel}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Expiring Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-red-500" />
                                    Expiring Soon
                                </CardTitle>
                                <CardDescription>Items expiring within 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                        {data?.expiringItems.map((item) => {
                                            const daysLeft = item.expiryDate
                                                ? getDaysUntilExpiry(item.expiryDate)
                                                : null;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                                                >
                                                    <div>
                                                        <p className="font-medium">{item.product.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Qty: {item.availableQuantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge
                                                            variant={daysLeft && daysLeft <= 2 ? 'destructive' : 'secondary'}
                                                        >
                                                            {daysLeft} days left
                                                        </Badge>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {item.expiryDate &&
                                                                format(new Date(item.expiryDate), 'dd MMM yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Movements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpDown className="h-5 w-5" />
                                Recent Stock Movements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead>Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.recentMovements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{movement.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{movement.product.sku}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <MovementTypeBadge type={movement.movementType} />
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'font-medium',
                                                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                                    )}
                                                >
                                                    {movement.quantity > 0 ? '+' : ''}
                                                    {movement.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {movement.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(movement.createdAt), 'HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Low Stock Tab */}
                <TabsContent value="low-stock">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Low Stock Items</CardTitle>
                                    <CardDescription>Products that need to be reordered</CardDescription>
                                </div>
                                <Button>Create Purchase Order</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Current Stock</TableHead>
                                        <TableHead>Reorder Level</TableHead>
                                        <TableHead>Shortage</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.lowStockItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">{item.availableQuantity}</Badge>
                                            </TableCell>
                                            <TableCell>{item.product.reorderLevel}</TableCell>
                                            <TableCell className="text-red-600 font-medium">
                                                {item.product.reorderLevel - item.availableQuantity}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline">
                                                    Order
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Expiring Tab */}
                <TabsContent value="expiring">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expiring Items</CardTitle>
                            <CardDescription>Items expiring within the next 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Days Left</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.expiringItems.map((item) => {
                                        const daysLeft = item.expiryDate
                                            ? getDaysUntilExpiry(item.expiryDate)
                                            : null;
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.product.name}</p>
                                                        <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.availableQuantity}</TableCell>
                                                <TableCell>
                                                    {item.expiryDate &&
                                                        format(new Date(item.expiryDate), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={daysLeft && daysLeft <= 2 ? 'destructive' : 'secondary'}
                                                    >
                                                        {daysLeft} days
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline">
                                                            Discount
                                                        </Button>
                                                        <Button size="sm" variant="destructive">
                                                            Mark Expired
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Movements Tab */}
                <TabsContent value="movements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Movements</CardTitle>
                            <CardDescription>Complete history of stock changes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search movements..." className="pl-10" />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.recentMovements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{movement.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">{movement.product.sku}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <MovementTypeBadge type={movement.movementType} />
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'font-medium',
                                                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                                    )}
                                                >
                                                    {movement.quantity > 0 ? '+' : ''}
                                                    {movement.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {movement.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(movement.createdAt), 'dd MMM, HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

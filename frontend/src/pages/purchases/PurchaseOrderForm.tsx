import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import type { Supplier, Product, PaginatedResponse, CreatePurchaseOrderData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
}

export default function PurchaseOrderForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const [supplierId, setSupplierId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<OrderItem[]>(location.state?.prefilledItems || []);
    const [productSearch, setProductSearch] = useState('');

    // Fetch suppliers
    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers-list'],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Supplier>>('/purchase-orders', {
                params: { pageSize: 100 },
            });
            // Try fetching suppliers directly — fallback to empty array
            try {
                const suppRes = await api.get('/products', { params: { pageSize: 1 } });
                // We'll use a separate supplier fetch
            } catch { /* ignore */ }
            return response.data;
        },
    });

    // Fetch products for item picker
    const { data: productsData } = useQuery({
        queryKey: ['products-picker', productSearch],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Product>>('/products', {
                params: { search: productSearch || undefined, pageSize: 50, isActive: true },
            });
            return response.data;
        },
        enabled: productSearch.length > 0,
    });

    const createOrder = useMutation({
        mutationFn: async (data: CreatePurchaseOrderData) => {
            return api.post('/purchase-orders', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase order created successfully');
            navigate('/purchases');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to create order');
        },
    });

    const addItem = (product: Product) => {
        if (items.find(i => i.productId === product.id)) {
            toast.error('Product already added');
            return;
        }
        setItems([...items, {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice: Number(product.purchasePrice),
        }]);
        setProductSearch('');
    };

    const updateItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const handleSubmit = () => {
        if (!supplierId) { toast.error('Please select a supplier'); return; }
        if (items.length === 0) { toast.error('Please add at least one item'); return; }

        createOrder.mutate({
            supplierId,
            expectedDate: expectedDate || undefined,
            notes: notes || undefined,
            items: items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/purchases')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
                    <p className="text-muted-foreground">Create a draft purchase order for a supplier</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Supplier & dates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Details</CardTitle>
                            <CardDescription>Select supplier and set dates</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier">Supplier *</Label>
                                    <Input
                                        id="supplier"
                                        placeholder="Enter supplier ID (supplier API coming in Phase 2)"
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expectedDate">Expected Delivery</Label>
                                    <Input
                                        id="expectedDate"
                                        type="date"
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Additional notes for this order..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Item picker */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                            <CardDescription>Search and add products to this order</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products by name or SKU..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Search results */}
                            {productSearch && productsData?.data && productsData.data.length > 0 && (
                                <div className="border rounded-md max-h-48 overflow-y-auto">
                                    {productsData.data.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addItem(product)}
                                            className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">₹{Number(product.purchasePrice).toFixed(2)}</p>
                                                <Plus className="h-4 w-4 text-primary inline" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Items table */}
                            {items.length > 0 && (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="w-24">Qty</TableHead>
                                                <TableHead className="w-32">Unit Price</TableHead>
                                                <TableHead className="w-28 text-right">Total</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={item.productId}>
                                                    <TableCell>
                                                        <p className="font-medium">{item.productName}</p>
                                                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                            className="w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={0.01}
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                            className="w-28"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {items.length === 0 && !productSearch && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No items added yet. Search for products above to add them.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Items</span>
                                <span className="font-medium">{items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Qty</span>
                                <span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-lg font-semibold">Total</span>
                                <span className="text-lg font-bold text-primary">
                                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={createOrder.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                {createOrder.isPending ? 'Creating...' : 'Create Draft Order'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

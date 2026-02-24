import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Send,
    XCircle,
    Package,
    FileText,
} from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { toast } from 'sonner';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PurchaseOrder, PurchaseOrderQueryParams, PurchaseOrderStatus, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const statusColors: Record<PurchaseOrderStatus, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    ordered: 'bg-blue-100 text-blue-700 border-blue-200',
    partially_received: 'bg-amber-100 text-amber-700 border-amber-200',
    received: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
    draft: 'Draft',
    ordered: 'Ordered',
    partially_received: 'Partial',
    received: 'Received',
    cancelled: 'Cancelled',
};

function usePurchaseOrders(params: PurchaseOrderQueryParams) {
    return useQuery({
        queryKey: ['purchase-orders', params],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params });
            return response.data;
        },
        placeholderData: (prev) => prev,
    });
}

export default function PurchaseOrdersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<PurchaseOrder | null>(null);
    const [params, setParams] = useState<PurchaseOrderQueryParams>({
        page: 1,
        pageSize: 25,
    });

    const { data, isLoading } = usePurchaseOrders({
        ...params,
        search: search || undefined,
    });

    const submitOrder = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/purchase-orders/${id}/submit`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase order submitted to supplier');
        },
        onError: () => toast.error('Failed to submit order'),
    });

    const cancelOrder = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/purchase-orders/${id}/cancel`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast.success('Purchase order cancelled');
            setCancelDialogOpen(false);
            setOrderToCancel(null);
        },
        onError: () => toast.error('Failed to cancel order'),
    });

    const columns: ColumnDef<PurchaseOrder>[] = [
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <div className="font-mono font-medium text-primary">{row.original.poNumber}</div>
            ),
        },
        {
            accessorKey: 'supplier',
            header: 'Supplier',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.supplier?.name || '—'}</p>
                    {row.original.supplier?.phone && (
                        <p className="text-xs text-muted-foreground">{row.original.supplier.phone}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'orderDate',
            header: 'Order Date',
            cell: ({ row }) => new Date(row.original.orderDate).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            }),
        },
        {
            accessorKey: 'expectedDate',
            header: 'Expected',
            cell: ({ row }) => row.original.expectedDate
                ? new Date(row.original.expectedDate).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                })
                : '—',
        },
        {
            accessorKey: 'totalAmount',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-semibold">₹{Number(row.original.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant="outline" className={cn('capitalize', statusColors[status])}>
                        {statusLabels[status]}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const order = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link to={`/purchases/${order.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                </Link>
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                                <DropdownMenuItem onClick={() => submitOrder.mutate(order.id)}>
                                    <Send className="mr-2 h-4 w-4" /> Submit Order
                                </DropdownMenuItem>
                            )}
                            {(order.status === 'ordered' || order.status === 'partially_received') && (
                                <DropdownMenuItem asChild>
                                    <Link to={`/purchases/${order.id}/receive`}>
                                        <Package className="mr-2 h-4 w-4" /> Receive Goods
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'received' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setOrderToCancel(order);
                                            setCancelDialogOpen(true);
                                        }}
                                        className="text-destructive"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: data?.data || [],
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground">Manage supplier orders and goods receiving</p>
                </div>
                <Button asChild>
                    <Link to="/purchases/new">
                        <Plus className="mr-2 h-4 w-4" /> New Purchase Order
                    </Link>
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: 'Draft', status: 'draft' as PurchaseOrderStatus, color: 'text-slate-600' },
                    { label: 'Ordered', status: 'ordered' as PurchaseOrderStatus, color: 'text-blue-600' },
                    { label: 'Partially Received', status: 'partially_received' as PurchaseOrderStatus, color: 'text-amber-600' },
                    { label: 'Completed', status: 'received' as PurchaseOrderStatus, color: 'text-emerald-600' },
                ].map((stat) => (
                    <Card key={stat.status} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setParams({ ...params, status: params.status === stat.status ? undefined : stat.status, page: 1 })}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                <FileText className={cn('h-4 w-4', stat.color)} />
                            </div>
                            <p className={cn('text-2xl font-bold mt-1', stat.color)}>
                                {data?.data?.filter(o => o.status === stat.status).length || 0}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by PO number or supplier..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={params.status || 'all'}
                            onValueChange={(value) =>
                                setParams({
                                    ...params,
                                    status: value === 'all' ? undefined : value as PurchaseOrderStatus,
                                    page: 1,
                                })
                            }
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                                <SelectItem value="partially_received">Partial</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Order List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map((hg) => (
                                            <TableRow key={hg.id}>
                                                {hg.headers.map((header) => (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TableRow key={row.id}>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                                    No purchase orders found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((data?.pagination.page || 1) - 1) * (data?.pagination.pageSize || 25) + 1} to{' '}
                                    {Math.min(
                                        (data?.pagination.page || 1) * (data?.pagination.pageSize || 25),
                                        data?.pagination.totalRecords || 0
                                    )}{' '}
                                    of {data?.pagination.totalRecords || 0} orders
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm"
                                        onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
                                        disabled={(params.page || 1) <= 1}>
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm"
                                        onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
                                        disabled={(params.page || 1) >= (data?.pagination.totalPages || 1)}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Cancel dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Purchase Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel order "{orderToCancel?.poNumber}"? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Order</Button>
                        <Button variant="destructive"
                            onClick={() => orderToCancel && cancelOrder.mutate(orderToCancel.id)}
                            disabled={cancelOrder.isPending}>
                            {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

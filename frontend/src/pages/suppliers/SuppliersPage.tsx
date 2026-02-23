import { useState, useDeferredValue, useCallback } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Phone,
    Mail,
    Truck,
    Power,
    Loader2,
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

import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from '@/types';
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useToggleSupplier,
} from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FORM: CreateSupplierInput = {
    name: '', contactName: '', email: '', phone: '',
    address: '', gstNumber: '', panNumber: '', notes: '',
};

export default function SuppliersPage() {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [page, setPage] = useState(1);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateSupplierInput>({ ...EMPTY_FORM });

    // --- API hooks ---
    const { data, isLoading } = useSuppliers({ search: deferredSearch, page, limit: 20 });
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();
    const toggleMutation = useToggleSupplier();

    const suppliers = data?.data || [];
    const totalRecords = data?.pagination?.totalRecords ?? 0;
    const totalPages = Math.ceil(totalRecords / 20) || 1;

    // --- Handlers ---
    const openCreate = useCallback(() => {
        setEditingId(null);
        setFormData({ ...EMPTY_FORM });
        setDialogOpen(true);
    }, []);

    const openEdit = useCallback((supplier: Supplier) => {
        setEditingId(supplier.id);
        setFormData({
            name: supplier.name,
            contactName: supplier.contactName || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            gstNumber: supplier.gstNumber || '',
            panNumber: supplier.panNumber || '',
            notes: supplier.notes || '',
        });
        setDialogOpen(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData.name.trim()) {
            toast.error('Supplier name is required');
            return;
        }
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, ...formData });
                toast.success('Supplier updated successfully');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('Supplier created successfully');
            }
            setDialogOpen(false);
            setFormData({ ...EMPTY_FORM });
            setEditingId(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error?.message || 'Failed to save supplier');
        }
    }, [formData, editingId, createMutation, updateMutation]);

    const handleToggle = useCallback(async (id: string, name: string) => {
        try {
            await toggleMutation.mutateAsync(id);
            toast.success(`${name} status toggled`);
        } catch {
            toast.error('Failed to toggle supplier status');
        }
    }, [toggleMutation]);

    // --- Table columns ---
    const columns: ColumnDef<Supplier>[] = [
        {
            accessorKey: 'name',
            header: 'Supplier',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        {row.original.contactName && (
                            <p className="text-xs text-muted-foreground">{row.original.contactName}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: 'contact',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="space-y-1">
                    {row.original.phone && (
                        <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" /> {row.original.phone}
                        </div>
                    )}
                    {row.original.email && (
                        <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'gstNumber',
            header: 'GST No.',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.gstNumber || '—'}</span>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(row.original)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggle(row.original.id, row.original.name)}>
                            <Power className="mr-2 h-4 w-4" />
                            {row.original.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: suppliers,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">
                        Manage your supplier contacts and details
                        {totalRecords > 0 && <span className="ml-1">({totalRecords} total)</span>}
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, contact, email, GST..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Supplier List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : (
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
                                                No suppliers found. Add your first supplier to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Update supplier details.' : 'Enter the supplier\'s details below.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Company Name *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input value={formData.contactName || ''} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>GST Number</Label>
                                <Input
                                    value={formData.gstNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                                    placeholder="e.g., 27AABCU9603R1ZM"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>PAN Number</Label>
                                <Input
                                    value={formData.panNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                    placeholder="e.g., ABCDE1234F"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? 'Update Supplier' : 'Save Supplier'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

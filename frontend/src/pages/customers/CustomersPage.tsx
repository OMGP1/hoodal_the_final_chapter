import { useState, useDeferredValue, useCallback } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Phone,
    Mail,
    Power,
    Loader2,
    IndianRupee,
    CreditCard,
    Users,
    ArrowUpCircle,
    ArrowDownCircle,
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

import type { Customer, CreateCustomerInput, UpdateCustomerInput, AdjustBalanceInput } from '@/types';
import {
    useCustomers,
    useCreateCustomer,
    useUpdateCustomer,
    useAdjustBalance,
    useToggleCustomer,
} from '@/hooks/useCustomers';
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

// ─── Form defaults ────────────────────────────
const EMPTY_FORM: CreateCustomerInput = {
    name: '', email: '', phone: '', address: '', creditLimit: 0, notes: '',
};

const EMPTY_BALANCE: AdjustBalanceInput = { amount: 0, type: 'credit', notes: '' };

// ─── Balance color helper ─────────────────────
function balanceColor(balance: number, limit: number) {
    if (balance <= 0) return 'text-emerald-600 dark:text-emerald-400';
    if (limit > 0 && balance >= limit * 0.8) return 'text-red-600 dark:text-red-400';
    if (balance > 0) return 'text-amber-600 dark:text-amber-400';
    return '';
}

function balanceBadge(balance: number, limit: number) {
    if (balance <= 0) return 'default' as const;
    if (limit > 0 && balance >= limit) return 'destructive' as const;
    return 'secondary' as const;
}

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [page, setPage] = useState(1);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateCustomerInput>({ ...EMPTY_FORM });

    // Balance adjustment dialog
    const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
    const [balanceCustomer, setBalanceCustomer] = useState<Customer | null>(null);
    const [balanceData, setBalanceData] = useState<AdjustBalanceInput>({ ...EMPTY_BALANCE });

    // --- API hooks ---
    const { data, isLoading } = useCustomers({ search: deferredSearch, page, limit: 20 });
    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();
    const adjustMutation = useAdjustBalance();
    const toggleMutation = useToggleCustomer();

    const customers = data?.data || [];
    const totalRecords = data?.pagination?.totalRecords ?? 0;
    const totalPages = Math.ceil(totalRecords / 20) || 1;

    // --- Handlers ---
    const openCreate = useCallback(() => {
        setEditingId(null);
        setFormData({ ...EMPTY_FORM });
        setDialogOpen(true);
    }, []);

    const openEdit = useCallback((customer: Customer) => {
        setEditingId(customer.id);
        setFormData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            creditLimit: customer.creditLimit,
            notes: customer.notes || '',
        });
        setDialogOpen(true);
    }, []);

    const openBalance = useCallback((customer: Customer) => {
        setBalanceCustomer(customer);
        setBalanceData({ ...EMPTY_BALANCE });
        setBalanceDialogOpen(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData.name.trim()) {
            toast.error('Customer name is required');
            return;
        }
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, ...formData });
                toast.success('Customer updated successfully');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('Customer created successfully');
            }
            setDialogOpen(false);
            setFormData({ ...EMPTY_FORM });
            setEditingId(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error?.message || 'Failed to save customer');
        }
    }, [formData, editingId, createMutation, updateMutation]);

    const handleBalance = useCallback(async () => {
        if (!balanceCustomer || !balanceData.amount || balanceData.amount <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        try {
            await adjustMutation.mutateAsync({
                id: balanceCustomer.id,
                ...balanceData,
            });
            toast.success(
                balanceData.type === 'credit'
                    ? `₹${balanceData.amount} credit added for ${balanceCustomer.name}`
                    : `₹${balanceData.amount} payment recorded for ${balanceCustomer.name}`
            );
            setBalanceDialogOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.error?.message || 'Failed to adjust balance');
        }
    }, [balanceCustomer, balanceData, adjustMutation]);

    const handleToggle = useCallback(async (id: string, name: string) => {
        try {
            await toggleMutation.mutateAsync(id);
            toast.success(`${name} status toggled`);
        } catch {
            toast.error('Failed to toggle customer status');
        }
    }, [toggleMutation]);

    // --- Table columns ---
    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: 'name',
            header: 'Customer',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        {row.original.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {row.original.phone}
                            </p>
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
                    {row.original.email && (
                        <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'currentBalance',
            header: 'Balance (₹)',
            cell: ({ row }) => {
                const bal = Number(row.original.currentBalance);
                const limit = Number(row.original.creditLimit);
                return (
                    <div className="space-y-1">
                        <span className={`font-semibold font-mono ${balanceColor(bal, limit)}`}>
                            ₹{bal.toFixed(2)}
                        </span>
                        {limit > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Limit: ₹{limit.toFixed(2)}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'loyaltyPoints',
            header: 'Points',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.loyaltyPoints}</span>
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
                        <DropdownMenuItem onClick={() => openBalance(row.original)}>
                            <IndianRupee className="mr-2 h-4 w-4" /> Adjust Balance
                        </DropdownMenuItem>
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
        data: customers,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const isSaving = createMutation.isPending || updateMutation.isPending;

    // Credit limit warning for balance adjustment
    const willExceedLimit = balanceCustomer && balanceData.type === 'credit' &&
        Number(balanceCustomer.creditLimit) > 0 &&
        (Number(balanceCustomer.currentBalance) + balanceData.amount) > Number(balanceCustomer.creditLimit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage customers, credit, and payments
                        {totalRecords > 0 && <span className="ml-1">({totalRecords} total)</span>}
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, email..."
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
                    <CardTitle>Customer List</CardTitle>
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
                                                No customers found. Add your first customer to get started.
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
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                    Previous
                                </Button>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Create / Edit Customer Dialog ────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Update customer details.' : 'Enter customer details below.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Credit Limit (₹)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.creditLimit ?? 0}
                                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
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
                            {editingId ? 'Update Customer' : 'Save Customer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Balance Adjustment Dialog ────────────────────────── */}
            <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adjust Balance</DialogTitle>
                        <DialogDescription>
                            {balanceCustomer && (
                                <>
                                    Customer: <strong>{balanceCustomer.name}</strong>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {balanceCustomer && (
                        <div className="space-y-5 py-4">
                            {/* Current balance card */}
                            <div className="rounded-lg border p-4 bg-muted/30">
                                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                                <p className={`text-2xl font-bold font-mono ${balanceColor(Number(balanceCustomer.currentBalance), Number(balanceCustomer.creditLimit))}`}>
                                    ₹{Number(balanceCustomer.currentBalance).toFixed(2)}
                                </p>
                                {Number(balanceCustomer.creditLimit) > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Credit limit: ₹{Number(balanceCustomer.creditLimit).toFixed(2)}
                                    </p>
                                )}
                            </div>

                            {/* Type selection */}
                            <div className="space-y-2">
                                <Label>Transaction Type</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setBalanceData({ ...balanceData, type: 'credit' })}
                                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${balanceData.type === 'credit'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                                : 'border-muted hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <ArrowUpCircle className={`h-5 w-5 ${balanceData.type === 'credit' ? 'text-red-500' : 'text-muted-foreground'}`} />
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Credit (Udhaari)</p>
                                            <p className="text-xs text-muted-foreground">Add to balance</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBalanceData({ ...balanceData, type: 'payment' })}
                                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${balanceData.type === 'payment'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                                : 'border-muted hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <ArrowDownCircle className={`h-5 w-5 ${balanceData.type === 'payment' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                        <div className="text-left">
                                            <p className="font-medium text-sm">Payment</p>
                                            <p className="text-xs text-muted-foreground">Reduce balance</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <Label>Amount (₹)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={balanceData.amount || ''}
                                    onChange={(e) => setBalanceData({ ...balanceData, amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="Enter amount"
                                    className="text-lg font-mono"
                                />
                            </div>

                            {/* Credit limit warning */}
                            {willExceedLimit && (
                                <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                                    <CreditCard className="h-4 w-4 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Credit limit will be exceeded</p>
                                        <p className="text-xs mt-1">
                                            New balance: ₹{(Number(balanceCustomer.currentBalance) + balanceData.amount).toFixed(2)}
                                            {' '}/ Limit: ₹{Number(balanceCustomer.creditLimit).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>Notes (optional)</Label>
                                <Textarea
                                    value={balanceData.notes || ''}
                                    onChange={(e) => setBalanceData({ ...balanceData, notes: e.target.value })}
                                    rows={2}
                                    placeholder="e.g., 'Monthly groceries' or 'Cash payment'"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleBalance}
                            disabled={adjustMutation.isPending || !balanceData.amount}
                            variant={balanceData.type === 'credit' ? 'destructive' : 'default'}
                        >
                            {adjustMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {balanceData.type === 'credit' ? 'Add Credit' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

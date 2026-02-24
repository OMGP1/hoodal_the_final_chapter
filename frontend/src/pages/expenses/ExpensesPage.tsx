import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    DollarSign,
    TrendingUp,
    Calendar,
    Check,
    X,
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
import type { Expense, ExpenseCategory, ExpenseQueryParams, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

const paymentLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    card: 'Card',
    cheque: 'Cheque',
};

export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [params, setParams] = useState<ExpenseQueryParams>({
        page: 1,
        pageSize: 25,
    });

    const [formData, setFormData] = useState({
        expenseDate: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        vendor: '',
        paymentMethod: 'cash' as string,
        categoryId: '',
    });

    const { data, isLoading } = useQuery({
        queryKey: ['expenses', params, search],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Expense>>('/expenses', {
                params: { ...params, search: search || undefined },
            });
            return response.data;
        },
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['expense-categories'],
        queryFn: async () => {
            try {
                const response = await api.get('/expenses/categories');
                return response.data;
            } catch {
                return { data: [] };
            }
        },
    });

    const createExpense = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/expenses', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Expense recorded successfully');
            setAddDialogOpen(false);
            setFormData({
                expenseDate: new Date().toISOString().split('T')[0],
                amount: '', description: '', vendor: '', paymentMethod: 'cash', categoryId: '',
            });
        },
        onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to add expense'),
    });

    const updateExpense = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return api.put(`/expenses/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Expense updated successfully');
            setEditDialogOpen(false);
            setExpenseToEdit(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update expense'),
    });

    const processExpense = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'approved' | 'rejected' }) => {
            return api.post(`/expenses/${id}/process`, { action });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success(`Expense ${variables.action}`);
        },
        onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to process expense'),
    });

    const deleteExpense = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/expenses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Expense deleted successfully');
            setDeleteDialogOpen(false);
            setExpenseToDelete(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to delete expense'),
    });

    const expenses = data?.data || [];
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const columns: ColumnDef<Expense>[] = [
        {
            accessorKey: 'expenseDate',
            header: 'Date',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(row.original.expenseDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.description}</p>
                    {row.original.vendor && (
                        <p className="text-xs text-muted-foreground">Vendor: {row.original.vendor}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.category?.name || 'Uncategorized'}</Badge>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-red-600">
                    -₹{Number(row.original.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            accessorKey: 'paymentMethod',
            header: 'Payment',
            cell: ({ row }) => (
                <Badge variant="outline">{paymentLabels[row.original.paymentMethod] || row.original.paymentMethod}</Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="outline" className={statusColors[row.original.status]}>
                    {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
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
                        <DropdownMenuItem onClick={() => {
                            setFormData({
                                expenseDate: new Date(row.original.expenseDate).toISOString().split('T')[0],
                                amount: row.original.amount.toString(),
                                description: row.original.description,
                                vendor: row.original.vendor || '',
                                paymentMethod: row.original.paymentMethod,
                                categoryId: row.original.categoryId || '',
                            });
                            setExpenseToEdit(row.original);
                            setEditDialogOpen(true);
                        }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        {row.original.status === 'pending' && (
                            <>
                                <DropdownMenuItem onClick={() => processExpense.mutate({ id: row.original.id, action: 'approved' })}><Check className="mr-2 h-4 w-4" /> Approve</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => processExpense.mutate({ id: row.original.id, action: 'rejected' })}><X className="mr-2 h-4 w-4" /> Reject</DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                                setExpenseToDelete(row.original);
                                setDeleteDialogOpen(true);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: expenses,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Track and manage shop expenses</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-red-400/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                <p className="text-2xl font-bold">{expenses.length} entries</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {expenses.filter(e => e.status === 'pending').length}
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-amber-400/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={params.status || 'all'} onValueChange={(v) => setParams({ ...params, status: v === 'all' ? undefined : v as any, page: 1 })}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader><CardTitle>Expense Records</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map((hg) => (
                                            <TableRow key={hg.id}>
                                                {hg.headers.map((h) => (
                                                    <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TableRow key={row.id}>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No expenses found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((data?.pagination.page || 1) - 1) * (data?.pagination.pageSize || 25) + 1} to{' '}
                                    {Math.min((data?.pagination.page || 1) * (data?.pagination.pageSize || 25), data?.pagination.totalRecords || 0)} of {data?.pagination.totalRecords || 0}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })} disabled={(params.page || 1) <= 1}>Previous</Button>
                                    <Button variant="outline" size="sm" onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })} disabled={(params.page || 1) >= (data?.pagination.totalPages || 1)}>Next</Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add Expense Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                        <DialogDescription>Record a new expense entry.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input type="date" value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (₹) *</Label>
                                <Input type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="What was this expense for?" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        {categoriesData?.data?.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor</Label>
                                <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="Vendor name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            if (!formData.amount || !formData.description) { toast.error('Amount and description are required'); return; }
                            createExpense.mutate({
                                expenseDate: formData.expenseDate,
                                amount: parseFloat(formData.amount),
                                description: formData.description,
                                vendor: formData.vendor || undefined,
                                paymentMethod: formData.paymentMethod,
                                categoryId: formData.categoryId || undefined,
                            });
                        }} disabled={createExpense.isPending}>
                            {createExpense.isPending ? 'Saving...' : 'Save Expense'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Expense</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this expense ({expenseToDelete?.description})? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => expenseToDelete && deleteExpense.mutate(expenseToDelete.id)}
                            disabled={deleteExpense.isPending}
                        >
                            {deleteExpense.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Expense Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                        <DialogDescription>Modify the expense entry.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input type="date" value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (₹) *</Label>
                                <Input type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="What was this expense for?" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        {categoriesData?.data?.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor</Label>
                                <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="Vendor name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            if (!formData.amount || !formData.description) { toast.error('Amount and description are required'); return; }
                            if (!expenseToEdit) return;
                            updateExpense.mutate({
                                id: expenseToEdit.id,
                                data: {
                                    expenseDate: formData.expenseDate,
                                    amount: parseFloat(formData.amount),
                                    description: formData.description,
                                    vendor: formData.vendor || undefined,
                                    paymentMethod: formData.paymentMethod,
                                    categoryId: formData.categoryId || undefined,
                                }
                            });
                        }} disabled={updateExpense.isPending}>
                            {updateExpense.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

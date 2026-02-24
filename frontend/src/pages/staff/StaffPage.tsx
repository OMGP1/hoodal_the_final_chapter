import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    UserCheck,
    Calendar,
    Users,
    Shield,
    Power,
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
import type { StaffMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function useStaff(search: string) {
    return useQuery({
        queryKey: ['staff', search],
        queryFn: async () => {
            const response = await api.get('/staff', {
                params: { search: search || undefined, pageSize: 50 },
            });
            // Backend returns { success, data: { data: users[], pagination } }
            return response.data.data as { data: StaffMember[]; pagination: any };
        },
    });
}

export default function StaffPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const { data, isLoading } = useStaff(search);

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });

    // Mutations
    const updateMutation = useMutation({
        mutationFn: async (params: { id: string; data: any }) => {
            return api.put(`/users/${params.id}`, params.data);
        },
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setEditOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async (params: { id: string; isActive: boolean }) => {
            return api.put(`/users/${params.id}`, { isActive: params.isActive });
        },
        onSuccess: (_, vars) => {
            toast.success(vars.isActive ? 'Staff member activated' : 'Staff member deactivated');
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update status');
        },
    });

    const markPresentMutation = useMutation({
        mutationFn: async () => {
            // The check-in endpoint uses the authenticated user's own ID
            // For admin marking others present, we'd need a different endpoint
            // For now, this checks in the current logged-in user
            return api.post('/staff/attendance/check-in', {});
        },
        onSuccess: () => {
            toast.success('Checked in for today');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to check in');
        },
    });

    const openEditDialog = (staff: StaffMember) => {
        setEditingStaff(staff);
        setEditForm({
            firstName: staff.firstName || '',
            lastName: staff.lastName || '',
            phone: staff.phone || '',
            email: staff.email,
        });
        setEditOpen(true);
    };

    const handleEditSubmit = () => {
        if (!editingStaff) return;
        updateMutation.mutate({
            id: editingStaff.id,
            data: {
                firstName: editForm.firstName || undefined,
                lastName: editForm.lastName || undefined,
                phone: editForm.phone || undefined,
            },
        });
    };

    const columns: ColumnDef<StaffMember>[] = [
        {
            accessorKey: 'name',
            header: 'Staff Member',
            cell: ({ row }) => {
                const staff = row.original;
                const initials = [staff.firstName?.[0], staff.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{[staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.email}</p>
                            <p className="text-xs text-muted-foreground">{staff.email}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
            cell: ({ row }) => row.original.phone || '—',
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {row.original.role?.name || 'Unknown'}
                </Badge>
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
            cell: ({ row }) => {
                const staff = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(staff)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/staff/attendance')}>
                                <Calendar className="mr-2 h-4 w-4" /> View Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markPresentMutation.mutate()}>
                                <UserCheck className="mr-2 h-4 w-4" /> Mark Present
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => toggleActiveMutation.mutate({
                                    id: staff.id,
                                    isActive: !staff.isActive,
                                })}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                {staff.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
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

    // Summary stats
    const totalStaff = data?.data?.length || 0;
    const activeStaff = data?.data?.filter(s => s.isActive).length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground">Manage team members, attendance, and leave requests</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/staff/attendance">
                            <Calendar className="mr-2 h-4 w-4" /> Attendance
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/staff/leaves">
                            <UserCheck className="mr-2 h-4 w-4" /> Leave Requests
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                                <p className="text-2xl font-bold">{totalStaff}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active</p>
                                <p className="text-2xl font-bold text-emerald-600">{activeStaff}</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-emerald-500/30" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                                <p className="text-2xl font-bold text-slate-500">{totalStaff - activeStaff}</p>
                            </div>
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search staff by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                    </div>
                </CardContent>
            </Card>

            {/* Staff Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Staff Directory</CardTitle>
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
                                                No staff members found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Profile Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update profile for {editingStaff?.firstName} {editingStaff?.lastName || editingStaff?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={editForm.email} disabled className="bg-muted" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

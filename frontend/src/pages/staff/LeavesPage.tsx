import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Check,
    X,
    Clock,
    CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import type { LeaveRequest, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

const leaveTypeLabels: Record<string, string> = {
    casual: 'Casual Leave',
    sick: 'Sick Leave',
    earned: 'Earned Leave',
    unpaid: 'Unpaid Leave',
};

export default function LeavesPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data, isLoading } = useQuery({
        queryKey: ['leave-requests', statusFilter],
        queryFn: async () => {
            try {
                const response = await api.get<PaginatedResponse<LeaveRequest>>('/staff/leaves', {
                    params: { status: statusFilter === 'all' ? undefined : statusFilter, pageSize: 50 },
                });
                return response.data;
            } catch {
                return { data: [] as LeaveRequest[], pagination: { page: 1, pageSize: 50, totalPages: 0, totalRecords: 0 } };
            }
        },
    });

    const approveLeave = useMutation({
        mutationFn: async (id: string) => { await api.post(`/staff/leaves/${id}/approve`); },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
            toast.success('Leave approved');
        },
        onError: () => toast.error('Failed to approve'),
    });

    const rejectLeave = useMutation({
        mutationFn: async (id: string) => { await api.post(`/staff/leaves/${id}/reject`); },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
            toast.success('Leave rejected');
        },
        onError: () => toast.error('Failed to reject'),
    });

    const requests = data?.data || [];
    const pending = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/staff"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
                    <p className="text-muted-foreground">Manage staff leave applications</p>
                </div>
                {pending > 0 && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                        {pending} Pending
                    </Badge>
                )}
            </div>

            {/* Filter */}
            <Card>
                <CardContent className="p-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Requests */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" /> Leave Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
                        </div>
                    ) : requests.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">
                                                {req.user
                                                    ? [req.user.firstName, req.user.lastName].filter(Boolean).join(' ')
                                                    : req.userId}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{leaveTypeLabels[req.leaveType] || req.leaveType}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(req.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(req.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                                {req.reason}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={statusColors[req.status]}>
                                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                                            onClick={() => approveLeave.mutate(req.id)}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700"
                                                            onClick={() => rejectLeave.mutate(req.id)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No leave requests found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

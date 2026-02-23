import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    UserCheck,
    UserX,
    Coffee,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import type { Attendance, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    present: { label: 'Present', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: UserCheck },
    absent: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: UserX },
    half_day: { label: 'Half Day', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Coffee },
    on_leave: { label: 'On Leave', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar },
};

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading } = useQuery({
        queryKey: ['attendance', date],
        queryFn: async () => {
            try {
                const response = await api.get<PaginatedResponse<Attendance>>('/staff/attendance', {
                    params: { date, pageSize: 100 },
                });
                return response.data;
            } catch {
                return { data: [] as Attendance[], pagination: { page: 1, pageSize: 100, totalPages: 0, totalRecords: 0 } };
            }
        },
    });

    const records = data?.data || [];
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const halfDay = records.filter(r => r.status === 'half_day').length;
    const onLeave = records.filter(r => r.status === 'on_leave').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/staff"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                    <p className="text-muted-foreground">Track daily staff attendance</p>
                </div>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: 'Present', count: present, color: 'text-emerald-600', icon: UserCheck },
                    { label: 'Absent', count: absent, color: 'text-red-600', icon: UserX },
                    { label: 'Half Day', count: halfDay, color: 'text-amber-600', icon: Coffee },
                    { label: 'On Leave', count: onLeave, color: 'text-blue-600', icon: Calendar },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                                    <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                                </div>
                                <s.icon className={`h-8 w-8 ${s.color} opacity-30`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Records */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
                        </div>
                    ) : records.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Check In</TableHead>
                                        <TableHead>Check Out</TableHead>
                                        <TableHead>Hours</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => {
                                        const cfg = statusConfig[record.status] || statusConfig.present;
                                        return (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    {record.user
                                                        ? [record.user.firstName, record.user.lastName].filter(Boolean).join(' ')
                                                        : record.userId}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.checkOut ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cfg.color}>
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                    {record.notes || '—'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No attendance records for this date</p>
                            <p className="text-sm">Mark attendance to start tracking.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

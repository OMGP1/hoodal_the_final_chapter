import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Calendar,
    Download,
    Package,
    CreditCard,
    Receipt,
    Users,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { format, parseISO, startOfWeek, subDays } from 'date-fns';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Quick date presets
type DatePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

function getPresetDates(preset: DatePreset): { start: string; end: string } {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
        case 'today':
            return { start: fmt(today), end: fmt(today) };
        case 'yesterday': {
            const y = subDays(today, 1);
            return { start: fmt(y), end: fmt(y) };
        }
        case 'this_week': {
            const ws = startOfWeek(today, { weekStartsOn: 1 });
            return { start: fmt(ws), end: fmt(today) };
        }
        case 'last_week': {
            const lws = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
            const lwe = subDays(startOfWeek(today, { weekStartsOn: 1 }), 1);
            return { start: fmt(lws), end: fmt(lwe) };
        }
        case 'this_month': {
            const ms = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: fmt(ms), end: fmt(today) };
        }
        case 'last_month': {
            const lms = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lme = new Date(today.getFullYear(), today.getMonth(), 0);
            return { start: fmt(lms), end: fmt(lme) };
        }
        default: {
            const ms = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: fmt(ms), end: fmt(today) };
        }
    }
}

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesReportPage() {
    // Read preset from URL query param (e.g. ?preset=today)
    const urlParams = new URLSearchParams(window.location.search);
    const urlPreset = urlParams.get('preset') as DatePreset | null;
    const initialPreset: DatePreset = urlPreset && ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'].includes(urlPreset) ? urlPreset : 'this_month';

    const [activePreset, setActivePreset] = useState<DatePreset>(initialPreset);
    const [startDate, setStartDate] = useState(() => getPresetDates(initialPreset).start);
    const [endDate, setEndDate] = useState(() => getPresetDates(initialPreset).end);

    const handlePreset = (preset: DatePreset) => {
        setActivePreset(preset);
        if (preset !== 'custom') {
            const { start, end } = getPresetDates(preset);
            setStartDate(start);
            setEndDate(end);
        }
    };

    const { data, isLoading } = useQuery({
        queryKey: ['sales-report', startDate, endDate],
        queryFn: async () => {
            try {
                const response = await api.get('/reports/sales', {
                    params: { startDate, endDate },
                });
                return response.data;
            } catch {
                return { data: null };
            }
        },
    });

    const report = data?.data;

    // Compute derived data
    const totalRevenue = report?.totalRevenue ?? report?.summary?.totalRevenue ?? 0;
    const totalOrders = report?.totalOrders ?? report?.summary?.totalOrders ?? 0;
    const averageOrderValue = report?.averageOrderValue ?? report?.summary?.averageOrderValue ?? 0;
    const totalItemsSold = report?.totalItemsSold ??
        (report?.topProducts || []).reduce((sum: number, p: any) => sum + (p.totalQuantity || p.quantity || 0), 0);

    // Daily breakdown chart data
    const dailyData = useMemo(() => {
        const raw = report?.dailyBreakdown || [];
        return raw.map((d: any) => ({
            date: (() => { try { return format(parseISO(d.date), 'MMM d'); } catch { return d.date; } })(),
            revenue: Number(d.revenue || 0),
            orders: d.orders || 0,
        }));
    }, [report?.dailyBreakdown]);

    // Payment breakdown for pie chart
    const paymentData = useMemo(() => {
        const raw = report?.paymentBreakdown || [];
        return raw.map((p: any) => ({
            name: (p.method || p.paymentMethod || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            value: Number(p.total || p.amount || 0),
            count: p.count || 0,
        }));
    }, [report?.paymentBreakdown]);

    // Top products
    const topProducts = report?.topProducts || [];

    // Date range label
    const dateLabel = useMemo(() => {
        if (startDate === endDate) {
            try { return format(parseISO(startDate), 'MMMM d, yyyy'); } catch { return startDate; }
        }
        try {
            return `${format(parseISO(startDate), 'MMM d')} – ${format(parseISO(endDate), 'MMM d, yyyy')}`;
        } catch { return `${startDate} – ${endDate}`; }
    }, [startDate, endDate]);

    const presets: { key: DatePreset; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: 'yesterday', label: 'Yesterday' },
        { key: 'this_week', label: 'This Week' },
        { key: 'last_week', label: 'Last Week' },
        { key: 'this_month', label: 'This Month' },
        { key: 'last_month', label: 'Last Month' },
        { key: 'custom', label: 'Custom' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
                    <p className="text-muted-foreground">
                        {dateLabel}
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>

            {/* Quick Presets + Custom Date Range */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Presets */}
                        <div className="flex flex-wrap gap-2">
                            {presets.map(({ key, label }) => (
                                <Button
                                    key={key}
                                    variant={activePreset === key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePreset(key)}
                                    className="text-xs"
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>

                        {/* Custom date inputs */}
                        {activePreset === 'custom' && (
                            <div className="flex items-center gap-2 ml-auto">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-36 h-8 text-xs"
                                />
                                <span className="text-muted-foreground text-sm">to</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-36 h-8 text-xs"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-500">
                                        ₹{Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                    {totalOrders > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            ₹{Number(averageOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })} avg per order
                                        </p>
                                    )}
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10">
                                    <DollarSign className="h-6 w-6 text-emerald-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                                    <p className="text-2xl font-bold">{totalOrders}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {dailyData.length > 0 ? `across ${dailyData.length} day${dailyData.length > 1 ? 's' : ''}` : 'in selected period'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <Receipt className="h-6 w-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                                    <p className="text-2xl font-bold">
                                        ₹{Number(averageOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        per transaction
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-500/10">
                                    <TrendingUp className="h-6 w-6 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                                    <p className="text-2xl font-bold">{totalItemsSold}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {topProducts.length > 0 ? `across ${topProducts.length} products` : 'total units'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10">
                                    <Package className="h-6 w-6 text-amber-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-5">
                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base">Revenue Trend</CardTitle>
                        <CardDescription>Daily revenue during the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dailyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm">No data available for selected period</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Breakdown Pie Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Payment Methods</CardTitle>
                        <CardDescription>Revenue by payment type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {paymentData.map((_: any, index: number) => (
                                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                                <CreditCard className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm">No payment data</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Daily Orders Chart */}
            {dailyData.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Daily Orders</CardTitle>
                        <CardDescription>Number of orders per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                />
                                <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Top Selling Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Top Selling Products</CardTitle>
                    <CardDescription>Products ranked by revenue during the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                    ) : topProducts.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-center">Qty Sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">% of Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topProducts.map((p: any, i: number) => {
                                        const revenue = Number(p.totalRevenue || p.revenue || 0);
                                        const qty = p.totalQuantity || p.quantity || p.qty || 0;
                                        const pct = Number(totalRevenue) > 0 ? ((revenue / Number(totalRevenue)) * 100).toFixed(1) : '0';
                                        return (
                                            <TableRow key={p.productId || i}>
                                                <TableCell>
                                                    <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-7 justify-center">
                                                        {i + 1}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{p.productName || p.name || 'Unknown'}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">{p.sku || '-'}</TableCell>
                                                <TableCell className="text-center">{qty}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    ₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">{pct}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No sales data available for the selected period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Daily Breakdown Table */}
            {dailyData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Daily Breakdown</CardTitle>
                        <CardDescription>Day-by-day sales summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center">Orders</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Avg / Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyData.map((d: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{d.date}</TableCell>
                                            <TableCell className="text-center">{d.orders}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                ₹{d.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ₹{d.orders > 0 ? (d.revenue / d.orders).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals row */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-center">{totalOrders}</TableCell>
                                        <TableCell className="text-right">
                                            ₹{Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ₹{Number(averageOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

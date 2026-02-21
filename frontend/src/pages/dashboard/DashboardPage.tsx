import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    AlertTriangle,
    Clock,
    ArrowRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardMetrics {
    todaySales: {
        revenue: number;
        orders: number;
        itemsSold: number;
        change: number;
    };
    weeklySales: {
        revenue: number;
        change: number;
        data: { date: string; revenue: number }[];
    };
    lowStockCount: number;
    expiringCount: number;
    pendingOrders: number;
    topProducts: {
        id: string;
        name: string;
        quantity: number;
        revenue: number;
    }[];
    recentTransactions: {
        id: string;
        orderNumber: string;
        customerName: string;
        total: number;
        status: string;
        createdAt: string;
    }[];
}

function useDashboardMetrics() {
    return useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: DashboardMetrics }>(
                '/dashboard/overview'
            );
            return response.data.data;
        },
        // Fallback data for demo
        placeholderData: {
            todaySales: { revenue: 15420, orders: 23, itemsSold: 87, change: 12.5 },
            weeklySales: {
                revenue: 87500,
                change: 8.3,
                data: [
                    { date: 'Mon', revenue: 12500 },
                    { date: 'Tue', revenue: 15200 },
                    { date: 'Wed', revenue: 11800 },
                    { date: 'Thu', revenue: 13400 },
                    { date: 'Fri', revenue: 16800 },
                    { date: 'Sat', revenue: 9500 },
                    { date: 'Sun', revenue: 8300 },
                ],
            },
            lowStockCount: 12,
            expiringCount: 5,
            pendingOrders: 8,
            topProducts: [
                { id: '1', name: 'Amul Milk 1L', quantity: 145, revenue: 7250 },
                { id: '2', name: 'Parle-G Biscuits', quantity: 120, revenue: 2400 },
                { id: '3', name: 'Tata Salt 1kg', quantity: 95, revenue: 2850 },
                { id: '4', name: 'Fortune Oil 1L', quantity: 72, revenue: 10800 },
                { id: '5', name: 'Maggi Noodles', quantity: 68, revenue: 952 },
            ],
            recentTransactions: [
                { id: '1', orderNumber: 'ORD-001', customerName: 'Walk-in', total: 850, status: 'paid', createdAt: new Date().toISOString() },
                { id: '2', orderNumber: 'ORD-002', customerName: 'Rahul Sharma', total: 1250, status: 'paid', createdAt: new Date().toISOString() },
                { id: '3', orderNumber: 'ORD-003', customerName: 'Walk-in', total: 320, status: 'paid', createdAt: new Date().toISOString() },
                { id: '4', orderNumber: 'ORD-004', customerName: 'Priya Singh', total: 2100, status: 'pending', createdAt: new Date().toISOString() },
                { id: '5', orderNumber: 'ORD-005', customerName: 'Walk-in', total: 560, status: 'paid', createdAt: new Date().toISOString() },
            ],
        },
    });
}

function StatCard({
    title,
    value,
    change,
    icon: Icon,
    subtitle,
    className,
}: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    subtitle?: string;
    className?: string;
}) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {change !== undefined && (
                        <span
                            className={cn(
                                'flex items-center text-xs font-medium',
                                change >= 0 ? 'text-green-600' : 'text-red-600'
                            )}
                        >
                            {change >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(change)}%
                        </span>
                    )}
                    {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
                </div>
            </CardContent>
        </Card>
    );
}

function AlertCard({
    title,
    count,
    variant,
    href,
}: {
    title: string;
    count: number;
    variant: 'warning' | 'danger' | 'info';
    href: string;
}) {
    const colors = {
        warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-600 border-red-500/20',
        info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };

    return (
        <Link to={href}>
            <Card
                className={cn(
                    'border-2 transition-all hover:scale-[1.02] cursor-pointer',
                    colors[variant]
                )}
            >
                <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">{title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-lg font-bold px-3">
                            {count}
                        </Badge>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function DashboardPage() {
    const { data: metrics, isLoading } = useDashboardMetrics();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link to="/pos">New Sale</Link>
                    </Button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Revenue"
                    value={`₹${(metrics?.todaySales?.revenue || 0).toLocaleString()}`}
                    change={metrics?.todaySales?.change}
                    icon={DollarSign}
                    subtitle="vs yesterday"
                />
                <StatCard
                    title="Orders"
                    value={metrics?.todaySales?.orders || 0}
                    icon={ShoppingCart}
                    subtitle={`${metrics?.todaySales?.itemsSold || 0} items sold`}
                />
                <StatCard
                    title="Weekly Revenue"
                    value={`₹${(metrics?.weeklySales?.revenue || 0).toLocaleString()}`}
                    change={metrics?.weeklySales?.change}
                    icon={TrendingUp}
                    subtitle="vs last week"
                />
                <StatCard
                    title="Pending Orders"
                    value={metrics?.pendingOrders || 0}
                    icon={Clock}
                    subtitle="awaiting fulfillment"
                />
            </div>

            {/* Alerts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AlertCard
                    title="Low Stock Items"
                    count={metrics?.lowStockCount || 0}
                    variant="warning"
                    href="/products/low-stock"
                />
                <AlertCard
                    title="Expiring Soon"
                    count={metrics?.expiringCount || 0}
                    variant="danger"
                    href="/inventory/expiring"
                />
                <AlertCard
                    title="Online Orders"
                    count={metrics?.pendingOrders || 0}
                    variant="info"
                    href="/orders/pending"
                />
            </div>

            {/* Charts and tables */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Sales trend chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Sales Trend</CardTitle>
                        <CardDescription>Revenue over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full min-h-[250px]">
                            {metrics?.weeklySales?.data ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={metrics.weeklySales.data}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                        <CardDescription>By quantity sold this week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full min-h-[250px]">
                            {metrics?.topProducts ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={metrics.topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" className="text-xs" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            className="text-xs"
                                            width={100}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value: number) => [value, 'Qty Sold']}
                                        />
                                        <Bar
                                            dataKey="quantity"
                                            fill="hsl(var(--primary))"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest sales orders</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/orders">View all</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64">
                        <div className="space-y-4">
                            {(metrics?.recentTransactions || []).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No recent transactions
                                </div>
                            ) : (
                                (metrics?.recentTransactions || []).map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full bg-primary/10">
                                                <Package className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.orderNumber}</p>
                                                <p className="text-sm text-muted-foreground">{tx.customerName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">₹{tx.total.toLocaleString()}</p>
                                            <Badge
                                                variant={tx.status === 'paid' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                            <Link to="/pos">
                                <ShoppingCart className="h-6 w-6" />
                                New Sale
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                            <Link to="/products/new">
                                <Package className="h-6 w-6" />
                                Add Product
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                            <Link to="/purchases/new">
                                <TrendingUp className="h-6 w-6" />
                                New Purchase
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                            <Link to="/reports/sales">
                                <DollarSign className="h-6 w-6" />
                                Sales Report
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

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
import { format, parseISO } from 'date-fns';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Backend shapes ──────────────────────────────────────────

interface OverviewData {
    todaySales: { revenue: number; orders: number; items: number };
    weeklySales: { revenue: number; change: number };
    monthlySales: { revenue: number; change: number };
    lowStockCount: number;
    expiringCount: number;
    pendingOrders: number;
    outstandingPayments: number;
}

interface TrendPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface TopProduct {
    product: { id: string; name: string; sku: string } | null;
    totalQuantity: number;
    totalRevenue: number;
}

interface RecentOrder {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
    orderDate: string;
    customer?: { firstName: string; lastName: string } | null;
}

// ── Queries ─────────────────────────────────────────────────

function useOverview() {
    return useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: OverviewData }>('/dashboard/overview');
            return res.data.data;
        },
        refetchInterval: 30_000, // auto-refresh every 30s
    });
}

function useSalesTrend() {
    return useQuery({
        queryKey: ['dashboard-sales-trend'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: TrendPoint[] }>('/dashboard/sales-trend?days=7');
            return res.data.data;
        },
    });
}

function useTopProducts() {
    return useQuery({
        queryKey: ['dashboard-top-products'],
        queryFn: async () => {
            const res = await api.get<{ success: boolean; data: TopProduct[] }>('/dashboard/top-products?limit=5');
            return res.data.data;
        },
    });
}

function useRecentOrders() {
    return useQuery({
        queryKey: ['dashboard-recent-orders'],
        queryFn: async (): Promise<RecentOrder[]> => {
            const res = await api.get<{ success: boolean; data: { orders: RecentOrder[] } }>('/pos/orders?limit=10');
            return res.data.data.orders;
        },
    });
}

// ── Sub-components ──────────────────────────────────────────

function StatCard({
    title,
    value,
    change,
    icon: Icon,
    subtitle,
    className,
    href,
}: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    subtitle?: string;
    className?: string;
    href?: string;
}) {
    const content = (
        <Card className={cn('relative overflow-hidden transition-all', href && 'cursor-pointer hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 hover:scale-[1.02]', className)}>
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

    if (href) return <Link to={href}>{content}</Link>;
    return content;
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

// ── Main Page ───────────────────────────────────────────────

export default function DashboardPage() {
    const { data: overview, isLoading: loadingOverview } = useOverview();
    const { data: trend } = useSalesTrend();
    const { data: topProducts } = useTopProducts();
    const { data: recentOrders } = useRecentOrders();

    if (loadingOverview) {
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

    // Format trend data for chart
    const chartData = (trend || []).map((t) => ({
        date: (() => { try { return format(parseISO(t.date), 'MMM d'); } catch { return t.date; } })(),
        revenue: t.revenue,
    }));

    // Format top products for chart
    const topProductsChart = (topProducts || [])
        .filter((p) => p.product)
        .map((p) => ({
            name: p.product!.name.length > 18 ? p.product!.name.slice(0, 18) + '…' : p.product!.name,
            quantity: p.totalQuantity,
            revenue: p.totalRevenue,
        }));

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
                    value={`₹${(overview?.todaySales?.revenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    subtitle={`${overview?.todaySales?.orders || 0} orders today`}
                    href="/reports/sales?preset=today"
                />
                <StatCard
                    title="Items Sold Today"
                    value={overview?.todaySales?.items || 0}
                    icon={ShoppingCart}
                    subtitle={`${overview?.todaySales?.orders || 0} transactions`}
                    href="/reports/sales?preset=today"
                />
                <StatCard
                    title="Weekly Revenue"
                    value={`₹${(overview?.weeklySales?.revenue || 0).toLocaleString()}`}
                    change={overview?.weeklySales?.change}
                    icon={TrendingUp}
                    subtitle="vs last week"
                    href="/reports/sales?preset=this_week"
                />
                <StatCard
                    title="Pending Orders"
                    value={overview?.pendingOrders || 0}
                    icon={Clock}
                    subtitle="awaiting fulfillment"
                    href="/purchases"
                />
            </div>

            {/* Alerts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AlertCard
                    title="Low Stock Items"
                    count={overview?.lowStockCount || 0}
                    variant="warning"
                    href="/products/low-stock"
                />
                <AlertCard
                    title="Expiring Soon"
                    count={overview?.expiringCount || 0}
                    variant="danger"
                    href="/inventory/expiring"
                />
                <AlertCard
                    title="Outstanding Payments"
                    count={overview?.outstandingPayments ? 1 : 0}
                    variant="info"
                    href="/reports/sales"
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Sales trend chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Sales Trend</CardTitle>
                        <CardDescription>Revenue over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full min-h-[250px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-card)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--color-primary)"
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
                        <CardDescription>By quantity sold (last 30 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full min-h-[250px]">
                            {topProductsChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={topProductsChart} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" className="text-xs" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            className="text-xs"
                                            width={120}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-card)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value: number) => [value, 'Qty Sold']}
                                        />
                                        <Bar
                                            dataKey="quantity"
                                            fill="var(--color-primary)"
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
                        <Link to="/pos/sales-history">View all</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64">
                        <div className="space-y-4">
                            {!recentOrders || recentOrders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No recent transactions
                                </div>
                            ) : (
                                recentOrders.map((order: RecentOrder) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full bg-primary/10">
                                                <Package className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{order.orderNumber}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.customer
                                                        ? `${order.customer.firstName} ${order.customer.lastName}`
                                                        : 'Walk-in Customer'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">₹{Number(order.totalAmount).toLocaleString()}</p>
                                            <Badge
                                                variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {order.paymentStatus}
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
                            <Link to="/purchase-orders/new">
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

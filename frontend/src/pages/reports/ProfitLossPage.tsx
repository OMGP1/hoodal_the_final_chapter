import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Minus,
    Calendar,
    Download,
} from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function ProfitLossPage() {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading } = useQuery({
        queryKey: ['profit-loss', startDate, endDate],
        queryFn: async () => {
            try {
                const response = await api.get('/reports/profit-loss', {
                    params: { startDate, endDate },
                });
                return response.data;
            } catch {
                return { data: null };
            }
        },
    });

    const report = data?.data;
    const revenue = report?.totalRevenue || 0;
    const cogs = report?.costOfGoodsSold || 0;
    const grossProfit = revenue - cogs;
    const expenses = report?.totalExpenses || 0;
    const netProfit = grossProfit - expenses;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
                    <p className="text-muted-foreground">Financial performance overview</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>

            {/* Date range */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">From:</span>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">To:</span>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI cards */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                ₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
                            <p className={cn('text-2xl font-bold', grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                            <p className={cn('text-2xl font-bold', netProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                ₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                            <div className="flex items-center gap-2">
                                <p className={cn('text-2xl font-bold', profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                    {profitMargin.toFixed(1)}%
                                </p>
                                {profitMargin >= 0 ? (
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* P&L Statement */}
            <Card>
                <CardHeader>
                    <CardTitle>Profit & Loss Statement</CardTitle>
                    <CardDescription>
                        {new Date(startDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} — {new Date(endDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                    ) : (
                        <div className="space-y-1">
                            {/* Revenue section */}
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    <span className="font-semibold text-emerald-800">Total Revenue</span>
                                </div>
                                <span className="font-bold text-emerald-600">
                                    ₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* COGS */}
                            <div className="flex justify-between items-center p-3 pl-8">
                                <div className="flex items-center gap-2">
                                    <Minus className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Cost of Goods Sold</span>
                                </div>
                                <span className="text-red-600">
                                    -₹{cogs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <Separator />

                            {/* Gross profit */}
                            <div className="flex justify-between items-center p-3 font-medium">
                                <span>Gross Profit</span>
                                <span className={grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Expenses */}
                            <div className="flex justify-between items-center p-3 pl-8">
                                <div className="flex items-center gap-2">
                                    <Minus className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Operating Expenses</span>
                                </div>
                                <span className="text-red-600">
                                    -₹{expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <Separator />

                            {/* Net profit */}
                            <div className={cn(
                                'flex justify-between items-center p-3 rounded-lg font-bold text-lg',
                                netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                            )}>
                                <div className="flex items-center gap-2">
                                    <DollarSign className={cn('h-5 w-5', netProfit >= 0 ? 'text-emerald-600' : 'text-red-600')} />
                                    <span>Net Profit / Loss</span>
                                </div>
                                <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    ₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

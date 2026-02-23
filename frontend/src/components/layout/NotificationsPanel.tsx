import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Activity, RefreshCw, ExternalLink,
    Package, ShoppingCart, Users, Truck, UserCircle,
    DollarSign, Boxes, FileText, Settings, ClipboardList,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

interface AuditLog {
    id: string;
    action: string;       // e.g. "POST /api/v1/products"
    resourceType: string; // e.g. "products", "auth", "pos"
    resourceId?: string;
    createdAt: string;
    status: string;
    changes?: any;
    user?: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
}

// Map resourceType → icon, label, color, and deep-link route
const RESOURCE_META: Record<string, {
    icon: React.ElementType;
    label: string;
    color: string;
    route: string;             // base page route
    detailRoute?: (id: string) => string; // specific resource route
}> = {
    products: { icon: Package, label: 'Products', color: 'text-blue-500', route: '/products', detailRoute: (id) => `/products/${id}/edit` },
    variants: { icon: Package, label: 'Product Variants', color: 'text-blue-400', route: '/products' },
    inventory: { icon: Boxes, label: 'Inventory', color: 'text-emerald-500', route: '/inventory' },
    pos: { icon: ShoppingCart, label: 'Point of Sale', color: 'text-orange-500', route: '/pos/sales-history' },
    'purchase-orders': { icon: FileText, label: 'Purchase Orders', color: 'text-violet-500', route: '/purchases' },
    suppliers: { icon: Truck, label: 'Suppliers', color: 'text-amber-600', route: '/suppliers' },
    customers: { icon: UserCircle, label: 'Customers', color: 'text-pink-500', route: '/customers' },
    staff: { icon: Users, label: 'Staff', color: 'text-cyan-500', route: '/staff' },
    expenses: { icon: DollarSign, label: 'Expenses', color: 'text-red-500', route: '/expenses' },
    settings: { icon: Settings, label: 'Settings', color: 'text-gray-500', route: '/settings' },
    register: { icon: ClipboardList, label: 'Cash Register', color: 'text-teal-500', route: '/pos/sales-history' },
    reports: { icon: Activity, label: 'Reports', color: 'text-indigo-500', route: '/reports/sales' },
    users: { icon: Users, label: 'Users', color: 'text-sky-500', route: '/staff' },
};

// Translate raw "POST /api/v1/products" into "Created Products"
function humanAction(action: string, resourceType: string): string {
    const method = action.split(' ')[0];
    const meta = RESOURCE_META[resourceType];
    const moduleName = meta?.label || resourceType;

    const pathParts = action.split('/').filter(Boolean);
    const subResource = pathParts.length > 4 ? pathParts[4] : null;

    switch (method) {
        case 'POST':
            if (subResource) return `Created ${subResource} in ${moduleName}`;
            return `Created ${moduleName}`;
        case 'PUT':
        case 'PATCH':
            return `Updated ${moduleName}`;
        case 'DELETE':
            return `Deleted ${moduleName}`;
        default:
            return `${method} ${moduleName}`;
    }
}

// Build the best deep-link URL for a log entry
function getDeepLink(log: AuditLog): string | null {
    const meta = RESOURCE_META[log.resourceType];
    if (!meta) return null;

    // If this log has a specific resourceId and the meta has a detailRoute, use it
    if (log.resourceId && meta.detailRoute) {
        return meta.detailRoute(log.resourceId);
    }

    return meta.route;
}

// Resource types to EXCLUDE from the business panel
const EXCLUDED_RESOURCES = ['auth'];

export function NotificationsPanel() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const { data: rawLogs, isLoading, isError, refetch } = useQuery({
        queryKey: ['auditLogs'],
        queryFn: async () => {
            const response = await api.get('/audits?limit=100');
            return response.data.data.logs as AuditLog[];
        },
        enabled: isOpen,
        refetchInterval: isOpen ? 10000 : false,
    });

    // Filter out auth / non-business logs
    const logs = useMemo(() => {
        if (!rawLogs) return [];
        return rawLogs.filter(
            (log) => !EXCLUDED_RESOURCES.includes(log.resourceType.toLowerCase())
        );
    }, [rawLogs]);

    const unreadCount = logs?.length || 0;

    const handleLogClick = (log: AuditLog) => {
        const link = getDeepLink(log);
        if (link) {
            setIsOpen(false); // close the sheet
            navigate(link);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications & Audits</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-5 w-5 text-primary" />
                            Activity Log
                        </SheetTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => refetch()}
                            title="Refresh logs"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Click any activity to jump to the related page
                    </p>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="px-4 py-3 space-y-1">
                        {isLoading && !rawLogs && (
                            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/50" />
                                <span className="text-sm">Loading activity…</span>
                            </div>
                        )}

                        {isError && (
                            <div className="text-center py-12 text-destructive text-sm">
                                Failed to load activity logs.
                            </div>
                        )}

                        {!isLoading && logs.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                No business activity yet. Logs will appear here when products, orders, inventory, staff, or settings change.
                            </div>
                        )}

                        {logs.map((log) => {
                            const meta = RESOURCE_META[log.resourceType] || {
                                icon: Activity,
                                label: log.resourceType,
                                color: 'text-muted-foreground',
                                route: '/dashboard',
                            };
                            const Icon = meta.icon;
                            const title = humanAction(log.action, log.resourceType);
                            const userName = log.user
                                ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
                                : 'System';
                            const deepLink = getDeepLink(log);

                            return (
                                <div
                                    key={log.id}
                                    className={`flex gap-3 items-start px-2 py-3 rounded-lg transition-colors group ${deepLink
                                            ? 'cursor-pointer hover:bg-primary/5 active:bg-primary/10'
                                            : 'hover:bg-muted/50'
                                        }`}
                                    onClick={() => handleLogClick(log)}
                                    role={deepLink ? 'button' : undefined}
                                    tabIndex={deepLink ? 0 : undefined}
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-md bg-muted ${meta.color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium leading-tight truncate">
                                                {title}
                                            </p>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {deepLink && (
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                                <Badge
                                                    variant={log.status === 'success' ? 'default' : 'destructive'}
                                                    className="text-[10px] h-4 px-1.5"
                                                >
                                                    {log.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground truncate">
                                                by <span className="font-medium text-foreground">{userName}</span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

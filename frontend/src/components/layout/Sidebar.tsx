import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PERMISSIONS } from '@/config/permissions';
import {
    LayoutDashboard,
    Package,
    Boxes,
    ShoppingCart,
    FileText,
    Truck,
    Users,
    UserCircle,
    DollarSign,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface NavItem {
    title: string;
    href?: string;
    icon: React.ElementType;
    children?: { title: string; href: string; permissions?: string[] }[];
    badge?: number;
    permissions?: string[];
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permissions: [PERMISSIONS.DASHBOARD_VIEW],
    },
    {
        title: 'Products',
        icon: Package,
        permissions: [PERMISSIONS.PRODUCTS_READ],
        children: [
            { title: 'All Products', href: '/products', permissions: [PERMISSIONS.PRODUCTS_READ] },
            { title: 'Categories', href: '/products/categories', permissions: [PERMISSIONS.PRODUCTS_READ] },
            { title: 'Low Stock', href: '/products/low-stock', permissions: [PERMISSIONS.PRODUCTS_READ] },
        ],
    },
    {
        title: 'Inventory',
        icon: Boxes,
        permissions: [PERMISSIONS.INVENTORY_READ],
        children: [
            { title: 'Stock Levels', href: '/inventory', permissions: [PERMISSIONS.INVENTORY_READ] },
            { title: 'Stock Movements', href: '/inventory/movements', permissions: [PERMISSIONS.INVENTORY_READ] },
            { title: 'Expiring Items', href: '/inventory/expiring', permissions: [PERMISSIONS.INVENTORY_READ] },
        ],
    },
    {
        title: 'POS',
        icon: ShoppingCart,
        permissions: [PERMISSIONS.POS_ACCESS],
        children: [
            { title: 'POS Terminal', href: '/pos', permissions: [PERMISSIONS.POS_ACCESS] },
            { title: 'Sales History', href: '/pos/sales-history', permissions: [PERMISSIONS.SALES_READ] },
        ],
    },
    {
        title: 'Purchase Orders',
        icon: FileText,
        permissions: [PERMISSIONS.PURCHASE_READ],
        children: [
            { title: 'All Orders', href: '/purchases', permissions: [PERMISSIONS.PURCHASE_READ] },
            { title: 'Create Order', href: '/purchases/new', permissions: [PERMISSIONS.PURCHASE_CREATE] },
            { title: 'Receive Goods', href: '/purchases/receive', permissions: [PERMISSIONS.PURCHASE_RECEIVE] },
        ],
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
        permissions: [PERMISSIONS.SUPPLIERS_READ],
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: UserCircle,
        permissions: [PERMISSIONS.CUSTOMERS_READ], // Usually just READ is enough to see the page
    },
    {
        title: 'Staff',
        icon: Users,
        permissions: [PERMISSIONS.STAFF_READ], // Even staff need to read their own attendance, but the backend handles specific logic. We let anyone with STAFF_READ see this link. (Staff shouldn't see "All Staff", maybe we should let Admin/Manager handle that, but for now we'll put STAFF_READ here)
        children: [
            { title: 'All Staff', href: '/staff', permissions: [PERMISSIONS.STAFF_WRITE] }, // Only managers/admins can usually modify or see all staff
            { title: 'Attendance', href: '/staff/attendance', permissions: [PERMISSIONS.STAFF_READ] },
            { title: 'Leave Requests', href: '/staff/leaves', permissions: [PERMISSIONS.STAFF_READ] },
        ],
    },
    {
        title: 'Expenses',
        href: '/expenses',
        icon: DollarSign,
        permissions: [PERMISSIONS.EXPENSES_READ],
    },
    {
        title: 'Reports',
        icon: BarChart3,
        permissions: [PERMISSIONS.REPORTS_VIEW],
        children: [
            { title: 'Sales Report', href: '/reports/sales', permissions: [PERMISSIONS.REPORTS_VIEW] },
            { title: 'Inventory Report', href: '/reports/inventory', permissions: [PERMISSIONS.REPORTS_VIEW] },
            { title: 'Profit & Loss', href: '/reports/profit-loss', permissions: [PERMISSIONS.REPORTS_FINANCIAL] },
        ],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        permissions: [PERMISSIONS.SETTINGS_READ],
    },
];

function NavItemComponent({ item }: { item: NavItem }) {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const { sidebarCollapsed } = useUIStore();

    const isActive = item.href
        ? location.pathname === item.href
        : item.children?.some((child) => location.pathname === child.href);

    const hasChildren = item.children && item.children.length > 0;

    if (sidebarCollapsed) {
        return (
            <Link
                to={item.href || item.children?.[0]?.href || '#'}
                className={cn(
                    'flex items-center justify-center p-3 rounded-lg transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
                title={item.title}
            >
                <item.icon className="h-5 w-5" />
            </Link>
        );
    }

    if (hasChildren) {
        return (
            <div>
                <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'w-full justify-start gap-3 px-3 py-2 h-auto font-normal',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive && 'bg-sidebar-accent/50 text-sidebar-accent-foreground'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>
                {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
                        {item.children.map((child) => child && (
                            <Link
                                key={child.href}
                                to={child.href}
                                className={cn(
                                    'flex items-center py-2 px-3 rounded-lg text-sm transition-colors',
                                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    location.pathname === child.href &&
                                    'bg-sidebar-primary text-sidebar-primary-foreground'
                                )}
                            >
                                {child.title}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            to={item.href || '#'}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
            )}
        >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
        </Link>
    );
}

export function Sidebar() {
    const { sidebarCollapsed } = useUIStore();
    const user = useAuthStore((state) => state.user);
    const userPermissions = user?.permissions || [];

    const hasPermission = (permissions?: string[]) => {
        if (!permissions || permissions.length === 0) return true;
        return permissions.some((perm) => userPermissions.includes(perm));
    };

    // Filter items based on permissions
    const authorizedNavItems = navItems
        .filter((item) => hasPermission(item.permissions))
        .map((item) => {
            if (item.children) {
                return {
                    ...item,
                    children: item.children.filter((child) => hasPermission(child.permissions))
                };
            }
            return item;
        })
        .filter(item => !item.children || item.children.length > 0); // Don't show parents with 0 children

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-30',
                'transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center h-16 px-4 border-b border-sidebar-border',
                sidebarCollapsed ? 'justify-center' : 'gap-3'
            )}>
                <div className="p-2 rounded-lg bg-primary">
                    <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                {!sidebarCollapsed && (
                    <div>
                        <h1 className="font-bold text-sidebar-foreground">ShopInventory</h1>
                        <p className="text-xs text-muted-foreground">Management System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="h-[calc(100vh-4rem)] py-4">
                <nav className={cn('space-y-1', sidebarCollapsed ? 'px-2' : 'px-3')}>
                    {authorizedNavItems.map((item) => (
                        <NavItemComponent key={item.title} item={item} />
                    ))}
                </nav>
            </ScrollArea>
        </aside>
    );
}

export default Sidebar;

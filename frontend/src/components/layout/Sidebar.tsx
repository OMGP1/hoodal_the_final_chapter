import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Boxes,
    ShoppingCart,
    FileText,
    Truck,
    Users,
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
    children?: { title: string; href: string }[];
    badge?: number;
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Products',
        icon: Package,
        children: [
            { title: 'All Products', href: '/products' },
            { title: 'Categories', href: '/products/categories' },
            { title: 'Low Stock', href: '/products/low-stock' },
        ],
    },
    {
        title: 'Inventory',
        icon: Boxes,
        children: [
            { title: 'Stock Levels', href: '/inventory' },
            { title: 'Stock Movements', href: '/inventory/movements' },
            { title: 'Expiring Items', href: '/inventory/expiring' },
        ],
    },
    {
        title: 'POS',
        href: '/pos',
        icon: ShoppingCart,
    },
    {
        title: 'Purchase Orders',
        icon: FileText,
        children: [
            { title: 'All Orders', href: '/purchases' },
            { title: 'Create Order', href: '/purchases/new' },
            { title: 'Receive Goods', href: '/purchases/receive' },
        ],
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
    },
    {
        title: 'Staff',
        icon: Users,
        children: [
            { title: 'All Staff', href: '/staff' },
            { title: 'Attendance', href: '/staff/attendance' },
            { title: 'Leave Requests', href: '/staff/leaves' },
        ],
    },
    {
        title: 'Expenses',
        href: '/expenses',
        icon: DollarSign,
    },
    {
        title: 'Reports',
        icon: BarChart3,
        children: [
            { title: 'Sales Report', href: '/reports/sales' },
            { title: 'Inventory Report', href: '/reports/inventory' },
            { title: 'Profit & Loss', href: '/reports/profit-loss' },
        ],
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
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
                        {item.children.map((child) => (
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
                    {navItems.map((item) => (
                        <NavItemComponent key={item.title} item={item} />
                    ))}
                </nav>
            </ScrollArea>
        </aside>
    );
}

export default Sidebar;

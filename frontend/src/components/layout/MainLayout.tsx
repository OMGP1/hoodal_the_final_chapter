import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div
                className={cn(
                    'flex flex-col transition-all duration-300',
                    sidebarCollapsed ? 'ml-16' : 'ml-64'
                )}
            >
                <Header />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;

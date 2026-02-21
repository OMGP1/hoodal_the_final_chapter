import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useCartTotals } from '@/stores/cartStore';

interface POSLayoutProps {
    children: ReactNode;
    leftPanel: ReactNode;
    rightPanel: ReactNode;
}

export function POSLayout({ leftPanel, rightPanel }: POSLayoutProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { itemCount, grandTotal } = useCartTotals();

    const handleExit = () => {
        if (itemCount > 0) {
            // TODO: Show confirmation dialog
            const confirmed = window.confirm(
                'You have items in your cart. Are you sure you want to exit?'
            );
            if (!confirmed) return;
        }
        navigate('/dashboard');
    };

    return (
        <div className="fixed inset-0 bg-background flex flex-col">
            {/* Header */}
            <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                            POS
                        </span>
                        <span>Point of Sale</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Current time */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <CurrentTime />
                    </div>

                    {/* Cashier info */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                            {user?.firstName || 'Cashier'}
                        </span>
                    </div>

                    {/* Cart summary */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">
                            {itemCount} items
                        </span>
                        <span className="font-semibold">
                            ₹{grandTotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Exit button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExit}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Exit POS</span>
                    </Button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left panel - Product search and grid */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {leftPanel}
                </div>

                {/* Right panel - Cart */}
                <div className="w-[400px] border-l bg-card flex flex-col overflow-hidden">
                    {rightPanel}
                </div>
            </div>
        </div>
    );
}

// Component to display current time, updates every second
function CurrentTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return <span className="text-sm font-mono">{time}</span>;
}

export default POSLayout;

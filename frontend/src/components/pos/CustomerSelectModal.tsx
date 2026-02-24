import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User, X, Check, UserPlus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { Customer } from '@/types/customer';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerSelectModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (customer: Customer | null) => void;
    currentCustomerId?: string;
}

export function CustomerSelectModal({ open, onClose, onSelect, currentCustomerId }: CustomerSelectModalProps) {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['customers', search],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: Customer[] }>('/customers', {
                params: {
                    limit: 10,
                    search: search.length >= 2 ? search : undefined,
                },
            });
            // Handle PaginatedResponse from backend properly (which has { data: [...], pagination: {...} } inside response.data.data or response.data)
            // It looks like /customers returns sendPaginated, so response.data.data is the array
            return Array.isArray(response.data?.data) ? response.data.data : [];
        },
        enabled: open,
    });

    const customers = data || [];

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        onClose();
    };

    const handleClear = () => {
        onSelect(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Select Customer</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-2">
                        {isLoading ? (
                            <div className="space-y-2 p-2">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                                <User className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">No customers found.</p>
                                {/* Future enhancement: Add Quick Create Customer button here */}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {currentCustomerId && (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-auto py-3 mb-2"
                                        onClick={handleClear}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Remove current customer
                                    </Button>
                                )}

                                {customers.map((customer) => (
                                    <Button
                                        key={customer.id}
                                        variant={currentCustomerId === customer.id ? "secondary" : "ghost"}
                                        className="w-full justify-start h-auto py-3 px-4 flex-col items-start gap-1"
                                        onClick={() => handleSelect(customer)}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-semibold">{customer.name}</span>
                                            {currentCustomerId === customer.id && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{customer.phone || 'No phone'}</span>
                                            {customer.email && (
                                                <>
                                                    <span>•</span>
                                                    <span>{customer.email}</span>
                                                </>
                                            )}
                                        </div>
                                        {customer.currentBalance > 0 && (
                                            <Badge variant="destructive" className="mt-1 text-[10px]">
                                                Balance: ₹{Number(customer.currentBalance).toFixed(2)}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CustomerSelectModal;

import { useState } from 'react';
import {
    Banknote,
    CreditCard,
    Smartphone,
    Receipt,
    X,
    Check,
    Calculator,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCartTotals } from '@/stores/cartStore';

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    onComplete: (paymentData: PaymentData) => void;
    isPending?: boolean;
}

export interface PaymentData {
    method: PaymentMethod;
    amountPaid: number;
    change: number;
    reference?: string; // For card/UPI transactions
}

type PaymentMethod = 'cash' | 'card' | 'upi' | 'credit';

const PAYMENT_METHODS = [
    { id: 'cash' as const, label: 'Cash', icon: Banknote },
    { id: 'card' as const, label: 'Card', icon: CreditCard },
    { id: 'upi' as const, label: 'UPI', icon: Smartphone },
    { id: 'credit' as const, label: 'Credit', icon: Receipt },
];

const QUICK_CASH_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000, 2000];

export function PaymentModal({ open, onClose, onComplete, isPending }: PaymentModalProps) {
    const { grandTotal } = useCartTotals();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [amountPaid, setAmountPaid] = useState(grandTotal);
    const [reference, setReference] = useState('');

    const change = Math.max(0, amountPaid - grandTotal);
    const isPaymentValid =
        amountPaid >= grandTotal &&
        (selectedMethod === 'cash' || reference.length > 0 || selectedMethod === 'credit');

    const handleQuickAmount = (amount: number) => {
        setAmountPaid(amount);
    };

    const handleExactAmount = () => {
        setAmountPaid(grandTotal);
    };

    const handleComplete = () => {
        if (!isPaymentValid) return;

        onComplete({
            method: selectedMethod,
            amountPaid,
            change,
            reference: reference || undefined,
        });
    };

    const handleMethodChange = (method: PaymentMethod) => {
        setSelectedMethod(method);
        if (method !== 'cash') {
            setAmountPaid(grandTotal);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Payment</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Amount due */}
                    <div className="text-center py-4 bg-primary/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Amount Due</div>
                        <div className="text-4xl font-bold text-primary">
                            ₹{grandTotal.toFixed(2)}
                        </div>
                    </div>

                    {/* Payment method selection */}
                    <div className="grid grid-cols-4 gap-2">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isSelected = selectedMethod === method.id;
                            return (
                                <Button
                                    key={method.id}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className="flex flex-col items-center gap-1 h-auto py-3"
                                    onClick={() => handleMethodChange(method.id)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-xs">{method.label}</span>
                                </Button>
                            );
                        })}
                    </div>

                    <Separator />

                    {/* Payment details based on method */}
                    {selectedMethod === 'cash' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Amount Tendered</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        ₹
                                    </span>
                                    <Input
                                        type="number"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                                        className="pl-8 text-lg h-12"
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                            </div>

                            {/* Quick amount buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleExactAmount}
                                    className="col-span-2"
                                >
                                    <Calculator className="h-4 w-4 mr-1" />
                                    Exact
                                </Button>
                                {QUICK_CASH_AMOUNTS.slice(0, 6).map((amount) => (
                                    <Button
                                        key={amount}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickAmount(amount)}
                                        disabled={amount < grandTotal}
                                    >
                                        ₹{amount}
                                    </Button>
                                ))}
                            </div>

                            {/* Change display */}
                            {change > 0 && (
                                <div className="text-center py-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="text-sm text-green-600 dark:text-green-400">
                                        Change
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        ₹{change.toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {(selectedMethod === 'card' || selectedMethod === 'upi') && (
                        <div className="space-y-2">
                            <Label>
                                {selectedMethod === 'card' ? 'Card Transaction ID' : 'UPI Reference'}
                            </Label>
                            <Input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder={
                                    selectedMethod === 'card'
                                        ? 'Enter last 4 digits or transaction ID'
                                        : 'Enter UPI transaction reference'
                                }
                                className="h-12"
                            />
                        </div>
                    )}

                    {selectedMethod === 'credit' && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                This will add ₹{grandTotal.toFixed(2)} to the customer's credit
                                account. Make sure a customer is selected.
                            </p>
                        </div>
                    )}

                    {/* Complete payment button */}
                    <Button
                        className="w-full h-14 text-lg font-semibold"
                        disabled={!isPaymentValid || isPending}
                        onClick={handleComplete}
                    >
                        {isPending ? (
                            <><span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></span> Processing...</>
                        ) : (
                            <><Check className="h-5 w-5 mr-2" /> Complete Payment</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PaymentModal;

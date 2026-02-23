import { useState, useEffect, useCallback } from 'react';
import {
    Settings as SettingsIcon,
    Store,
    Bell,
    Save,
    Users,
    Loader2,
    Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

import {
    useSettingsByPrefix,
    useBulkUpsertSettings,
} from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

type SettingsRecord = Record<string, string>;

/**
 * Generic settings section component
 * Loads settings by prefix, renders editable fields, and saves via bulkUpsert
 */
function SettingsSection({
    prefix,
    fields,
    title,
    description,
}: {
    prefix: string;
    fields: { key: string; label: string; type?: string; placeholder?: string; hint?: string; rows?: number }[];
    title: string;
    description: string;
}) {
    const { data, isLoading } = useSettingsByPrefix(prefix);
    const bulkUpsert = useBulkUpsertSettings();
    const [values, setValues] = useState<SettingsRecord>({});
    const [initialized, setInitialized] = useState(false);

    // Populate form when API data arrives
    useEffect(() => {
        if (data && !initialized) {
            const initial: SettingsRecord = {};
            for (const f of fields) {
                const fullKey = `${prefix}.${f.key}`;
                initial[f.key] = data[fullKey] != null ? String(data[fullKey]) : '';
            }
            setValues(initial);
            setInitialized(true);
        }
    }, [data, initialized, fields, prefix]);

    const handleSave = useCallback(async () => {
        const settings = fields.map((f) => ({
            key: `${prefix}.${f.key}`,
            value: values[f.key] ?? '',
        }));
        try {
            await bulkUpsert.mutateAsync(settings);
            toast.success(`${title} saved successfully`);
        } catch (err: any) {
            toast.error(err?.response?.data?.error?.message || 'Failed to save settings');
        }
    }, [values, fields, prefix, bulkUpsert, title]);

    const updateField = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((f) => (
                        <Skeleton key={f.key} className="h-10 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {fields.map((f) => (
                        <div key={f.key} className={`space-y-2 ${f.rows ? 'md:col-span-2' : ''}`}>
                            <Label>{f.label}</Label>
                            {f.rows ? (
                                <Textarea
                                    value={values[f.key] || ''}
                                    onChange={(e) => updateField(f.key, e.target.value)}
                                    rows={f.rows}
                                    placeholder={f.placeholder}
                                />
                            ) : (
                                <Input
                                    type={f.type || 'text'}
                                    value={values[f.key] || ''}
                                    onChange={(e) => updateField(f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                />
                            )}
                            {f.hint && (
                                <p className="text-xs text-muted-foreground">{f.hint}</p>
                            )}
                        </div>
                    ))}
                </div>
                <Button onClick={handleSave} disabled={bulkUpsert.isPending}>
                    {bulkUpsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </CardContent>
        </Card>
    );
}

// ─── Field definitions per section ─────────────
const shopFields = [
    { key: 'name', label: 'Shop Name', placeholder: 'My Shop' },
    { key: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'shop@example.com' },
    { key: 'gstNumber', label: 'GST Number', placeholder: '27AABCU9603R1ZM' },
    { key: 'address', label: 'Address', rows: 3, placeholder: 'Full shop address' },
];

const taxFields = [
    { key: 'defaultRate', label: 'Default GST Rate (%)', type: 'number', hint: 'Applied as default for new products' },
    { key: 'gstin', label: 'GSTIN', placeholder: '27AABCU9603R1ZM' },
    { key: 'defaultHsnCode', label: 'Default HSN Code', placeholder: 'e.g., 0401', hint: 'Pre-filled for new products to save time' },
    { key: 'invoicePrefix', label: 'Invoice Prefix', placeholder: 'INV-' },
];

const inventoryFields = [
    { key: 'lowStockThreshold', label: 'Default Low Stock Threshold', type: 'number', hint: 'Trigger alert when stock falls below this level' },
    { key: 'expiryAlertDays', label: 'Expiry Alert Days', type: 'number', hint: 'Warn about products expiring within this many days' },
    { key: 'reorderAlertEnabled', label: 'Auto Reorder Alert', placeholder: 'true', hint: 'Set to "true" to enable automatic reorder alerts' },
];

const invoiceFields = [
    { key: 'prefix', label: 'Invoice Prefix', placeholder: 'INV-' },
    { key: 'counter', label: 'Next Invoice Number', type: 'number', hint: 'Auto-increments after each sale' },
    { key: 'terms', label: 'Invoice Terms & Conditions', rows: 4, placeholder: 'Payment due within 30 days...' },
    { key: 'footerNote', label: 'Footer Note', placeholder: 'Thank you for your business!' },
];

export default function SettingsPage() {
    // GST split preview
    const { data: taxData } = useSettingsByPrefix('tax');
    const taxRate = Number(taxData?.['tax.defaultRate'] ?? 18);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage shop configuration and preferences</p>
            </div>

            <Tabs defaultValue="shop" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
                    <TabsTrigger value="shop" className="gap-2">
                        <Store className="h-4 w-4" /> Shop
                    </TabsTrigger>
                    <TabsTrigger value="tax" className="gap-2">
                        <SettingsIcon className="h-4 w-4" /> Tax & Billing
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2">
                        <Bell className="h-4 w-4" /> Inventory
                    </TabsTrigger>
                    <TabsTrigger value="invoice" className="gap-2">
                        <Receipt className="h-4 w-4" /> Invoice
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" /> Users
                    </TabsTrigger>
                </TabsList>

                {/* Shop Profile */}
                <TabsContent value="shop">
                    <SettingsSection
                        prefix="shop"
                        fields={shopFields}
                        title="Shop Information"
                        description="Your shop details will appear on invoices and receipts."
                    />
                </TabsContent>

                {/* Tax & Billing */}
                <TabsContent value="tax">
                    <div className="space-y-6">
                        <SettingsSection
                            prefix="tax"
                            fields={taxFields}
                            title="Tax Configuration"
                            description="Set up GST rates, default HSN codes, and billing preferences."
                        />
                        {/* GST Split Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">GST Split Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                                        <p className="text-sm text-muted-foreground">CGST</p>
                                        <p className="text-lg font-bold">{(taxRate / 2).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                                        <p className="text-sm text-muted-foreground">SGST</p>
                                        <p className="text-lg font-bold">{(taxRate / 2).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                                        <p className="text-sm text-muted-foreground">IGST</p>
                                        <p className="text-lg font-bold">{taxRate.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Inventory Settings */}
                <TabsContent value="inventory">
                    <SettingsSection
                        prefix="inventory"
                        fields={inventoryFields}
                        title="Inventory Alerts"
                        description="Configure stock level thresholds and alert preferences."
                    />
                </TabsContent>

                {/* Invoice Settings */}
                <TabsContent value="invoice">
                    <SettingsSection
                        prefix="invoice"
                        fields={invoiceFields}
                        title="Invoice Configuration"
                        description="Customize invoice numbering, terms, and footer notes."
                    />
                </TabsContent>

                {/* User Management */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage user accounts and role assignments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">User management coming soon</p>
                                <p className="text-sm">You'll be able to create, edit, and deactivate user accounts here.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

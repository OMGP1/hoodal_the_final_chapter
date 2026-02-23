import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import type { Product, ProductCategory, CreateProductData } from '@/types';
import { UNITS_OF_MEASURE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface ProductFormData {
    sku: string;
    name: string;
    description: string;
    categoryId: string;
    barcode: string;
    unitOfMeasure: string;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    taxRate: number;
    reorderLevel: number;
    maxStockLevel: number;
    isPerishable: boolean;
    shelfLifeDays: number;
    isActive: boolean;
}

function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: ProductCategory[] }>(
                '/products/categories'
            );
            return response.data.data;
        },
        placeholderData: [],
    });
}

function useProduct(id: string | undefined) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

export default function ProductFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPerishable, setIsPerishable] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [categoryId, setCategoryId] = useState('');
    const [unitOfMeasure, setUnitOfMeasure] = useState('piece');

    const { data: categories } = useCategories();
    const { data: product, isLoading: isLoadingProduct } = useProduct(id);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProductFormData>({
        defaultValues: {
            sku: '',
            name: '',
            description: '',
            categoryId: '',
            barcode: '',
            unitOfMeasure: 'piece',
            purchasePrice: 0,
            sellingPrice: 0,
            mrp: 0,
            taxRate: 0,
            reorderLevel: 10,
            maxStockLevel: 0,
            isPerishable: false,
            shelfLifeDays: 0,
            isActive: true,
        },
    });

    useEffect(() => {
        if (product) {
            setValue('sku', product.sku);
            setValue('name', product.name);
            setValue('description', product.description || '');
            setValue('categoryId', product.categoryId || '');
            setValue('barcode', product.barcode || '');
            setValue('unitOfMeasure', product.unitOfMeasure);
            setValue('purchasePrice', Number(product.purchasePrice));
            setValue('sellingPrice', Number(product.sellingPrice));
            setValue('mrp', product.mrp ? Number(product.mrp) : 0);
            setValue('taxRate', Number(product.taxRate));
            setValue('reorderLevel', product.reorderLevel);
            setValue('maxStockLevel', product.maxStockLevel || 0);
            setValue('isPerishable', product.isPerishable);
            setValue('shelfLifeDays', product.shelfLifeDays || 0);
            setValue('isActive', product.isActive);

            setIsPerishable(product.isPerishable);
            setIsActive(product.isActive);
            setCategoryId(product.categoryId || '');
            setUnitOfMeasure(product.unitOfMeasure);
            if (product.imageUrl) {
                const apiBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
                const fullUrl = product.imageUrl.startsWith('http') ? product.imageUrl : `${apiBase}${product.imageUrl}`;
                setImagePreview(fullUrl);
                setImageUrl(product.imageUrl);
            }
        }
    }, [product, setValue]);

    const handleImageUpload = async (file: File) => {
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/products/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res.data.data.imageUrl;
            setImageUrl(url);
            const apiBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
            setImagePreview(url.startsWith('http') ? url : `${apiBase}${url}`);
            toast.success('Image uploaded');
        } catch {
            toast.error('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const createMutation = useMutation({
        mutationFn: async (data: CreateProductData) => {
            const response = await api.post('/products', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product created successfully');
            navigate('/products');
        },
        onError: () => {
            toast.error('Failed to create product');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: CreateProductData) => {
            const response = await api.put(`/products/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', id] });
            toast.success('Product updated successfully');
            navigate('/products');
        },
        onError: () => {
            toast.error('Failed to update product');
        },
    });

    const onSubmit = (data: ProductFormData) => {
        const payload: CreateProductData = {
            ...data,
            categoryId: categoryId || undefined,
            unitOfMeasure: unitOfMeasure,
            isPerishable: isPerishable,
            isActive: isActive,
            mrp: data.mrp || undefined,
            maxStockLevel: data.maxStockLevel || undefined,
            shelfLifeDays: isPerishable ? data.shelfLifeDays : undefined,
            imageUrl: imageUrl || undefined,
        };

        if (isEditing) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingProduct) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEditing ? 'Edit Product' : 'New Product'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditing ? 'Update product details' : 'Add a new product to your catalog'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Product name, SKU, and description</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Product Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter product name"
                                            {...register('name', { required: 'Product name is required' })}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sku">SKU *</Label>
                                        <Input
                                            id="sku"
                                            placeholder="e.g., PROD-001"
                                            {...register('sku', { required: 'SKU is required' })}
                                        />
                                        {errors.sku && (
                                            <p className="text-sm text-destructive">{errors.sku.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter product description"
                                        rows={3}
                                        {...register('description')}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={categoryId} onValueChange={setCategoryId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories?.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="barcode">Barcode</Label>
                                        <Input
                                            id="barcode"
                                            placeholder="Enter barcode"
                                            {...register('barcode')}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing</CardTitle>
                                <CardDescription>Set purchase and selling prices</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="purchasePrice">Purchase Price *</Label>
                                        <Input
                                            id="purchasePrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('purchasePrice', {
                                                required: 'Purchase price is required',
                                                valueAsNumber: true,
                                                min: { value: 0, message: 'Must be positive' }
                                            })}
                                        />
                                        {errors.purchasePrice && (
                                            <p className="text-sm text-destructive">{errors.purchasePrice.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sellingPrice">Selling Price *</Label>
                                        <Input
                                            id="sellingPrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('sellingPrice', {
                                                required: 'Selling price is required',
                                                valueAsNumber: true,
                                                min: { value: 0, message: 'Must be positive' }
                                            })}
                                        />
                                        {errors.sellingPrice && (
                                            <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mrp">MRP</Label>
                                        <Input
                                            id="mrp"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('mrp', { valueAsNumber: true })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="taxRate">Tax Rate (GST %)</Label>
                                        <Input
                                            id="taxRate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            {...register('taxRate', { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unit of Measure</Label>
                                        <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UNITS_OF_MEASURE.map((unit) => (
                                                    <SelectItem key={unit.value} value={unit.value}>
                                                        {unit.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory Settings</CardTitle>
                                <CardDescription>Stock levels and expiry tracking</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="reorderLevel">Reorder Level</Label>
                                        <Input
                                            id="reorderLevel"
                                            type="number"
                                            min="0"
                                            {...register('reorderLevel', { valueAsNumber: true })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Alert when stock falls below this
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxStockLevel">Max Stock Level</Label>
                                        <Input
                                            id="maxStockLevel"
                                            type="number"
                                            min="0"
                                            {...register('maxStockLevel', { valueAsNumber: true })}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="isPerishable"
                                        checked={isPerishable}
                                        onCheckedChange={(checked) => setIsPerishable(checked === true)}
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="isPerishable">Perishable Item</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Track expiry dates for this product
                                        </p>
                                    </div>
                                </div>

                                {isPerishable && (
                                    <div className="space-y-2">
                                        <Label htmlFor="shelfLifeDays">Shelf Life (Days)</Label>
                                        <Input
                                            id="shelfLifeDays"
                                            type="number"
                                            min="1"
                                            {...register('shelfLifeDays', { valueAsNumber: true })}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Image upload */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Image</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                                >
                                    {uploadingImage ? (
                                        <div className="py-8 flex flex-col items-center gap-2">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">Uploading…</p>
                                        </div>
                                    ) : imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImagePreview(null);
                                                    setImageUrl(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="absolute bottom-2 right-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                            >
                                                Change
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="py-8">
                                            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                Click to upload image
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG, WebP up to 5MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="isActive"
                                        checked={isActive}
                                        onCheckedChange={(checked) => setIsActive(checked === true)}
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label htmlFor="isActive">Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Product is available for sale
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <Button type="submit" className="w-full" disabled={isPending}>
                                        {isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {isEditing ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                {isEditing ? 'Update Product' : 'Create Product'}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}

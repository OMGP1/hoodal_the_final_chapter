import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import type { Product, PaginatedResponse } from '@/types';

interface ProductGridProps {
    onProductSelect: (product: Product) => void;
    categoryFilter?: string;
}

export function ProductGrid({ onProductSelect, categoryFilter }: ProductGridProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['pos-products', categoryFilter],
        queryFn: async () => {
            const response = await api.get<PaginatedResponse<Product>>(
                '/products',
                {
                    params: {
                        pageSize: 50,
                        isActive: true,
                        categoryId: categoryFilter || undefined,
                    },
                }
            );
            return response.data;
        },
        staleTime: 60000, // Cache for 1 minute
    });

    const products = data?.data || [];

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <span>Failed to load products</span>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <span>No products found</span>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => onProductSelect(product)}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

interface ProductCardProps {
    product: Product;
    onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
    const getStockStatus = (): 'in_stock' | 'low_stock' | 'out_of_stock' => {
        if (product.availableQuantity === undefined || product.availableQuantity === null) {
            return 'in_stock'; // Fallback if data is missing
        }
        if (product.availableQuantity <= 0) return 'out_of_stock';
        if (product.isLowStock || product.availableQuantity <= (product.reorderLevel || 5)) return 'low_stock';
        return 'in_stock';
    };

    const stockStatus = getStockStatus();
    const isOutOfStock = stockStatus === 'out_of_stock';

    const stockBadge = {
        in_stock: null,
        low_stock: <Badge variant="secondary" className="text-xs">Low Stock</Badge>,
        out_of_stock: <Badge variant="destructive" className="text-xs">Out of Stock</Badge>,
    }[stockStatus];

    return (
        <Button
            variant="outline"
            className="h-auto p-3 flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
            onClick={onClick}
            disabled={isOutOfStock}
        >
            {/* Product image */}
            <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (() => {
                    const apiBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
                    const imgSrc = product.imageUrl.startsWith('http') ? product.imageUrl : `${apiBase}${product.imageUrl}`;
                    return (
                        <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-md"
                        />
                    );
                })() : (
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                )}
            </div>

            {/* Product info */}
            <div className="w-full text-left space-y-1">
                <div className="font-medium text-sm line-clamp-2 leading-tight">
                    {product.name}
                </div>
                <div className="text-xs text-muted-foreground">
                    {product.sku}
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">
                        ₹{Number(product.sellingPrice).toFixed(0)}
                    </span>
                    {stockBadge}
                </div>
            </div>
        </Button>
    );
}

export default ProductGrid;

import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import type { Product } from '@/types';

interface ProductGridProps {
    onProductSelect: (product: Product) => void;
    categoryFilter?: string;
}

interface ProductsResponse {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
}

export function ProductGrid({ onProductSelect, categoryFilter }: ProductGridProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['pos-products', categoryFilter],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: ProductsResponse }>(
                '/products',
                {
                    params: {
                        pageSize: 50,
                        isActive: true,
                        categoryId: categoryFilter || undefined,
                    },
                }
            );
            return response.data.data;
        },
        staleTime: 60000, // Cache for 1 minute
    });

    const products = data?.products || [];

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
    // Determine stock status (would need inventory data)
    // TODO: Get actual stock status from inventory service
    const getStockStatus = (): 'in_stock' | 'low_stock' | 'out_of_stock' => {
        // Placeholder - will be replaced with actual inventory check
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
            {/* Product image placeholder */}
            <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md"
                    />
                ) : (
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

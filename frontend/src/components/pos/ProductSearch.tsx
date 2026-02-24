import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { Product, PaginatedResponse } from '@/types';

interface ProductSearchProps {
    onProductSelect: (product: Product) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
}

export function ProductSearch({ onProductSelect, inputRef }: ProductSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const internalRef = useRef<HTMLInputElement>(null);
    const ref = inputRef || internalRef;
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search query
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 200);
        return () => clearTimeout(timer);
    }, [query]);

    // Search products
    const { data, isLoading } = useQuery({
        queryKey: ['pos-product-search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                return null;
            }
            const response = await api.get<PaginatedResponse<Product>>(
                '/products',
                {
                    params: {
                        search: debouncedQuery,
                        pageSize: 10,
                        isActive: true,
                    },
                }
            );
            return response.data;
        },
        enabled: debouncedQuery.length >= 2,
        staleTime: 30000, // Cache for 30 seconds
    });

    const products = data?.data || [];

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [products]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen || products.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < products.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (products[selectedIndex]) {
                        handleSelect(products[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    setQuery('');
                    break;
            }
        },
        [isOpen, products, selectedIndex]
    );

    const handleSelect = (product: Product) => {
        onProductSelect(product);
        setQuery('');
        setIsOpen(false);
        ref.current?.focus();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={ref}
                    type="text"
                    placeholder="Search products by name, SKU, or barcode..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 h-12 text-lg"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Dropdown results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
                    {products.length === 0 && !isLoading ? (
                        <div className="p-4 text-center text-muted-foreground">
                            No products found for "{query}"
                        </div>
                    ) : (
                        <ul className="py-1">
                            {products.map((product, index) => (
                                <li
                                    key={product.id}
                                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-4 ${index === selectedIndex
                                        ? 'bg-accent'
                                        : 'hover:bg-muted'
                                        }`}
                                    onClick={() => handleSelect(product)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {product.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>{product.sku}</span>
                                            {product.barcode && (
                                                <Badge variant="outline" className="text-xs">
                                                    {product.barcode}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-semibold">
                                            ₹{Number(product.sellingPrice).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {product.taxRate}% GST
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProductSearch;

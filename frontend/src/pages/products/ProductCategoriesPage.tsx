import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Search, Plus, Pencil, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Category {
    id: string;
    name: string;
    description: string | null;
    productCount: number;
}

export default function ProductCategoriesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: Category[] }>('/products/categories');
            return response.data.data;
        },
    });

    // Create category mutation
    const createMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const response = await api.post('/products/categories', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created successfully');
            closeDialog();
        },
        onError: () => {
            toast.error('Failed to create category');
        },
    });

    // Update category mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
            const response = await api.put(`/products/categories/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category updated successfully');
            closeDialog();
        },
        onError: () => {
            toast.error('Failed to update category');
        },
    });

    // Delete category mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/products/categories/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category deleted successfully');
            setDeletingCategory(null);
        },
        onError: () => {
            toast.error('Failed to delete category. It may have products assigned.');
        },
    });

    const openCreateDialog = () => {
        setEditingCategory(null);
        setFormName('');
        setFormDescription('');
        setDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setFormName(category.name);
        setFormDescription(category.description || '');
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingCategory(null);
        setFormName('');
        setFormDescription('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Category name is required');
            return;
        }

        const payload = {
            name: formName.trim(),
            description: formDescription.trim() || undefined,
        };

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;
    const filteredCategories = categories?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) || [];

    // Map category name to its image
    const getCategoryImage = (name: string): string | null => {
        const apiBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
        const map: Record<string, string> = {
            'dairy products': '/uploads/products/dairy.png',
            'groceries': '/uploads/products/grocery.png',
            'beverages': '/uploads/products/beverage.png',
            'snacks': '/uploads/products/snacks.png',
            'personal care': '/uploads/products/personal_care.png',
            'household': '/uploads/products/household.png',
            'bakery': '/uploads/products/grocery.png',
            'fruits & vegetables': '/uploads/products/grocery.png',
        };
        const path = map[name.toLowerCase()];
        return path ? `${apiBase}${path}` : null;
    };

    // Category color accents
    const getCategoryGradient = (name: string): string => {
        const map: Record<string, string> = {
            'dairy products': 'from-blue-500/20 to-cyan-500/10',
            'groceries': 'from-amber-500/20 to-orange-500/10',
            'beverages': 'from-rose-500/20 to-pink-500/10',
            'snacks': 'from-yellow-500/20 to-lime-500/10',
            'personal care': 'from-violet-500/20 to-purple-500/10',
            'household': 'from-emerald-500/20 to-teal-500/10',
            'bakery': 'from-orange-500/20 to-red-500/10',
            'fruits & vegetables': 'from-green-500/20 to-lime-500/10',
        };
        return map[name.toLowerCase()] || 'from-primary/20 to-primary/5';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
                    <p className="text-muted-foreground">Manage your product classifications</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Category Cards Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            ) : filteredCategories.length === 0 ? (
                <Card className="py-16">
                    <CardContent className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-12 w-12 mb-3 opacity-40" />
                        <p className="text-lg font-medium">No categories found</p>
                        <p className="text-sm mt-1">Create a new category to get started</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredCategories.map((category) => {
                        const imgSrc = getCategoryImage(category.name);
                        const gradient = getCategoryGradient(category.name);

                        return (
                            <Card
                                key={category.id}
                                className="group overflow-hidden border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                            >
                                {/* Image area */}
                                <div className={`relative h-40 bg-gradient-to-br ${gradient} overflow-hidden`}>
                                    {imgSrc ? (
                                        <img
                                            src={imgSrc}
                                            alt={category.name}
                                            className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="h-16 w-16 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    {/* Overlay gradient for readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

                                    {/* Product count badge */}
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">
                                            {category.productCount} Products
                                        </Badge>
                                    </div>

                                    {/* Category name on image */}
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className="text-lg font-bold text-foreground truncate">
                                            {category.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Content area */}
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                        {category.description || 'No description'}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => openEditDialog(category)}
                                        >
                                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setDeletingCategory(category)}
                                        >
                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? 'Update the category name and description below.'
                                : 'Fill in the details to create a new product category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">Name *</Label>
                            <Input
                                id="categoryName"
                                placeholder="e.g. Dairy Products"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="categoryDescription">Description</Label>
                            <Input
                                id="categoryDescription"
                                placeholder="e.g. Milk, cheese, butter, paneer"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingCategory ? 'Save Changes' : 'Create Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{deletingCategory?.name}</span>? This action cannot be undone. Products in this category will become uncategorized.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

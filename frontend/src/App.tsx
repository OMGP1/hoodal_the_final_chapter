import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';

// Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Products
import ProductListPage from '@/pages/products/ProductListPage';
import ProductFormPage from '@/pages/products/ProductFormPage';

// Inventory
import InventoryPage from '@/pages/inventory/InventoryPage';

// POS
import POSPage from '@/pages/pos/POSPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* POS - Full screen, protected but outside MainLayout */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Products */}
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/products/:id/edit" element={<ProductFormPage />} />
            <Route path="/products/categories" element={<ProductListPage />} />
            <Route path="/products/low-stock" element={<ProductListPage />} />

            {/* Inventory */}
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/movements" element={<InventoryPage />} />
            <Route path="/inventory/expiring" element={<InventoryPage />} />

            {/* Placeholder routes for other modules */}
            <Route path="/purchases" element={<ComingSoon title="Purchase Orders" />} />
            <Route path="/purchases/new" element={<ComingSoon title="New Purchase Order" />} />
            <Route path="/suppliers" element={<ComingSoon title="Suppliers" />} />
            <Route path="/staff" element={<ComingSoon title="Staff Management" />} />
            <Route path="/staff/attendance" element={<ComingSoon title="Attendance" />} />
            <Route path="/staff/leaves" element={<ComingSoon title="Leave Requests" />} />
            <Route path="/expenses" element={<ComingSoon title="Expenses" />} />
            <Route path="/reports/sales" element={<ComingSoon title="Sales Report" />} />
            <Route path="/reports/inventory" element={<ComingSoon title="Inventory Report" />} />
            <Route path="/reports/profit-loss" element={<ComingSoon title="Profit & Loss" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

// Placeholder component for routes not yet implemented
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-muted-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">This module is coming soon in the next phase.</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Page not found</p>
        <a href="/dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default App;

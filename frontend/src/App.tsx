import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AxiosError } from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { PERMISSIONS } from '@/config/permissions';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';

// Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Products
import ProductListPage from '@/pages/products/ProductListPage';
import ProductFormPage from '@/pages/products/ProductFormPage';
import ProductCategoriesPage from '@/pages/products/ProductCategoriesPage';
import LowStockPage from '@/pages/products/LowStockPage';

// Inventory
import InventoryPage from '@/pages/inventory/InventoryPage';
import InventoryMovementsPage from '@/pages/inventory/InventoryMovementsPage';
import ExpiringItemsPage from '@/pages/inventory/ExpiringItemsPage';

// POS
import POSPage from '@/pages/pos/POSPage';
import SalesHistoryPage from '@/pages/pos/SalesHistoryPage';

// Purchase Orders
import PurchaseOrdersPage from '@/pages/purchases/PurchaseOrdersPage';
import PurchaseOrderForm from '@/pages/purchases/PurchaseOrderForm';
import ReceiveGoodsPage from '@/pages/purchases/ReceiveGoodsPage';
import ProcessReceiptPage from '@/pages/purchases/ProcessReceiptPage';

// Suppliers
import SuppliersPage from '@/pages/suppliers/SuppliersPage';

// Customers
import CustomersPage from '@/pages/customers/CustomersPage';

// Staff
import StaffPage from '@/pages/staff/StaffPage';
import AttendancePage from '@/pages/staff/AttendancePage';
import LeavesPage from '@/pages/staff/LeavesPage';

// Expenses
import ExpensesPage from '@/pages/expenses/ExpensesPage';

// Reports
import SalesReportPage from '@/pages/reports/SalesReportPage';
import InventoryReportPage from '@/pages/reports/InventoryReportPage';
import ProfitLossPage from '@/pages/reports/ProfitLossPage';

// Settings
import SettingsPage from '@/pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Do not retry on 4xx Client Errors (except perhaps 429 Too Many Requests)
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            return false;
          }
        }
        return failureCount < 2; // Retry up to 2 times for network/5xx errors
      },
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* POS - Full screen, protected but outside MainLayout */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute requiredPermissions={[PERMISSIONS.POS_ACCESS]}>
                  <POSPage />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.DASHBOARD_VIEW]}><DashboardPage /></ProtectedRoute>} />

              {/* Products */}
              <Route path="/products" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_READ]}><ProductListPage /></ProtectedRoute>} />
              <Route path="/products/new" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_WRITE]}><ProductFormPage /></ProtectedRoute>} />
              <Route path="/products/:id/edit" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_WRITE]}><ProductFormPage /></ProtectedRoute>} />
              <Route path="/products/categories" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_READ]}><ProductCategoriesPage /></ProtectedRoute>} />
              <Route path="/products/low-stock" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PRODUCTS_READ]}><LowStockPage /></ProtectedRoute>} />

              {/* Inventory */}
              <Route path="/inventory" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.INVENTORY_READ]}><InventoryPage /></ProtectedRoute>} />
              <Route path="/inventory/movements" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.INVENTORY_READ]}><InventoryMovementsPage /></ProtectedRoute>} />
              <Route path="/inventory/expiring" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.INVENTORY_READ]}><ExpiringItemsPage /></ProtectedRoute>} />

              {/* POS Sales History */}
              <Route path="/pos/sales-history" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.SALES_READ]}><SalesHistoryPage /></ProtectedRoute>} />

              {/* Purchase Orders */}
              <Route path="/purchases" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PURCHASE_READ]}><PurchaseOrdersPage /></ProtectedRoute>} />
              <Route path="/purchases/new" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PURCHASE_CREATE]}><PurchaseOrderForm /></ProtectedRoute>} />
              <Route path="/purchases/receive" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PURCHASE_RECEIVE]}><ReceiveGoodsPage /></ProtectedRoute>} />
              <Route path="/purchases/:id/receive" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.PURCHASE_RECEIVE]}><ProcessReceiptPage /></ProtectedRoute>} />

              {/* Suppliers */}
              <Route path="/suppliers" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.SUPPLIERS_READ]}><SuppliersPage /></ProtectedRoute>} />

              {/* Customers */}
              <Route path="/customers" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.CUSTOMERS_READ]}><CustomersPage /></ProtectedRoute>} />

              {/* Staff */}
              <Route path="/staff" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.STAFF_READ]}><StaffPage /></ProtectedRoute>} />
              <Route path="/staff/attendance" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.STAFF_READ]}><AttendancePage /></ProtectedRoute>} />
              <Route path="/staff/leaves" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.STAFF_READ]}><LeavesPage /></ProtectedRoute>} />

              {/* Expenses */}
              <Route path="/expenses" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.EXPENSES_READ]}><ExpensesPage /></ProtectedRoute>} />

              {/* Reports */}
              <Route path="/reports/sales" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}><SalesReportPage /></ProtectedRoute>} />
              <Route path="/reports/inventory" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_VIEW]}><InventoryReportPage /></ProtectedRoute>} />
              <Route path="/reports/profit-loss" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_FINANCIAL]}><ProfitLossPage /></ProtectedRoute>} />

              {/* Settings */}
              <Route path="/settings" element={<ProtectedRoute requiredPermissions={[PERMISSIONS.SETTINGS_READ]}><SettingsPage /></ProtectedRoute>} />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster position="top-right" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
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

function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
        <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

function GlobalErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground">
          We're sorry, but an unexpected error occurred. You can try reloading the page.
        </p>
        <div className="p-4 bg-muted rounded-md text-left overflow-auto max-h-32 text-xs font-mono text-muted-foreground">
          {error.message}
        </div>
        <div className="pt-4 flex gap-4 justify-center">
          <Button onClick={resetErrorBoundary} className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;

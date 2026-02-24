import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import variantRoutes from './variant.routes';
import inventoryRoutes from './inventory.routes';
import dashboardRoutes from './dashboard.routes';
import posRoutes from './pos.routes';
import registerRoutes from './register.routes';
import purchaseRoutes from './purchase.routes';
import staffRoutes from './staff.routes';
import expenseRoutes from './expense.routes';
import reportRoutes from './report.routes';
import supplierRoutes from './supplier.routes';
import customerRoutes from './customer.routes';
import settingsRoutes from './settings.routes';
import auditRoutes from './audit.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pos', posRoutes);
router.use('/register', registerRoutes);
router.use('/purchase-orders', purchaseRoutes);
router.use('/staff', staffRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/settings', settingsRoutes);
router.use('/audits', auditRoutes);

export default router;


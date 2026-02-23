import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/constants';

const router = Router();

// Only users with settings/reports permission can view audit logs
router.use(authenticate);
router.use(authorize(PERMISSIONS.SETTINGS_READ));

router.get('/', getAuditLogs);

export default router;

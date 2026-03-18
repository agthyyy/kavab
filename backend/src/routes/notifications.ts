import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { registerToken } from '../controllers/notificationsController';

const router = Router();

// POST /api/notifications/token — save/update FCM token for authenticated user
router.post('/token', requireAuth, registerToken);

export default router;

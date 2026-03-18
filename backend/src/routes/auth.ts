import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', loginHandler);

// POST /api/auth/refresh
router.post('/refresh', refreshHandler);

// POST /api/auth/logout — requires valid access token
router.post('/logout', requireAuth, logoutHandler);

export default router;

import { Router } from 'express';
import { rankingController } from '../controllers/rankingController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// GET /api/ranking/me - получить мой рейтинг
router.get('/me', rankingController.getMyRanking);

// GET /api/ranking/leaderboard - получить таблицу лидеров
router.get('/leaderboard', rankingController.getLeaderboard);

export default router;

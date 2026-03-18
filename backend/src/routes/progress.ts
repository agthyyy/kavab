import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  completeLessonHandler,
  submitQuizHandler,
  getProgressHandler,
  getAchievementsHandler,
  getXpHistoryHandler,
} from '../controllers/progressController';

const router = Router();

router.use(requireAuth);

// POST /api/progress/lessons/:id/complete
router.post('/lessons/:id/complete', completeLessonHandler);

// POST /api/progress/quizzes/:id/submit
router.post('/quizzes/:id/submit', submitQuizHandler);

// GET /api/progress/me
router.get('/me', getProgressHandler);

// GET /api/progress/me/achievements
router.get('/me/achievements', getAchievementsHandler);

// GET /api/progress/me/xp-history
router.get('/me/xp-history', getXpHistoryHandler);

export default router;

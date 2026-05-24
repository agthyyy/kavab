import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as gamificationController from '../controllers/gamificationController';

const router = Router();

// ── Daily Quests ──────────────────────────────────────────────────────────────
router.get('/daily-quests', requireAuth, gamificationController.getDailyQuests);

// ── Titles ────────────────────────────────────────────────────────────────────
router.get('/titles', requireAuth, gamificationController.getUserTitles);
router.post('/titles/activate', requireAuth, gamificationController.setActiveTitle);

// ── Energy ────────────────────────────────────────────────────────────────────
router.get('/energy', requireAuth, gamificationController.getUserEnergy);

// ── Collection ────────────────────────────────────────────────────────────────
router.get('/cards', requireAuth, gamificationController.getUserCards);

// ── Overview ──────────────────────────────────────────────────────────────────
router.get('/overview', requireAuth, gamificationController.getGamificationOverview);

export default router;
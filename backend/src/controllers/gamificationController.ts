import { Request, Response, NextFunction } from 'express';
import * as gamificationService from '../services/gamificationService';

// ── Daily Quests ──────────────────────────────────────────────────────────────

export async function getDailyQuests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const quests = await gamificationService.generateDailyQuests(userId);
    res.status(200).json({ quests });
  } catch (err) {
    next(err);
  }
}

// ── Titles ────────────────────────────────────────────────────────────────────

export async function getUserTitles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const titles = await gamificationService.getUserTitles(userId);
    res.status(200).json({ titles });
  } catch (err) {
    next(err);
  }
}

export async function setActiveTitle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const { titleId } = req.body as { titleId?: string };
    if (!titleId) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'titleId is required' } });
      return;
    }

    await gamificationService.setActiveTitle(userId, titleId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── Energy System ─────────────────────────────────────────────────────────────

export async function getUserEnergy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const energy = await gamificationService.getUserEnergy(userId);
    res.status(200).json({ energy });
  } catch (err) {
    next(err);
  }
}

// ── Collectible Cards ─────────────────────────────────────────────────────────

export async function getUserCards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const cards = await gamificationService.getUserCards(userId);
    res.status(200).json({ cards });
  } catch (err) {
    next(err);
  }
}

// ── Gamification Overview ─────────────────────────────────────────────────────

export async function getGamificationOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const [quests, titles, energy, cards] = await Promise.all([
      gamificationService.generateDailyQuests(userId),
      gamificationService.getUserTitles(userId),
      gamificationService.getUserEnergy(userId),
      gamificationService.getUserCards(userId),
    ]);

    const activeTitle = titles.find(t => t.isActive);
    const unlockedTitles = titles.filter(t => t.isUnlocked);
    const completedQuests = quests.filter(q => q.isCompleted);

    res.status(200).json({
      dailyQuests: {
        quests,
        completed: completedQuests.length,
        total: quests.length,
      },
      titles: {
        active: activeTitle,
        unlocked: unlockedTitles.length,
        total: titles.length,
      },
      energy,
      collection: {
        cards: cards.length,
        totalCards: await getTotalCardsCount(),
        rareCards: cards.filter(c => ['rare', 'epic', 'legendary', 'mythic'].includes(c.rarity)).length,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Helper Functions ──────────────────────────────────────────────────────────

async function getTotalCardsCount(): Promise<number> {
  const db = require('../config/database').default;
  const result = await db('collectible_cards').count('id as count').first();
  return parseInt(result?.count as string || '0');
}
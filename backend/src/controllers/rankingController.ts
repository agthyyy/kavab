import { Request, Response } from 'express';
import { rankingService } from '../services/rankingService';

export const rankingController = {
  async getMyRanking(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const ranking = await rankingService.getUserRanking(userId);
      res.json(ranking);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get ranking' });
    }
  },

  async getLeaderboard(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await rankingService.getLeaderboard(userId, limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get leaderboard' });
    }
  },
};

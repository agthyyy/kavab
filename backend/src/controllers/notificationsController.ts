import { Request, Response, NextFunction } from 'express';
import { saveToken } from '../services/notificationService';

/**
 * POST /api/notifications/token
 * Body: { token: string }
 * Upserts the FCM token for the authenticated user.
 */
export async function registerToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body as { token?: unknown };

    if (!token || typeof token !== 'string' || token.trim() === '') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'token is required and must be a non-empty string' } });
      return;
    }

    const userId = req.user!.id;
    await saveToken(userId, token.trim());

    res.status(200).json({ message: 'Token saved' });
  } catch (err) {
    next(err);
  }
}

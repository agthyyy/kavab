import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { login, password } = req.body as { login?: string; password?: string };

    if (!login || !password) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'login and password are required' } });
      return;
    }

    const result = await authService.login(login, password);
    res.json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken is required' } });
      return;
    }

    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as Request & { user?: { id: string } }).user;
    if (!user) {
      res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Unauthorized' } });
      return;
    }

    const { refreshToken } = req.body as { refreshToken?: string };
    await authService.logout(user.id, refreshToken);
    res.json({ message: 'Logged out' });
  } catch (err: unknown) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { env } from '../config/env';

export interface AuthUser {
  id: string;
  role: string;
  fullName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[AUTH] Missing or invalid Authorization header for', req.method, req.path);
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Missing or invalid Authorization header' } });
    return;
  }

  const token = authHeader.slice(7);

  let payload: { sub: string; role: string };
  try {
    payload = jwt.verify(token, env.jwt.accessSecret) as { sub: string; role: string };
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    console.log('[AUTH] Token verification failed for', req.method, req.path, '- Error:', isExpired ? 'EXPIRED' : 'INVALID');
    res.status(401).json({
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: isExpired ? 'Access token expired' : 'Invalid access token',
      },
    });
    return;
  }

  // Join with roles table to get role name
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', payload.sub)
    .select('users.id', 'users.full_name', 'users.is_active', 'roles.name as role')
    .first();

  if (!user) {
    console.log('[AUTH] User not found for ID:', payload.sub, 'from token for', req.method, req.path);
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'User not found' } });
    return;
  }

  if (!user.is_active) {
    console.log('[AUTH] Account disabled for user:', user.id, req.method, req.path);
    res.status(403).json({ error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' } });
    return;
  }

  req.user = { id: user.id, role: user.role, fullName: user.full_name };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }
    next();
  };
}

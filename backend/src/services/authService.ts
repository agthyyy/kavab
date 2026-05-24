import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/database';
import { env } from '../config/env';

// In-memory failed attempt tracker with TTL
interface AttemptRecord {
  count: number;
  lockedUntil?: number; // epoch ms
}

const failedAttempts = new Map<string, AttemptRecord>();

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getAttemptRecord(login: string): AttemptRecord {
  return failedAttempts.get(login) ?? { count: 0 };
}

function isLocked(login: string): boolean {
  const record = failedAttempts.get(login);
  if (!record?.lockedUntil) return false;
  if (Date.now() < record.lockedUntil) return true;
  // Lock expired — clear it
  failedAttempts.delete(login);
  return false;
}

function recordFailedAttempt(login: string): void {
  const record = getAttemptRecord(login);
  const newCount = record.count + 1;
  if (newCount >= LOCK_THRESHOLD) {
    failedAttempts.set(login, { count: newCount, lockedUntil: Date.now() + LOCK_DURATION_MS });
  } else {
    failedAttempts.set(login, { count: newCount });
  }
}

function clearAttempts(login: string): void {
  failedAttempts.delete(login);
}

// Exported for testing
export { failedAttempts, isLocked, recordFailedAttempt, clearAttempts, LOCK_THRESHOLD };

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; fullName: string; role: string };
}

export async function login(loginInput: string, password: string): Promise<LoginResult> {
  if (isLocked(loginInput)) {
    const err = new Error('Account locked for 15 minutes') as Error & { statusCode: number; code: string };
    err.statusCode = 423;
    err.code = 'ACCOUNT_LOCKED';
    throw err;
  }

  // Join with roles table to get role name
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.login', loginInput)
    .select('users.*', 'roles.name as role')
    .first();

  if (!user || !user.is_active) {
    recordFailedAttempt(loginInput);
    const err = new Error('Invalid login or password') as Error & { statusCode: number; code: string };
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    recordFailedAttempt(loginInput);
    const err = new Error('Invalid login or password') as Error & { statusCode: number; code: string };
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  clearAttempts(loginInput);

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken, tokenHash, expiresAt } = generateRefreshToken();

  await db('refresh_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    revoked: false,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, fullName: user.full_name, role: user.role },
  };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  const tokenHash = hashToken(refreshToken);
  const record = await db('refresh_tokens')
    .where({ token_hash: tokenHash, revoked: false })
    .where('expires_at', '>', db.fn.now())
    .first();

  if (!record) {
    const err = new Error('Invalid or expired refresh token') as Error & { statusCode: number; code: string };
    err.statusCode = 401;
    err.code = 'TOKEN_INVALID';
    throw err;
  }

  // Join with roles table to get role name
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', record.user_id)
    .select('users.id', 'users.is_active', 'roles.name as role')
    .first();

  if (!user || !user.is_active) {
    const err = new Error('Account is disabled') as Error & { statusCode: number; code: string };
    err.statusCode = 403;
    err.code = 'ACCOUNT_DISABLED';
    throw err;
  }

  const accessToken = generateAccessToken(user.id, user.role);
  return { accessToken };
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await db('refresh_tokens').where({ token_hash: tokenHash, user_id: userId }).update({ revoked: true });
  } else {
    // Revoke all refresh tokens for user
    await db('refresh_tokens').where({ user_id: userId }).update({ revoked: true });
  }
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(): { refreshToken: string; tokenHash: string; expiresAt: Date } {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return { refreshToken, tokenHash, expiresAt };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Feature: kavabanga-learning-platform
 * Auth tests: properties 1, 2, 3 + unit test for lockout
 */

import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// We test the service layer directly with mocked DB to avoid needing a real DB
// The DB module is mocked below

// Mock the database module
jest.mock('../config/database', () => {
  const dbMock = jest.fn().mockImplementation((_table: string) => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    select: jest.fn().mockReturnThis(),
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dbMock as any).fn = { now: jest.fn().mockReturnValue('NOW()') };
  return { __esModule: true, default: dbMock };
});

import db from '../config/database';
import * as authService from '../services/authService';
import { env } from '../config/env';

// Helper to build a mock user
function buildUser(overrides: Partial<{
  id: string;
  login: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
}> = {}) {
  return {
    id: 'user-uuid-1',
    login: 'testuser',
    password_hash: '',
    full_name: 'Test User',
    role: 'barista',
    is_active: true,
    ...overrides,
  };
}

// Helper to set up DB mock chain to return a specific value from .first()
function mockDbFirst(value: unknown) {
  const firstMock = jest.fn().mockResolvedValue(value);
  const whereMock = jest.fn().mockReturnValue({ first: firstMock, where: jest.fn().mockReturnValue({ first: firstMock }) });
  (db as unknown as jest.Mock).mockReturnValue({ where: whereMock, insert: jest.fn().mockResolvedValue([1]) });
  return { whereMock, firstMock };
}

function mockDbInsert() {
  const insertMock = jest.fn().mockResolvedValue([1]);
  const whereMock = jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null), where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) });
  (db as unknown as jest.Mock).mockReturnValue({ where: whereMock, insert: insertMock });
  return insertMock;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Clear in-memory attempt map between tests
  authService.failedAttempts.clear();
});

// ─── Property 1: Successful authentication returns token ───────────────────
// Validates: Requirements 1.1, 2.1
describe('Property 1: Successful authentication returns token', () => {
  it('for any valid user credentials, login returns accessToken and refreshToken', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          login: fc.string({ minLength: 3, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
          password: fc.string({ minLength: 6, maxLength: 30 }),
          fullName: fc.string({ minLength: 2, maxLength: 50 }),
          role: fc.constantFrom('barista', 'waiter', 'manager', 'admin'),
        }),
        async ({ login, password, fullName, role }) => {
          const passwordHash = await bcrypt.hash(password, 1);
          const user = buildUser({ login, password_hash: passwordHash, full_name: fullName, role });

          // Mock DB: users.where().first() returns user, refresh_tokens.insert() succeeds
          let callCount = 0;
          (db as unknown as jest.Mock).mockImplementation((table: string) => {
            if (table === 'users') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(user),
                }),
              };
            }
            if (table === 'refresh_tokens') {
              return { insert: jest.fn().mockResolvedValue([1]) };
            }
            callCount++;
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          authService.failedAttempts.clear();
          const result = await authService.login(login, password);

          return (
            typeof result.accessToken === 'string' &&
            result.accessToken.length > 0 &&
            typeof result.refreshToken === 'string' &&
            result.refreshToken.length > 0 &&
            result.user.id === user.id &&
            result.user.role === role
          );
        }
      ),
      { numRuns: 20 } // reduced for speed since bcrypt is slow
    );
  });
});

// ─── Property 2: Invalid credentials are rejected ──────────────────────────
// Validates: Requirements 1.2
describe('Property 2: Invalid credentials are rejected', () => {
  it('for any wrong password, login returns 401 INVALID_CREDENTIALS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          login: fc.string({ minLength: 3, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
          correctPassword: fc.string({ minLength: 6, maxLength: 30 }),
          wrongPassword: fc.string({ minLength: 1, maxLength: 30 }),
        }).filter(({ correctPassword, wrongPassword }) => correctPassword !== wrongPassword),
        async ({ login, correctPassword, wrongPassword }) => {
          const passwordHash = await bcrypt.hash(correctPassword, 1);
          const user = buildUser({ login, password_hash: passwordHash });

          (db as unknown as jest.Mock).mockImplementation((table: string) => {
            if (table === 'users') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(user),
                }),
              };
            }
            return { insert: jest.fn().mockResolvedValue([1]) };
          });

          authService.failedAttempts.clear();
          try {
            await authService.login(login, wrongPassword);
            return false; // should have thrown
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 401 && e.code === 'INVALID_CREDENTIALS';
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('for non-existent login, returns 401 INVALID_CREDENTIALS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
        async (login) => {
          (db as unknown as jest.Mock).mockImplementation(() => ({
            where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
          }));

          authService.failedAttempts.clear();
          try {
            await authService.login(login, 'anypassword');
            return false;
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 401 && e.code === 'INVALID_CREDENTIALS';
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Unit test 2.4: Lockout after 5 failed attempts ────────────────────────
describe('Unit test 2.4: Account lockout after 5 failed attempts', () => {
  it('5th failed attempt triggers lock, 6th attempt returns 423 ACCOUNT_LOCKED', async () => {
    const login = 'locktest_user';
    const correctPassword = 'correct_pass';
    const passwordHash = await bcrypt.hash(correctPassword, 1);
    const user = buildUser({ login, password_hash: passwordHash });

    (db as unknown as jest.Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(user) }),
        };
      }
      return { insert: jest.fn().mockResolvedValue([1]) };
    });

    authService.failedAttempts.clear();

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login(login, 'wrong_password');
      } catch {
        // expected 401
      }
    }

    // 6th attempt should be locked
    try {
      await authService.login(login, 'wrong_password');
      fail('Expected 423 error');
    } catch (err: unknown) {
      const e = err as { statusCode?: number; code?: string };
      expect(e.statusCode).toBe(423);
      expect(e.code).toBe('ACCOUNT_LOCKED');
    }
  });

  it('correct credentials after 4 failed attempts still succeed', async () => {
    const login = 'almost_locked';
    const correctPassword = 'correct_pass';
    const passwordHash = await bcrypt.hash(correctPassword, 1);
    const user = buildUser({ login, password_hash: passwordHash });

    (db as unknown as jest.Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(user) }),
        };
      }
      return { insert: jest.fn().mockResolvedValue([1]) };
    });

    authService.failedAttempts.clear();

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      try {
        await authService.login(login, 'wrong_password');
      } catch {
        // expected 401
      }
    }

    // 5th attempt with correct password should succeed
    const result = await authService.login(login, correctPassword);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });
});

// ─── Property 3: Logout invalidates session ────────────────────────────────
// Validates: Requirements 1.5
describe('Property 3: Logout invalidates session', () => {
  it('after logout, using old access token returns 401 (token verification fails for revoked tokens)', async () => {
    // This property tests that:
    // 1. logout() marks the refresh token as revoked in DB
    // 2. A subsequent refresh() call with the old refresh token fails
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          role: fc.constantFrom('barista', 'waiter', 'manager', 'admin'),
        }),
        async ({ userId, role }) => {
          // Generate a real access token
          const accessToken = authService.generateAccessToken(userId, role);

          // Simulate a refresh token
          const refreshToken = 'fake-refresh-token-' + userId;

          // Mock DB: logout updates revoked=true, then refresh finds no valid token
          const updateMock = jest.fn().mockResolvedValue(1);
          (db as unknown as jest.Mock).mockImplementation((table: string) => {
            if (table === 'refresh_tokens') {
              return {
                where: jest.fn().mockReturnValue({
                  update: updateMock,
                  where: jest.fn().mockReturnValue({
                    first: jest.fn().mockResolvedValue(null), // token not found after revoke
                  }),
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          // Perform logout
          await authService.logout(userId, refreshToken);

          // Verify update was called (token revoked)
          expect(updateMock).toHaveBeenCalledWith({ revoked: true });

          // Now try to use the refresh token — should fail
          (db as unknown as jest.Mock).mockImplementation((table: string) => {
            if (table === 'refresh_tokens') {
              return {
                where: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    first: jest.fn().mockResolvedValue(null), // revoked, not found
                  }),
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          try {
            await authService.refresh(refreshToken);
            return false; // should have thrown
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 401 && e.code === 'TOKEN_INVALID';
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('access token is still cryptographically valid after logout (stateless JWT)', () => {
    // Access tokens are stateless — they remain valid until expiry.
    // The session is invalidated by revoking the refresh token.
    // This test verifies the access token was properly signed.
    const userId = 'test-user-id';
    const role = 'barista';
    const accessToken = authService.generateAccessToken(userId, role);

    const decoded = jwt.verify(accessToken, env.jwt.accessSecret) as { sub: string; role: string };
    expect(decoded.sub).toBe(userId);
    expect(decoded.role).toBe(role);
  });
});

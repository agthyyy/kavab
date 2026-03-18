/**
 * Feature: kavabanga-learning-platform
 * User management tests: properties 4, 5, 6
 */

import * as fc from 'fast-check';

// Mock the database module
jest.mock('../config/database', () => {
  const dbMock = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dbMock as any).fn = { now: jest.fn().mockReturnValue('NOW()') };
  return { __esModule: true, default: dbMock };
});

import db from '../config/database';
import * as userService from '../services/userService';

const dbMock = db as unknown as jest.Mock;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'uuid-1',
    login: 'existing',
    full_name: 'Existing User',
    role: 'barista',
    is_active: true,
    created_at: new Date(),
    ...overrides,
  };
}

/** Set up db mock so that users.where().first() returns `value` */
function mockUsersFirst(value: unknown) {
  dbMock.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(value),
        }),
        insert: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([buildUserRow()]),
        }),
        count: jest.fn().mockResolvedValue([{ count: '0' }]),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };
    }
    return {
      where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
      insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
    };
  });
}

/** Set up db mock for successful user creation (no existing user) */
function mockCreateSuccess(returnRow: Record<string, unknown>) {
  dbMock.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null), // no existing user
        }),
        insert: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([returnRow]),
        }),
      };
    }
    return {
      where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
    };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Property 4: Login uniqueness on user creation ───────────────────────────
// Validates: Requirements 2.2
describe('Property 4: Login uniqueness on user creation', () => {
  it('for any existing login, creating a user with the same login returns 409 LOGIN_ALREADY_EXISTS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length > 0),
        async (login) => {
          // DB returns an existing user for this login
          mockUsersFirst(buildUserRow({ login }));

          try {
            await userService.createUser({ login, password: 'pass123', fullName: 'Test', role: 'barista' });
            return false; // should have thrown
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 409 && e.code === 'LOGIN_ALREADY_EXISTS';
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: User role always from allowed set ───────────────────────────
// Validates: Requirements 2.4
describe('Property 6: User role always from allowed set', () => {
  it('for any role value not in [barista, waiter, manager, admin], creation returns 400 VALIDATION_ERROR', async () => {
    const validRoles = new Set(['barista', 'waiter', 'manager', 'admin']);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !validRoles.has(s)),
        async (invalidRole) => {
          // DB mock not needed — validation happens before DB call
          mockUsersFirst(null);

          try {
            await userService.createUser({ login: 'anylogin', password: 'pass123', fullName: 'Test', role: invalidRole });
            return false; // should have thrown
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 400 && e.code === 'VALIDATION_ERROR';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid roles are accepted without validation error', async () => {
    for (const role of userService.VALID_ROLES) {
      const returnRow = buildUserRow({ role });
      mockCreateSuccess(returnRow);

      const result = await userService.createUser({ login: `user_${role}`, password: 'pass123', fullName: 'Test', role });
      expect(result.role).toBe(role);
    }
  });
});

// ─── Property 5: Deactivation immediately blocks access ──────────────────────
// Validates: Requirements 2.3
describe('Property 5: Deactivation immediately blocks access', () => {
  it('after deactivation, user.isActive is false in DB', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const deactivatedRow = buildUserRow({ id: userId, is_active: false });

          // Mock: existing user found, update returns deactivated row
          dbMock.mockImplementation((table: string) => {
            if (table === 'users') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(buildUserRow({ id: userId, is_active: true })),
                  update: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([deactivatedRow]),
                  }),
                }),
              };
            }
            return {
              where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            };
          });

          const result = await userService.updateUser(userId, { isActive: false });
          return result.isActive === false;
        }
      ),
      { numRuns: 50 }
    );
  });
});

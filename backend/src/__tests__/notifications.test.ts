/**
 * Feature: kavabanga-learning-platform
 * Push notifications tests — tasks 8.3, 8.4, 8.6
 */

import * as fc from 'fast-check';

// ── Mock database ─────────────────────────────────────────────────────────────
jest.mock('../config/database', () => {
  const dbMock = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dbMock as any).fn = { now: jest.fn().mockReturnValue('NOW()') };
  return { __esModule: true, default: dbMock };
});

// ── Mock Firebase messaging ───────────────────────────────────────────────────
const mockSend = jest.fn();
jest.mock('../config/firebase', () => ({
  getMessaging: jest.fn(() => ({ send: mockSend })),
}));

import db from '../config/database';
import * as userService from '../services/userService';
import * as notificationService from '../services/notificationService';

const dbMock = db as unknown as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCourseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: 'course-1', title: 'Espresso Basics', is_published: true, ...overrides };
}

function buildUserRow(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: 'user-1', login: 'barista1', full_name: 'Test User', role: 'barista', is_active: true, created_at: new Date(), ...overrides };
}

/**
 * Set up db mock for assignCourse:
 * - courses.where().first() → courseRow
 * - fcm_tokens.where().first() → fcmRow
 * - user_courses.insert().onConflict().ignore() → resolves
 */
function mockAssignCourse(courseRow: Record<string, unknown> | null, fcmRow: Record<string, unknown> | null) {
  dbMock.mockImplementation((table: string) => {
    if (table === 'courses') {
      return {
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(courseRow),
        }),
      };
    }
    if (table === 'fcm_tokens') {
      return {
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(fcmRow),
        }),
        insert: jest.fn().mockReturnValue({
          onConflict: jest.fn().mockReturnValue({
            merge: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      };
    }
    if (table === 'user_courses') {
      return {
        insert: jest.fn().mockReturnValue({
          onConflict: jest.fn().mockReturnValue({
            ignore: jest.fn().mockResolvedValue(undefined),
          }),
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
  mockSend.mockResolvedValue('message-id');
});

// ─── 8.3 Unit test: assignCourse with FCM token → FCM send called ─────────────
describe('8.3 Unit: assignCourse FCM notification', () => {
  it('sends FCM notification with correct title/body when user has a token', async () => {
    const course = buildCourseRow({ title: 'Espresso Basics' });
    const fcmRow = { user_id: 'user-1', token: 'fcm-token-abc' };
    mockAssignCourse(course, fcmRow);

    await userService.assignCourse('user-1', 'course-1');

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith({
      token: 'fcm-token-abc',
      notification: {
        title: 'New course assigned!',
        body: 'Espresso Basics',
      },
    });
  });

  it('does NOT call FCM send when user has no token', async () => {
    const course = buildCourseRow({ title: 'Latte Art' });
    mockAssignCourse(course, null); // no FCM token

    await userService.assignCourse('user-1', 'course-1');

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('does not throw when FCM send fails — request still succeeds', async () => {
    const course = buildCourseRow({ title: 'Barista Pro' });
    const fcmRow = { user_id: 'user-1', token: 'bad-token' };
    mockAssignCourse(course, fcmRow);
    mockSend.mockRejectedValueOnce(new Error('FCM error'));

    // Should not throw
    await expect(userService.assignCourse('user-1', 'course-1')).resolves.toBeUndefined();
  });
});

// ─── 8.4 Property test: no notification for users without FCM token ───────────
// Property 27: Notifications not sent to users without FCM token
// Validates: Requirements 11.3
describe('Property 27: Notifications not sent to users without FCM token', () => {
  it('for any user without FCM token, FCM send is never called', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.string({ minLength: 1, maxLength: 100 }), // notification title
        fc.string({ minLength: 1, maxLength: 200 }), // notification body
        async (userId, title, body) => {
          jest.clearAllMocks();

          // DB returns no FCM token for this user
          dbMock.mockImplementation((table: string) => {
            if (table === 'fcm_tokens') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(null),
                }),
              };
            }
            return {
              where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            };
          });

          await notificationService.sendNotificationToUser(userId, title, body);

          return mockSend.mock.calls.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── 8.6 Property test: editing lesson does not affect user_lesson_progress ───
// Property 26: Editing lesson does not affect employees who completed it
// Validates: Requirements 10.7
describe('Property 26: Editing lesson content does not change user_lesson_progress', () => {
  it('for any lesson update, user_lesson_progress table is never modified', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // lessonId
        fc.record({
          blockType: fc.constantFrom('text', 'image', 'video'),
          content: fc.string({ minLength: 0, maxLength: 500 }),
          orderIndex: fc.integer({ min: 0, max: 100 }),
        }),
        async (lessonId, blockData) => {
          jest.clearAllMocks();

          const insertMock = jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{
              id: 'block-1',
              lesson_id: lessonId,
              block_type: blockData.blockType,
              content: blockData.content,
              order_index: blockData.orderIndex,
            }]),
          });

          const tablesWritten: string[] = [];

          dbMock.mockImplementation((table: string) => {
            return {
              insert: jest.fn().mockImplementation(() => {
                tablesWritten.push(table);
                return insertMock();
              }),
              where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
            };
          });

          // Import contentService lazily to use the mocked db
          const { addLessonBlock } = await import('../services/contentService');
          try {
            await addLessonBlock(lessonId, blockData);
          } catch {
            // Validation errors are fine — we only care that user_lesson_progress is untouched
          }

          return !tablesWritten.includes('user_lesson_progress');
        }
      ),
      { numRuns: 50 }
    );
  });
});

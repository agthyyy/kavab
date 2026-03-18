/**
 * Feature: kavabanga-learning-platform
 * Content management tests: properties 25, 24, 16, 11
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
import * as contentService from '../services/contentService';
import * as userService from '../services/userService';

const dbMock = db as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Property 25: Course unavailable for assignment before publishing ─────────
// Validates: Requirements 10.6
// Feature: kavabanga-learning-platform, Property 25: Course unavailable for assignment before publishing
describe('Property 25: Course unavailable for assignment before publishing', () => {
  it('for any unpublished course, assignCourse throws 400 VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.uuid(), // courseId
        async (userId, courseId) => {
          // DB returns an unpublished course
          dbMock.mockImplementation((table: string) => {
            if (table === 'courses') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue({
                    id: courseId,
                    title: 'Test Course',
                    is_published: false,
                  }),
                }),
              };
            }
            return {
              where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
              insert: jest.fn().mockReturnValue({ onConflict: jest.fn().mockReturnValue({ ignore: jest.fn().mockResolvedValue([]) }) }),
            };
          });

          try {
            await userService.assignCourse(userId, courseId);
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

  it('published course can be assigned without error', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';

    dbMock.mockImplementation((table: string) => {
      if (table === 'courses') {
        return {
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ id: courseId, title: 'Test', is_published: true }),
          }),
        };
      }
      if (table === 'user_courses') {
        return {
          insert: jest.fn().mockReturnValue({
            onConflict: jest.fn().mockReturnValue({ ignore: jest.fn().mockResolvedValue([]) }),
          }),
        };
      }
      return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
    });

    await expect(userService.assignCourse(userId, courseId)).resolves.toBeUndefined();
  });
});

// ─── Property 24: Quiz pass threshold in range [1, 100] ──────────────────────
// Validates: Requirements 10.4
// Feature: kavabanga-learning-platform, Property 24: Quiz pass threshold in range [1, 100]
describe('Property 24: Quiz pass threshold in range [1, 100]', () => {
  it('for any passThreshold outside [1, 100], createModule returns 400 VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer().filter((n) => n < 1 || n > 100),
        async (invalidThreshold) => {
          // DB mock not needed — validation happens before DB call
          dbMock.mockImplementation(() => ({
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
          }));

          try {
            await contentService.createModule({
              courseId: 'course-1',
              title: 'Module',
              orderIndex: 1,
              passThreshold: invalidThreshold,
            });
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

  it('for any passThreshold outside [1, 100], createQuiz returns 400 VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer().filter((n) => n < 1 || n > 100),
        async (invalidThreshold) => {
          dbMock.mockImplementation(() => ({
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
          }));

          try {
            await contentService.createQuiz({
              moduleId: 'module-1',
              xpMax: 50,
              passThreshold: invalidThreshold,
            });
            return false;
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 400 && e.code === 'VALIDATION_ERROR';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid passThreshold values [1, 100] are accepted', async () => {
    for (const threshold of [1, 50, 80, 100]) {
      const moduleRow = {
        id: 'mod-1',
        course_id: 'course-1',
        title: 'Module',
        order_index: 1,
        pass_threshold: threshold,
      };
      dbMock.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([moduleRow]) }),
      }));

      const result = await contentService.createModule({
        courseId: 'course-1',
        title: 'Module',
        orderIndex: 1,
        passThreshold: threshold,
      });
      expect(result.passThreshold).toBe(threshold);
    }
  });
});

// ─── Property 16: Question types limited to allowed set ──────────────────────
// Validates: Requirements 5.1, 10.3
// Feature: kavabanga-learning-platform, Property 16: Question types limited to allowed set
describe('Property 16: Question types limited to allowed set', () => {
  const validTypes = new Set(['single', 'multiple', 'matching', 'true_false']);

  it('for any questionType not in allowed set, addQuestion returns 400 VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !validTypes.has(s)),
        async (invalidType) => {
          dbMock.mockImplementation(() => ({
            insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
          }));

          try {
            await contentService.addQuestion('quiz-1', {
              questionType: invalidType,
              text: 'Question?',
              orderIndex: 1,
              options: [{ text: 'A', isCorrect: true }],
            });
            return false;
          } catch (err: unknown) {
            const e = err as { statusCode?: number; code?: string };
            return e.statusCode === 400 && e.code === 'VALIDATION_ERROR';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid question types are accepted', async () => {
    for (const qType of contentService.VALID_QUESTION_TYPES) {
      const qRow = {
        id: 'q-1',
        quiz_id: 'quiz-1',
        question_type: qType,
        text: 'Question?',
        explanation: null,
        order_index: 1,
      };
      const optRow = {
        id: 'opt-1',
        question_id: 'q-1',
        text: 'Option A',
        is_correct: true,
        match_pair: null,
      };

      dbMock.mockImplementation((table: string) => {
        if (table === 'questions') {
          return { insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([qRow]) }) };
        }
        if (table === 'answer_options') {
          return { insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([optRow]) }) };
        }
        return { insert: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }) };
      });

      const result = await contentService.addQuestion('quiz-1', {
        questionType: qType,
        text: 'Question?',
        orderIndex: 1,
        options: [{ text: 'Option A', isCorrect: true }],
      });
      expect(result.questionType).toBe(qType);
    }
  });
});

// ─── Property 11: Lesson content round-trip ───────────────────────────────────
// Validates: Requirements 4.1, 10.2
// Feature: kavabanga-learning-platform, Property 11: Lesson content round-trip
describe('Property 11: Lesson content round-trip', () => {
  it('lesson blocks are returned in the same order_index order as stored', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            orderIndex: fc.integer({ min: 0, max: 100 }),
            blockType: fc.constantFrom('text' as const, 'image' as const, 'video' as const),
            content: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (blocks) => {
          const lessonId = 'lesson-1';
          const lessonRow = {
            id: lessonId,
            module_id: 'mod-1',
            title: 'Test Lesson',
            order_index: 1,
            xp_reward: 10,
          };

          // Sort blocks by orderIndex as DB would return them
          const sortedBlocks = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
          const blockRows = sortedBlocks.map((b, i) => ({
            id: `block-${i}`,
            lesson_id: lessonId,
            block_type: b.blockType,
            content: b.content,
            order_index: b.orderIndex,
          }));

          dbMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(lessonRow),
                }),
              };
            }
            if (table === 'lesson_blocks') {
              return {
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(blockRows),
                  }),
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          const result = await contentService.getLessonWithBlocks(lessonId);

          // Verify blocks are in ascending order_index order
          for (let i = 1; i < result.blocks.length; i++) {
            if (result.blocks[i].orderIndex < result.blocks[i - 1].orderIndex) {
              return false;
            }
          }

          // Verify all blocks are present
          return result.blocks.length === sortedBlocks.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

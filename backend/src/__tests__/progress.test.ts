/**
 * Feature: kavabanga-learning-platform
 * Progress and gamification tests: properties 12, 19, 13, 17, 15, 14, 7, 9, 21, 22
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
import * as progressService from '../services/progressService';
import * as contentService from '../services/contentService';

const dbMock = db as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLesson(id: string, xpReward: number) {
  return { id, module_id: 'mod-1', title: 'Lesson', order_index: 1, xp_reward: xpReward };
}

function makeQuiz(id: string, xpMax: number, passThreshold: number) {
  return { id, module_id: 'mod-1', xp_max: xpMax, pass_threshold: passThreshold };
}

function makeQuestion(id: string, type: string, explanation: string | null = null) {
  return { id, quiz_id: 'quiz-1', question_type: type, text: 'Q?', explanation, order_index: 1 };
}

function makeOption(id: string, questionId: string, isCorrect: boolean, matchPair: string | null = null) {
  return { id, question_id: questionId, text: 'Opt', is_correct: isCorrect, match_pair: matchPair };
}

function makeProgressRow(userId: string, totalXp: number, streak: number, lastActivityDate: string | null) {
  return { user_id: userId, total_xp: totalXp, streak, last_activity_date: lastActivityDate };
}

function mockQuizSubmit(opts: {
  quiz: ReturnType<typeof makeQuiz>;
  questions: ReturnType<typeof makeQuestion>[];
  options: ReturnType<typeof makeOption>[];
  progressRow: ReturnType<typeof makeProgressRow>;
}) {
  dbMock.mockImplementation((table: string) => {
    if (table === 'quizzes') {
      return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(opts.quiz) }) };
    }
    if (table === 'questions') {
      return {
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(opts.questions) }),
        }),
      };
    }
    if (table === 'answer_options') {
      return { whereIn: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(opts.options) }) };
    }
    if (table === 'user_quiz_attempts') {
      return { insert: jest.fn().mockResolvedValue([]) };
    }
    if (table === 'user_progress') {
      return {
        where: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(opts.progressRow),
          update: jest.fn().mockResolvedValue(1),
        }),
      };
    }
    if (table === 'xp_history') {
      return { insert: jest.fn().mockResolvedValue([]) };
    }
    return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
  });
}

// ─── Property 12: Completing lesson awards XP and marks lesson completed ──────
// Validates: Requirements 4.4, 6.1
// Feature: kavabanga-learning-platform, Property 12: Completing lesson awards XP and marks lesson completed
describe('Property 12: Completing lesson awards XP and marks lesson completed', () => {
  it('completing a lesson awards exactly xp_reward XP', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 10000 }),
        async (lessonId, xpReward, currentXp) => {
          const lesson = makeLesson(lessonId, xpReward);
          const progressRow = makeProgressRow('user-1', currentXp, 3, null);

          dbMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
              return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(lesson) }) };
            }
            if (table === 'user_lesson_progress') {
              return {
                where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
                insert: jest.fn().mockResolvedValue([]),
              };
            }
            if (table === 'user_progress') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(progressRow),
                  update: jest.fn().mockResolvedValue(1),
                }),
              };
            }
            if (table === 'xp_history') {
              return { insert: jest.fn().mockResolvedValue([]) };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          const result = await progressService.completeLesson('user-1', lessonId);
          return result.xpAwarded === xpReward && result.totalXp === currentXp + xpReward && result.lessonId === lessonId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('completing an already-completed lesson is idempotent (xpAwarded=0)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 10000 }),
        async (lessonId, xpReward, currentXp) => {
          const lesson = makeLesson(lessonId, xpReward);
          const progressRow = makeProgressRow('user-1', currentXp, 3, null);

          dbMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
              return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(lesson) }) };
            }
            if (table === 'user_lesson_progress') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue({ user_id: 'user-1', lesson_id: lessonId }),
                }),
              };
            }
            if (table === 'user_progress') {
              return {
                where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(progressRow) }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          const result = await progressService.completeLesson('user-1', lessonId);
          return result.xpAwarded === 0 && result.totalXp === currentXp;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 19: XP history contains record after each award ────────────────
// Validates: Requirements 6.5
// Feature: kavabanga-learning-platform, Property 19: XP history contains record after each award
describe('Property 19: XP history contains record after each award', () => {
  it('awardXp inserts a record into xp_history with correct fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom('lesson' as const, 'quiz' as const),
        fc.uuid(),
        async (userId, amount, sourceType, sourceId) => {
          let insertedRecord: Record<string, unknown> | null = null;
          const progressRow = makeProgressRow(userId, 0, 0, null);

          dbMock.mockImplementation((table: string) => {
            if (table === 'user_progress') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(progressRow),
                  update: jest.fn().mockResolvedValue(1),
                }),
              };
            }
            if (table === 'xp_history') {
              return {
                insert: jest.fn().mockImplementation((record: Record<string, unknown>) => {
                  insertedRecord = record;
                  return Promise.resolve([]);
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          await progressService.awardXp(userId, amount, sourceType, sourceId);

          return (
            insertedRecord !== null &&
            insertedRecord['user_id'] === userId &&
            insertedRecord['amount'] === amount &&
            insertedRecord['source_type'] === sourceType &&
            insertedRecord['source_id'] === sourceId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 13: Quiz score = floor(correct/total * 100) ────────────────────
// Validates: Requirements 5.2
// Feature: kavabanga-learning-platform, Property 13: Quiz score calculated as percentage of correct answers
describe('Property 13: Quiz score calculated as percentage of correct answers', () => {
  it('score = floor(correct/total * 100) and is in [0, 100]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 1, max: 100 }),
        async (correctFlags, xpMax, passThreshold) => {
          const quizId = 'quiz-score';
          const quiz = makeQuiz(quizId, xpMax, passThreshold);
          const questions = correctFlags.map((_, i) => makeQuestion(`q-${i}`, 'single'));
          const allOptions = correctFlags.flatMap((_, i) => [
            makeOption(`opt-${i}-correct`, `q-${i}`, true),
            makeOption(`opt-${i}-wrong`, `q-${i}`, false),
          ]);
          const answers: progressService.QuizAnswerInput[] = correctFlags.map((correct, i) => ({
            questionId: `q-${i}`,
            selectedOptionIds: [correct ? `opt-${i}-correct` : `opt-${i}-wrong`],
          }));
          const progressRow = makeProgressRow('user-1', 0, 0, null);

          mockQuizSubmit({ quiz, questions, options: allOptions, progressRow });

          const result = await progressService.submitQuiz('user-1', quizId, answers);
          const expectedCorrect = correctFlags.filter(Boolean).length;
          const expectedScore = Math.floor((expectedCorrect / correctFlags.length) * 100);

          return result.score === expectedScore && result.score >= 0 && result.score <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 17: XP for quiz = round(score/100 * xp_max) ───────────────────
// Validates: Requirements 6.2
// Feature: kavabanga-learning-platform, Property 17: XP for quiz proportional to score
describe('Property 17: XP for quiz proportional to score', () => {
  it('xpAwarded = round(score/100 * xp_max) when passed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 1, max: 100 }),
        async (xpMax, passThreshold) => {
          const quizId = 'quiz-xp';
          const quiz = makeQuiz(quizId, xpMax, passThreshold);
          const question = makeQuestion('q-1', 'single');
          const correctOpt = makeOption('opt-correct', 'q-1', true);
          const wrongOpt = makeOption('opt-wrong', 'q-1', false);
          const progressRow = makeProgressRow('user-1', 0, 0, null);

          mockQuizSubmit({ quiz, questions: [question], options: [correctOpt, wrongOpt], progressRow });

          // Answer correctly → score=100
          const result = await progressService.submitQuiz('user-1', quizId, [
            { questionId: 'q-1', selectedOptionIds: ['opt-correct'] },
          ]);

          // score=100 >= any threshold in [1,100], so always passed
          const expectedXp = Math.round((result.score / 100) * xpMax);
          return result.passed ? result.xpAwarded === expectedXp : result.xpAwarded === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: Quiz not passed when score < pass_threshold ────────────────
// Validates: Requirements 5.4
// Feature: kavabanga-learning-platform, Property 15: Quiz not passed when score below threshold
describe('Property 15: Quiz not passed when score below threshold', () => {
  it('passed=false when score < pass_threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 100 }),
        async (passThreshold) => {
          const quizId = 'quiz-fail';
          const quiz = makeQuiz(quizId, 50, passThreshold);
          const question = makeQuestion('q-1', 'single');
          const correctOpt = makeOption('opt-correct', 'q-1', true);
          const wrongOpt = makeOption('opt-wrong', 'q-1', false);
          const progressRow = makeProgressRow('user-1', 0, 0, null);

          mockQuizSubmit({ quiz, questions: [question], options: [correctOpt, wrongOpt], progressRow });

          // Answer wrong → score=0
          const result = await progressService.submitQuiz('user-1', quizId, [
            { questionId: 'q-1', selectedOptionIds: ['opt-wrong'] },
          ]);

          return result.score < passThreshold ? result.passed === false : true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 14: Error review contains correct answers for wrong questions ───
// Validates: Requirements 5.3
// Feature: kavabanga-learning-platform, Property 14: Error review contains correct answers for wrong responses
describe('Property 14: Error review contains correct answers for wrong responses', () => {
  it('errorReview includes correctOptionIds for each wrong question', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (numQuestions) => {
          const quizId = 'quiz-review';
          const quiz = makeQuiz(quizId, 50, 80);
          const questions = Array.from({ length: numQuestions }, (_, i) =>
            makeQuestion(`q-${i}`, 'single', `Explanation ${i}`)
          );
          const allOptions = questions.flatMap((q, i) => [
            makeOption(`opt-${i}-correct`, q.id, true),
            makeOption(`opt-${i}-wrong`, q.id, false),
          ]);
          const answers: progressService.QuizAnswerInput[] = questions.map((q, i) => ({
            questionId: q.id,
            selectedOptionIds: [`opt-${i}-wrong`],
          }));
          const progressRow = makeProgressRow('user-1', 0, 0, null);

          mockQuizSubmit({ quiz, questions, options: allOptions, progressRow });

          const result = await progressService.submitQuiz('user-1', quizId, answers);

          if (result.errorReview.length !== numQuestions) return false;
          return result.errorReview.every((item, i) =>
            item.questionId === `q-${i}` &&
            item.correctOptionIds.includes(`opt-${i}-correct`) &&
            item.explanation === `Explanation ${i}`
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 7: Each module in tree has valid status ────────────────────────
// Validates: Requirements 3.1
// Feature: kavabanga-learning-platform, Property 7: Each module in tree has valid status
describe('Property 7: Each module in tree has valid status', () => {
  it('every module returned by getCourseTree has status locked|available|completed', async () => {
    const validStatuses = new Set(['locked', 'available', 'completed']);

    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.record({ id: fc.uuid(), passedQuiz: fc.boolean() }), { minLength: 1, maxLength: 8 }),
        async (courseId, userId, moduleSpecs) => {
          const modules = moduleSpecs.map((m, i) => ({
            id: m.id,
            course_id: courseId,
            title: `Module ${i}`,
            order_index: i,
            pass_threshold: 80,
          }));
          const quizzes = moduleSpecs.map((m) => ({ quiz_id: `quiz-${m.id}`, module_id: m.id }));
          const passedAttempts = moduleSpecs
            .filter((m) => m.passedQuiz)
            .map((m) => ({ quiz_id: `quiz-${m.id}` }));

          dbMock.mockImplementation((table: string) => {
            if (table === 'modules') {
              return {
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(modules) }),
                }),
              };
            }
            if (table === 'quizzes') {
              return {
                join: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(quizzes) }),
                }),
              };
            }
            if (table === 'user_quiz_attempts') {
              return {
                whereIn: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(passedAttempts) }),
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          const tree = await contentService.getCourseTree(courseId, userId);
          return tree.every((m) => validStatuses.has(m.status));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: Passing quiz (score >= threshold) results in passed=true ────
// Validates: Requirements 3.3, 5.5
// Feature: kavabanga-learning-platform, Property 9: Passing quiz unlocks next module
describe('Property 9: Passing quiz (score >= threshold) results in passed=true', () => {
  it('when all answers correct, score=100 >= any threshold in [1,100], passed=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 200 }),
        async (passThreshold, xpMax) => {
          const quizId = 'quiz-pass';
          const quiz = makeQuiz(quizId, xpMax, passThreshold);
          const question = makeQuestion('q-1', 'single');
          const correctOpt = makeOption('opt-correct', 'q-1', true);
          const wrongOpt = makeOption('opt-wrong', 'q-1', false);
          const progressRow = makeProgressRow('user-1', 0, 0, null);

          mockQuizSubmit({ quiz, questions: [question], options: [correctOpt, wrongOpt], progressRow });

          const result = await progressService.submitQuiz('user-1', quizId, [
            { questionId: 'q-1', selectedOptionIds: ['opt-correct'] },
          ]);

          // score=100 >= any threshold in [1,100]
          return result.passed === true && result.score === 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 21: Streak increments by 1 when last_activity_date was yesterday
// Validates: Requirements 8.1
// Feature: kavabanga-learning-platform, Property 21: Streak increments by 1 on daily activity
describe('Property 21: Streak increments by 1 when last_activity_date was yesterday', () => {
  it('streak += 1 when last_activity_date is yesterday', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (currentStreak) => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          const progressRow = makeProgressRow('user-1', 0, currentStreak, yesterdayStr);
          let updatedStreak: number | null = null;

          dbMock.mockImplementation((table: string) => {
            if (table === 'user_progress') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(progressRow),
                  update: jest.fn().mockImplementation((data: Record<string, unknown>) => {
                    updatedStreak = data['streak'] as number;
                    return Promise.resolve(1);
                  }),
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          await progressService.updateStreak('user-1');
          return updatedStreak === currentStreak + 1;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 22: Streak resets to 1 when gap > 1 day ───────────────────────
// Validates: Requirements 8.2
// Feature: kavabanga-learning-platform, Property 22: Streak resets on missed day
describe('Property 22: Streak resets to 1 when gap > 1 day', () => {
  it('streak = 1 when last_activity_date is more than 1 day ago', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 30 }),
        fc.integer({ min: 1, max: 100 }),
        async (daysAgo, currentStreak) => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - daysAgo);
          const pastDateStr = pastDate.toISOString().slice(0, 10);

          const progressRow = makeProgressRow('user-1', 0, currentStreak, pastDateStr);
          let updatedStreak: number | null = null;

          dbMock.mockImplementation((table: string) => {
            if (table === 'user_progress') {
              return {
                where: jest.fn().mockReturnValue({
                  first: jest.fn().mockResolvedValue(progressRow),
                  update: jest.fn().mockImplementation((data: Record<string, unknown>) => {
                    updatedStreak = data['streak'] as number;
                    return Promise.resolve(1);
                  }),
                }),
              };
            }
            return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
          });

          await progressService.updateStreak('user-1');
          return updatedStreak === 1;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('streak = 1 when last_activity_date is null (first activity)', async () => {
    const progressRow = makeProgressRow('user-1', 0, 0, null);
    let updatedStreak: number | null = null;

    dbMock.mockImplementation((table: string) => {
      if (table === 'user_progress') {
        return {
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(progressRow),
            update: jest.fn().mockImplementation((data: Record<string, unknown>) => {
              updatedStreak = data['streak'] as number;
              return Promise.resolve(1);
            }),
          }),
        };
      }
      return { where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }) };
    });

    await progressService.updateStreak('user-1');
    expect(updatedStreak).toBe(1);
  });
});

import db from '../config/database';
import { checkAndAwardAchievements } from './achievementService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LessonCompleteResult {
  xpAwarded: number;
  totalXp: number;
  lessonId: string;
}

export interface QuizAnswerInput {
  questionId: string;
  selectedOptionIds: string[];
  matchPairs?: { leftId: string; rightId: string }[];
}

export interface ErrorReviewItem {
  questionId: string;
  correctOptionIds: string[];
  explanation: string | null;
}

export interface QuizSubmitResult {
  score: number;
  passed: boolean;
  xpAwarded: number;
  totalXp: number;
  errorReview: ErrorReviewItem[];
}

export interface UserProgressResult {
  totalXp: number;
  levelName: string | null;
  xpToNextLevel: number | null;
  streak: number;
  completedLessons: number;
  completedQuizzes: number;
  courseCompletionPercent: number;
}

export interface AchievementResult {
  id: string;
  title: string;
  description: string;
  conditionType: string;
  conditionValue: number;
  earnedAt: Date;
}

export interface XpHistoryItem {
  id: string;
  amount: number;
  sourceType: string;
  sourceId: string;
  earnedAt: Date;
}

// ── Level-up result ───────────────────────────────────────────────────────────

export interface LevelUpResult {
  levelChanged: boolean;
  newLevelName: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeError(message: string, statusCode: number, code: string): Error & { statusCode: number; code: string } {
  const err = new Error(message) as Error & { statusCode: number; code: string };
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

/**
 * Check if user should level up based on totalXp.
 * Finds the highest level where xp_required <= totalXp.
 * Updates user_progress.level_id if changed.
 */
export async function checkAndUpdateLevel(userId: string, totalXp: number): Promise<LevelUpResult> {
  const newLevel = await db('levels')
    .where('xp_required', '<=', totalXp)
    .orderBy('xp_required', 'desc')
    .first();

  if (!newLevel) return { levelChanged: false, newLevelName: null };

  const progress = await db('user_progress').where({ user_id: userId }).first();
  const currentLevelId = progress ? (progress.level_id as number | null) : null;

  if (currentLevelId === (newLevel.id as number)) {
    return { levelChanged: false, newLevelName: null };
  }

  await db('user_progress')
    .where({ user_id: userId })
    .update({ level_id: newLevel.id });

  return { levelChanged: true, newLevelName: newLevel.name as string };
}

/**
 * Streak logic:
 * - today: unchanged
 * - yesterday: streak += 1
 * - gap > 1 day or null: streak = 1
 */
export async function updateStreak(userId: string): Promise<void> {
  const progress = await db('user_progress').where({ user_id: userId }).first();
  if (!progress) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = progress.last_activity_date ? new Date(progress.last_activity_date) : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);

  let newStreak: number;
  if (lastDate && lastDate.getTime() === today.getTime()) {
    // Already active today — no change
    return;
  } else if (lastDate && today.getTime() - lastDate.getTime() === 86400000) {
    // Yesterday — increment
    newStreak = (progress.streak as number) + 1;
  } else {
    // Gap or first time — reset to 1
    newStreak = 1;
  }

  await db('user_progress')
    .where({ user_id: userId })
    .update({ streak: newStreak, last_activity_date: today.toISOString().slice(0, 10) });
}

/**
 * Award XP to user: update user_progress.total_xp and insert xp_history record.
 * Returns the new total_xp.
 */
export async function awardXp(
  userId: string,
  amount: number,
  sourceType: 'lesson' | 'quiz',
  sourceId: string
): Promise<number> {
  const progress = await db('user_progress').where({ user_id: userId }).first();
  const currentXp = progress ? (progress.total_xp as number) : 0;
  const newTotalXp = currentXp + amount;

  if (progress) {
    await db('user_progress').where({ user_id: userId }).update({ total_xp: newTotalXp });
  } else {
    await db('user_progress').insert({ user_id: userId, total_xp: newTotalXp, streak: 0 });
  }

  await db('xp_history').insert({
    user_id: userId,
    amount,
    source_type: sourceType,
    source_id: sourceId,
  });

  // Check and update level after XP change
  await checkAndUpdateLevel(userId, newTotalXp);

  return newTotalXp;
}

// ── Complete Lesson ───────────────────────────────────────────────────────────

export async function completeLesson(userId: string, lessonId: string): Promise<LessonCompleteResult> {
  // Check lesson exists
  const lesson = await db('lessons').where({ id: lessonId }).first();
  if (!lesson) throw makeError('Lesson not found', 404, 'NOT_FOUND');

  // Check sequential unlock: previous lesson in same module must be completed
  const prevLesson = await db('lessons')
    .where({ module_id: lesson.module_id })
    .where('order_index', '<', lesson.order_index as number)
    .orderBy('order_index', 'desc')
    .select('id')
    .first();

  if (prevLesson) {
    const prevCompleted = await db('user_lesson_progress')
      .where({ user_id: userId, lesson_id: prevLesson.id })
      .first();
    if (!prevCompleted) {
      throw makeError('Complete previous lesson first', 403, 'LESSON_LOCKED');
    }
  }

  // Check if already completed (idempotent)
  const existing = await db('user_lesson_progress')
    .where({ user_id: userId, lesson_id: lessonId })
    .first();

  if (existing) {
    const progress = await db('user_progress').where({ user_id: userId }).first();
    return {
      xpAwarded: 0,
      totalXp: progress ? (progress.total_xp as number) : 0,
      lessonId,
    };
  }

  // Insert completion record
  await db('user_lesson_progress').insert({ user_id: userId, lesson_id: lessonId });

  // Award XP
  const xpReward = lesson.xp_reward as number;
  const totalXp = await awardXp(userId, xpReward, 'lesson', lessonId);

  // Update streak
  await updateStreak(userId);

  // Get updated streak and completed lessons count for achievement checking
  const updatedProgress = await db('user_progress').where({ user_id: userId }).first();
  const streak = updatedProgress ? (updatedProgress.streak as number) : 1;
  const lessonCountRows = await db('user_lesson_progress').where({ user_id: userId }).count('lesson_id as count');
  const completedLessons = parseInt(String(lessonCountRows[0]?.count ?? '0'), 10);

  // Check and award achievements
  await checkAndAwardAchievements(userId, { streak, completedLessons });

  return { xpAwarded: xpReward, totalXp, lessonId };
}

// ── Submit Quiz ───────────────────────────────────────────────────────────────

export async function submitQuiz(
  userId: string,
  quizId: string,
  answers: QuizAnswerInput[]
): Promise<QuizSubmitResult> {
  // Load quiz
  const quiz = await db('quizzes').where({ id: quizId }).first();
  if (!quiz) throw makeError('Quiz not found', 404, 'NOT_FOUND');

  // Load questions with answer options (including is_correct)
  const questions = await db('questions')
    .where({ quiz_id: quizId })
    .orderBy('order_index', 'asc')
    .select('id', 'question_type', 'text', 'explanation', 'order_index');

  const questionIds = questions.map((q: Record<string, unknown>) => q.id as string);

  const options = questionIds.length > 0
    ? await db('answer_options')
        .whereIn('question_id', questionIds)
        .select('id', 'question_id', 'text', 'is_correct', 'match_pair')
    : [];

  const optionsByQuestion = new Map<string, Array<{ id: string; isCorrect: boolean; matchPair: string | null }>>();
  for (const opt of options) {
    const qId = opt.question_id as string;
    if (!optionsByQuestion.has(qId)) optionsByQuestion.set(qId, []);
    optionsByQuestion.get(qId)!.push({
      id: opt.id as string,
      isCorrect: opt.is_correct as boolean,
      matchPair: opt.match_pair as string | null,
    });
  }

  // Build answer map
  const answerMap = new Map<string, QuizAnswerInput>();
  for (const a of answers) {
    answerMap.set(a.questionId, a);
  }

  // Calculate score
  let correctCount = 0;
  const errorReview: ErrorReviewItem[] = [];

  for (const q of questions) {
    const qId = q.id as string;
    const qType = q.question_type as string;
    const qOptions = optionsByQuestion.get(qId) ?? [];
    const userAnswer = answerMap.get(qId);

    const correctOptionIds = qOptions.filter((o) => o.isCorrect).map((o) => o.id);

    let isCorrect = false;

    if (!userAnswer) {
      // No answer provided — wrong
    } else if (qType === 'single' || qType === 'true_false') {
      const selected = userAnswer.selectedOptionIds[0];
      isCorrect = correctOptionIds.length === 1 && correctOptionIds[0] === selected;
    } else if (qType === 'multiple') {
      const selected = [...userAnswer.selectedOptionIds].sort();
      const correct = [...correctOptionIds].sort();
      isCorrect = selected.length === correct.length && selected.every((id, i) => id === correct[i]);
    } else if (qType === 'matching') {
      const pairs = userAnswer.matchPairs ?? [];
      // Each option has a match_pair value; check all pairs match
      const optionMatchMap = new Map(qOptions.map((o) => [o.id, o.matchPair]));
      isCorrect = pairs.length > 0 && pairs.every((p) => {
        const expectedRight = optionMatchMap.get(p.leftId);
        return expectedRight !== undefined && expectedRight === p.rightId;
      }) && pairs.length === qOptions.filter((o) => o.matchPair !== null).length;
    }

    if (isCorrect) {
      correctCount++;
    } else {
      errorReview.push({
        questionId: qId,
        correctOptionIds,
        explanation: q.explanation as string | null,
      });
    }
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.floor((correctCount / totalQuestions) * 100) : 0;
  const passThreshold = quiz.pass_threshold as number;
  const passed = score >= passThreshold;

  // Insert quiz attempt
  await db('user_quiz_attempts').insert({
    user_id: userId,
    quiz_id: quizId,
    score,
    passed,
  });

  // Award XP if passed
  let xpAwarded = 0;
  let totalXp = 0;

  if (passed) {
    const xpMax = quiz.xp_max as number;
    xpAwarded = Math.round((score / 100) * xpMax);
    totalXp = await awardXp(userId, xpAwarded, 'quiz', quizId);
  } else {
    const progress = await db('user_progress').where({ user_id: userId }).first();
    totalXp = progress ? (progress.total_xp as number) : 0;
  }

  // Update streak
  await updateStreak(userId);

  // Get updated streak and completed lessons count for achievement checking
  const updatedProgress = await db('user_progress').where({ user_id: userId }).first();
  const currentStreak = updatedProgress ? (updatedProgress.streak as number) : 1;
  const lessonCountRows = await db('user_lesson_progress').where({ user_id: userId }).count('lesson_id as count');
  const completedLessons = parseInt(String(lessonCountRows[0]?.count ?? '0'), 10);

  // Check and award achievements
  await checkAndAwardAchievements(userId, { quizScore: score, streak: currentStreak, completedLessons });

  return { score, passed, xpAwarded, totalXp, errorReview };
}

// ── GET /api/progress/me ──────────────────────────────────────────────────────

export async function getUserProgress(userId: string): Promise<UserProgressResult> {
  const progress = await db('user_progress').where({ user_id: userId }).first();
  const totalXp = progress ? (progress.total_xp as number) : 0;
  const streak = progress ? (progress.streak as number) : 0;
  const levelId = progress ? (progress.level_id as number | null) : null;

  // Level info
  let levelName: string | null = null;
  let xpToNextLevel: number | null = null;

  if (levelId) {
    const level = await db('levels').where({ id: levelId }).first();
    if (level) levelName = level.name as string;

    const nextLevel = await db('levels')
      .where('xp_required', '>', totalXp)
      .orderBy('xp_required', 'asc')
      .first();
    if (nextLevel) xpToNextLevel = (nextLevel.xp_required as number) - totalXp;
  } else {
    const nextLevel = await db('levels')
      .where('xp_required', '>', totalXp)
      .orderBy('xp_required', 'asc')
      .first();
    if (nextLevel) xpToNextLevel = (nextLevel.xp_required as number) - totalXp;
  }

  // Completed lessons count
  const lessonCountRows = await db('user_lesson_progress')
    .where({ user_id: userId })
    .count('lesson_id as count');
  const completedLessons = parseInt(String(lessonCountRows[0]?.count ?? '0'), 10);

  // Completed quizzes count (passed=true)
  const quizCountRows = await db('user_quiz_attempts')
    .where({ user_id: userId, passed: true })
    .count('id as count');
  const completedQuizzes = parseInt(String(quizCountRows[0]?.count ?? '0'), 10);

  // Course completion percent: floor(completedLessons / totalLessonsInAssignedCourses * 100)
  const assignedCourses = await db('user_courses')
    .where({ user_id: userId })
    .select('course_id');

  let courseCompletionPercent = 0;
  if (assignedCourses.length > 0) {
    const courseIds = assignedCourses.map((c: Record<string, unknown>) => c.course_id as string);
    const totalLessonsRows = await db('lessons')
      .join('modules', 'lessons.module_id', 'modules.id')
      .whereIn('modules.course_id', courseIds)
      .count('lessons.id as count');
    const totalLessons = parseInt(String(totalLessonsRows[0]?.count ?? '0'), 10);
    if (totalLessons > 0) {
      courseCompletionPercent = Math.floor((completedLessons / totalLessons) * 100);
    }
  }

  return { totalXp, levelName, xpToNextLevel, streak, completedLessons, completedQuizzes, courseCompletionPercent };
}

// ── GET /api/progress/me/achievements ────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<AchievementResult[]> {
  const rows = await db('user_achievements')
    .join('achievements', 'user_achievements.achievement_id', 'achievements.id')
    .where('user_achievements.user_id', userId)
    .select(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.condition_type',
      'achievements.condition_value',
      'user_achievements.earned_at'
    );

  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    conditionType: r.condition_type as string,
    conditionValue: r.condition_value as number,
    earnedAt: r.earned_at as Date,
  }));
}

// ── GET /api/progress/me/xp-history ──────────────────────────────────────────

export async function getXpHistory(
  userId: string,
  page: number,
  limit: number
): Promise<{ items: XpHistoryItem[]; total: number }> {
  const offset = (page - 1) * limit;

  const countRows = await db('xp_history').where({ user_id: userId }).count('id as count');
  const total = parseInt(String(countRows[0]?.count ?? '0'), 10);

  const rows = await db('xp_history')
    .where({ user_id: userId })
    .orderBy('earned_at', 'desc')
    .limit(limit)
    .offset(offset)
    .select('id', 'amount', 'source_type', 'source_id', 'earned_at');

  const items: XpHistoryItem[] = rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    amount: r.amount as number,
    sourceType: r.source_type as string,
    sourceId: r.source_id as string,
    earnedAt: r.earned_at as Date,
  }));

  return { items, total };
}

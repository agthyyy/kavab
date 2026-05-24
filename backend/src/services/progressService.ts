import db from '../config/database';
import { checkAndAwardAchievements, checkLessonAchievements, Achievement } from './achievementService';
import * as gamificationService from './gamificationService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LessonCompleteResult {
  xpAwarded: number;
  totalXp: number;
  lessonId: string;
  quizId: string | null;
  nextLessonId: string | null;
}

export interface QuizAnswerInput {
  questionId: string;
  selectedOptionIds: string[];
  matchPairs?: { leftId: string; rightId: string }[];
}

export interface QuizSubmitResult {
  score: number;
  passed: boolean;
  xpAwarded: number;
  totalXp: number;
  attemptNumber: number;
}

export interface UserProgressResult {
  totalXp: number;
  levelName: string | null;
  userName: string | null;
  roleName: string | null;
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

  // Get today's date in YYYY-MM-DD format (local timezone)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const lastActivityStr = progress.last_activity_date as string | null;

  let newStreak: number;
  if (lastActivityStr === todayStr) {
    // Already active today — no change
    return;
  } else if (lastActivityStr) {
    // Calculate day difference
    const lastDate = new Date(lastActivityStr + 'T00:00:00');
    const todayDate = new Date(todayStr + 'T00:00:00');
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
    
    if (daysDiff === 1) {
      // Yesterday — increment
      newStreak = (progress.streak as number) + 1;
    } else {
      // Gap > 1 day — reset to 1
      newStreak = 1;
    }
  } else {
    // First time — set to 1
    newStreak = 1;
  }

  await db('user_progress')
    .where({ user_id: userId })
    .update({ streak: newStreak, last_activity_date: todayStr });
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
  let progress = await db('user_progress').where({ user_id: userId }).first();
  
  if (progress) {
    const currentXp = progress.total_xp as number;
    const newTotalXp = currentXp + amount;
    await db('user_progress').where({ user_id: userId }).update({ total_xp: newTotalXp });
  } else {
    // Создаем новую запись с энергией
    const newTotalXp = amount;
    await db('user_progress').insert({ 
      user_id: userId, 
      total_xp: newTotalXp, 
      streak: 0,
      energy: 100,
      max_energy: 100,
      last_energy_update: db.fn.now(),
    });
    progress = { total_xp: newTotalXp };
  }

  await db('xp_history').insert({
    user_id: userId,
    amount,
    source_type: sourceType,
    source_id: sourceId,
  });

  const newTotalXp = progress.total_xp as number + amount;

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
    
    // Get quiz and next lesson info
    const quiz = await db('quizzes').where({ lesson_id: lessonId }).select('id').first();
    const nextLesson = await db('lessons')
      .where({ module_id: lesson.module_id })
      .where('order_index', '>', lesson.order_index as number)
      .orderBy('order_index', 'asc')
      .select('id')
      .first();
    
    // Check if quiz has questions
    let quizId: string | null = null;
    if (quiz) {
      const questionCount = await db('questions').where({ quiz_id: quiz.id }).count('id as count').first();
      console.log('[completeLesson-existing] Quiz found:', quiz.id, 'Question count result:', questionCount);
      const count = parseInt(String(questionCount?.count ?? '0'), 10);
      console.log('[completeLesson-existing] Parsed count:', count);
      if (count > 0) {
        quizId = quiz.id as string;
      }
    } else {
      console.log('[completeLesson-existing] No quiz found for lesson:', lessonId);
    }
    
    return {
      xpAwarded: 0,
      totalXp: progress ? (progress.total_xp as number) : 0,
      lessonId,
      quizId,
      nextLessonId: nextLesson ? (nextLesson.id as string) : null,
    };
  }

  // Insert completion record
  await db('user_lesson_progress').insert({ user_id: userId, lesson_id: lessonId });

  // Award XP
  const xpReward = lesson.xp_reward as number;
  const totalXp = await awardXp(userId, xpReward, 'lesson', lessonId);

  // Update streak
  await updateStreak(userId);

  // Get comprehensive stats for achievement checking
  const updatedProgress = await db('user_progress').where({ user_id: userId }).first();
  const streak = updatedProgress ? (updatedProgress.streak as number) : 1;
  
  const lessonCountRows = await db('user_lesson_progress').where({ user_id: userId }).count('lesson_id as count');
  const completedLessons = parseInt(String(lessonCountRows[0]?.count ?? '0'), 10);
  
  // Count lessons completed today
  const today = new Date().toISOString().slice(0, 10);
  const lessonsTodayRows = await db('user_lesson_progress')
    .where({ user_id: userId })
    .where('completed_at', '>=', today)
    .count('lesson_id as count');
  const lessonsToday = parseInt(String(lessonsTodayRows[0]?.count ?? '0'), 10);
  
  // Get current hour for time-based achievements
  const currentHour = new Date().getHours();

  // Check and award achievements (including lesson-specific ones)
  await checkLessonAchievements(userId, lessonId, {
    streak,
    completedLessons,
    lessonsToday,
    currentHour,
  });

  // ── Gamification Updates ──────────────────────────────────────────────────
  
  // Update daily quests
  await gamificationService.updateQuestProgress(userId, 'complete_lessons', 1);
  await gamificationService.updateQuestProgress(userId, 'earn_xp', xpReward);
  
  // Check for new titles
  await gamificationService.checkAndUnlockTitles(userId);
  
  // Try to drop collectible card
  await gamificationService.tryDropCard(userId, 'random_lesson', { lessonId });
  
  // Update combo streaks
  await gamificationService.updateComboStreak(userId, 'lesson_streak', true);

  // Get quiz and next lesson info
  const quiz = await db('quizzes').where({ lesson_id: lessonId }).select('id').first();
  const nextLesson = await db('lessons')
    .where({ module_id: lesson.module_id })
    .where('order_index', '>', lesson.order_index as number)
    .orderBy('order_index', 'asc')
    .select('id')
    .first();
  
  // Check if quiz has questions
  let quizId: string | null = null;
  if (quiz) {
    const questionCount = await db('questions').where({ quiz_id: quiz.id }).count('id as count').first();
    console.log('[completeLesson] Quiz found:', quiz.id, 'Question count result:', questionCount);
    const count = parseInt(String(questionCount?.count ?? '0'), 10);
    console.log('[completeLesson] Parsed count:', count);
    if (count > 0) {
      quizId = quiz.id as string;
    }
  } else {
    console.log('[completeLesson] No quiz found for lesson:', lessonId);
  }

  return { 
    xpAwarded: xpReward, 
    totalXp, 
    lessonId,
    quizId,
    nextLessonId: nextLesson ? (nextLesson.id as string) : null,
  };
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

  const optionsByQuestion = new Map<string, Array<{ id: string; text: string; isCorrect: boolean; matchPair: string | null }>>();
  for (const opt of options) {
    const qId = opt.question_id as string;
    if (!optionsByQuestion.has(qId)) optionsByQuestion.set(qId, []);
    optionsByQuestion.get(qId)!.push({
      id: opt.id as string,
      text: opt.text as string,
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
    }
    // Не показываем правильные ответы пользователю
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.floor((correctCount / totalQuestions) * 100) : 0;
  const passThreshold = quiz.pass_threshold as number;
  const passed = score >= passThreshold;

  // Подсчитываем номер попытки для этого квиза
  const previousAttempts = await db('user_quiz_attempts')
    .where({ user_id: userId, quiz_id: quizId })
    .count('id as count')
    .first();
  
  const attemptNumber = parseInt(String(previousAttempts?.count ?? '0'), 10) + 1;

  // Insert quiz attempt
  await db('user_quiz_attempts').insert({
    user_id: userId,
    quiz_id: quizId,
    score,
    passed,
    attempt_number: attemptNumber,
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

  // Get comprehensive stats for achievement checking
  const updatedProgress = await db('user_progress').where({ user_id: userId }).first();
  const currentStreak = updatedProgress ? (updatedProgress.streak as number) : 1;
  
  const lessonCountRows = await db('user_lesson_progress').where({ user_id: userId }).count('lesson_id as count');
  const completedLessons = parseInt(String(lessonCountRows[0]?.count ?? '0'), 10);
  
  const quizCountRows = await db('user_quiz_attempts').where({ user_id: userId, passed: true }).countDistinct('quiz_id as count');
  const completedQuizzes = parseInt(String(quizCountRows[0]?.count ?? '0'), 10);
  
  const perfectQuizRows = await db('user_quiz_attempts').where({ user_id: userId }).whereRaw('score >= 100').countDistinct('quiz_id as count');
  const perfectQuizzes = parseInt(String(perfectQuizRows[0]?.count ?? '0'), 10);
  
  // Get previous best score for this quiz
  const previousAttempt = await db('user_quiz_attempts')
    .where({ user_id: userId, quiz_id: quizId })
    .where('attempt_number', '<', attemptNumber)
    .orderBy('score', 'desc')
    .first();
  const previousBestScore = previousAttempt ? (previousAttempt.score as number) : undefined;
  
  // Get current hour for time-based achievements
  const currentHour = new Date().getHours();
  
  // Check and award achievements
  await checkAndAwardAchievements(userId, {
    quizScore: score,
    streak: currentStreak,
    completedLessons,
    completedQuizzes,
    perfectQuizzes,
    quizAttempts: attemptNumber,
    previousBestScore,
    currentHour,
  });

  // ── Gamification Updates ──────────────────────────────────────────────────
  
  if (passed) {
    // Update daily quests
    await gamificationService.updateQuestProgress(userId, 'pass_quizzes', 1);
    await gamificationService.updateQuestProgress(userId, 'earn_xp', xpAwarded);
    
    // Perfect quiz bonus
    if (score === 100) {
      await gamificationService.updateQuestProgress(userId, 'perfect_quiz', 1);
      await gamificationService.tryDropCard(userId, 'perfect_quiz', { quizId, score });
      await gamificationService.updateComboStreak(userId, 'perfect_quiz', true);
    } else {
      await gamificationService.updateComboStreak(userId, 'perfect_quiz', false);
    }
    
    // Check for new titles
    await gamificationService.checkAndUnlockTitles(userId);
  } else {
    // Reset perfect quiz combo on failure
    await gamificationService.updateComboStreak(userId, 'perfect_quiz', false);
  }

  return { score, passed, xpAwarded, totalXp, attemptNumber };
}

// ── GET /api/progress/me ──────────────────────────────────────────────────────

export async function getUserProgress(userId: string): Promise<UserProgressResult> {
  const progress = await db('user_progress').where({ user_id: userId }).first();
  const totalXp = progress ? (progress.total_xp as number) : 0;
  const streak = progress ? (progress.streak as number) : 0;
  const levelId = progress ? (progress.level_id as number | null) : null;

  // Get user's name and role
  const user = await db('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .where('users.id', userId)
    .select('users.full_name as user_name', 'roles.display_name as role_name')
    .first();
  
  const userName = user?.user_name as string | null;
  const roleName = user?.role_name as string | null;

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

  return { totalXp, levelName, userName, roleName, xpToNextLevel, streak, completedLessons, completedQuizzes, courseCompletionPercent };
}

// ── GET /api/progress/me/achievements ────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  return await import('./achievementService').then(m => m.getUserAchievements(userId));
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

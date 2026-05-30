import db from '../config/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AwardedAchievement {
  id: string;
  title: string;
  description: string;
  conditionType: string;
  conditionValue: number;
  icon: string;
  rarity: string;
  xpReward: number;
  category: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  progressCurrent: number;
  progressTotal: number;
  isSecret: boolean;
  category: string;
  earnedAt?: Date;
}

export interface AchievementCheckContext {
  quizScore?: number;
  streak?: number;
  completedLessons?: number;
  completedQuizzes?: number;
  perfectQuizzes?: number;
  quizAttempts?: number;
  previousBestScore?: number;
  currentHour?: number;
  lessonsToday?: number;
  rankingPosition?: number;
}

// ── Condition evaluation ──────────────────────────────────────────────────────

function isConditionMet(
  conditionType: string,
  conditionValue: number,
  context: AchievementCheckContext
): boolean {
  switch (conditionType) {
    case 'quiz_perfect':
      return context.quizScore === 100;
    
    case 'quiz_perfect_first_try':
      return context.quizScore === 100 && context.quizAttempts === 1;
    
    case 'quiz_perfect_count':
      return context.perfectQuizzes !== undefined && context.perfectQuizzes >= conditionValue;
    
    case 'quiz_passed_after_retries':
      return context.quizAttempts !== undefined && context.quizAttempts >= conditionValue && context.quizScore !== undefined && context.quizScore >= 70;
    
    case 'quiz_retake_improve':
      return context.previousBestScore !== undefined && context.quizScore !== undefined && context.quizScore > context.previousBestScore;
    
    case 'streak_days':
      return context.streak !== undefined && context.streak >= conditionValue;
    
    case 'lessons_count':
      return context.completedLessons !== undefined && context.completedLessons >= conditionValue;
    
    case 'quizzes_count':
      return context.completedQuizzes !== undefined && context.completedQuizzes >= conditionValue;
    
    case 'lessons_in_day':
      return context.lessonsToday !== undefined && context.lessonsToday >= conditionValue;
    
    case 'lesson_late_night':
      return context.currentHour !== undefined && context.currentHour >= 23;
    
    case 'lesson_early_morning':
      return context.currentHour !== undefined && context.currentHour < 7;
    
    case 'ranking_top':
      return context.rankingPosition !== undefined && context.rankingPosition <= conditionValue;
    
    default:
      return false;
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Check all achievements and award any that are newly met.
 * Uses INSERT ... ON CONFLICT DO NOTHING to prevent duplicates.
 * Returns only the achievements that were actually newly inserted.
 */
export async function checkAndAwardAchievements(
  userId: string,
  context: AchievementCheckContext
): Promise<AwardedAchievement[]> {
  // Load user's role_id
  const user = await db('users').where({ id: userId }).select('role_id').first();
  if (!user) return [];
  const userRoleId = user.role_id;

  // Load achievements available for user's role
  const achievements = await db('achievements')
    .leftJoin('achievement_roles', 'achievements.id', '=', 'achievement_roles.achievement_id')
    .where(function() {
      this.where('achievements.is_global', true)
        .orWhere('achievement_roles.role_id', userRoleId);
    })
    .distinct(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.condition_type',
      'achievements.condition_value',
      'achievements.icon',
      'achievements.rarity',
      'achievements.xp_reward',
      'achievements.category'
    )
    .select(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.condition_type',
      'achievements.condition_value',
      'achievements.icon',
      'achievements.rarity',
      'achievements.xp_reward',
      'achievements.category'
    );

  if (achievements.length === 0) return [];

  // Load already-earned achievement IDs for this user
  const existingRows = await db('user_achievements')
    .where({ user_id: userId })
    .select('achievement_id');
  const existingIds = new Set(existingRows.map((r: Record<string, unknown>) => r['achievement_id'] as string));

  const newlyAwarded: AwardedAchievement[] = [];

  for (const achievement of achievements) {
    const conditionType = achievement['condition_type'] as string;
    const conditionValue = achievement['condition_value'] as number;
    const achievementId = achievement['id'] as string;

    // Skip already earned
    if (existingIds.has(achievementId)) continue;

    // Check if condition is met
    if (!isConditionMet(conditionType, conditionValue, context)) continue;

    // Try to insert (ON CONFLICT DO NOTHING via try/catch on unique constraint)
    try {
      await db('user_achievements').insert({
        user_id: userId,
        achievement_id: achievementId,
        progress_at_earn: context.completedLessons || 0,
      });

      // Award XP bonus
      const xpReward = achievement['xp_reward'] as number;
      if (xpReward > 0) {
        await db('xp_history').insert({
          user_id: userId,
          xp_change: xpReward,
          reason: `Достижение: ${achievement['title']}`,
        });

        // Update user total XP
        await db('user_progress')
          .where({ user_id: userId })
          .increment('total_xp', xpReward);
      }

      newlyAwarded.push({
        id: achievementId,
        title: achievement['title'] as string,
        description: achievement['description'] as string,
        conditionType,
        conditionValue,
        icon: achievement['icon'] as string,
        rarity: achievement['rarity'] as string,
        xpReward,
        category: achievement['category'] as string,
      });
    } catch {
      // Duplicate — already awarded (race condition), skip
    }
  }

  return newlyAwarded;
}

/**
 * Check lesson-specific achievements when a lesson is completed
 */
export async function checkLessonAchievements(
  userId: string,
  lessonId: string,
  context: AchievementCheckContext
): Promise<AwardedAchievement[]> {
  // Load user's role_id
  const user = await db('users').where({ id: userId }).select('role_id').first();
  if (!user) return [];
  const userRoleId = user.role_id;

  // Get lesson-specific achievements through triggers
  const lessonAchievements = await db('achievements')
    .join('achievement_triggers', 'achievements.id', '=', 'achievement_triggers.achievement_id')
    .leftJoin('achievement_roles', 'achievements.id', '=', 'achievement_roles.achievement_id')
    .where('achievement_triggers.trigger_type', 'lesson_complete')
    .where('achievement_triggers.trigger_value', lessonId)
    .where(function() {
      this.where('achievements.is_global', true)
        .orWhere('achievement_roles.role_id', userRoleId);
    })
    .distinct(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.condition_type',
      'achievements.condition_value',
      'achievements.icon',
      'achievements.rarity',
      'achievements.xp_reward',
      'achievements.category'
    )
    .select(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.condition_type',
      'achievements.condition_value',
      'achievements.icon',
      'achievements.rarity',
      'achievements.xp_reward',
      'achievements.category'
    );

  // Check if user already has these achievements
  const existingRows = await db('user_achievements')
    .where({ user_id: userId })
    .whereIn('achievement_id', lessonAchievements.map(a => a.id))
    .select('achievement_id');
  const existingIds = new Set(existingRows.map((r: Record<string, unknown>) => r['achievement_id'] as string));

  const newlyAwarded: AwardedAchievement[] = [];

  for (const achievement of lessonAchievements) {
    const achievementId = achievement['id'] as string;

    // Skip already earned
    if (existingIds.has(achievementId)) continue;

    try {
      await db('user_achievements').insert({
        user_id: userId,
        achievement_id: achievementId,
        progress_at_earn: context.completedLessons || 0,
      });

      // Award XP bonus
      const xpReward = achievement['xp_reward'] as number;
      if (xpReward > 0) {
        await db('xp_history').insert({
          user_id: userId,
          xp_change: xpReward,
          reason: `Достижение: ${achievement['title']}`,
        });

        // Update user total XP
        await db('user_progress')
          .where({ user_id: userId })
          .increment('total_xp', xpReward);
      }

      newlyAwarded.push({
        id: achievementId,
        title: achievement['title'] as string,
        description: achievement['description'] as string,
        conditionType: achievement['condition_type'] as string,
        conditionValue: achievement['condition_value'] as number,
        icon: achievement['icon'] as string,
        rarity: achievement['rarity'] as string,
        xpReward,
        category: achievement['category'] as string,
      });
    } catch {
      // Duplicate — already awarded (race condition), skip
    }
  }

  // Also check general achievements
  const generalAchievements = await checkAndAwardAchievements(userId, context);
  
  return [...newlyAwarded, ...generalAchievements];
}
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  // Get user's role
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', userId)
    .select('roles.id as role_id', 'roles.name as role_name')
    .first();

  if (!user) return [];

  const userRoleId = user.role_id as string;

  // Get user stats for progress calculation
  const userProgress = await db('user_progress')
    .where({ user_id: userId })
    .first();

  const completedLessons = userProgress?.completed_lessons || 0;
  const completedQuizzes = userProgress?.completed_quizzes || 0;
  const streak = userProgress?.streak || 0;

  // Get perfect quiz count
  const perfectQuizCount = await db('user_quiz_attempts')
    .where({ user_id: userId, passed: true })
    .whereRaw('score >= 100')
    .countDistinct('quiz_id as count')
    .first();
  const perfectQuizzes = parseInt(perfectQuizCount?.count as string || '0');

  // Get achievements that are either global OR assigned to user's role
  const achievements = await db('achievements')
    .leftJoin('user_achievements', function() {
      this.on('achievements.id', '=', 'user_achievements.achievement_id')
        .andOn('user_achievements.user_id', '=', db.raw('?', [userId]));
    })
    .leftJoin('achievement_roles', 'achievements.id', '=', 'achievement_roles.achievement_id')
    .where(function() {
      this.where('achievements.is_global', true)
        .orWhere('achievement_roles.role_id', userRoleId);
    })
    .groupBy(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.icon',
      'achievements.rarity',
      'achievements.xp_reward',
      'achievements.progress_total',
      'achievements.is_secret',
      'achievements.category',
      'achievements.condition_type',
      'achievements.condition_value',
      'user_achievements.earned_at'
    )
    .select(
      'achievements.id',
      'achievements.title',
      'achievements.description',
      'achievements.icon',
      'achievements.rarity',
      'achievements.xp_reward',
      'achievements.progress_total',
      'achievements.is_secret',
      'achievements.category',
      'achievements.condition_type',
      'achievements.condition_value',
      'user_achievements.earned_at'
    )
    .orderBy('achievements.rarity', 'asc')
    .orderBy('achievements.condition_value', 'asc');

  return achievements.map((a: Record<string, unknown>) => {
    const conditionType = a['condition_type'] as string;
    const conditionValue = a['condition_value'] as number;
    
    // Calculate current progress
    let progressCurrent = 0;
    switch (conditionType) {
      case 'lessons_count':
        progressCurrent = Math.min(completedLessons, conditionValue);
        break;
      case 'quizzes_count':
        progressCurrent = Math.min(completedQuizzes, conditionValue);
        break;
      case 'streak_days':
        progressCurrent = Math.min(streak, conditionValue);
        break;
      case 'quiz_perfect_count':
        progressCurrent = Math.min(perfectQuizzes, conditionValue);
        break;
      default:
        progressCurrent = a['earned_at'] ? conditionValue : 0;
    }

    return {
      id: a['id'] as string,
      title: a['title'] as string,
      description: a['description'] as string,
      icon: a['icon'] as string,
      rarity: a['rarity'] as string,
      xpReward: a['xp_reward'] as number,
      progressCurrent,
      progressTotal: a['progress_total'] as number,
      isSecret: a['is_secret'] as boolean,
      category: a['category'] as string,
      earnedAt: a['earned_at'] ? new Date(a['earned_at'] as string) : undefined,
    };
  });
}

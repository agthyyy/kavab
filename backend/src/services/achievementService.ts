import db from '../config/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AwardedAchievement {
  id: string;
  title: string;
  description: string;
  conditionType: string;
  conditionValue: number;
}

export interface AchievementCheckContext {
  quizScore?: number;
  streak?: number;
  completedLessons?: number;
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
    case 'streak_days':
      return context.streak !== undefined && context.streak >= conditionValue;
    case 'lessons_count':
      return context.completedLessons !== undefined && context.completedLessons >= conditionValue;
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
  // Load all achievements
  const achievements = await db('achievements').select(
    'id',
    'title',
    'description',
    'condition_type',
    'condition_value'
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
      });

      newlyAwarded.push({
        id: achievementId,
        title: achievement['title'] as string,
        description: achievement['description'] as string,
        conditionType,
        conditionValue,
      });
    } catch {
      // Duplicate — already awarded (race condition), skip
    }
  }

  return newlyAwarded;
}

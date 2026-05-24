import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { getUserAchievements } from '../services/achievementService';

const VALID_CONDITION_TYPES = [
  'quiz_perfect',
  'quiz_perfect_first_try',
  'quiz_perfect_count',
  'quiz_passed_after_retries',
  'quiz_retake_improve',
  'streak_days',
  'lessons_count',
  'quizzes_count',
  'lessons_in_day',
  'lesson_late_night',
  'lesson_early_morning',
  'ranking_top',
] as const;

export async function listAchievements(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await db('achievements').orderBy('category', 'asc').orderBy('rarity', 'asc');
    
    // Get role assignments for each achievement
    const achievementIds = rows.map((r: Record<string, unknown>) => r.id as string);
    const roleAssignments = achievementIds.length > 0
      ? await db('achievement_roles')
          .whereIn('achievement_id', achievementIds)
          .join('roles', 'achievement_roles.role_id', 'roles.id')
          .select('achievement_roles.achievement_id', 'roles.id as role_id', 'roles.name as role_name')
      : [];
    
    const rolesByAchievement = roleAssignments.reduce((acc: Record<string, Array<{id: string, name: string}>>, r: Record<string, unknown>) => {
      const achId = r.achievement_id as string;
      if (!acc[achId]) acc[achId] = [];
      acc[achId].push({ id: r.role_id as string, name: r.role_name as string });
      return acc;
    }, {});
    
    res.status(200).json(rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      condition_type: r.condition_type,
      condition_value: r.condition_value,
      icon: r.icon,
      rarity: r.rarity,
      xp_reward: r.xp_reward,
      category: r.category,
      is_secret: r.is_secret,
      is_global: r.is_global,
      roles: rolesByAchievement[r.id as string] || [],
    })));
  } catch (err) {
    next(err);
  }
}

export async function createAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const name = (req.body.name ?? req.body.title) as string | undefined;
    const { description, condition_type, conditionType, condition_value, conditionValue, icon, rarity, xp_reward, category, is_secret, is_global, role_ids } = req.body as Record<string, unknown>;

    const resolvedConditionType = (condition_type ?? conditionType) as string | undefined;
    const resolvedConditionValue = Number(condition_value ?? conditionValue);

    if (!name?.trim()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
      return;
    }
    if (!description) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'description is required' } });
      return;
    }
    if (!resolvedConditionType || !VALID_CONDITION_TYPES.includes(resolvedConditionType as typeof VALID_CONDITION_TYPES[number])) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `condition_type must be one of: ${VALID_CONDITION_TYPES.join(', ')}` } });
      return;
    }
    if (isNaN(resolvedConditionValue)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'condition_value is required' } });
      return;
    }

    const [row] = await db('achievements')
      .insert({
        title: name.trim(),
        description,
        condition_type: resolvedConditionType,
        condition_value: resolvedConditionValue,
        icon: icon || '🏆',
        rarity: rarity || 'common',
        xp_reward: xp_reward || 0,
        category: category || 'general',
        is_secret: is_secret || false,
        is_global: is_global !== false, // default true
      })
      .returning(['id', 'title', 'description', 'condition_type', 'condition_value', 'icon', 'rarity', 'xp_reward', 'category', 'is_secret', 'is_global']);

    // If not global, assign to specific roles
    if (is_global === false && Array.isArray(role_ids) && role_ids.length > 0) {
      const roleAssignments = role_ids.map((roleId: unknown) => ({
        achievement_id: row.id,
        role_id: roleId as string,
      }));
      await db('achievement_roles').insert(roleAssignments);
    }

    res.status(201).json({
      achievement: {
        id: row.id,
        title: row.title,
        description: row.description,
        condition_type: row.condition_type,
        condition_value: row.condition_value,
        icon: row.icon,
        rarity: row.rarity,
        xp_reward: row.xp_reward,
        category: row.category,
        is_secret: row.is_secret,
        is_global: row.is_global,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const achievements = await getUserAchievements(userId);
    
    // Filter out secret achievements that haven't been earned yet
    const visibleAchievements = achievements.filter(a => !a.isSecret || a.earnedAt);
    
    res.status(200).json(visibleAchievements);
  } catch (err) {
    next(err);
  }
}

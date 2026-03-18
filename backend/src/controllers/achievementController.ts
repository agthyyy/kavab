import { Request, Response, NextFunction } from 'express';
import db from '../config/database';

const VALID_CONDITION_TYPES = ['quiz_perfect', 'streak_days', 'lessons_count'] as const;

export async function listAchievements(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await db('achievements').orderBy('title', 'asc');
    res.status(200).json(rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.title,
      description: r.description,
      condition_type: r.condition_type,
      condition_value: r.condition_value,
    })));
  } catch (err) {
    next(err);
  }
}

export async function createAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const name = (req.body.name ?? req.body.title) as string | undefined;
    const { description, condition_type, conditionType, condition_value, conditionValue } = req.body as Record<string, unknown>;

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
      .insert({ title: name.trim(), description, condition_type: resolvedConditionType, condition_value: resolvedConditionValue })
      .returning(['id', 'title', 'description', 'condition_type', 'condition_value']);

    res.status(201).json({
      achievement: { id: row.id, name: row.title, description: row.description, condition_type: row.condition_type, condition_value: row.condition_value },
    });
  } catch (err) {
    next(err);
  }
}

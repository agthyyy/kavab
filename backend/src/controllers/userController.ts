import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { login, password, fullName, full_name, role } = req.body as {
      login?: string;
      password?: string;
      fullName?: string;
      full_name?: string;
      role?: string;
    };

    const resolvedFullName = fullName ?? full_name;

    if (!login || !password || !resolvedFullName || !role) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'login, password, full_name, role are required' } });
      return;
    }

    const user = await userService.createUser({ login, password, fullName: resolvedFullName, role });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { fullName, role, isActive, password } = req.body as {
      fullName?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    };

    const user = await userService.updateUser(id, { fullName, role, isActive, password });
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20));

    const result = await userService.listUsers(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function assignCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { courseId } = req.body as { courseId?: string };

    if (!courseId) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'courseId is required' } });
      return;
    }

    await userService.assignCourse(id, courseId);
    res.status(200).json({ message: 'Course assigned' });
  } catch (err) {
    next(err);
  }
}

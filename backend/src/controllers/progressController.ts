import { Request, Response, NextFunction } from 'express';
import * as progressService from '../services/progressService';

export async function completeLessonHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const lessonId = req.params.id;
    const result = await progressService.completeLesson(userId, lessonId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function submitQuizHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const quizId = req.params.id;
    const { answers } = req.body as { answers: progressService.QuizAnswerInput[] };

    if (!Array.isArray(answers)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'answers must be an array' } });
      return;
    }

    const result = await progressService.submitQuiz(userId, quizId, answers);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProgressHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await progressService.getUserProgress(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAchievementsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await progressService.getUserAchievements(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getXpHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const result = await progressService.getXpHistory(userId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

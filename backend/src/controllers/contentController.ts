import { Request, Response, NextFunction } from 'express';
import * as contentService from '../services/contentService';

// ── Admin: Course CRUD ────────────────────────────────────────────────────────

export async function createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description } = req.body as { title?: string; description?: string };
    if (!title) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
      return;
    }
    const course = await contentService.createCourse(title, description);
    res.status(201).json({ course });
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description } = req.body as { title?: string; description?: string };
    const course = await contentService.updateCourse(id, { title, description });
    res.status(200).json({ course });
  } catch (err) {
    next(err);
  }
}

export async function publishCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const course = await contentService.publishCourse(id);
    res.status(200).json({ course });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Module CRUD ────────────────────────────────────────────────────────

export async function createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const courseId = (body.courseId ?? body.course_id) as string | undefined;
    const title = body.title as string | undefined;
    const orderIndex = Number(body.orderIndex ?? body.order_index ?? 1);
    const passThreshold = Number(body.passThreshold ?? body.pass_threshold ?? 70);

    if (!courseId || !title) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'course_id and title are required' } });
      return;
    }
    const module = await contentService.createModule({ courseId, title, orderIndex, passThreshold });
    res.status(201).json({ module });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Lesson CRUD ────────────────────────────────────────────────────────

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const moduleId = (body.moduleId ?? body.module_id) as string | undefined;
    const title = body.title as string | undefined;
    const description = (body.description ?? '') as string;
    const orderIndex = Number(body.orderIndex ?? body.order_index ?? 1);
    const xpReward = Number(body.xpReward ?? body.xp_reward ?? 50);

    if (!moduleId || !title) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'module_id and title are required' } });
      return;
    }
    const lesson = await contentService.createLesson({ moduleId, title, description, orderIndex, xpReward });
    res.status(201).json({ lesson });
  } catch (err) {
    next(err);
  }
}

export async function createLessonQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { xpMax, xp_max, passThreshold, pass_threshold } = req.body as Record<string, unknown>;
    const quiz = await contentService.createQuiz({
      lessonId: id,
      xpMax: Number(xpMax ?? xp_max ?? 50),
      passThreshold: Number(passThreshold ?? pass_threshold ?? 80),
    });
    res.status(201).json({ quiz });
  } catch (err) {
    next(err);
  }
}

export async function getLessonQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const quiz = await contentService.getQuizByLesson(id);
    res.status(200).json({ quiz });
  } catch (err) {
    next(err);
  }
}

export async function addLessonBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { blockType, content, orderIndex } = req.body as {
      blockType?: string;
      content?: string;
      orderIndex?: number;
    };
    if (!blockType || content === undefined || orderIndex === undefined) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'blockType, content, orderIndex are required' } });
      return;
    }
    const block = await contentService.addLessonBlock(id, { blockType, content, orderIndex });
    res.status(201).json({ block });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Quiz CRUD ──────────────────────────────────────────────────────────

export async function createQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { moduleId, xpMax, passThreshold } = req.body as {
      moduleId?: string;
      xpMax?: number;
      passThreshold?: number;
    };
    if (!moduleId || xpMax === undefined || passThreshold === undefined) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'moduleId, xpMax, passThreshold are required' } });
      return;
    }
    const quiz = await contentService.createQuiz({ moduleId, xpMax, passThreshold });
    res.status(201).json({ quiz });
  } catch (err) {
    next(err);
  }
}

export async function addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { questionType, text, explanation, orderIndex, options } = req.body as {
      questionType?: string;
      text?: string;
      explanation?: string;
      orderIndex?: number;
      options?: Array<{ text: string; isCorrect: boolean; matchPair?: string }>;
    };
    if (!questionType || !text || orderIndex === undefined || !options) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'questionType, text, orderIndex, options are required' } });
      return;
    }
    const question = await contentService.addQuestion(id, { questionType, text, explanation, orderIndex, options });
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

// ── Content: Media upload URL ─────────────────────────────────────────────────

export async function getMediaUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fileName, contentType, fileSize } = req.body as {
      fileName?: string;
      contentType?: string;
      fileSize?: number;
    };
    if (!fileName || !contentType || fileSize === undefined) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'fileName, contentType, fileSize are required' } });
      return;
    }
    const result = await contentService.generateUploadUrl({ fileName, contentType, fileSize });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── Content: Read endpoints ───────────────────────────────────────────────────

export async function listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courses = await contentService.getAllCourses();
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
}

export async function listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const modules = await contentService.getModulesByCourse(id);
    res.status(200).json(modules);
  } catch (err) {
    next(err);
  }
}

export async function listLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lessons = await contentService.getLessonsByModule(id);
    res.status(200).json(lessons);
  } catch (err) {
    next(err);
  }
}

export async function getCourseTree(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const modules = await contentService.getCourseTree(id, userId);
    res.status(200).json({ modules });
  } catch (err) {
    next(err);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await contentService.getLessonWithBlocks(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await contentService.getQuizWithQuestions(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

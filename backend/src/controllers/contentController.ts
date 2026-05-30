import { Request, Response, NextFunction } from 'express';
import * as contentService from '../services/contentService';
import db from '../config/database';

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
    const { questionType, text, imageUrl, explanation, orderIndex, options } = req.body as {
      questionType?: string;
      text?: string;
      imageUrl?: string;
      explanation?: string;
      orderIndex?: number;
      options?: Array<{ text: string; isCorrect: boolean; matchPair?: string }>;
    };
    
    console.log('[addQuestion] Received data:', { id, questionType, text, orderIndex, options });
    
    if (!questionType || !text || orderIndex === undefined || !options) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'questionType, text, orderIndex, options are required' } });
      return;
    }
    const question = await contentService.addQuestion(id, { questionType, text, imageUrl, explanation, orderIndex, options });
    
    console.log('[addQuestion] Question created:', question.id);
    
    res.status(201).json({ question });
  } catch (err) {
    console.error('[addQuestion] Error:', err);
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

// ── Content: Media upload ─────────────────────────────────────────────────────

export async function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
      return;
    }
    
    const publicUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
    
    res.status(200).json({ 
      success: true, 
      publicUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    next(err);
  }
}

// ── Achievement triggers ──────────────────────────────────────────────────────

export async function createAchievementTrigger(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { achievementId, triggerType, triggerValue } = req.body as {
      achievementId?: string;
      triggerType?: string;
      triggerValue?: string;
    };

    if (!achievementId || !triggerType) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'achievementId and triggerType are required' } });
      return;
    }

    // Check if achievement exists
    const achievement = await db('achievements').where({ id: achievementId }).first();
    if (!achievement) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Achievement not found' } });
      return;
    }

    // Create trigger
    const trigger = await db('achievement_triggers').insert({
      achievement_id: achievementId,
      trigger_type: triggerType,
      trigger_value: triggerValue,
    }).returning('*');

    res.status(201).json({ success: true, trigger: trigger[0] });
  } catch (err) {
    next(err);
  }
}

// ── Content: Read endpoints ───────────────────────────────────────────────────

export async function listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let courses;
    // Check if the request comes from the admin panel (includes /admin)
    if (req.baseUrl.includes('/admin')) {
      courses = await contentService.getAllCourses();
    } else {
      courses = await contentService.getCoursesForUser(req.user!.id);
    }
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
    console.log('[getLesson] Returning lesson:', { 
      id: result.lesson.id, 
      title: result.lesson.title,
      quizId: result.lesson.quizId,
      nextLessonId: result.lesson.nextLessonId 
    });
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

export async function getQuizForAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await contentService.getQuizWithQuestions(id, true);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ── Course Roles Management ───────────────────────────────────────────────────

export async function getCourseRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { roleService } = await import('../services/roleService');
    const roles = await roleService.getRolesForCourse(id);
    // Возвращаем только ID ролей
    const roleIds = roles.map(role => role.id);
    res.status(200).json({ roles: roleIds });
  } catch (err) {
    next(err);
  }
}

export async function setCourseRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { roleIds } = req.body as { roleIds?: string[] };
    if (!Array.isArray(roleIds)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'roleIds must be an array' } });
      return;
    }
    // Фильтруем null/undefined/пустые значения
    const validRoleIds = roleIds.filter(id => id != null && id !== '');
    console.log('[setCourseRoles] Received roleIds:', roleIds);
    console.log('[setCourseRoles] Valid roleIds:', validRoleIds);
    
    const { roleService } = await import('../services/roleService');
    await roleService.setRolesForCourse(id, validRoleIds);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── Module Roles Management ───────────────────────────────────────────────────

export async function getModuleRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const roles = await db('module_roles')
      .join('roles', 'module_roles.role_id', 'roles.id')
      .where('module_roles.module_id', id)
      .select('roles.id', 'roles.name');
    res.status(200).json({ roles });
  } catch (err) {
    next(err);
  }
}

export async function setModuleRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { roleIds } = req.body as { roleIds?: string[] };
    if (!Array.isArray(roleIds)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'roleIds must be an array' } });
      return;
    }

    // Проверяем существование модуля
    const module = await db('modules').where({ id }).first();
    if (!module) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Module not found' } });
      return;
    }

    // Удаляем старые привязки
    await db('module_roles').where({ module_id: id }).delete();

    // Добавляем новые привязки
    if (roleIds.length > 0) {
      await db('module_roles').insert(
        roleIds.map(roleId => ({
          module_id: id,
          role_id: roleId,
        }))
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

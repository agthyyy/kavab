import db from '../config/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CourseRecord {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
}

export interface ModuleRecord {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  passThreshold: number;
}

export interface LessonRecord {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  xpReward: number;
}

export interface LessonBlockRecord {
  id: string;
  lessonId: string;
  blockType: 'text' | 'image' | 'video';
  content: string | null;
  orderIndex: number;
}

export interface QuizRecord {
  id: string;
  moduleId: string | null;
  lessonId: string | null;
  title: string;
  xpMax: number;
  passThreshold: number;
}

export interface QuestionRecord {
  id: string;
  quizId: string;
  questionType: 'single' | 'multiple' | 'matching' | 'true_false';
  text: string;
  imageUrl: string | null;
  explanation: string | null;
  orderIndex: number;
  options: AnswerOptionRecord[];
}

export interface AnswerOptionRecord {
  id: string;
  questionId: string;
  text: string;
  isCorrect?: boolean;
  matchPair: string | null;
}

export type ModuleStatus = 'locked' | 'available' | 'completed';

export interface ModuleWithStatus extends ModuleRecord {
  status: ModuleStatus;
  firstLessonId: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeError(message: string, statusCode: number, code: string): Error & { statusCode: number; code: string } {
  const err = new Error(message) as Error & { statusCode: number; code: string };
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

// ── Course CRUD ───────────────────────────────────────────────────────────────

export async function createCourse(title: string, description?: string): Promise<CourseRecord> {
  const [row] = await db('courses')
    .insert({ title, description: description ?? null, is_published: false })
    .returning(['id', 'title', 'description', 'is_published', 'created_at']);
  return mapCourse(row);
}

export async function updateCourse(id: string, data: { title?: string; description?: string }): Promise<CourseRecord> {
  /**
   * NOTE (Property 26 / Requirement 10.7): Editing course content does NOT affect
   * user_lesson_progress records. Completion records are stored independently and
   * reference lesson IDs — changing lesson content leaves all existing completion
   * records intact.
   */
  const existing = await db('courses').where({ id }).first();
  if (!existing) throw makeError('Course not found', 404, 'NOT_FOUND');

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;

  const [row] = await db('courses').where({ id }).update(updates).returning(['id', 'title', 'description', 'is_published', 'created_at']);
  return mapCourse(row);
}

export async function publishCourse(id: string): Promise<CourseRecord> {
  const existing = await db('courses').where({ id }).first();
  if (!existing) throw makeError('Course not found', 404, 'NOT_FOUND');

  const [row] = await db('courses').where({ id }).update({ is_published: true }).returning(['id', 'title', 'description', 'is_published', 'created_at']);
  return mapCourse(row);
}

function mapCourse(row: Record<string, unknown>): CourseRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as Date,
  };
}

// ── Module CRUD ───────────────────────────────────────────────────────────────

export async function createModule(data: {
  courseId: string;
  title: string;
  orderIndex: number;
  passThreshold: number;
}): Promise<ModuleRecord> {
  if (data.passThreshold < 1 || data.passThreshold > 100) {
    throw makeError('passThreshold must be between 1 and 100', 400, 'VALIDATION_ERROR');
  }

  const [row] = await db('modules')
    .insert({
      course_id: data.courseId,
      title: data.title,
      order_index: data.orderIndex,
      pass_threshold: data.passThreshold,
    })
    .returning(['id', 'course_id', 'title', 'order_index', 'pass_threshold']);
  return mapModule(row);
}

function mapModule(row: Record<string, unknown>): ModuleRecord {
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    title: row.title as string,
    orderIndex: row.order_index as number,
    passThreshold: row.pass_threshold as number,
  };
}

// ── Lesson CRUD ───────────────────────────────────────────────────────────────

export async function createLesson(data: {
  moduleId: string;
  title: string;
  description?: string;
  orderIndex: number;
  xpReward: number;
}): Promise<LessonRecord> {
  const [row] = await db('lessons')
    .insert({
      module_id: data.moduleId,
      title: data.title,
      description: data.description ?? null,
      order_index: data.orderIndex,
      xp_reward: data.xpReward,
    })
    .returning(['id', 'module_id', 'title', 'description', 'order_index', 'xp_reward']);
  return mapLesson(row);
}

function mapLesson(row: Record<string, unknown>): LessonRecord {
  return {
    id: row.id as string,
    moduleId: row.module_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    orderIndex: row.order_index as number,
    xpReward: row.xp_reward as number,
  };
}

// ── Lesson Block CRUD ─────────────────────────────────────────────────────────

const VALID_BLOCK_TYPES = ['text', 'image', 'video'] as const;

export async function addLessonBlock(lessonId: string, data: {
  blockType: string;
  content: string;
  orderIndex: number;
}): Promise<LessonBlockRecord> {
  /**
   * NOTE (Property 26 / Requirement 10.7): Adding or editing lesson blocks does NOT
   * affect user_lesson_progress records. user_lesson_progress stores completion events
   * keyed by (user_id, lesson_id) — modifying lesson content never alters those records.
   * Similarly, user_quiz_attempts stores attempt records independently of quiz content.
   */
  if (!VALID_BLOCK_TYPES.includes(data.blockType as 'text' | 'image' | 'video')) {
    throw makeError(`blockType must be one of: ${VALID_BLOCK_TYPES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const [row] = await db('lesson_blocks')
    .insert({
      lesson_id: lessonId,
      block_type: data.blockType,
      content: data.content,
      order_index: data.orderIndex,
    })
    .returning(['id', 'lesson_id', 'block_type', 'content', 'order_index']);
  return mapBlock(row);
}

function mapBlock(row: Record<string, unknown>): LessonBlockRecord {
  return {
    id: row.id as string,
    lessonId: row.lesson_id as string,
    blockType: row.block_type as 'text' | 'image' | 'video',
    content: row.content as string | null,
    orderIndex: row.order_index as number,
  };
}

// ── Quiz CRUD ─────────────────────────────────────────────────────────────────

export async function createQuiz(data: {
  moduleId?: string;
  lessonId?: string;
  xpMax: number;
  passThreshold: number;
}): Promise<QuizRecord> {
  if (data.passThreshold < 1 || data.passThreshold > 100) {
    throw makeError('passThreshold must be between 1 and 100', 400, 'VALIDATION_ERROR');
  }
  if (!data.moduleId && !data.lessonId) {
    throw makeError('moduleId or lessonId is required', 400, 'VALIDATION_ERROR');
  }

  const [row] = await db('quizzes')
    .insert({
      module_id: data.moduleId ?? null,
      lesson_id: data.lessonId ?? null,
      xp_max: data.xpMax,
      pass_threshold: data.passThreshold,
    })
    .returning(['id', 'module_id', 'lesson_id', 'xp_max', 'pass_threshold']);
  return mapQuiz(row);
}

export async function getQuizByLesson(lessonId: string): Promise<QuizRecord | null> {
  const row = await db('quizzes').where({ lesson_id: lessonId }).first();
  return row ? mapQuiz(row) : null;
}

function mapQuiz(row: Record<string, unknown>): QuizRecord {
  return {
    id: row.id as string,
    moduleId: (row.module_id as string | null) ?? null,
    lessonId: (row.lesson_id as string | null) ?? null,
    title: (row.title as string | null) ?? 'Тест', // Default title since DB doesn't have this field
    xpMax: row.xp_max as number,
    passThreshold: row.pass_threshold as number,
  };
}

// ── Question CRUD ─────────────────────────────────────────────────────────────

export const VALID_QUESTION_TYPES = ['single', 'multiple', 'matching', 'true_false'] as const;
export type QuestionType = typeof VALID_QUESTION_TYPES[number];

export async function addQuestion(quizId: string, data: {
  questionType: string;
  text: string;
  imageUrl?: string;
  explanation?: string;
  orderIndex: number;
  options: Array<{ text: string; isCorrect: boolean; matchPair?: string }>;
}): Promise<QuestionRecord> {
  if (!VALID_QUESTION_TYPES.includes(data.questionType as QuestionType)) {
    throw makeError(`questionType must be one of: ${VALID_QUESTION_TYPES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const [qRow] = await db('questions')
    .insert({
      quiz_id: quizId,
      question_type: data.questionType,
      text: data.text,
      image_url: data.imageUrl ?? null,
      explanation: data.explanation ?? null,
      order_index: data.orderIndex,
    })
    .returning(['id', 'quiz_id', 'question_type', 'text', 'image_url', 'explanation', 'order_index']);

  const optionRows = await db('answer_options')
    .insert(
      data.options.map((o) => ({
        question_id: qRow.id,
        text: o.text,
        is_correct: o.isCorrect,
        match_pair: o.matchPair ?? null,
      }))
    )
    .returning(['id', 'question_id', 'text', 'is_correct', 'match_pair']);

  return {
    id: qRow.id as string,
    quizId: qRow.quiz_id as string,
    questionType: qRow.question_type as QuestionType,
    text: qRow.text as string,
    imageUrl: qRow.image_url as string | null,
    explanation: qRow.explanation as string | null,
    orderIndex: qRow.order_index as number,
    options: optionRows.map((o: Record<string, unknown>) => ({
      id: o.id as string,
      questionId: o.question_id as string,
      text: o.text as string,
      isCorrect: o.is_correct as boolean,
      matchPair: o.match_pair as string | null,
    })),
  };
}

// ── Media upload URL ──────────────────────────────────────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4'];
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;   // 10 MB
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;  // 500 MB

export async function generateUploadUrl(data: {
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; filePath: string; publicUrl: string }> {
  const isImage = IMAGE_TYPES.includes(data.contentType);
  const isVideo = VIDEO_TYPES.includes(data.contentType);

  if (!isImage && !isVideo) {
    throw makeError(
      `contentType must be one of: ${[...IMAGE_TYPES, ...VIDEO_TYPES].join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (isImage && data.fileSize > IMAGE_MAX_BYTES) {
    throw makeError('Image files must be <= 10MB', 400, 'VALIDATION_ERROR');
  }

  if (isVideo && data.fileSize > VIDEO_MAX_BYTES) {
    throw makeError('Video files must be <= 500MB', 400, 'VALIDATION_ERROR');
  }

  // Генерируем уникальное имя файла
  const timestamp = Date.now();
  const extension = data.fileName.split('.').pop();
  const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
  const filePath = `uploads/${uniqueFileName}`;
  
  // URL для загрузки (будет обрабатываться через multer)
  const uploadUrl = `/api/admin/media/upload`;
  
  // Публичный URL для доступа к файлу
  const publicUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${uniqueFileName}`;
  
  return { 
    uploadUrl, 
    filePath, 
    publicUrl 
  };
}

// ── Content read endpoints ────────────────────────────────────────────────────

export async function getCoursesForUser(userId: string): Promise<Record<string, unknown>[]> {
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', userId)
    .select('users.role_id', 'roles.name as roleName')
    .first();
  if (!user) throw makeError('User not found', 404, 'NOT_FOUND');
  
  const allCourses = await db('courses')
    .where({ is_published: true })
    .orderBy('created_at', 'desc')
    .select('id', 'title', 'description', 'is_published', 'created_at');
  const result: Record<string, unknown>[] = [];
  
  for (const course of allCourses) {
    if (user.roleName === 'admin') {
      result.push(course);
      continue;
    }
    
    const courseRoles = await db('course_roles').where({ course_id: course.id }).select('role_id');
    if (courseRoles.length === 0 || courseRoles.some(cr => cr.role_id === user.role_id)) {
      result.push(course);
    }
  }
  
  return result;
}

export async function getAllCourses(): Promise<Record<string, unknown>[]> {
  const rows = await db('courses').orderBy('created_at', 'desc').select('id', 'title', 'description', 'is_published', 'created_at');
  return rows;
}

export async function getModulesByCourse(courseId: string): Promise<Record<string, unknown>[]> {
  return db('modules').where({ course_id: courseId }).orderBy('order_index', 'asc');
}

export async function getLessonsByModule(moduleId: string): Promise<Record<string, unknown>[]> {
  return db('lessons').where({ module_id: moduleId }).orderBy('order_index', 'asc');
}

export async function getCourseTree(courseId: string, userId: string): Promise<ModuleWithStatus[]> {
  // Получаем роль пользователя
  const user = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', userId)
    .select('users.role_id', 'roles.name as roleName')
    .first();

  if (!user) {
    throw makeError('User not found', 404, 'NOT_FOUND');
  }

  // Получаем модули, доступные для роли пользователя
  let query = db('modules')
    .where('modules.course_id', courseId);

  if (user.roleName !== 'admin') {
    query = query
      .leftJoin('module_roles', 'modules.id', 'module_roles.module_id')
      .where(function() {
        // Модуль доступен если:
        // 1. У него нет привязки к ролям (доступен всем)
        // 2. Или он привязан к роли пользователя
        this.whereNull('module_roles.role_id')
          .orWhere('module_roles.role_id', user.role_id);
      });
  }

  const modules = await query
    .distinct('modules.id', 'modules.course_id', 'modules.title', 'modules.order_index', 'modules.pass_threshold')
    .orderBy('modules.order_index', 'asc')
    .select('modules.id', 'modules.course_id', 'modules.title', 'modules.order_index', 'modules.pass_threshold');

  if (modules.length === 0) return [];

  // Get first lesson per module
  const moduleIds = modules.map((m: Record<string, unknown>) => m.id as string);
  const firstLessons = await db('lessons')
    .whereIn('module_id', moduleIds)
    .orderBy('order_index', 'asc')
    .select('id', 'module_id');

  const firstLessonByModule = new Map<string, string>();
  for (const l of firstLessons) {
    if (!firstLessonByModule.has(l.module_id as string)) {
      firstLessonByModule.set(l.module_id as string, l.id as string);
    }
  }

  // Get all passed quiz attempts for this user in this course
  const quizzes = await db('quizzes')
    .join('modules', 'quizzes.module_id', 'modules.id')
    .where('modules.course_id', courseId)
    .whereNotNull('quizzes.module_id')
    .select('quizzes.id as quiz_id', 'quizzes.module_id');

  const quizIds = quizzes.map((q: Record<string, unknown>) => q.quiz_id as string);

  const passedAttempts = quizIds.length > 0
    ? await db('user_quiz_attempts')
        .whereIn('quiz_id', quizIds)
        .where({ user_id: userId, passed: true })
        .select('quiz_id')
    : [];

  const passedQuizIds = new Set(passedAttempts.map((a: Record<string, unknown>) => a.quiz_id as string));
  const quizByModule = new Map(quizzes.map((q: Record<string, unknown>) => [q.module_id as string, q.quiz_id as string]));

  const result: ModuleWithStatus[] = [];
  let previousCompleted = true;

  for (const mod of modules) {
    const moduleId = mod.id as string;
    const quizId = quizByModule.get(moduleId);
    
    let isCompleted = false;
    
    if (quizId) {
      // Если у модуля есть тест - проверяем, пройден ли он
      isCompleted = passedQuizIds.has(quizId);
    } else {
      // Если у модуля НЕТ теста - проверяем, пройдены ли ВСЕ уроки
      const lessonsInModule = await db('lessons')
        .where({ module_id: moduleId })
        .select('id');
      
      if (lessonsInModule.length > 0) {
        const lessonIds = lessonsInModule.map(l => l.id as string);
        const completedLessons = await db('user_lesson_progress')
          .whereIn('lesson_id', lessonIds)
          .where({ user_id: userId })
          .select('lesson_id');
        
        // Модуль считается завершенным только если пройдены ВСЕ уроки
        isCompleted = completedLessons.length === lessonsInModule.length;
      }
    }

    let status: ModuleStatus;
    if (isCompleted) {
      status = 'completed';
    } else if (previousCompleted) {
      status = 'available';
    } else {
      status = 'locked';
    }

    result.push({
      id: moduleId,
      courseId: mod.course_id as string,
      title: mod.title as string,
      orderIndex: mod.order_index as number,
      passThreshold: mod.pass_threshold as number,
      status,
      firstLessonId: firstLessonByModule.get(moduleId) ?? null,
    });

    previousCompleted = isCompleted;
  }

  return result;
}

export async function getLessonWithBlocks(lessonId: string): Promise<{ lesson: LessonRecord & { nextLessonId: string | null; quizId: string | null }; blocks: LessonBlockRecord[] }> {
  const lesson = await db('lessons').where({ id: lessonId }).first();
  if (!lesson) throw makeError('Lesson not found', 404, 'NOT_FOUND');

  // Find next lesson in the same module by order_index
  const nextLesson = await db('lessons')
    .where({ module_id: lesson.module_id })
    .where('order_index', '>', lesson.order_index as number)
    .orderBy('order_index', 'asc')
    .select('id')
    .first();

  // Find quiz for this lesson
  const quiz = await db('quizzes')
    .where({ lesson_id: lessonId })
    .select('id')
    .first();

  // Check if quiz has questions
  let quizId: string | null = null;
  if (quiz) {
    const questionCount = await db('questions')
      .where({ quiz_id: quiz.id })
      .count('id as count')
      .first();
    
    const count = parseInt(String(questionCount?.count ?? '0'), 10);
    if (count > 0) {
      quizId = quiz.id as string;
    }
  }

  const blocks = await db('lesson_blocks')
    .where({ lesson_id: lessonId })
    .orderBy('order_index', 'asc')
    .select('id', 'lesson_id', 'block_type', 'content', 'order_index');

  return {
    lesson: { 
      ...mapLesson(lesson), 
      nextLessonId: nextLesson ? (nextLesson.id as string) : null,
      quizId,
    },
    blocks: blocks.map((b: Record<string, unknown>) => mapBlock(b)),
  };
}

export async function getQuizWithQuestions(quizId: string, includeCorrectAnswers: boolean = false): Promise<{ quiz: QuizRecord; questions: QuestionRecord[] }> {
  const quiz = await db('quizzes').where({ id: quizId }).first();
  if (!quiz) throw makeError('Quiz not found', 404, 'NOT_FOUND');

  const questions = await db('questions')
    .where({ quiz_id: quizId })
    .orderBy('order_index', 'asc')
    .select('id', 'quiz_id', 'question_type', 'text', 'image_url', 'explanation', 'order_index');

  const questionIds = questions.map((q: Record<string, unknown>) => q.id as string);

  const selectFields = includeCorrectAnswers
    ? ['id', 'question_id', 'text', 'is_correct', 'match_pair']
    : ['id', 'question_id', 'text', 'match_pair'];

  const options = questionIds.length > 0
    ? await db('answer_options')
        .whereIn('question_id', questionIds)
        .select(selectFields)
    : [];

  const optionsByQuestion = new Map<string, AnswerOptionRecord[]>();
  for (const opt of options) {
    const qId = opt.question_id as string;
    if (!optionsByQuestion.has(qId)) optionsByQuestion.set(qId, []);
    optionsByQuestion.get(qId)!.push({
      id: opt.id as string,
      questionId: opt.question_id as string,
      text: opt.text as string,
      isCorrect: includeCorrectAnswers ? (opt.is_correct as boolean) : undefined,
      matchPair: opt.match_pair as string | null,
    });
  }

  return {
    quiz: mapQuiz(quiz),
    questions: questions.map((q: Record<string, unknown>) => ({
      id: q.id as string,
      quizId: q.quiz_id as string,
      questionType: q.question_type as QuestionType,
      text: q.text as string,
      imageUrl: q.image_url as string | null,
      explanation: q.explanation as string | null,
      orderIndex: q.order_index as number,
      options: optionsByQuestion.get(q.id as string) ?? [],
    })),
  };
}

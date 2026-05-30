import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as userController from '../controllers/userController';
import * as contentController from '../controllers/contentController';
import * as achievementController from '../controllers/achievementController';
import { upload } from '../middleware/upload';

const router = Router();

// ── User management ──────────────────────────────────────────────────────────
router.post('/users', requireAuth, requireRole('admin'), userController.createUser);
router.patch('/users/:id', requireAuth, requireRole('admin'), userController.updateUser);
router.get('/users', requireAuth, requireRole('admin'), userController.listUsers);
router.post('/users/:id/courses', requireAuth, requireRole('admin'), userController.assignCourse);
router.delete('/users/:id', requireAuth, requireRole('admin'), userController.deleteUser);


// ── Course management ─────────────────────────────────────────────────────────
router.get('/courses', requireAuth, requireRole('admin'), contentController.listCourses);
router.post('/courses', requireAuth, requireRole('admin'), contentController.createCourse);
router.put('/courses/:id', requireAuth, requireRole('admin'), contentController.updateCourse);
router.post('/courses/:id/publish', requireAuth, requireRole('admin'), contentController.publishCourse);
router.get('/courses/:id/modules', requireAuth, requireRole('admin'), contentController.listModules);
router.get('/courses/:id/roles', requireAuth, requireRole('admin'), contentController.getCourseRoles);
router.post('/courses/:id/roles', requireAuth, requireRole('admin'), contentController.setCourseRoles);

// ── Module and lesson management ──────────────────────────────────────────────
router.post('/modules', requireAuth, requireRole('admin'), contentController.createModule);
router.get('/modules/:id/lessons', requireAuth, requireRole('admin'), contentController.listLessons);
router.get('/modules/:id/roles', requireAuth, requireRole('admin'), contentController.getModuleRoles);
router.post('/modules/:id/roles', requireAuth, requireRole('admin'), contentController.setModuleRoles);
router.post('/lessons', requireAuth, requireRole('admin'), contentController.createLesson);
router.post('/lessons/:id/blocks', requireAuth, requireRole('admin'), contentController.addLessonBlock);
router.post('/lessons/:id/quiz', requireAuth, requireRole('admin'), contentController.createLessonQuiz);
router.get('/lessons/:id/quiz', requireAuth, requireRole('admin'), contentController.getLessonQuiz);

// ── Quiz management ───────────────────────────────────────────────────────────
router.get('/quizzes/:id', requireAuth, requireRole('admin'), contentController.getQuizForAdmin);
router.post('/quizzes', requireAuth, requireRole('admin'), contentController.createQuiz);
router.post('/quizzes/:id/questions', requireAuth, requireRole('admin'), contentController.addQuestion);

// ── Achievements ──────────────────────────────────────────────────────────────
router.get('/achievements', requireAuth, requireRole('admin'), achievementController.listAchievements);
router.post('/achievements', requireAuth, requireRole('admin'), achievementController.createAchievement);

// ── Media upload ──────────────────────────────────────────────────────────────
router.post('/media/upload-url', requireAuth, requireRole('admin'), contentController.getMediaUploadUrl);
router.post('/media/upload', requireAuth, requireRole('admin'), upload.single('file'), contentController.uploadMedia);

// ── Achievement triggers ──────────────────────────────────────────────────────
router.post('/achievement-triggers', requireAuth, requireRole('admin'), contentController.createAchievementTrigger);

export default router;

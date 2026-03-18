import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as contentController from '../controllers/contentController';

const router = Router();

// GET /api/content/courses
router.get('/courses', requireAuth, contentController.listCourses);

// GET /api/content/courses/:id/tree
router.get('/courses/:id/tree', requireAuth, contentController.getCourseTree);

// GET /api/content/lessons/:id
router.get('/lessons/:id', requireAuth, contentController.getLesson);

// GET /api/content/quizzes/:id
router.get('/quizzes/:id', requireAuth, contentController.getQuiz);

// POST /api/content/media/upload-url
router.post('/media/upload-url', requireAuth, contentController.getMediaUploadUrl);

export default router;

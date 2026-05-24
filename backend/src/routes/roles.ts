import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// GET /api/roles - получить все должности (доступно всем)
router.get('/', roleController.getAllRoles);

// GET /api/roles/:id - получить должность по ID (доступно всем)
router.get('/:id', roleController.getRoleById);

// Только для администраторов
router.use(requireRole('admin'));

// POST /api/roles - создать новую должность
router.post('/', roleController.createRole);

// PUT /api/roles/:id - обновить должность
router.put('/:id', roleController.updateRole);

// DELETE /api/roles/:id - удалить должность
router.delete('/:id', roleController.deleteRole);

export default router;

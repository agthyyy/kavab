import { Request, Response } from 'express';
import { roleService } from '../services/roleService';

export const roleController = {
  // Получить все должности
  async getAllRoles(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const roles = await roleService.getAllRoles(includeInactive);
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get roles' });
    }
  },

  // Получить должность по ID
  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get role' });
    }
  },

  // Создать новую должность (только для админов)
  async createRole(req: Request, res: Response) {
    try {
      const { name, displayName, description, sortOrder } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ message: 'Name and displayName are required' });
      }

      const role = await roleService.createRole({
        name,
        displayName,
        description,
        sortOrder,
      });
      
      res.status(201).json(role);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to create role' });
    }
  },

  // Обновить должность (только для админов)
  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { displayName, description, sortOrder, isActive } = req.body;
      
      const role = await roleService.updateRole(id, {
        displayName,
        description,
        sortOrder,
        isActive,
      });
      
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update role' });
    }
  },

  // Удалить должность (только для админов)
  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await roleService.deleteRole(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('cannot be deleted')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to delete role' });
    }
  },
};

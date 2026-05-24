import db from '../config/database';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  sortOrder?: number;
}

interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const roleService = {
  /**
   * Получить все должности
   */
  async getAllRoles(includeInactive: boolean = false): Promise<Role[]> {
    let query = db('roles').select(
      'id',
      'name',
      'display_name as displayName',
      'description',
      'is_active as isActive',
      'sort_order as sortOrder',
      'created_at as createdAt',
      'updated_at as updatedAt'
    );

    if (!includeInactive) {
      query = query.where('is_active', true);
    }

    const roles = await query.orderBy('sort_order', 'asc');
    return roles;
  },

  /**
   * Получить должность по ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    const role = await db('roles')
      .where({ id })
      .select(
        'id',
        'name',
        'display_name as displayName',
        'description',
        'is_active as isActive',
        'sort_order as sortOrder',
        'created_at as createdAt',
        'updated_at as updatedAt'
      )
      .first();

    return role || null;
  },

  /**
   * Получить должность по имени
   */
  async getRoleByName(name: string): Promise<Role | null> {
    const role = await db('roles')
      .where({ name })
      .select(
        'id',
        'name',
        'display_name as displayName',
        'description',
        'is_active as isActive',
        'sort_order as sortOrder',
        'created_at as createdAt',
        'updated_at as updatedAt'
      )
      .first();

    return role || null;
  },

  /**
   * Создать новую должность
   */
  async createRole(input: CreateRoleInput): Promise<Role> {
    // Проверяем, не существует ли уже должность с таким именем
    const existing = await this.getRoleByName(input.name);
    if (existing) {
      throw new Error(`Role with name "${input.name}" already exists`);
    }

    const [role] = await db('roles')
      .insert({
        name: input.name,
        display_name: input.displayName,
        description: input.description,
        sort_order: input.sortOrder || 0,
      })
      .returning([
        'id',
        'name',
        'display_name as displayName',
        'description',
        'is_active as isActive',
        'sort_order as sortOrder',
        'created_at as createdAt',
        'updated_at as updatedAt',
      ]);

    return role;
  },

  /**
   * Обновить должность
   */
  async updateRole(id: string, input: UpdateRoleInput): Promise<Role | null> {
    const updateData: any = {
      updated_at: db.fn.now(),
    };

    if (input.displayName !== undefined) {
      updateData.display_name = input.displayName;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.sortOrder !== undefined) {
      updateData.sort_order = input.sortOrder;
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    const [role] = await db('roles')
      .where({ id })
      .update(updateData)
      .returning([
        'id',
        'name',
        'display_name as displayName',
        'description',
        'is_active as isActive',
        'sort_order as sortOrder',
        'created_at as createdAt',
        'updated_at as updatedAt',
      ]);

    return role || null;
  },

  /**
   * Удалить должность
   */
  async deleteRole(id: string): Promise<void> {
    // Проверяем, есть ли пользователи с этой должностью
    const usersCount = await db('users').where({ role_id: id }).count('id as count').first();
    
    if (usersCount && parseInt(String(usersCount.count)) > 0) {
      throw new Error('Role cannot be deleted because it is assigned to users');
    }

    // Проверяем, есть ли курсы с этой должностью
    const coursesCount = await db('course_roles').where({ role_id: id }).count('id as count').first();
    
    if (coursesCount && parseInt(String(coursesCount.count)) > 0) {
      throw new Error('Role cannot be deleted because it is assigned to courses');
    }

    await db('roles').where({ id }).delete();
  },

  /**
   * Получить должности для курса
   */
  async getRolesForCourse(courseId: string): Promise<Role[]> {
    const roles = await db('roles')
      .join('course_roles', 'roles.id', 'course_roles.role_id')
      .where('course_roles.course_id', courseId)
      .select(
        'roles.id',
        'roles.name',
        'roles.display_name as displayName',
        'roles.description',
        'roles.is_active as isActive',
        'roles.sort_order as sortOrder',
        'roles.created_at as createdAt',
        'roles.updated_at as updatedAt'
      )
      .orderBy('roles.sort_order', 'asc');

    return roles;
  },

  /**
   * Установить должности для курса
   */
  async setRolesForCourse(courseId: string, roleIds: string[]): Promise<void> {
    await db.transaction(async (trx) => {
      // Удаляем старые связи
      await trx('course_roles').where({ course_id: courseId }).delete();

      // Добавляем новые связи
      if (roleIds.length > 0) {
        const courseRoles = roleIds.map((roleId) => ({
          course_id: courseId,
          role_id: roleId,
        }));
        await trx('course_roles').insert(courseRoles);
      }
    });
  },
};

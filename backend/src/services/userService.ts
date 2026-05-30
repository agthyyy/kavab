import bcrypt from 'bcryptjs';
import db from '../config/database';
import { sendNotificationToUser } from './notificationService';

export const VALID_ROLES = ['barista', 'waiter', 'manager', 'admin'] as const;
export type UserRole = typeof VALID_ROLES[number];

export interface CreateUserInput {
  login: string;
  password: string;
  fullName: string;
  roleId: string;
}

export interface UpdateUserInput {
  fullName?: string;
  roleId?: string;
  isActive?: boolean;
  password?: string;
}

export interface UserRecord {
  id: string;
  login: string;
  fullName: string;
  role: string;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
}

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    login: row.login as string,
    fullName: row.full_name as string,
    role: row.role as string,
    roleId: row.role_id as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as Date,
  };
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  // Verify role exists
  const role = await db('roles').where({ id: input.roleId }).first();
  if (!role) {
    const err = new Error('Invalid role ID') as Error & { statusCode: number; code: string };
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const existing = await db('users').where({ login: input.login }).first();
  if (existing) {
    const err = new Error('Login already taken') as Error & { statusCode: number; code: string };
    err.statusCode = 409;
    err.code = 'LOGIN_ALREADY_EXISTS';
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const [row] = await db('users')
    .insert({
      login: input.login,
      password_hash: passwordHash,
      full_name: input.fullName,
      role_id: input.roleId,
      is_active: true,
    })
    .returning(['id', 'login', 'full_name', 'role_id', 'is_active', 'created_at']);

  // Join with roles to get role name
  const userWithRole = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', row.id)
    .select('users.*', 'roles.name as role')
    .first();

  return mapUser(userWithRole);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  if (input.roleId !== undefined) {
    const role = await db('roles').where({ id: input.roleId }).first();
    if (!role) {
      const err = new Error('Invalid role ID') as Error & { statusCode: number; code: string };
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  const existing = await db('users').where({ id }).first();
  if (!existing) {
    const err = new Error('User not found') as Error & { statusCode: number; code: string };
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const updates: Record<string, unknown> = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.roleId !== undefined) updates.role_id = input.roleId;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.password !== undefined) updates.password_hash = await bcrypt.hash(input.password, 10);

  await db('users').where({ id }).update(updates);

  // Join with roles to get role name
  const userWithRole = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .where('users.id', id)
    .select('users.*', 'roles.name as role')
    .first();

  return mapUser(userWithRole);
}

export async function listUsers(page: number, limit: number): Promise<{ users: UserRecord[]; total: number; page: number; limit: number }> {
  const offset = (page - 1) * limit;

  const [{ count }] = await db('users').count('id as count');
  const total = parseInt(count as string, 10);

  // Join with roles to get role name
  const rows = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .select('users.id', 'users.login', 'users.full_name', 'users.role_id', 'users.is_active', 'users.created_at', 'roles.name as role')
    .orderBy('users.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { users: rows.map(mapUser), total, page, limit };
}

export async function assignCourse(userId: string, courseId: string): Promise<void> {
  const course = await db('courses').where({ id: courseId }).first();
  if (!course) {
    const err = new Error('Course not found or not published') as Error & { statusCode: number; code: string };
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (!course.is_published) {
    const err = new Error('Course not found or not published') as Error & { statusCode: number; code: string };
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  await db('user_courses')
    .insert({ user_id: userId, course_id: courseId })
    .onConflict(['user_id', 'course_id'])
    .ignore();

  // Send FCM push notification to the user (fire-and-forget; errors are logged, not thrown)
  await sendNotificationToUser(userId, 'New course assigned!', course.title as string);
}

export async function deleteUser(id: string): Promise<void> {
  const existing = await db('users').where({ id }).first();
  if (!existing) {
    const err = new Error('User not found') as Error & { statusCode: number; code: string };
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  await db('users').where({ id }).delete();
}


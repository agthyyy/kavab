import bcrypt from 'bcryptjs';
import db from '../config/database';
import { sendNotificationToUser } from './notificationService';

export const VALID_ROLES = ['barista', 'waiter', 'manager', 'admin'] as const;
export type UserRole = typeof VALID_ROLES[number];

export interface CreateUserInput {
  login: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}

export interface UserRecord {
  id: string;
  login: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    login: row.login as string,
    fullName: row.full_name as string,
    role: row.role as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as Date,
  };
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  if (!VALID_ROLES.includes(input.role as UserRole)) {
    const err = new Error(`Role must be one of: ${VALID_ROLES.join(', ')}`) as Error & { statusCode: number; code: string };
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
      role: input.role,
      is_active: true,
    })
    .returning(['id', 'login', 'full_name', 'role', 'is_active', 'created_at']);

  return mapUser(row);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  if (input.role !== undefined && !VALID_ROLES.includes(input.role as UserRole)) {
    const err = new Error(`Role must be one of: ${VALID_ROLES.join(', ')}`) as Error & { statusCode: number; code: string };
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
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
  if (input.role !== undefined) updates.role = input.role;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.password !== undefined) updates.password_hash = await bcrypt.hash(input.password, 10);

  const [row] = await db('users')
    .where({ id })
    .update(updates)
    .returning(['id', 'login', 'full_name', 'role', 'is_active', 'created_at']);

  return mapUser(row);
}

export async function listUsers(page: number, limit: number): Promise<{ users: UserRecord[]; total: number; page: number; limit: number }> {
  const offset = (page - 1) * limit;

  const [{ count }] = await db('users').count('id as count');
  const total = parseInt(count as string, 10);

  const rows = await db('users')
    .select('id', 'login', 'full_name', 'role', 'is_active', 'created_at')
    .orderBy('created_at', 'desc')
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

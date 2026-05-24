import db from '../config/database';

interface RankingUser {
  id: string;
  fullName: string;
  role: string;
  completedLessons: number;
  totalAttempts: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface UserRanking {
  myRank: number;
  totalUsers: number;
  role: string;
  completedLessons: number;
  totalAttempts: number;
}

interface Leaderboard {
  myRanking: UserRanking;
  topUsers: RankingUser[];
}

export const rankingService = {
  /**
   * Получить рейтинг пользователя среди его профиля (роли)
   */
  async getUserRanking(userId: string): Promise<UserRanking> {
    // Получаем роль пользователя
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .where('users.id', userId)
      .first('roles.name as role', 'users.full_name');

    if (!user) {
      throw new Error('User not found');
    }

    // Получаем статистику пользователя
    const userStats = await this.getUserStats(userId);

    // Получаем рейтинг среди пользователей с той же ролью
    const rankQuery = await db.raw(`
      WITH user_stats AS (
        SELECT 
          u.id,
          r.name as role,
          COUNT(DISTINCT ulp.lesson_id) as completed_lessons,
          COALESCE(COUNT(uqa.id), 0) as total_attempts
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_lesson_progress ulp ON u.id = ulp.user_id
        LEFT JOIN user_quiz_attempts uqa ON u.id = uqa.user_id
        WHERE r.name = ? AND u.is_active = true
        GROUP BY u.id, r.name
      ),
      ranked_users AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (
            ORDER BY 
              completed_lessons DESC,
              total_attempts ASC,
              id
          ) as rank
        FROM user_stats
      )
      SELECT 
        rank,
        (SELECT COUNT(*) FROM user_stats) as total_users
      FROM ranked_users
      WHERE id = ?
    `, [user.role, userId]);

    const rankData = rankQuery.rows[0];

    return {
      myRank: parseInt(rankData?.rank || '0'),
      totalUsers: parseInt(rankData?.total_users || '0'),
      role: user.role,
      completedLessons: userStats.completedLessons,
      totalAttempts: userStats.totalAttempts,
    };
  },

  /**
   * Получить таблицу лидеров для профиля пользователя
   */
  async getLeaderboard(userId: string, limit: number = 10): Promise<Leaderboard> {
    // Получаем роль пользователя
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .where('users.id', userId)
      .first('roles.name as role');

    if (!user) {
      throw new Error('User not found');
    }

    // Получаем топ пользователей с той же ролью
    const topUsersQuery = await db.raw(`
      WITH user_stats AS (
        SELECT 
          u.id,
          u.full_name,
          r.name as role,
          COUNT(DISTINCT ulp.lesson_id) as completed_lessons,
          COALESCE(COUNT(uqa.id), 0) as total_attempts
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_lesson_progress ulp ON u.id = ulp.user_id
        LEFT JOIN user_quiz_attempts uqa ON u.id = uqa.user_id
        WHERE r.name = ? AND u.is_active = true
        GROUP BY u.id, u.full_name, r.name
      ),
      ranked_users AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (
            ORDER BY 
              completed_lessons DESC,
              total_attempts ASC,
              id
          ) as rank
        FROM user_stats
      )
      SELECT 
        id,
        full_name as "fullName",
        role,
        completed_lessons as "completedLessons",
        total_attempts as "totalAttempts",
        rank
      FROM ranked_users
      ORDER BY rank
      LIMIT ?
    `, [user.role, limit]);

    const topUsers: RankingUser[] = topUsersQuery.rows.map((row: any) => ({
      ...row,
      rank: parseInt(row.rank),
      completedLessons: parseInt(row.completedLessons),
      totalAttempts: parseInt(row.totalAttempts),
      isCurrentUser: row.id === userId,
    }));

    // Получаем рейтинг текущего пользователя
    const myRanking = await this.getUserRanking(userId);

    return {
      myRanking,
      topUsers,
    };
  },

  /**
   * Получить статистику пользователя
   */
  async getUserStats(userId: string): Promise<{ completedLessons: number; totalAttempts: number }> {
    const stats = await db.raw(`
      SELECT 
        COUNT(DISTINCT ulp.lesson_id) as completed_lessons,
        COALESCE(COUNT(uqa.id), 0) as total_attempts
      FROM users u
      LEFT JOIN user_lesson_progress ulp ON u.id = ulp.user_id
      LEFT JOIN user_quiz_attempts uqa ON u.id = uqa.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    const row = stats.rows[0] || { completed_lessons: 0, total_attempts: 0 };

    return {
      completedLessons: parseInt(row.completed_lessons),
      totalAttempts: parseInt(row.total_attempts),
    };
  },
};

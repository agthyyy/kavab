import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';

class UserProgressModel {
  static UserProgressEntity fromJson(Map<String, dynamic> json) {
    final achievementsJson =
        (json['achievements'] as List<dynamic>? ?? []);
    final achievements = achievementsJson
        .map((a) => _parseAchievement(a as Map<String, dynamic>))
        .toList();

    return UserProgressEntity(
      totalXp: json['total_xp'] as int? ?? 0,
      currentLevel: json['current_level'] as int? ?? 1,
      levelName: json['level_name'] as String? ?? 'Beginner',
      xpForNextLevel: json['xp_for_next_level'] as int? ?? 100,
      streakDays: json['streak_days'] as int? ?? 0,
      completedLessons: json['completed_lessons'] as int? ?? 0,
      completedQuizzes: json['completed_quizzes'] as int? ?? 0,
      courseCompletionPercent:
          json['course_completion_percent'] as int? ?? 0,
      achievements: achievements,
    );
  }

  static AchievementEntity _parseAchievement(Map<String, dynamic> a) =>
      AchievementEntity(
        id: a['id'] as String,
        name: a['name'] as String,
        description: a['description'] as String? ?? '',
        iconUrl: a['icon_url'] as String?,
        earnedAt: DateTime.parse(a['earned_at'] as String),
      );
}

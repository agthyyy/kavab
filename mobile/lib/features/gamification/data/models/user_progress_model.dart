import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';

class UserProgressModel {
  static UserProgressEntity fromJson(Map<String, dynamic> json) {
    final achievementsJson =
        (json['achievements'] as List<dynamic>? ?? []);
    final achievements = achievementsJson
        .map((a) => _parseAchievement(a as Map<String, dynamic>))
        .toList();

    return UserProgressEntity(
      totalXp: json['totalXp'] as int? ?? 0,
      currentLevel: json['currentLevel'] as int? ?? 1,
      levelName: json['levelName'] as String?,
      userName: json['userName'] as String?,
      xpForNextLevel: json['xpToNextLevel'] as int?,
      streakDays: json['streak'] as int? ?? 0,
      completedLessons: json['completedLessons'] as int? ?? 0,
      completedQuizzes: json['completedQuizzes'] as int? ?? 0,
      courseCompletionPercent:
          json['courseCompletionPercent'] as int? ?? 0,
      achievements: achievements,
    );
  }

  static AchievementEntity _parseAchievement(Map<String, dynamic> a) =>
      AchievementEntity(
        id: a['id'] as String,
        name: a['title'] as String? ?? a['name'] as String? ?? '',
        description: a['description'] as String? ?? '',
        icon: a['icon'] as String? ?? '🏆',
        rarity: a['rarity'] as String? ?? 'common',
        xpReward: a['xpReward'] as int? ?? 0,
        progressCurrent: a['progressCurrent'] as int? ?? 0,
        progressTotal: a['progressTotal'] as int? ?? 0,
        isSecret: a['isSecret'] as bool? ?? false,
        category: a['category'] as String? ?? 'general',
        earnedAt: a['earnedAt'] != null ? DateTime.parse(a['earnedAt'] as String) : null,
      );
}

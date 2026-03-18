import 'package:equatable/equatable.dart';

class AchievementEntity extends Equatable {
  final String id;
  final String name;
  final String description;
  final String? iconUrl;
  final DateTime earnedAt;

  const AchievementEntity({
    required this.id,
    required this.name,
    required this.description,
    this.iconUrl,
    required this.earnedAt,
  });

  @override
  List<Object?> get props => [id, name, description, iconUrl, earnedAt];
}

class UserProgressEntity extends Equatable {
  final int totalXp;
  final int currentLevel;
  final String levelName;
  final int xpForNextLevel;
  final int streakDays;
  final int completedLessons;
  final int completedQuizzes;
  final int courseCompletionPercent;
  final List<AchievementEntity> achievements;

  const UserProgressEntity({
    required this.totalXp,
    required this.currentLevel,
    required this.levelName,
    required this.xpForNextLevel,
    required this.streakDays,
    required this.completedLessons,
    required this.completedQuizzes,
    required this.courseCompletionPercent,
    required this.achievements,
  });

  @override
  List<Object> get props => [
        totalXp,
        currentLevel,
        levelName,
        xpForNextLevel,
        streakDays,
        completedLessons,
        completedQuizzes,
        courseCompletionPercent,
        achievements,
      ];
}

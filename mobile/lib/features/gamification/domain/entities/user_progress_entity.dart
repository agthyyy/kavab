import 'package:equatable/equatable.dart';

class AchievementEntity extends Equatable {
  final String id;
  final String name;
  final String description;
  final String icon;
  final String rarity;
  final int xpReward;
  final int progressCurrent;
  final int progressTotal;
  final bool isSecret;
  final String category;
  final DateTime? earnedAt;

  const AchievementEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.rarity,
    required this.xpReward,
    required this.progressCurrent,
    required this.progressTotal,
    required this.isSecret,
    required this.category,
    this.earnedAt,
  });

  bool get isEarned => earnedAt != null;
  double get progress => progressTotal > 0 ? progressCurrent / progressTotal : 0.0;

  @override
  List<Object?> get props => [id, name, description, icon, rarity, xpReward, progressCurrent, progressTotal, isSecret, category, earnedAt];
}

class UserProgressEntity extends Equatable {
  final int totalXp;
  final int currentLevel;
  final String? levelName;
  final String? userName;
  final int? xpForNextLevel;
  final int streakDays;
  final int completedLessons;
  final int completedQuizzes;
  final int courseCompletionPercent;
  final List<AchievementEntity> achievements;

  const UserProgressEntity({
    required this.totalXp,
    required this.currentLevel,
    this.levelName,
    this.userName,
    this.xpForNextLevel,
    required this.streakDays,
    required this.completedLessons,
    required this.completedQuizzes,
    required this.courseCompletionPercent,
    required this.achievements,
  });

  @override
  List<Object?> get props => [
        totalXp,
        currentLevel,
        levelName,
        userName,
        xpForNextLevel,
        streakDays,
        completedLessons,
        completedQuizzes,
        courseCompletionPercent,
        achievements,
      ];
}

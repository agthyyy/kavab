import 'package:equatable/equatable.dart';

class UserProgressSummary extends Equatable {
  final int totalXp;
  final String? levelName;
  final int? xpToNextLevel;
  final int streak;
  final int completedLessons;
  final int completedQuizzes;
  final int courseCompletionPercent;

  const UserProgressSummary({
    required this.totalXp,
    this.levelName,
    this.xpToNextLevel,
    required this.streak,
    required this.completedLessons,
    required this.completedQuizzes,
    required this.courseCompletionPercent,
  });

  @override
  List<Object?> get props => [
        totalXp,
        levelName,
        xpToNextLevel,
        streak,
        completedLessons,
        completedQuizzes,
        courseCompletionPercent,
      ];
}

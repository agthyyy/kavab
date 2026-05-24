import 'package:kavabanga/features/learning_tree/domain/entities/user_progress_summary.dart';

class UserProgressModel extends UserProgressSummary {
  const UserProgressModel({
    required super.totalXp,
    super.levelName,
    super.roleName,
    super.xpToNextLevel,
    required super.streak,
    required super.completedLessons,
    required super.completedQuizzes,
    required super.courseCompletionPercent,
  });

  factory UserProgressModel.fromJson(Map<String, dynamic> json) {
    return UserProgressModel(
      totalXp: (json['totalXp'] as num?)?.toInt() ?? 0,
      levelName: json['levelName'] as String?,
      roleName: json['roleName'] as String?,
      xpToNextLevel: (json['xpToNextLevel'] as num?)?.toInt(),
      streak: (json['streak'] as num?)?.toInt() ?? 0,
      completedLessons: (json['completedLessons'] as num?)?.toInt() ?? 0,
      completedQuizzes: (json['completedQuizzes'] as num?)?.toInt() ?? 0,
      courseCompletionPercent:
          (json['courseCompletionPercent'] as num?)?.toInt() ?? 0,
    );
  }
}

part of 'gamification_cubit.dart';

abstract class GamificationState extends Equatable {
  const GamificationState();
  @override
  List<Object?> get props => [];
}

class GamificationInitial extends GamificationState {}

class GamificationLoading extends GamificationState {}

class GamificationLoaded extends GamificationState {
  final UserProgressEntity progress;
  const GamificationLoaded(this.progress);
  @override
  List<Object?> get props => [progress];
}

class GamificationLevelUp extends GamificationState {
  final UserProgressEntity progress;
  final int newLevel;
  final String levelName;
  const GamificationLevelUp({
    required this.progress,
    required this.newLevel,
    required this.levelName,
  });
  @override
  List<Object?> get props => [progress, newLevel, levelName];
}

class GamificationAchievementUnlocked extends GamificationState {
  final UserProgressEntity progress;
  final AchievementEntity achievement;
  const GamificationAchievementUnlocked({
    required this.progress,
    required this.achievement,
  });
  @override
  List<Object?> get props => [progress, achievement];
}

class GamificationError extends GamificationState {
  final String message;
  const GamificationError(this.message);
  @override
  List<Object?> get props => [message];
}

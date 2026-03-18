import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';
import 'package:kavabanga/features/gamification/domain/repositories/gamification_repository.dart';

part 'gamification_state.dart';

class GamificationCubit extends Cubit<GamificationState> {
  final GamificationRepository repository;

  GamificationCubit({required this.repository}) : super(GamificationInitial());

  Future<void> loadProgress() async {
    emit(GamificationLoading());
    final result = await repository.getUserProgress();
    result.fold(
      (f) => emit(GamificationError(f.message)),
      (progress) => emit(GamificationLoaded(progress)),
    );
  }

  void notifyLevelUp(int newLevel, String levelName) {
    final s = state;
    if (s is GamificationLoaded) {
      emit(GamificationLevelUp(progress: s.progress, newLevel: newLevel, levelName: levelName));
    }
  }

  void notifyAchievement(AchievementEntity achievement) {
    final s = state;
    if (s is GamificationLoaded) {
      emit(GamificationAchievementUnlocked(progress: s.progress, achievement: achievement));
    }
  }
}

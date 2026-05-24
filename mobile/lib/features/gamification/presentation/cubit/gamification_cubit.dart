import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:kavabanga/features/gamification/data/datasources/gamification_remote_datasource.dart';

part 'gamification_state.dart';

class GamificationCubit extends Cubit<GamificationState> {
  final GamificationRemoteDataSource dataSource;

  GamificationCubit({required this.dataSource}) : super(GamificationInitial());

  Future<void> loadGamificationData() async {
    emit(GamificationLoading());
    try {
      final overview = await dataSource.getGamificationOverview();
      emit(GamificationLoaded(
        dailyQuests: overview['dailyQuests']['quests'] ?? [],
        completedQuestsCount: overview['dailyQuests']['completed'] ?? 0,
        totalQuestsCount: overview['dailyQuests']['total'] ?? 0,
        titles: overview['titles']['active'] != null ? [overview['titles']['active']] : [],
        activeTitle: overview['titles']['active'],
        unlockedTitlesCount: overview['titles']['unlocked'] ?? 0,
        totalTitlesCount: overview['titles']['total'] ?? 0,
        energy: overview['energy'],
        cardsCount: overview['collection']['cards'] ?? 0,
        totalCardsCount: overview['collection']['totalCards'] ?? 0,
        rareCardsCount: overview['collection']['rareCards'] ?? 0,
      ));
    } catch (e) {
      emit(GamificationError(e.toString()));
    }
  }

  Future<void> setActiveTitle(String titleId) async {
    try {
      await dataSource.setActiveTitle(titleId);
      await loadGamificationData(); // Refresh data
    } catch (e) {
      emit(GamificationError(e.toString()));
    }
  }
}

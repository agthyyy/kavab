part of 'gamification_cubit.dart';

abstract class GamificationState extends Equatable {
  const GamificationState();
  @override
  List<Object?> get props => [];
}

class GamificationInitial extends GamificationState {}

class GamificationLoading extends GamificationState {}

class GamificationLoaded extends GamificationState {
  final List<dynamic> dailyQuests;
  final int completedQuestsCount;
  final int totalQuestsCount;
  final List<dynamic> titles;
  final dynamic activeTitle;
  final int unlockedTitlesCount;
  final int totalTitlesCount;
  final Map<String, dynamic> energy;
  final int cardsCount;
  final int totalCardsCount;
  final int rareCardsCount;

  const GamificationLoaded({
    required this.dailyQuests,
    required this.completedQuestsCount,
    required this.totalQuestsCount,
    required this.titles,
    required this.activeTitle,
    required this.unlockedTitlesCount,
    required this.totalTitlesCount,
    required this.energy,
    required this.cardsCount,
    required this.totalCardsCount,
    required this.rareCardsCount,
  });

  @override
  List<Object?> get props => [
    dailyQuests,
    completedQuestsCount,
    totalQuestsCount,
    titles,
    activeTitle,
    unlockedTitlesCount,
    totalTitlesCount,
    energy,
    cardsCount,
    totalCardsCount,
    rareCardsCount,
  ];
}

class GamificationError extends GamificationState {
  final String message;
  const GamificationError(this.message);
  @override
  List<Object?> get props => [message];
}

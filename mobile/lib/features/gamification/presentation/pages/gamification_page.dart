import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/features/gamification/presentation/cubit/gamification_cubit.dart';
import 'package:kavabanga/features/gamification/presentation/widgets/daily_quests_section.dart';
import 'package:kavabanga/features/gamification/presentation/widgets/titles_section.dart';
import 'package:kavabanga/features/gamification/presentation/widgets/energy_section.dart';
import 'package:kavabanga/features/gamification/presentation/widgets/collection_section.dart';
import 'package:kavabanga/injection_container.dart';

class GamificationPage extends StatelessWidget {
  const GamificationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<GamificationCubit>(
      create: (_) => sl<GamificationCubit>()..loadGamificationData(),
      child: const _GamificationView(),
    );
  }
}

class _GamificationView extends StatelessWidget {
  const _GamificationView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C1810),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Геймификация',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded,
                color: Colors.white, size: 16),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocBuilder<GamificationCubit, GamificationState>(
        builder: (context, state) {
          if (state is GamificationLoading || state is GamificationInitial) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFFC8860A)),
            );
          }

          if (state is GamificationError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(state.message,
                      style: TextStyle(color: Colors.grey[600])),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<GamificationCubit>().loadGamificationData(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC8860A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Повторить'),
                  ),
                ],
              ),
            );
          }

          if (state is GamificationLoaded) {
            return RefreshIndicator(
              color: const Color(0xFFC8860A),
              onRefresh: () => context.read<GamificationCubit>().loadGamificationData(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Energy Section
                    EnergySection(energy: state.energy),
                    const SizedBox(height: 20),

                    // Daily Quests Section
                    DailyQuestsSection(
                      quests: state.dailyQuests,
                      completedCount: state.completedQuestsCount,
                    ),
                    const SizedBox(height: 20),

                    // Titles Section
                    TitlesSection(
                      titles: state.titles,
                      activeTitle: state.activeTitle,
                      unlockedCount: state.unlockedTitlesCount,
                    ),
                    const SizedBox(height: 20),

                    // Collection Section
                    CollectionSection(
                      cardsCount: state.cardsCount,
                      totalCards: state.totalCardsCount,
                      rareCards: state.rareCardsCount,
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
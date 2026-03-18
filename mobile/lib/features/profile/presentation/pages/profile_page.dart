import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_cubit.dart';
import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';
import 'package:kavabanga/features/gamification/presentation/cubit/gamification_cubit.dart';
import 'package:kavabanga/injection_container.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<GamificationCubit>(
      create: (_) => sl<GamificationCubit>()..loadProgress(),
      child: const _ProfileView(),
    );
  }
}

class _ProfileView extends StatelessWidget {
  const _ProfileView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C1810),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Profile',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.logout_rounded,
                    color: Colors.white, size: 18),
              ),
              onPressed: () => context.read<AuthCubit>().logout(),
            ),
          ),
        ],
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
                        context.read<GamificationCubit>().loadProgress(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC8860A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final progress = switch (state) {
            GamificationLoaded(:final progress) => progress,
            GamificationLevelUp(:final progress) => progress,
            GamificationAchievementUnlocked(:final progress) => progress,
            _ => null,
          };

          if (progress == null) return const SizedBox.shrink();

          return RefreshIndicator(
            color: const Color(0xFFC8860A),
            onRefresh: () => context.read<GamificationCubit>().loadProgress(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _HeroCard(progress: progress),
                  const SizedBox(height: 16),
                  _StatsRow(progress: progress),
                  const SizedBox(height: 20),
                  _AchievementsSection(achievements: progress.achievements),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final UserProgressEntity progress;
  const _HeroCard({required this.progress});

  @override
  Widget build(BuildContext context) {
    final xpPercent = progress.xpForNextLevel > 0
        ? (progress.totalXp / progress.xpForNextLevel).clamp(0.0, 1.0)
        : 1.0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2C1810), Color(0xFF4A2C2A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2C1810).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFFC8860A),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFC8860A).withOpacity(0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.person_rounded,
                size: 40, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            progress.levelName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFC8860A).withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: const Color(0xFFC8860A).withOpacity(0.4)),
            ),
            child: Text(
              'Level ${progress.currentLevel}',
              style: const TextStyle(
                color: Color(0xFFC8860A),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${progress.totalXp} XP',
                style: const TextStyle(
                    color: Colors.white70, fontSize: 13),
              ),
              Text(
                '${progress.xpForNextLevel} XP',
                style: const TextStyle(
                    color: Colors.white38, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: xpPercent,
              minHeight: 8,
              backgroundColor: Colors.white12,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Color(0xFFC8860A)),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final UserProgressEntity progress;
  const _StatsRow({required this.progress});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatCard(
          icon: Icons.local_fire_department_rounded,
          color: const Color(0xFFFF6B35),
          value: '${progress.streakDays}',
          label: 'Day streak',
        ),
        const SizedBox(width: 10),
        _StatCard(
          icon: Icons.menu_book_rounded,
          color: const Color(0xFF4A2C2A),
          value: '${progress.completedLessons}',
          label: 'Lessons done',
        ),
        const SizedBox(width: 10),
        _StatCard(
          icon: Icons.pie_chart_rounded,
          color: const Color(0xFFC8860A),
          value: '${progress.courseCompletionPercent}%',
          label: 'Complete',
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }
}

class _AchievementsSection extends StatelessWidget {
  final List<AchievementEntity> achievements;
  const _AchievementsSection({required this.achievements});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.emoji_events_rounded,
                color: Color(0xFFC8860A), size: 22),
            const SizedBox(width: 8),
            const Text(
              'Achievements',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
            const Spacer(),
            if (achievements.isNotEmpty)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFC8860A).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${achievements.length}',
                  style: const TextStyle(
                    color: Color(0xFFC8860A),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        if (achievements.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(Icons.emoji_events_outlined,
                    size: 40, color: Colors.grey[300]),
                const SizedBox(height: 8),
                Text(
                  'No achievements yet',
                  style: TextStyle(color: Colors.grey[500]),
                ),
              ],
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: achievements.length,
            itemBuilder: (context, i) =>
                _AchievementTile(achievement: achievements[i]),
          ),
      ],
    );
  }
}

class _AchievementTile extends StatelessWidget {
  final AchievementEntity achievement;
  const _AchievementTile({required this.achievement});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.emoji_events_rounded,
                  color: Color(0xFFC8860A)),
              const SizedBox(width: 8),
              Expanded(child: Text(achievement.name)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(achievement.description),
              const SizedBox(height: 12),
              Text(
                'Earned: ${achievement.earnedAt.day}.${achievement.earnedAt.month}.${achievement.earnedAt.year}',
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK',
                  style: TextStyle(color: Color(0xFFC8860A))),
            ),
          ],
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFC8860A).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.emoji_events_rounded,
                  color: Color(0xFFC8860A), size: 24),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                achievement.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

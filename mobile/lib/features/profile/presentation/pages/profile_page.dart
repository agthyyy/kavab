import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_cubit.dart';
import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';
import 'package:kavabanga/features/gamification/data/models/user_progress_model.dart';
import 'package:kavabanga/features/profile/presentation/widgets/ranking_section.dart';
import 'package:kavabanga/injection_container.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  UserProgressEntity? _progress;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProgress();
  }

  Future<void> _loadProgress() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apiClient = sl<ApiClient>();
      final progressRes = await apiClient.get(ApiConstants.progressMe);
      final achievementsRes = await apiClient.get(ApiConstants.achievements);

      final progressData = progressRes.data as Map<String, dynamic>;
      progressData['achievements'] = (achievementsRes.data as List<dynamic>?) ?? [];

      setState(() {
        _progress = UserProgressModel.fromJson(progressData);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C1810),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Профиль',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
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
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.logout_rounded,
                    color: Colors.white, size: 18),
              ),
              onPressed: () => context.read<AuthCubit>().logout(),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFC8860A)),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline_rounded, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(_error!, style: TextStyle(color: Colors.grey[600])),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadProgress,
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
                )
              : RefreshIndicator(
                  color: const Color(0xFFC8860A),
                  onRefresh: _loadProgress,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _HeroCard(progress: _progress!),
                        const SizedBox(height: 16),
                        _StatsRow(progress: _progress!),
                        const SizedBox(height: 24),
                        _RankingLoader(),
                        const SizedBox(height: 24),
                        _AchievementsSection(achievements: _progress!.achievements),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final UserProgressEntity progress;
  const _HeroCard({required this.progress});

  @override
  Widget build(BuildContext context) {
    final xpForNext = progress.xpForNextLevel ?? 100;
    final xpPercent = xpForNext > 0
        ? (progress.totalXp / xpForNext).clamp(0.0, 1.0)
        : 1.0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF23120B), // Эспрессо
            Color(0xFF3C2012), // Теплый какао
            Color(0xFF4E2C1B), // Шоколад
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF23120B).withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Аватар
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFC8860A), Color(0xFFE2B275)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFC8860A).withOpacity(0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(Icons.person_rounded,
                size: 44, color: Colors.white),
          ),
          const SizedBox(height: 16),
          
          // Имя пользователя
          Text(
            progress.userName ?? 'Пользователь',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 6),
          
          // Бейдж уровня
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFC8860A).withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: const Color(0xFFC8860A).withOpacity(0.4), width: 1.5),
            ),
            child: Text(
              'Уровень ${progress.currentLevel}',
              style: GoogleFonts.outfit(
                color: const Color(0xFFE2B275),
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          // XP Прогрессбар
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${progress.totalXp} XP',
                style: GoogleFonts.outfit(
                    color: Colors.white.withOpacity(0.9), fontSize: 13, fontWeight: FontWeight.w600),
              ),
              Text(
                '${xpForNext} XP до уровня ${progress.currentLevel + 1}',
                style: GoogleFonts.inter(
                    color: Colors.white.withOpacity(0.4), fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Stack(
            children: [
              Container(
                height: 8,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              FractionallySizedBox(
                widthFactor: xpPercent,
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFC8860A), Color(0xFFE2B275)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
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
          color: const Color(0xFFFF7A45),
          value: '${progress.streakDays}',
          label: 'Дней подряд',
        ),
        const SizedBox(width: 12),
        _StatCard(
          icon: Icons.auto_stories_rounded,
          color: const Color(0xFF8B5E3C),
          value: '${progress.completedLessons}',
          label: 'Уроков',
        ),
        const SizedBox(width: 12),
        _StatCard(
          icon: Icons.donut_large_rounded,
          color: const Color(0xFFC8860A),
          value: '${progress.courseCompletionPercent}%',
          label: 'Завершено',
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
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF7A6A5C), fontWeight: FontWeight.w500),
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

  Color _getRarityColor(String rarity) {
    switch (rarity) {
      case 'common':
        return Colors.grey.shade600;
      case 'rare':
        return const Color(0xFF1E88E5);
      case 'epic':
        return const Color(0xFF8E24AA);
      case 'legendary':
        return const Color(0xFFC8860A);
      default:
        return Colors.grey;
    }
  }

  String _getRarityName(String rarity) {
    switch (rarity) {
      case 'common':
        return 'Обычное';
      case 'rare':
        return 'Редкое';
      case 'epic':
        return 'Эпическое';
      case 'legendary':
        return 'Легендарное';
      default:
        return rarity;
    }
  }

  @override
  Widget build(BuildContext context) {
    final earnedAchievements = achievements.where((a) => a.isEarned).toList();
    final inProgressAchievements = achievements.where((a) => !a.isEarned && a.progress > 0).toList();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.emoji_events_rounded,
                color: Color(0xFFC8860A), size: 24),
            const SizedBox(width: 8),
            Text(
              'Достижения',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF2C1810),
              ),
            ),
            const Spacer(),
            if (achievements.isNotEmpty)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFC8860A).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${earnedAchievements.length}/${achievements.length}',
                  style: GoogleFonts.outfit(
                    color: const Color(0xFFC8860A),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (achievements.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.black.withOpacity(0.04)),
            ),
            child: Column(
              children: [
                Icon(Icons.emoji_events_outlined,
                    size: 40, color: Colors.grey[300]),
                const SizedBox(height: 8),
                Text(
                  'Пока нет достижений',
                  style: TextStyle(color: Colors.grey[500]),
                ),
              ],
            ),
          )
        else ...[
          // Earned achievements
          if (earnedAchievements.isNotEmpty) ...[
            Text(
              'ПОЛУЧЕНО',
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF7A6A5C),
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 160,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: earnedAchievements.length,
                itemBuilder: (context, i) =>
                    _buildAchievementCard(earnedAchievements[i], true),
              ),
            ),
            const SizedBox(height: 20),
          ],
          // In progress achievements
          if (inProgressAchievements.isNotEmpty) ...[
            Text(
              'В ПРОЦЕССЕ',
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF7A6A5C),
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            ...inProgressAchievements.map((a) => _buildProgressAchievement(a)),
          ],
        ],
      ],
    );
  }

  Widget _buildAchievementCard(AchievementEntity achievement, bool earned) {
    final rarityColor = _getRarityColor(achievement.rarity);

    return Container(
      width: 120,
      margin: const EdgeInsets.only(right: 12, bottom: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: earned ? rarityColor.withOpacity(0.2) : Colors.grey[300]!,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: earned ? rarityColor.withOpacity(0.04) : Colors.transparent,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: rarityColor.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Text(
                achievement.icon,
                style: const TextStyle(fontSize: 28),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              achievement.name,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF2C1810),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: rarityColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _getRarityName(achievement.rarity),
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: rarityColor,
                ),
              ),
            ),
            if (earned) ...[
              const SizedBox(height: 4),
              Text(
                '+${achievement.xpReward} XP',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFC8860A),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProgressAchievement(AchievementEntity achievement) {
    final rarityColor = _getRarityColor(achievement.rarity);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.01),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: rarityColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                achievement.icon,
                style: const TextStyle(fontSize: 26),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  achievement.name,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF2C1810),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  achievement.description,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: const Color(0xFF7A6A5C),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Stack(
                        children: [
                          Container(
                            height: 6,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                          FractionallySizedBox(
                            widthFactor: achievement.progress.clamp(0.0, 1.0),
                            child: Container(
                              height: 6,
                              decoration: BoxDecoration(
                                color: rarityColor,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${achievement.progressCurrent}/${achievement.progressTotal}',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: rarityColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RankingLoader extends StatefulWidget {
  const _RankingLoader();

  @override
  State<_RankingLoader> createState() => _RankingLoaderState();
}

class _RankingLoaderState extends State<_RankingLoader> {
  RankingData? _ranking;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRanking();
  }

  Future<void> _loadRanking() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apiClient = sl<ApiClient>();
      final response = await apiClient.get(ApiConstants.rankingLeaderboard);
      setState(() {
        _ranking = RankingData.fromJson(response.data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.black.withOpacity(0.04)),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: Color(0xFFC8860A)),
        ),
      );
    }

    if (_error != null || _ranking == null) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.black.withOpacity(0.04)),
        ),
        child: Column(
          children: [
            Icon(Icons.error_outline_rounded, size: 40, color: Colors.grey[400]),
            const SizedBox(height: 8),
            Text(
              'Не удалось загрузить рейтинг',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _loadRanking,
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

    return RankingSection(ranking: _ranking!);
  }
}

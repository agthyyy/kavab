import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C1810),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Профиль',
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
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFC8860A)),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
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
                        const SizedBox(height: 20),
                        _RankingLoader(),
                        const SizedBox(height: 20),
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
            progress.userName ?? 'Пользователь',
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
                '${xpForNext} XP',
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
          label: 'Дней подряд',
        ),
        const SizedBox(width: 10),
        _StatCard(
          icon: Icons.menu_book_rounded,
          color: const Color(0xFF4A2C2A),
          value: '${progress.completedLessons}',
          label: 'Уроков пройдено',
        ),
        const SizedBox(width: 10),
        _StatCard(
          icon: Icons.pie_chart_rounded,
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

  Color _getRarityColor(String rarity) {
    switch (rarity) {
      case 'common':
        return Colors.grey;
      case 'rare':
        return const Color(0xFF4A90E2);
      case 'epic':
        return const Color(0xFF9B59B6);
      case 'legendary':
        return const Color(0xFFD4AF37);
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.emoji_events_rounded,
                color: Color(0xFFC8860A), size: 22),
            const SizedBox(width: 8),
            const Text(
              'Достижения',
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
                  '${earnedAchievements.length}/${achievements.length}',
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
                  'Пока нет достижений',
                  style: TextStyle(color: Colors.grey[500]),
                ),
              ],
            ),
          )
        else ...[
          // Earned achievements
          if (earnedAchievements.isNotEmpty) ...[
            const Text(
              'Получено',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF666666),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 130, // Уменьшил высоту
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: earnedAchievements.length,
                itemBuilder: (context, i) =>
                    _buildAchievementCard(earnedAchievements[i], true),
              ),
            ),
            const SizedBox(height: 16),
          ],
          // In progress achievements
          if (inProgressAchievements.isNotEmpty) ...[
            const Text(
              'В процессе',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF666666),
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
      width: 110, // Уменьшил ширину
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        gradient: earned
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  rarityColor.withOpacity(0.1),
                  rarityColor.withOpacity(0.05),
                ],
              )
            : null,
        color: earned ? null : Colors.grey[100],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: earned ? rarityColor.withOpacity(0.3) : Colors.grey[300]!,
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              achievement.icon,
              style: TextStyle(
                fontSize: earned ? 28 : 22,
                color: earned ? null : Colors.grey[400],
              ),
            ),
            const SizedBox(height: 4),
            Flexible(
              child: Text(
                achievement.name,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: earned ? const Color(0xFF1A1A2E) : Colors.grey[500],
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 3),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: rarityColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _getRarityName(achievement.rarity),
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w500,
                  color: rarityColor,
                ),
              ),
            ),
            if (earned) ...[
              const SizedBox(height: 2),
              Text(
                '+${achievement.xpReward} XP',
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFC8860A),
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
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: rarityColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                achievement.icon,
                style: const TextStyle(fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  achievement.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  achievement.description,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: achievement.progress,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation(rarityColor),
                          minHeight: 5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${achievement.progressCurrent}/${achievement.progressTotal}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
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
          borderRadius: BorderRadius.circular(16),
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
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(Icons.error_outline, size: 40, color: Colors.grey[400]),
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

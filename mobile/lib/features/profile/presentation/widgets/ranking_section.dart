import 'package:flutter/material.dart';

class RankingData {
  final int myRank;
  final int totalUsers;
  final String role;
  final int completedLessons;
  final int totalAttempts;
  final List<RankingUser> topUsers;

  RankingData({
    required this.myRank,
    required this.totalUsers,
    required this.role,
    required this.completedLessons,
    required this.totalAttempts,
    required this.topUsers,
  });

  factory RankingData.fromJson(Map<String, dynamic> json) {
    return RankingData(
      myRank: json['myRanking']['myRank'] ?? 0,
      totalUsers: json['myRanking']['totalUsers'] ?? 0,
      role: json['myRanking']['role'] ?? '',
      completedLessons: json['myRanking']['completedLessons'] ?? 0,
      totalAttempts: json['myRanking']['totalAttempts'] ?? 0,
      topUsers: (json['topUsers'] as List?)
              ?.map((u) => RankingUser.fromJson(u))
              .toList() ??
          [],
    );
  }
}

class RankingUser {
  final String id;
  final String fullName;
  final String role;
  final int completedLessons;
  final int totalAttempts;
  final int rank;
  final bool isCurrentUser;

  RankingUser({
    required this.id,
    required this.fullName,
    required this.role,
    required this.completedLessons,
    required this.totalAttempts,
    required this.rank,
    this.isCurrentUser = false,
  });

  factory RankingUser.fromJson(Map<String, dynamic> json) {
    return RankingUser(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      role: json['role'] ?? '',
      completedLessons: json['completedLessons'] ?? 0,
      totalAttempts: json['totalAttempts'] ?? 0,
      rank: json['rank'] ?? 0,
      isCurrentUser: json['isCurrentUser'] ?? false,
    );
  }
}

class RankingSection extends StatelessWidget {
  final RankingData ranking;

  const RankingSection({super.key, required this.ranking});

  String _getRoleNameRu(String role) {
    switch (role) {
      case 'barista':
        return 'Бариста';
      case 'waiter':
        return 'Официант';
      case 'manager':
        return 'Менеджер';
      case 'admin':
        return 'Администратор';
      default:
        return role;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.leaderboard_rounded,
                color: Color(0xFFC8860A), size: 22),
            const SizedBox(width: 8),
            const Text(
              'Рейтинг',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A1A1A),
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFC8860A).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _getRoleNameRu(ranking.role),
                style: const TextStyle(
                  color: Color(0xFFC8860A),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        // Моя позиция
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2C1810), Color(0xFF4A2C2A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2C1810).withOpacity(0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFC8860A),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    '#${ranking.myRank}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Ваша позиция',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'из ${ranking.totalUsers} сотрудников',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${ranking.completedLessons}',
                    style: const TextStyle(
                      color: Color(0xFFC8860A),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'уроков',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Топ пользователей
        Container(
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
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.emoji_events_rounded,
                        color: Color(0xFFC8860A), size: 18),
                    const SizedBox(width: 6),
                    const Text(
                      'Лучшие сотрудники',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: ranking.topUsers.length,
                separatorBuilder: (_, __) => const Divider(height: 1, indent: 16),
                itemBuilder: (context, index) {
                  final user = ranking.topUsers[index];
                  return _LeaderboardTile(user: user);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LeaderboardTile extends StatelessWidget {
  final RankingUser user;

  const _LeaderboardTile({required this.user});

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return const Color(0xFFFFD700); // Gold
      case 2:
        return const Color(0xFFC0C0C0); // Silver
      case 3:
        return const Color(0xFFCD7F32); // Bronze
      default:
        return Colors.grey.shade400;
    }
  }

  IconData _getRankIcon(int rank) {
    if (rank <= 3) return Icons.emoji_events_rounded;
    return Icons.person_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: user.isCurrentUser
          ? const Color(0xFFC8860A).withOpacity(0.05)
          : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _getRankColor(user.rank).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: user.rank <= 3
                  ? Icon(_getRankIcon(user.rank),
                      color: _getRankColor(user.rank), size: 18)
                  : Text(
                      '${user.rank}',
                      style: TextStyle(
                        color: _getRankColor(user.rank),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.fullName,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: user.isCurrentUser
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: const Color(0xFF1A1A1A),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (user.isCurrentUser) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFC8860A),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Вы',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${user.completedLessons} уроков • ${user.totalAttempts} попыток',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

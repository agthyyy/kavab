import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class DailyQuestsSection extends StatelessWidget {
  final List<dynamic> quests;
  final int completedCount;

  const DailyQuestsSection({
    super.key,
    required this.quests,
    required this.completedCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFC8860A).withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.assignment_rounded,
                  color: Color(0xFFC8860A),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Задания дня',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF2C1810),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: completedCount == quests.length
                      ? const Color(0xFF2E7D32).withOpacity(0.08)
                      : const Color(0xFFC8860A).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  '$completedCount/${quests.length}',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: completedCount == quests.length
                        ? const Color(0xFF2E7D32)
                        : const Color(0xFFC8860A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (quests.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(color: Color(0xFFC8860A)),
              ),
            )
          else
            ...quests.map((quest) => _buildQuestItem(quest)).toList(),
        ],
      ),
    );
  }

  Widget _buildQuestItem(dynamic quest) {
    final isCompleted = quest['isCompleted'] ?? false;
    final currentProgress = quest['currentProgress'] ?? 0;
    final targetValue = quest['targetValue'] ?? 1;
    final progress = targetValue > 0 ? currentProgress / targetValue : 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCompleted 
            ? const Color(0xFF2E7D32).withOpacity(0.03)
            : const Color(0xFFFAF6F2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isCompleted 
              ? const Color(0xFF2E7D32).withOpacity(0.15)
              : Colors.transparent,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Круглый бейдж иконки задания
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isCompleted 
                  ? const Color(0xFF2E7D32).withOpacity(0.08)
                  : const Color(0xFFC8860A).withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getQuestIcon(quest['questType']),
              color: isCompleted 
                  ? const Color(0xFF2E7D32)
                  : const Color(0xFFC8860A),
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  quest['title'] ?? 'Задание',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isCompleted 
                        ? const Color(0xFF2E7D32)
                        : const Color(0xFF2C1810),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  quest['description'] ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF7A6A5C),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Stack(
                        children: [
                          Container(
                            height: 6,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                          FractionallySizedBox(
                            widthFactor: progress.clamp(0.0, 1.0),
                            child: Container(
                              height: 6,
                              decoration: BoxDecoration(
                                color: isCompleted 
                                    ? const Color(0xFF2E7D32)
                                    : const Color(0xFFC8860A),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$currentProgress/$targetValue',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF7A6A5C),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          if (isCompleted)
            Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Color(0xFF2E7D32),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_rounded,
                color: Colors.white,
                size: 14,
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFC8860A).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '+${quest['xpReward'] ?? 0} XP',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFC8860A),
                ),
              ),
            ),
        ],
      ),
    );
  }

  IconData _getQuestIcon(String? questType) {
    switch (questType) {
      case 'complete_lessons':
        return Icons.auto_stories_rounded;
      case 'perfect_quiz':
        return Icons.verified_rounded;
      case 'pass_quizzes':
        return Icons.quiz_rounded;
      case 'earn_xp':
        return Icons.stars_rounded;
      case 'login_streak':
        return Icons.local_fire_department_rounded;
      default:
        return Icons.assignment_turned_in_rounded;
    }
  }
}
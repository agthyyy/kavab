import 'package:flutter/material.dart';

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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
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
                  color: const Color(0xFFC8860A).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.assignment_outlined,
                  color: Color(0xFFC8860A),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Ежедневные задания',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C1810),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: completedCount == quests.length
                      ? Colors.green.withOpacity(0.1)
                      : const Color(0xFFC8860A).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$completedCount/${quests.length}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: completedCount == quests.length
                        ? Colors.green[700]
                        : const Color(0xFFC8860A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (quests.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Text(
                  'Задания на сегодня загружаются...',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                ),
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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCompleted 
            ? Colors.green.withOpacity(0.05)
            : const Color(0xFFF5F0EB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted 
              ? Colors.green.withOpacity(0.2)
              : Colors.transparent,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isCompleted 
                  ? Colors.green.withOpacity(0.1)
                  : const Color(0xFFC8860A).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getQuestIcon(quest['questType']),
              color: isCompleted 
                  ? Colors.green[700]
                  : const Color(0xFFC8860A),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  quest['title'] ?? 'Задание',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isCompleted 
                        ? Colors.green[700]
                        : const Color(0xFF2C1810),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  quest['description'] ?? '',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: LinearProgressIndicator(
                        value: progress.clamp(0.0, 1.0),
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isCompleted 
                              ? Colors.green
                              : const Color(0xFFC8860A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$currentProgress/$targetValue',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (isCompleted)
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.green,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.check,
                color: Colors.white,
                size: 16,
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFC8860A).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '+${quest['xpReward'] ?? 0} XP',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFC8860A),
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
        return Icons.school_outlined;
      case 'pass_quizzes':
        return Icons.quiz_outlined;
      case 'earn_xp':
        return Icons.star_outline;
      case 'login_streak':
        return Icons.calendar_today_outlined;
      default:
        return Icons.assignment_outlined;
    }
  }
}
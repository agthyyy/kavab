import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/user_progress_summary.dart';

class ProgressHeader extends StatelessWidget {
  final UserProgressSummary progress;

  const ProgressHeader({super.key, required this.progress});

  @override
  Widget build(BuildContext context) {
    final xpToNext = progress.xpToNextLevel;
    final roleName = progress.roleName ?? 'Сотрудник';
    final levelName = progress.levelName ?? 'Новичок';

    double xpRatio = 0.0;
    if (xpToNext != null && xpToNext > 0) {
      final total = progress.totalXp + xpToNext;
      xpRatio = total > 0 ? progress.totalXp / total : 0.0;
    } else if (xpToNext == 0) {
      xpRatio = 1.0;
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF23120B), // Глубокий кофейный
            Color(0xFF3C2012), // Теплый какао
            Color(0xFF4E2C1B), // Светлый шоколад
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF23120B).withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFC8860A), Color(0xFFE2B275)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFC8860A).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.stars_rounded, color: Colors.white, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      roleName,
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              _StreakBadge(streak: progress.streak),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${progress.totalXp}',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 38,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                'XP',
                style: GoogleFonts.outfit(
                  color: const Color(0xFFE2B275),
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    levelName,
                    style: GoogleFonts.outfit(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (xpToNext != null && xpToNext > 0) ...[
                    const SizedBox(height: 2),
                    Text(
                      'до след. уровня: $xpToNext XP',
                      style: GoogleFonts.inter(
                        color: Colors.white.withOpacity(0.5),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
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
                widthFactor: xpRatio.clamp(0.0, 1.0),
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFC8860A), Color(0xFFE2B275)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFC8860A).withOpacity(0.4),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
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

class _StreakBadge extends StatelessWidget {
  final int streak;

  const _StreakBadge({required this.streak});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.12), width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔥', style: TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Text(
            '$streak',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

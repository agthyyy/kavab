import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class EnergySection extends StatelessWidget {
  final Map<String, dynamic> energy;

  const EnergySection({
    super.key,
    required this.energy,
  });

  @override
  Widget build(BuildContext context) {
    final current = energy['current'] ?? 0;
    final max = energy['max'] ?? 100;
    final regenRate = energy['regenRate'] ?? 10;
    final progress = max > 0 ? current / max : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF8B5E3C), // Насыщенный цвет зёрен
            Color(0xFFC8860A), // Кремовый золотой
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFC8860A).withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.bolt_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Кофейный заряд',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '$current/$max',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Энергетическая шкала
          Stack(
            children: [
              Container(
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: progress.clamp(0.0, 1.0),
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withOpacity(0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          Row(
            children: [
              Icon(
                Icons.autorenew_rounded,
                color: Colors.white.withOpacity(0.85),
                size: 16,
              ),
              const SizedBox(width: 6),
              Text(
                'Восстановление: $regenRate энергии/час',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.85),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          
          if (current < max) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(
                  Icons.alarm_rounded,
                  color: Colors.white.withOpacity(0.85),
                  size: 16,
                ),
                const SizedBox(width: 6),
                Text(
                  _getTimeToFullEnergy(current, max, regenRate),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.85),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Подсказка
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.tips_and_updates_rounded,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _getEnergyTip(current, max),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.95),
                      fontWeight: FontWeight.w500,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getTimeToFullEnergy(int current, int max, int regenRate) {
    if (current >= max) return 'Энергия полная';
    
    final energyNeeded = max - current;
    final hoursNeeded = (energyNeeded / regenRate).ceil();
    
    if (hoursNeeded < 1) {
      final minutesNeeded = ((energyNeeded / regenRate) * 60).ceil();
      return 'Полный заряд через $minutesNeeded мин';
    } else if (hoursNeeded == 1) {
      return 'Полный заряд через 1 час';
    } else {
      return 'Полный заряд через $hoursNeeded ч';
    }
  }

  String _getEnergyTip(int current, int max) {
    final percentage = current / max;
    
    if (percentage >= 0.8) {
      return 'Заряд на максимуме! Отличное время, чтобы пройти сложный урок.';
    } else if (percentage >= 0.5) {
      return 'Достаточно энергии для прохождения пары тестов.';
    } else if (percentage >= 0.2) {
      return 'Заряда хватит на один урок. Используйте его с умом!';
    } else {
      return 'Энергия на исходе. Сделайте перерыв на чашечку эспрессо!';
    }
  }
}
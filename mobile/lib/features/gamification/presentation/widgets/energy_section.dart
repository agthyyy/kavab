import 'package:flutter/material.dart';

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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF3B82F6),
            Color(0xFF1D4ED8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.bolt,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Энергия',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$current/$max',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Energy Bar
          Container(
            height: 8,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: progress.clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Icon(
                Icons.refresh,
                color: Colors.white.withOpacity(0.8),
                size: 16,
              ),
              const SizedBox(width: 6),
              Text(
                'Восстановление: $regenRate энергии/час',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ],
          ),
          
          if (current < max) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  color: Colors.white.withOpacity(0.8),
                  size: 16,
                ),
                const SizedBox(width: 6),
                Text(
                  _getTimeToFullEnergy(current, max, regenRate),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ],
          
          const SizedBox(height: 12),
          
          // Energy Tips
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.lightbulb_outline,
                  color: Colors.white.withOpacity(0.8),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _getEnergyTip(current, max),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.9),
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
      return 'Полная через $minutesNeeded мин';
    } else if (hoursNeeded == 1) {
      return 'Полная через 1 час';
    } else {
      return 'Полная через $hoursNeeded ч';
    }
  }

  String _getEnergyTip(int current, int max) {
    final percentage = current / max;
    
    if (percentage >= 0.8) {
      return 'У вас достаточно энергии для изучения!';
    } else if (percentage >= 0.5) {
      return 'Можете пройти несколько уроков.';
    } else if (percentage >= 0.2) {
      return 'Энергии хватит на один урок.';
    } else {
      return 'Энергия заканчивается. Отдохните немного!';
    }
  }
}
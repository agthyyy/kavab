import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CollectionSection extends StatelessWidget {
  final int cardsCount;
  final int totalCards;
  final int rareCards;

  const CollectionSection({
    super.key,
    required this.cardsCount,
    required this.totalCards,
    required this.rareCards,
  });

  @override
  Widget build(BuildContext context) {
    final completionPercentage = totalCards > 0 ? (cardsCount / totalCards * 100).round() : 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF8E24AA), // Яркие ноты ягодного кофе
            Color(0xFFD81B60), // Розовая пенка
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD81B60).withOpacity(0.25),
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
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.style_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Коллекция карт',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  '$completionPercentage%',
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
          
          // Статистика коллекции
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  icon: Icons.style_outlined,
                  label: 'Всего карт',
                  value: '$cardsCount',
                  subtitle: 'из $totalCards',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  icon: Icons.diamond_outlined,
                  label: 'Редкие карты',
                  value: '$rareCards',
                  subtitle: 'особенных',
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Прогрессбар
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Прогресс сбора карт',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.white.withOpacity(0.85),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '$cardsCount/$totalCards',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Stack(
                  children: [
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: totalCards > 0 ? (cardsCount / totalCards).clamp(0.0, 1.0) : 0.0,
                      child: Container(
                        height: 6,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 14),
          
          // Полезная подсказка
          GestureDetector(
            onTap: () => _showCollectionInfo(context),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.white.withOpacity(0.15),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _getCollectionTip(cardsCount, totalCards),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.white.withOpacity(0.95),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: Colors.white.withOpacity(0.65),
                    size: 12,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: Colors.white.withOpacity(0.9),
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: Colors.white.withOpacity(0.8),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: Colors.white.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }

  String _getCollectionTip(int current, int total) {
    if (current == 0) {
      return 'Проходите уроки и квизы, чтобы получить первые карты!';
    } else if (current < total * 0.25) {
      return 'Отличное начало! Продолжайте изучать кофейные секреты.';
    } else if (current < total * 0.5) {
      return 'Хорошая коллекция! Ищите редкие и легендарные сорта.';
    } else if (current < total * 0.75) {
      return 'Впечатляющая коллекция! Осталось совсем немного.';
    } else if (current < total) {
      return 'Коллекция почти завершена! Найдите последние редкие экземпляры.';
    } else {
      return 'Поздравляем! Ваша коллекция кофейных карт полностью собрана!';
    }
  }

  void _showCollectionInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('О кофейной коллекции', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text(
          'Каждая карта представляет собой кофейный сорт, регион или рецепт. '
          'Они выпадают случайным образом за завершение уроков и квизов.\n\n'
          'Соберите их все, чтобы стать настоящим мастером вкуса!',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Понятно', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFFC8860A))),
          ),
        ],
      ),
    );
  }
}
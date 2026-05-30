import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class TitlesSection extends StatelessWidget {
  final List<dynamic> titles;
  final dynamic activeTitle;
  final int unlockedCount;

  const TitlesSection({
    super.key,
    required this.titles,
    required this.activeTitle,
    required this.unlockedCount,
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
                  color: const Color(0xFF6366F1).withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.military_tech_rounded,
                  color: Color(0xFF6366F1),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Ваши титулы',
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
                  color: const Color(0xFF6366F1).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  'Открыто: $unlockedCount',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF6366F1),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (activeTitle != null)
            _buildActiveTitleCard(activeTitle)
          else
            _buildNoActiveTitleCard(),
          const SizedBox(height: 14),
          if (unlockedCount > 0)
            GestureDetector(
              onTap: () => _showTitlesDialog(context),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFAF6F2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF6366F1).withOpacity(0.12),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.collections_bookmark_rounded,
                      color: Color(0xFF6366F1),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Посмотреть все титулы',
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF6366F1),
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Color(0xFF6366F1),
                      size: 14,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActiveTitleCard(dynamic title) {
    final colorHex = title['colorHex'] ?? '#6366F1';
    final color = _hexToColor(colorHex);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.04),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getTitleIcon(title['icon']),
              color: color,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title['name'] ?? 'Титул',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _getRarityColor(title['rarity']).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _getRarityText(title['rarity']),
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: _getRarityColor(title['rarity']),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  title['description'] ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF7A6A5C),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Text(
              'Активен',
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoActiveTitleCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFAF6F2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.black.withOpacity(0.04),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.military_tech_rounded,
              color: Colors.grey[400],
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Титул не выбран',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF7A6A5C),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Выберите титул для отображения',
                  style: GoogleFonts.inter(
                    fontSize: 12,
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

  void _showTitlesDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Выбор титула', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('В следующем обновлении вы сможете настраивать отображение ваших титулов в профиле!', style: GoogleFonts.inter()),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Понятно', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFFC8860A))),
          ),
        ],
      ),
    );
  }

  Color _hexToColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (e) {
      return const Color(0xFF6366F1);
    }
  }

  IconData _getTitleIcon(String? icon) {
    switch (icon) {
      case 'crown':
        return Icons.emoji_events_rounded;
      case 'star':
        return Icons.stars_rounded;
      case 'trophy':
        return Icons.emoji_events_rounded;
      case 'coffee':
        return Icons.local_cafe_rounded;
      default:
        return Icons.military_tech_rounded;
    }
  }

  Color _getRarityColor(String? rarity) {
    switch (rarity) {
      case 'common':
        return Colors.grey.shade600;
      case 'rare':
        return const Color(0xFF1E88E5);
      case 'epic':
        return const Color(0xFF8E24AA);
      case 'legendary':
        return const Color(0xFFC8860A);
      case 'mythic':
        return const Color(0xFFD32F2F);
      default:
        return Colors.grey;
    }
  }

  String _getRarityText(String? rarity) {
    switch (rarity) {
      case 'common':
        return 'Обычный';
      case 'rare':
        return 'Редкий';
      case 'epic':
        return 'Эпический';
      case 'legendary':
        return 'Легендарный';
      case 'mythic':
        return 'Мифический';
      default:
        return 'Обычный';
    }
  }
}
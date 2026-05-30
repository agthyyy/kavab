import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'dart:math' as math;

class LearningPathMap extends StatelessWidget {
  final List<ModuleNode> modules;
  final Function(ModuleNode) onModuleTap;

  const LearningPathMap({
    super.key,
    required this.modules,
    required this.onModuleTap,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _PathPainter(modules),
      child: Column(
        children: modules.asMap().entries.map((entry) {
          final index = entry.key;
          final module = entry.value;
          return _buildModuleNode(context, module, index);
        }).toList(),
      ),
    );
  }

  Widget _buildModuleNode(BuildContext context, ModuleNode module, int index) {
    // Зигзаг: четные слева, нечетные справа
    final isLeft = index % 2 == 0;
    final alignment = isLeft ? Alignment.centerLeft : Alignment.centerRight;
    
    return Container(
      height: 170,
      alignment: alignment,
      padding: EdgeInsets.only(
        left: isLeft ? 16 : 80,
        right: isLeft ? 80 : 16,
        bottom: 24,
      ),
      child: GestureDetector(
        onTap: module.status != ModuleStatus.locked ? () => onModuleTap(module) : null,
        child: _ModuleNodeCard(module: module, index: index),
      ),
    );
  }
}

class _ModuleNodeCard extends StatelessWidget {
  final ModuleNode module;
  final int index;

  const _ModuleNodeCard({required this.module, required this.index});

  @override
  Widget build(BuildContext context) {
    final isLocked = module.status == ModuleStatus.locked;
    final isCompleted = module.status == ModuleStatus.completed;
    
    Color bgColor;
    Color borderColor;
    IconData icon;
    String statusText;
    
    if (isCompleted) {
      bgColor = const Color(0xFF2E7D32).withOpacity(0.08);
      borderColor = const Color(0xFF2E7D32);
      icon = Icons.check_circle_rounded;
      statusText = 'Завершено';
    } else if (isLocked) {
      bgColor = Colors.grey.shade100;
      borderColor = Colors.grey.shade400;
      icon = Icons.lock_outline_rounded;
      statusText = 'Заблокировано';
    } else {
      bgColor = const Color(0xFFC8860A).withOpacity(0.08);
      borderColor = const Color(0xFFC8860A);
      icon = Icons.play_arrow_rounded;
      statusText = 'Доступно';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isLocked ? Colors.black.withOpacity(0.05) : borderColor.withOpacity(0.25),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isLocked ? Colors.transparent : borderColor.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              // Стильная круглая иконка
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: borderColor, size: 22),
              ),
              const SizedBox(width: 12),
              
              // Название
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'МОДУЛЬ ${index + 1}',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        color: const Color(0xFF7A6A5C),
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      module.title,
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isLocked ? Colors.grey[400] : const Color(0xFF2C1810),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Текстовый бейдж состояния
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              statusText,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: borderColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PathPainter extends CustomPainter {
  final List<ModuleNode> modules;

  _PathPainter(this.modules);

  @override
  void paint(Canvas canvas, Size size) {
    if (modules.length < 2) return;

    final paint = Paint()
      ..color = const Color(0xFFC8860A).withOpacity(0.4)
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final dashPaint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    
    for (int i = 0; i < modules.length - 1; i++) {
      final isLeft = i % 2 == 0;
      final nextIsLeft = (i + 1) % 2 == 0;
      
      final startY = (i * 170) + 70.0;
      final endY = ((i + 1) * 170) + 70.0;
      
      final startX = isLeft ? size.width * 0.25 : size.width * 0.75;
      final endX = nextIsLeft ? size.width * 0.25 : size.width * 0.75;
      
      final controlX = size.width * 0.5;
      final controlY = (startY + endY) / 2;

      if (i == 0) {
        path.moveTo(startX, startY);
      }

      final isSegmentCompleted = modules[i].status == ModuleStatus.completed && 
                                 modules[i + 1].status != ModuleStatus.locked;
      final currentPaint = isSegmentCompleted ? paint : dashPaint;
      
      final segmentPath = Path();
      segmentPath.moveTo(startX, startY);
      segmentPath.quadraticBezierTo(controlX, controlY, endX, endY);
      
      if (isSegmentCompleted) {
        canvas.drawPath(segmentPath, currentPaint);
      } else {
        _drawDashedPath(canvas, segmentPath, dashPaint);
      }
    }
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    const dashWidth = 8.0;
    const dashSpace = 6.0;
    
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double distance = 0.0;
      while (distance < metric.length) {
        final start = metric.getTangentForOffset(distance);
        final end = metric.getTangentForOffset(math.min(distance + dashWidth, metric.length));
        
        if (start != null && end != null) {
          canvas.drawLine(start.position, end.position, paint);
        }
        distance += dashWidth + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(_PathPainter oldDelegate) => true;
}

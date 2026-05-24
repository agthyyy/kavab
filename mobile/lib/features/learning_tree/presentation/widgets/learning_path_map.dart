import 'package:flutter/material.dart';
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
      height: 160,
      alignment: alignment,
      padding: EdgeInsets.only(
        left: isLeft ? 16 : 80,
        right: isLeft ? 80 : 16,
        bottom: 20,
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
      bgColor = const Color(0xFF4CAF50).withOpacity(0.1);
      borderColor = const Color(0xFF4CAF50);
      icon = Icons.check_circle;
      statusText = 'Завершено';
    } else if (isLocked) {
      bgColor = Colors.grey.shade100;
      borderColor = Colors.grey.shade300;
      icon = Icons.lock;
      statusText = 'Заблокировано';
    } else {
      bgColor = const Color(0xFFC8860A).withOpacity(0.1);
      borderColor = const Color(0xFFC8860A);
      icon = Icons.play_circle_filled;
      statusText = 'Доступно';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 3),
        boxShadow: [
          BoxShadow(
            color: borderColor.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: borderColor, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Модуль ${index + 1}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      module.title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isLocked ? Colors.grey[400] : const Color(0xFF1A1A1A),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              statusText,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
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
      ..color = const Color(0xFFD4A574).withOpacity(0.3)
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
      
      final startY = (i * 160) + 80.0;
      final endY = ((i + 1) * 160) + 80.0;
      
      final startX = isLeft ? size.width * 0.25 : size.width * 0.75;
      final endX = nextIsLeft ? size.width * 0.25 : size.width * 0.75;
      
      final controlX = size.width * 0.5;
      final controlY = (startY + endY) / 2;

      if (i == 0) {
        path.moveTo(startX, startY);
      }

      // Используем разные стили для завершенных и незавершенных путей
      final currentPaint = modules[i].status == ModuleStatus.completed ? paint : dashPaint;
      
      final segmentPath = Path();
      segmentPath.moveTo(startX, startY);
      segmentPath.quadraticBezierTo(controlX, controlY, endX, endY);
      
      canvas.drawPath(segmentPath, currentPaint);
      
      // Рисуем пунктир для незавершенных
      if (modules[i].status != ModuleStatus.completed) {
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

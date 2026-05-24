import 'package:flutter/material.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';

class ModuleCard extends StatelessWidget {
  final ModuleNode module;
  final int index;
  final VoidCallback? onTap;

  const ModuleCard({
    super.key,
    required this.module,
    required this.index,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    switch (module.status) {
      case ModuleStatus.completed:
        return _ModuleTile(
          module: module,
          index: index,
          onTap: onTap,
          bgColor: const Color(0xFFE8F5E9),
          borderColor: const Color(0xFF4CAF50),
          iconBg: const Color(0xFF4CAF50),
          icon: Icons.check_rounded,
          iconColor: Colors.white,
          statusText: 'Завершено',
          statusColor: const Color(0xFF4CAF50),
          opacity: 1.0,
        );
      case ModuleStatus.available:
        return _ModuleTile(
          module: module,
          index: index,
          onTap: onTap,
          bgColor: Colors.white,
          borderColor: const Color(0xFFC8860A),
          iconBg: const Color(0xFFC8860A),
          icon: Icons.play_arrow_rounded,
          iconColor: Colors.white,
          statusText: 'Доступно',
          statusColor: const Color(0xFFC8860A),
          opacity: 1.0,
          highlighted: true,
        );
      case ModuleStatus.locked:
        return _ModuleTile(
          module: module,
          index: index,
          onTap: onTap,
          bgColor: const Color(0xFFF5F5F5),
          borderColor: Colors.transparent,
          iconBg: Colors.grey.shade300,
          icon: Icons.lock_outline_rounded,
          iconColor: Colors.grey.shade500,
          statusText: 'Заблокировано',
          statusColor: Colors.grey,
          opacity: 0.7,
        );
    }
  }
}

class _ModuleTile extends StatelessWidget {
  final ModuleNode module;
  final int index;
  final VoidCallback? onTap;
  final Color bgColor;
  final Color borderColor;
  final Color iconBg;
  final IconData icon;
  final Color iconColor;
  final String statusText;
  final Color statusColor;
  final double opacity;
  final bool highlighted;

  const _ModuleTile({
    required this.module,
    required this.index,
    required this.onTap,
    required this.bgColor,
    required this.borderColor,
    required this.iconBg,
    required this.icon,
    required this.iconColor,
    required this.statusText,
    required this.statusColor,
    required this.opacity,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: Material(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor, width: highlighted ? 2 : 1),
              boxShadow: highlighted
                  ? [
                      BoxShadow(
                        color: borderColor.withOpacity(0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      )
                    ]
                  : [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ],
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: iconColor, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Модуль ${index + 1}',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        module.title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 11,
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (module.status != ModuleStatus.locked)
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: borderColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: borderColor,
                      size: 20,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

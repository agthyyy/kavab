import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/course_entity.dart';

class CourseCard extends StatelessWidget {
  final CourseEntity course;
  final VoidCallback onTap;

  const CourseCard({
    super.key,
    required this.course,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Иконка с градиентной подложкой
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFFC8860A).withOpacity(0.12),
                        const Color(0xFFE2B275).withOpacity(0.06),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFC8860A).withOpacity(0.1),
                      width: 1.5,
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.coffee_rounded, // Кофейная чашка для тематики бариста
                      color: Color(0xFFC8860A),
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Название и описание курса
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course.title,
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF2C1810),
                          letterSpacing: -0.2,
                        ),
                      ),
                      if (course.description.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          course.description,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFF7A6A5C),
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                
                // Минималистичная стрелочка перехода
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAF6F2),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFFC8860A),
                      size: 22,
                    ),
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

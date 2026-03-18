import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';

class LessonModel {
  static LessonEntity fromJson(Map<String, dynamic> json) {
    // Backend returns { lesson: {...}, blocks: [...] }
    final lessonData = (json['lesson'] ?? json) as Map<String, dynamic>;
    final rawBlocks = (json['blocks'] as List<dynamic>? ?? []);
    final blocks = rawBlocks.map((b) => _parseBlock(b as Map<String, dynamic>)).toList();

    return LessonEntity(
      id: lessonData['id'] as String,
      title: lessonData['title'] as String,
      description: lessonData['description'] as String?,
      xpReward: (lessonData['xpReward'] ?? lessonData['xp_reward'] as num?)?.toInt() ?? 0,
      blocks: blocks,
      quizId: lessonData['quizId'] as String? ?? lessonData['quiz_id'] as String?,
      nextLessonId: lessonData['nextLessonId'] as String?,
    );
  }

  static LessonBlock _parseBlock(Map<String, dynamic> b) {
    final type = (b['blockType'] ?? b['block_type']) as String;
    final content = (b['content'] as String?) ?? '';
    switch (type) {
      case 'text':
        return TextBlock(content: content);
      case 'image':
        return ImageBlock(url: content, caption: null);
      case 'video':
        return VideoBlock(url: content, title: null);
      default:
        return TextBlock(content: content);
    }
  }
}

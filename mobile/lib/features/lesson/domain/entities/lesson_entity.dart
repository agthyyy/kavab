import 'package:equatable/equatable.dart';

class LessonCompleteResult extends Equatable {
  final int xpEarned;
  final String? quizId;
  final String? nextLessonId;

  const LessonCompleteResult({
    required this.xpEarned,
    this.quizId,
    this.nextLessonId,
  });

  @override
  List<Object?> get props => [xpEarned, quizId, nextLessonId];
}

sealed class LessonBlock extends Equatable {
  const LessonBlock();
}

class TextBlock extends LessonBlock {
  final String content;
  const TextBlock({required this.content});
  @override
  List<Object> get props => [content];
}

class ImageBlock extends LessonBlock {
  final String url;
  final String? caption;
  const ImageBlock({required this.url, this.caption});
  @override
  List<Object?> get props => [url, caption];
}

class VideoBlock extends LessonBlock {
  final String url;
  final String? title;
  const VideoBlock({required this.url, this.title});
  @override
  List<Object?> get props => [url, title];
}

class LessonEntity extends Equatable {
  final String id;
  final String title;
  final String? description;
  final int xpReward;
  final List<LessonBlock> blocks;
  final String? quizId;
  final String? nextLessonId;

  const LessonEntity({
    required this.id,
    required this.title,
    this.description,
    required this.xpReward,
    required this.blocks,
    this.quizId,
    this.nextLessonId,
  });

  @override
  List<Object?> get props => [id, title, description, xpReward, blocks, quizId, nextLessonId];
}

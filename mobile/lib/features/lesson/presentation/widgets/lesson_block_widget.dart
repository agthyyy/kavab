import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';
import 'package:kavabanga/features/lesson/presentation/widgets/video_block_widget.dart';

class LessonBlockWidget extends StatelessWidget {
  final LessonBlock block;
  const LessonBlockWidget({super.key, required this.block});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: switch (block) {
        TextBlock(:final content) => Text(
            content,
            style: const TextStyle(fontSize: 16, height: 1.6),
          ),
        ImageBlock(:final url, :final caption) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: CachedNetworkImage(
                  imageUrl: url,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    height: 200,
                    color: Colors.grey[200],
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    height: 200,
                    color: Colors.grey[200],
                    child: const Icon(Icons.broken_image, size: 48),
                  ),
                ),
              ),
              if (caption != null) ...[
                const SizedBox(height: 8),
                Text(
                  caption,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        VideoBlock(:final url, :final title) =>
          VideoBlockWidget(url: url, title: title),
      },
    );
  }
}

import 'package:equatable/equatable.dart';

enum ModuleStatus { locked, available, completed }

class ModuleNode extends Equatable {
  final String id;
  final String title;
  final int orderIndex;
  final ModuleStatus status;
  final String? firstLessonId;

  const ModuleNode({
    required this.id,
    required this.title,
    required this.orderIndex,
    required this.status,
    this.firstLessonId,
  });

  @override
  List<Object?> get props => [id, title, orderIndex, status, firstLessonId];
}

import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';

class ModuleNodeModel extends ModuleNode {
  const ModuleNodeModel({
    required super.id,
    required super.title,
    required super.orderIndex,
    required super.status,
    super.firstLessonId,
  });

  factory ModuleNodeModel.fromJson(Map<String, dynamic> json) {
    return ModuleNodeModel(
      id: json['id'] as String,
      title: json['title'] as String,
      orderIndex: json['orderIndex'] as int,
      status: _parseStatus(json['status'] as String),
      firstLessonId: json['firstLessonId'] as String?,
    );
  }

  static ModuleStatus _parseStatus(String value) {
    switch (value) {
      case 'completed':
        return ModuleStatus.completed;
      case 'available':
        return ModuleStatus.available;
      case 'locked':
      default:
        return ModuleStatus.locked;
    }
  }
}

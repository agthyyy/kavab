import 'package:equatable/equatable.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/course_entity.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/user_progress_summary.dart';

abstract class LearningTreeState extends Equatable {
  const LearningTreeState();

  @override
  List<Object?> get props => [];
}

class LearningTreeInitial extends LearningTreeState {
  const LearningTreeInitial();
}

class LearningTreeLoading extends LearningTreeState {
  const LearningTreeLoading();
}

class CoursesLoaded extends LearningTreeState {
  final List<CourseEntity> courses;
  final UserProgressSummary progress;

  const CoursesLoaded({required this.courses, required this.progress});

  @override
  List<Object?> get props => [courses, progress];
}

class LearningTreeLoaded extends LearningTreeState {
  final List<ModuleNode> modules;
  final UserProgressSummary progress;
  final String courseId;
  final String courseTitle;

  const LearningTreeLoaded({
    required this.modules,
    required this.progress,
    required this.courseId,
    required this.courseTitle,
  });

  @override
  List<Object?> get props => [modules, progress, courseId, courseTitle];
}

class LearningTreeError extends LearningTreeState {
  final String message;

  const LearningTreeError(this.message);

  @override
  List<Object?> get props => [message];
}

class LearningTreeEmpty extends LearningTreeState {
  const LearningTreeEmpty();
}

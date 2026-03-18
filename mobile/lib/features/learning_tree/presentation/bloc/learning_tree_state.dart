import 'package:equatable/equatable.dart';
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

class LearningTreeLoaded extends LearningTreeState {
  final List<ModuleNode> modules;
  final UserProgressSummary progress;

  const LearningTreeLoaded({required this.modules, required this.progress});

  @override
  List<Object?> get props => [modules, progress];
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

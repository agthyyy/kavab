import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/user_progress_summary.dart';

abstract class LearningTreeRepository {
  Future<Either<Failure, List<ModuleNode>>> getCourseTree(String courseId);
  Future<Either<Failure, UserProgressSummary>> getUserProgress();
}

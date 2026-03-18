import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'package:kavabanga/features/learning_tree/domain/repositories/learning_tree_repository.dart';

class GetCourseTreeUseCase {
  final LearningTreeRepository _repository;

  const GetCourseTreeUseCase(this._repository);

  Future<Either<Failure, List<ModuleNode>>> call(String courseId) {
    return _repository.getCourseTree(courseId);
  }
}

import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/course_entity.dart';
import 'package:kavabanga/features/learning_tree/domain/repositories/learning_tree_repository.dart';

class GetCoursesUseCase {
  final LearningTreeRepository _repository;

  const GetCoursesUseCase(this._repository);

  Future<Either<Failure, List<CourseEntity>>> call() async {
    return await _repository.getCourses();
  }
}

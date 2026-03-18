import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/lesson/domain/repositories/lesson_repository.dart';

class CompleteLessonUseCase {
  final LessonRepository repository;
  CompleteLessonUseCase(this.repository);

  Future<Either<Failure, int>> call(String lessonId) =>
      repository.completeLesson(lessonId);
}

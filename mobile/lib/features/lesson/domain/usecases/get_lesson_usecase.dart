import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';
import 'package:kavabanga/features/lesson/domain/repositories/lesson_repository.dart';

class GetLessonUseCase {
  final LessonRepository repository;
  GetLessonUseCase(this.repository);

  Future<Either<Failure, LessonEntity>> call(String lessonId) =>
      repository.getLesson(lessonId);
}

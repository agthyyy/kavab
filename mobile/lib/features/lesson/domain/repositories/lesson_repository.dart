import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';

abstract class LessonRepository {
  Future<Either<Failure, LessonEntity>> getLesson(String lessonId);
  Future<Either<Failure, LessonCompleteResult>> completeLesson(String lessonId);
}

import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/lesson/data/datasources/lesson_remote_datasource.dart';
import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';
import 'package:kavabanga/features/lesson/domain/repositories/lesson_repository.dart';

class LessonRepositoryImpl implements LessonRepository {
  final LessonRemoteDataSource dataSource;
  LessonRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, LessonEntity>> getLesson(String lessonId) async {
    try {
      final lesson = await dataSource.getLesson(lessonId);
      return Right(lesson);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.receiveTimeout) {
        return Left(NetworkFailure('No internet connection'));
      }
      return Left(ServerFailure(e.message ?? 'Server error'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, int>> completeLesson(String lessonId) async {
    try {
      final xp = await dataSource.completeLesson(lessonId);
      return Right(xp);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}

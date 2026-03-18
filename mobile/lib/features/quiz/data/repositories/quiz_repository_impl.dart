import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/quiz/data/datasources/quiz_remote_datasource.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';
import 'package:kavabanga/features/quiz/domain/repositories/quiz_repository.dart';

class QuizRepositoryImpl implements QuizRepository {
  final QuizRemoteDataSource dataSource;
  QuizRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, QuizEntity>> getQuiz(String quizId) async {
    try {
      return Right(await dataSource.getQuiz(quizId));
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, QuizResult>> submitQuiz(
      String quizId, Map<String, dynamic> answers) async {
    try {
      return Right(await dataSource.submitQuiz(quizId, answers));
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}

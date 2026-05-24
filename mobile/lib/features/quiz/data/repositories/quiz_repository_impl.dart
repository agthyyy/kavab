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
    print('[QuizRepository] getQuiz called with quizId: $quizId');
    try {
      print('[QuizRepository] Calling dataSource.getQuiz...');
      final result = await dataSource.getQuiz(quizId);
      print('[QuizRepository] Success: got quiz with ${result.questions.length} questions');
      return Right(result);
    } on DioException catch (e) {
      print('[QuizRepository] DioException: ${e.message}');
      return Left(ServerFailure(e.message ?? 'Server error'));
    } catch (e) {
      print('[QuizRepository] General exception: $e');
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

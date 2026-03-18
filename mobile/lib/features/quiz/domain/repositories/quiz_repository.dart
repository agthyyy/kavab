import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';

abstract class QuizRepository {
  Future<Either<Failure, QuizEntity>> getQuiz(String quizId);
  Future<Either<Failure, QuizResult>> submitQuiz(
      String quizId, Map<String, dynamic> answers);
}

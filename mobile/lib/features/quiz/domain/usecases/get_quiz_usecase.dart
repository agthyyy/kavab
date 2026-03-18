import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';
import 'package:kavabanga/features/quiz/domain/repositories/quiz_repository.dart';

class GetQuizUseCase {
  final QuizRepository repository;
  GetQuizUseCase(this.repository);

  Future<Either<Failure, QuizEntity>> call(String quizId) =>
      repository.getQuiz(quizId);
}

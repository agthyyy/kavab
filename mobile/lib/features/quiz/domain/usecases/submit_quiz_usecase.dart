import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';
import 'package:kavabanga/features/quiz/domain/repositories/quiz_repository.dart';

class SubmitQuizUseCase {
  final QuizRepository repository;
  SubmitQuizUseCase(this.repository);

  Future<Either<Failure, QuizResult>> call(
          String quizId, Map<String, dynamic> answers) =>
      repository.submitQuiz(quizId, answers);
}

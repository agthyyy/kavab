import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/user_progress_summary.dart';
import 'package:kavabanga/features/learning_tree/domain/repositories/learning_tree_repository.dart';

class GetUserProgressUseCase {
  final LearningTreeRepository _repository;

  const GetUserProgressUseCase(this._repository);

  Future<Either<Failure, UserProgressSummary>> call() {
    return _repository.getUserProgress();
  }
}

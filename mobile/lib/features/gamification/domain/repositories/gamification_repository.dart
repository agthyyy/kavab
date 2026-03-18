import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';

abstract class GamificationRepository {
  Future<Either<Failure, UserProgressEntity>> getUserProgress();
}

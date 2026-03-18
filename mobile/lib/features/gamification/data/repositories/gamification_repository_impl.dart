import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/gamification/data/datasources/gamification_remote_datasource.dart';
import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';
import 'package:kavabanga/features/gamification/domain/repositories/gamification_repository.dart';

class GamificationRepositoryImpl implements GamificationRepository {
  final GamificationRemoteDataSource dataSource;
  GamificationRepositoryImpl(this.dataSource);

  @override
  Future<Either<Failure, UserProgressEntity>> getUserProgress() async {
    try {
      return Right(await dataSource.getUserProgress());
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Server error'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}

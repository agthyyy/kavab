import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/learning_tree/data/datasources/learning_tree_remote_datasource.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/user_progress_summary.dart';
import 'package:kavabanga/features/learning_tree/domain/repositories/learning_tree_repository.dart';

class LearningTreeRepositoryImpl implements LearningTreeRepository {
  final LearningTreeRemoteDataSource _dataSource;

  const LearningTreeRepositoryImpl(this._dataSource);

  @override
  Future<Either<Failure, List<ModuleNode>>> getCourseTree(
      String courseId) async {
    try {
      final modules = await _dataSource.getCourseTree(courseId);
      return Right(modules);
    } on DioException catch (e) {
      return Left(_mapDioError(e));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, UserProgressSummary>> getUserProgress() async {
    try {
      final progress = await _dataSource.getUserProgress();
      return Right(progress);
    } on DioException catch (e) {
      return Left(_mapDioError(e));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  Failure _mapDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      return const NetworkFailure();
    }
    final statusCode = e.response?.statusCode;
    if (statusCode == 401) return const AuthFailure();
    return ServerFailure(
      e.response?.data?['error']?['message'] as String? ?? 'Server error',
    );
  }
}

import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:kavabanga/features/auth/domain/entities/user_entity.dart';
import 'package:kavabanga/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _dataSource;

  const AuthRepositoryImpl(this._dataSource);

  @override
  Future<Either<Failure, UserEntity>> login(
    String login,
    String password,
  ) async {
    try {
      final response = await _dataSource.loginRemote(login, password);
      return Right(response.user.toEntity());
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      if (statusCode == 401) {
        return Left(AuthFailure(
          e.response?.data?['error']?['message'] as String? ??
              'Invalid login or password',
        ));
      }
      if (statusCode == 423) {
        return Left(AuthFailure(
          e.response?.data?['error']?['message'] as String? ??
              'Account locked. Try again later.',
        ));
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        return const Left(NetworkFailure());
      }
      return Left(ServerFailure(
        e.response?.data?['error']?['message'] as String? ?? 'Server error',
      ));
    } catch (_) {
      return const Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await _dataSource.logoutRemote();
      return const Right(null);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        return const Left(NetworkFailure());
      }
      return const Left(ServerFailure());
    } catch (_) {
      return const Left(ServerFailure());
    }
  }
}

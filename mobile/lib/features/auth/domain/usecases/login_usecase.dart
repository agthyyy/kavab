import 'package:fpdart/fpdart.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/features/auth/domain/entities/user_entity.dart';
import 'package:kavabanga/features/auth/domain/repositories/auth_repository.dart';

class LoginUseCase {
  final AuthRepository _repository;

  const LoginUseCase(this._repository);

  Future<Either<Failure, UserEntity>> call(String login, String password) {
    return _repository.login(login, password);
  }
}

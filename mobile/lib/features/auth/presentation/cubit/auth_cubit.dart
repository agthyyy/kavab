import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/core/error/failures.dart';
import 'package:kavabanga/core/storage/secure_storage.dart';
import 'package:kavabanga/features/auth/domain/usecases/login_usecase.dart';
import 'package:kavabanga/features/auth/domain/usecases/logout_usecase.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final LoginUseCase _loginUseCase;
  final LogoutUseCase _logoutUseCase;
  final SecureStorage _secureStorage;

  AuthCubit({
    required LoginUseCase loginUseCase,
    required LogoutUseCase logoutUseCase,
    required SecureStorage secureStorage,
  })  : _loginUseCase = loginUseCase,
        _logoutUseCase = logoutUseCase,
        _secureStorage = secureStorage,
        super(const AuthInitial());

  Future<void> checkAuth() async {
    final token = await _secureStorage.getAccessToken();
    if (token != null) {
      // Token exists but we don't have user data cached — treat as unauthenticated
      // so the user logs in again and we fetch fresh user data.
      emit(const AuthUnauthenticated());
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> login(String login, String password) async {
    emit(const AuthLoading());

    final result = await _loginUseCase(login, password);

    result.fold(
      (failure) {
        if (failure is AuthFailure &&
            failure.message.toLowerCase().contains('lock')) {
          emit(AuthLocked(failure.message));
        } else {
          emit(AuthError(failure.message));
        }
      },
      (user) => emit(AuthAuthenticated(user)),
    );
  }

  Future<void> logout() async {
    emit(const AuthLoading());
    await _logoutUseCase();
    emit(const AuthUnauthenticated());
  }
}

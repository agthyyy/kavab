import 'package:dio/dio.dart';
import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/core/storage/secure_storage.dart';
import 'package:kavabanga/features/auth/data/models/auth_model.dart';

abstract class AuthRemoteDataSource {
  Future<AuthResponseModel> loginRemote(String login, String password);
  Future<void> logoutRemote();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;
  final SecureStorage _secureStorage;

  const AuthRemoteDataSourceImpl({
    required ApiClient apiClient,
    required SecureStorage secureStorage,
  })  : _apiClient = apiClient,
        _secureStorage = secureStorage;

  @override
  Future<AuthResponseModel> loginRemote(String login, String password) async {
    final response = await _apiClient.dio.post(
      ApiConstants.login,
      data: {'login': login, 'password': password},
    );

    final model = AuthResponseModel.fromJson(
      response.data as Map<String, dynamic>,
    );

    await _secureStorage.saveAccessToken(model.accessToken);
    await _secureStorage.saveRefreshToken(model.refreshToken);

    return model;
  }

  @override
  Future<void> logoutRemote() async {
    try {
      await _apiClient.dio.post(ApiConstants.logout);
    } on DioException {
      // Ignore network errors on logout — clear tokens regardless
    } finally {
      await _secureStorage.clearAll();
    }
  }
}

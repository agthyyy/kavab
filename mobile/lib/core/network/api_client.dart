import 'package:dio/dio.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/core/storage/secure_storage.dart';

class ApiClient {
  late final Dio dio;
  final SecureStorage _secureStorage;

  ApiClient(this._secureStorage) {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(_JwtInterceptor(dio, _secureStorage));
  }

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters}) =>
      dio.get<T>(path, queryParameters: queryParameters);

  Future<Response<T>> post<T>(String path, {dynamic data}) =>
      dio.post<T>(path, data: data);

  Future<Response<T>> patch<T>(String path, {dynamic data}) =>
      dio.patch<T>(path, data: data);

  Future<Response<T>> put<T>(String path, {dynamic data}) =>
      dio.put<T>(path, data: data);

  Future<Response<T>> delete<T>(String path) => dio.delete<T>(path);
}

class _JwtInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorage _secureStorage;
  bool _isRefreshing = false;

  _JwtInterceptor(this._dio, this._secureStorage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await _secureStorage.getRefreshToken();
        if (refreshToken == null) {
          await _secureStorage.clearAll();
          _isRefreshing = false;
          handler.next(err);
          return;
        }

        final refreshResponse = await _dio.post(
          ApiConstants.refresh,
          data: {'refreshToken': refreshToken},
          options: Options(headers: {'Authorization': null}),
        );

        final newAccessToken = refreshResponse.data['accessToken'] as String;
        final newRefreshToken = refreshResponse.data['refreshToken'] as String?;

        await _secureStorage.saveAccessToken(newAccessToken);
        if (newRefreshToken != null) {
          await _secureStorage.saveRefreshToken(newRefreshToken);
        }

        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        final retryResponse = await _dio.fetch(retryOptions);
        _isRefreshing = false;
        handler.resolve(retryResponse);
      } catch (_) {
        await _secureStorage.clearAll();
        _isRefreshing = false;
        handler.next(err);
      }
    } else {
      handler.next(err);
    }
  }
}

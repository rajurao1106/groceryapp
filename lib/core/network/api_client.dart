import 'package:dio/dio.dart';

const _apiBaseUrl = String.fromEnvironment(
  'http://127.0.0.1:4000/api',
  defaultValue: 'http://127.0.0.1:4000/api',
);

class ApiClient {
  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
  }

  late final Dio _dio;

  Dio get dio => _dio;
}

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: kIsWeb
      ? 'http://localhost:4000/api'
      : 'https://groceryapp-mvwz.vercel.app/api',
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

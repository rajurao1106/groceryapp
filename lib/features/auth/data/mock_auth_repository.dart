import 'dart:async';

import 'package:grocery_app/features/auth/domain/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  @override
  Future<void> sendOtp(String mobile) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (mobile.trim().length != 10) {
      throw Exception('Invalid mobile number');
    }
  }

  @override
  Future<AuthSession> verifyOtp(String mobile, String otp) async {
    await Future<void>.delayed(const Duration(milliseconds: 800));

    if (mobile.trim().length != 10) {
      throw Exception('Invalid mobile number');
    }

    if (otp != '123456') {
      throw Exception('Invalid OTP');
    }

    return const AuthSession(
      accessToken: 'mock_access_token_123',
      refreshToken: 'mock_refresh_token_456',
      isNewUser: true,
    );
  }
}

abstract class AuthRepository {
  Future<void> sendOtp(String mobile);
  Future<AuthSession> verifyOtp(String mobile, String otp);
}

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.isNewUser,
  });

  final String accessToken;
  final String refreshToken;
  final bool isNewUser;
}

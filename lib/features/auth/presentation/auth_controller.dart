import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/core/storage/app_preferences.dart';
import 'package:grocery_app/core/storage/secure_token_store.dart';
import 'package:grocery_app/features/auth/data/mock_auth_repository.dart';
import 'package:grocery_app/features/auth/domain/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => MockAuthRepository(),
);

class AuthState {
  const AuthState({
    this.isLoading = false,
    this.errorMessage,
    this.mobile,
    this.otp,
    this.authSession,
  });

  final bool isLoading;
  final String? errorMessage;
  final String? mobile;
  final String? otp;
  final AuthSession? authSession;

  AuthState copyWith({
    bool? isLoading,
    String? errorMessage,
    String? mobile,
    String? otp,
    AuthSession? authSession,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
      mobile: mobile ?? this.mobile,
      otp: otp ?? this.otp,
      authSession: authSession ?? this.authSession,
    );
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  () => AuthController(),
);

class AuthController extends Notifier<AuthState> {
  AuthController();

  AuthRepository get _repository => ref.read(authRepositoryProvider);

  @override
  AuthState build() {
    return const AuthState();
  }

  Future<void> sendOtp(String mobile) async {
    final cleanedMobile = mobile.replaceAll(RegExp(r'\D'), '');
    if (cleanedMobile.length != 10) {
      state = state.copyWith(
        errorMessage: 'Enter a valid 10-digit mobile number',
      );
      return;
    }

    state = state.copyWith(
      mobile: cleanedMobile,
      errorMessage: null,
      isLoading: true,
    );

    try {
      await _repository.sendOtp(cleanedMobile);
      state = state.copyWith(isLoading: false, errorMessage: null);
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> verifyOtp(String mobile, String otp) async {
    final cleanedMobile = mobile.replaceAll(RegExp(r'\D'), '');
    final cleanedOtp = otp.trim();

    if (cleanedMobile.length != 10) {
      state = state.copyWith(
        errorMessage: 'Enter a valid 10-digit mobile number',
      );
      return;
    }

    if (cleanedOtp.length != 6) {
      state = state.copyWith(errorMessage: 'Enter the 6-digit OTP');
      return;
    }

    state = state.copyWith(
      mobile: cleanedMobile,
      otp: cleanedOtp,
      errorMessage: null,
      isLoading: true,
    );

    try {
      final session = await _repository.verifyOtp(cleanedMobile, cleanedOtp);
      await SecureTokenStore.saveToken(session.accessToken);
      await SecureTokenStore.saveRefreshToken(session.refreshToken);
      await AppPreferences.setLoggedInFlag(true);

      state = state.copyWith(
        isLoading: false,
        authSession: session,
        errorMessage: null,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Wrong OTP. Please try again.',
      );
    }
  }

  Future<void> logout() async {
    state = const AuthState();
    await SecureTokenStore.clear();
    await AppPreferences.clear();
  }
}

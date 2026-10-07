import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/core/widgets/app_logo.dart';
import 'package:grocery_app/core/widgets/app_text_field.dart';
import 'package:grocery_app/core/widgets/primary_button.dart';
import 'package:grocery_app/features/auth/presentation/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _mobileController = TextEditingController();

  @override
  void dispose() {
    _mobileController.dispose();
    super.dispose();
  }

  bool get _isValidMobile =>
      _mobileController.text.replaceAll(RegExp(r'\D'), '').length == 10;

  void _onContinue() async {
    final mobile = _mobileController.text;
    final cleaned = mobile.replaceAll(RegExp(r'\D'), '');
    if (cleaned.length != 10) {
      return;
    }

    await ref.read(authControllerProvider.notifier).sendOtp(cleaned);
    if (!mounted) return;

    final error = ref.read(authControllerProvider).errorMessage;
    if (error == null) {
      context.go('/otp', extra: cleaned);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Center(child: AppLogo(size: 88)),
                  const SizedBox(height: 28),
                  Text(
                    'Welcome back!',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to continue your grocery shopping',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 28),
                  AppTextField(
                    controller: _mobileController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    prefixText: '+91 ',
                    hintText: 'Enter mobile number',
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => setState(() {}),
                    validator: (value) {
                      final cleaned =
                          value?.replaceAll(RegExp(r'\D'), '') ?? '';
                      if (cleaned.length != 10) {
                        return 'Enter 10-digit mobile number';
                      }
                      return null;
                    },
                  ),
                  if (authState.errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      authState.errorMessage!,
                      style: const TextStyle(
                        color: AppColors.error,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  PrimaryButton(
                    text: 'Continue',
                    isLoading: authState.isLoading,
                    isEnabled: _isValidMobile,
                    onPressed: _onContinue,
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: Text(
                      'By continuing, you agree to our Terms & Privacy Policy',
                      textAlign: TextAlign.center,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/core/storage/app_preferences.dart';
import 'package:grocery_app/core/widgets/primary_button.dart';
import 'package:grocery_app/features/auth/presentation/auth_controller.dart';
import 'package:grocery_app/features/location/presentation/selected_address_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.mobile});

  final String mobile;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final PinInputController _otpController = PinInputController();
  Timer? _timer;
  int _secondsLeft = 30;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _secondsLeft = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_secondsLeft == 0) {
        timer.cancel();
        setState(() {});
        return;
      }
      setState(() {
        _secondsLeft--;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  bool get _isOtpComplete => _otpController.text.length == 6;

  void _verifyOtp() async {
    final authNotifier = ref.read(authControllerProvider.notifier);
    await authNotifier.verifyOtp(widget.mobile, _otpController.text);

    if (!mounted) return;

    final authState = ref.read(authControllerProvider);
    if (authState.errorMessage == null && authState.authSession != null) {
      final onboardingCompleted = await AppPreferences.isOnboardingCompleted();
      final locations = await ref
          .read(addressRepositoryProvider)
          .getSavedAddresses();

      if (!mounted) return;

      if (locations.isEmpty && !onboardingCompleted) {
        context.go('/location');
      } else if (!onboardingCompleted) {
        context.go('/notification');
      } else {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'We sent a 6-digit code to',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    '+91 ${widget.mobile}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text('Change'),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              MaterialPinField(
                length: 6,
                pinController: _otpController,
                autoFocus: true,
                keyboardType: TextInputType.number,
                onCompleted: (_) => setState(() {}),
                onChanged: (_) => setState(() {}),
                theme: MaterialPinTheme(
                  shape: MaterialPinShape.underlined,
                  cellSize: const Size(42, 52),
                  borderColor: AppColors.border,
                  focusedBorderColor: AppColors.primaryGreen,
                  fillColor: AppColors.surface,
                  focusedFillColor: AppColors.surface,
                  textStyle: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (authState.errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  authState.errorMessage!,
                  style: const TextStyle(
                    color: AppColors.error,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _secondsLeft > 0
                        ? 'Resend in 00:${_secondsLeft.toString().padLeft(2, '0')}'
                        : 'Did not receive the code?',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  if (_secondsLeft == 0)
                    TextButton(
                      onPressed: () {
                        ref
                            .read(authControllerProvider.notifier)
                            .sendOtp(widget.mobile);
                        _startTimer();
                      },
                      child: const Text('Resend'),
                    ),
                ],
              ),
              const Spacer(),
              PrimaryButton(
                text: 'Verify',
                isLoading: authState.isLoading,
                isEnabled: _isOtpComplete,
                onPressed: _verifyOtp,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

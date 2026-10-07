import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/core/storage/secure_token_store.dart';

final authStatusProvider = FutureProvider<bool>((ref) async {
  final token = await SecureTokenStore.readToken();
  return token != null && token.isNotEmpty;
});

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authStatus = ref.watch(authStatusProvider);

    return authStatus.when(
      data: (isLoggedIn) {
        if (isLoggedIn) {
          return child;
        }
        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.go('/login');
        });
        return const Scaffold(body: SizedBox());
      },
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (error, stackTrace) =>
          const Scaffold(body: Center(child: Text('Authentication error'))),
    );
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/core/storage/secure_token_store.dart';
import 'package:grocery_app/core/widgets/app_shell.dart';
import 'package:grocery_app/features/auth/presentation/auth_gate.dart';
import 'package:grocery_app/features/auth/presentation/login_screen.dart';
import 'package:grocery_app/features/auth/presentation/otp_screen.dart';
import 'package:grocery_app/features/cart/presentation/cart_placeholder_screen.dart';
import 'package:grocery_app/features/checkout/presentation/checkout_screen.dart';
import 'package:grocery_app/features/checkout/presentation/order_confirmation_screen.dart';
import 'package:grocery_app/features/categories/presentation/categories_placeholder_screen.dart';
import 'package:grocery_app/features/home/presentation/home_placeholder_screen.dart';
import 'package:grocery_app/core/storage/app_preferences.dart';
import 'package:grocery_app/features/location/presentation/location_selection_screen.dart';
import 'package:grocery_app/features/location/presentation/map_confirm_screen.dart';
import 'package:grocery_app/features/location/presentation/selected_address_provider.dart';
import 'package:grocery_app/features/notification/presentation/notification_permission_screen.dart';
import 'package:grocery_app/features/orders/presentation/order_detail_screen.dart';
import 'package:grocery_app/features/orders/presentation/orders_placeholder_screen.dart';
import 'package:grocery_app/features/profile/presentation/edit_profile_screen.dart';
import 'package:grocery_app/features/profile/presentation/profile_placeholder_screen.dart';
import 'package:grocery_app/features/profile/presentation/profile_screens.dart';
import 'package:grocery_app/features/product_detail/presentation/product_detail_screen.dart';
import 'package:grocery_app/features/search/presentation/search_placeholder_screen.dart';
import 'package:grocery_app/features/splash/presentation/splash_screen.dart';
import 'package:grocery_app/features/wishlist/presentation/wishlist_placeholder_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final token = await SecureTokenStore.readToken();
      final isLoggedIn = token != null && token.isNotEmpty;
      final isAuthRoute =
          state.matchedLocation == '/login' || state.matchedLocation == '/otp';
      final onboardingCompleted = await AppPreferences.isOnboardingCompleted();
      final savedAddresses = await ref
          .read(addressRepositoryProvider)
          .getSavedAddresses();

      if (state.matchedLocation == '/splash') {
        if (!isLoggedIn) {
          return '/login';
        }
        if (!onboardingCompleted) {
          return savedAddresses.isEmpty ? '/location' : '/notification';
        }
        return '/home';
      }

      if (!isLoggedIn && !isAuthRoute) {
        return '/login';
      }

      if (isLoggedIn && isAuthRoute) {
        if (!onboardingCompleted) {
          return savedAddresses.isEmpty ? '/location' : '/notification';
        }
        return '/home';
      }

      if (isLoggedIn &&
          !onboardingCompleted &&
          state.matchedLocation == '/home') {
        return savedAddresses.isEmpty ? '/location' : '/notification';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final mobile = state.extra as String? ?? '';
          return OtpScreen(mobile: mobile);
        },
      ),
      GoRoute(
        path: '/location',
        builder: (context, state) => const LocationSelectionScreen(),
      ),
      GoRoute(
        path: '/location-map',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? const {};
          return MapConfirmScreen(
            address: extra['address'] as String? ?? 'Bengaluru',
            latitude: (extra['lat'] as num?)?.toDouble() ?? 12.9716,
            longitude: (extra['lng'] as num?)?.toDouble() ?? 77.5946,
          );
        },
      ),
      GoRoute(
        path: '/notification',
        builder: (context, state) => const NotificationPermissionScreen(),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchPlaceholderScreen(),
      ),
      GoRoute(
        path: '/product/:id',
        builder: (context, state) =>
            ProductDetailScreen(productId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/order-confirmation/:orderId',
        builder: (context, state) => OrderConfirmationScreen(
          orderId: state.pathParameters['orderId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfilePlaceholderScreen(),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/addresses',
        builder: (context, state) => const SavedAddressesScreen(),
      ),
      GoRoute(
        path: '/profile/payment-modes',
        builder: (context, state) => const PaymentModesScreen(),
      ),
      GoRoute(
        path: '/profile/refunds',
        builder: (context, state) => const RefundsScreen(),
      ),
      GoRoute(
        path: '/profile/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersPlaceholderScreen(),
      ),
      GoRoute(
        path: '/orders/:orderId',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId'] ?? '';
          return OrderDetailScreen(orderId: orderId);
        },
      ),
      ShellRoute(
        builder: (context, state, child) => AuthGate(child: child),
        routes: [
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) =>
                AppShell(navigationShell: navigationShell),
            branches: [
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/home',
                    builder: (context, state) => const HomePlaceholderScreen(),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/categories',
                    builder: (context, state) {
                      final categoryId = state.uri.queryParameters['category'];
                      return CategoriesPlaceholderScreen(
                        initialCategoryId: categoryId,
                      );
                    },
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/cart',
                    builder: (context, state) => const CartPlaceholderScreen(),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: '/wishlist',
                    builder: (context, state) =>
                        const WishlistPlaceholderScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/cart/domain/cart_count_provider.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartItemCountProvider);

    final destinations = [
      const NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home_rounded),
        label: 'Home',
      ),
      const NavigationDestination(
        icon: Icon(Icons.category_outlined),
        selectedIcon: Icon(Icons.category_rounded),
        label: 'Categories',
      ),
      NavigationDestination(
        icon: Badge(
          isLabelVisible: cartCount > 0,
          label: Text(cartCount.toString()),
          child: const Icon(Icons.shopping_cart_outlined),
        ),
        selectedIcon: Badge(
          isLabelVisible: cartCount > 0,
          label: Text(cartCount.toString()),
          child: const Icon(Icons.shopping_cart_rounded),
        ),
        label: 'Cart',
      ),
      const NavigationDestination(
        icon: Icon(Icons.receipt_long_outlined),
        selectedIcon: Icon(Icons.receipt_long_rounded),
        label: 'Orders',
      ),
      const NavigationDestination(
        icon: Icon(Icons.person_outline_rounded),
        selectedIcon: Icon(Icons.person_rounded),
        label: 'Profile',
      ),
    ];

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NavigationBar(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: (index) => navigationShell.goBranch(
                index,
                initialLocation: index == navigationShell.currentIndex,
              ),
              destinations: destinations,
              backgroundColor: AppColors.surface,
            ),
          ],
        ),
      ),
    );
  }
}

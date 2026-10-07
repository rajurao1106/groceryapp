import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/home/presentation/product_card.dart';
import 'package:grocery_app/features/wishlist/data/mock_wishlist_repository.dart';
import 'package:grocery_app/features/wishlist/presentation/wishlist_controller.dart';

class WishlistPlaceholderScreen extends ConsumerStatefulWidget {
  const WishlistPlaceholderScreen({super.key});

  @override
  ConsumerState<WishlistPlaceholderScreen> createState() =>
      _WishlistPlaceholderScreenState();
}

class _WishlistPlaceholderScreenState
    extends ConsumerState<WishlistPlaceholderScreen> {
  @override
  Widget build(BuildContext context) {
    final wishlistIds = ref.watch(wishlistControllerProvider);
    final repository = ref.watch(wishlistRepositoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Wishlist'),
      ),
      body: FutureBuilder(
        future: repository.getWishlistProducts(wishlistIds),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primaryGreen),
            );
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return _EmptyWishlistState();
          }

          final products = snapshot.data!;

          return GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.76,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return ProductCard(
                product: product,
                onTap: () => context.push('/product/${product.id}'),
                isFavourite: true,
                onFavouriteTap: () async {
                  final removedId = product.id;
                  final controller = ref.read(
                    wishlistControllerProvider.notifier,
                  );
                  final messenger = ScaffoldMessenger.maybeOf(context);
                  await controller.remove(removedId);

                  if (!mounted) {
                    return;
                  }

                  messenger?.showSnackBar(
                    SnackBar(
                      content: const Text('Item removed from wishlist'),
                      action: SnackBarAction(
                        label: 'Undo',
                        onPressed: () async {
                          await controller.toggle(removedId);
                        },
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

class _EmptyWishlistState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(32),
              ),
              child: const Icon(
                Icons.favorite_border_rounded,
                size: 52,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Your wishlist is empty',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Save products you love and come back anytime.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => context.go('/home'),
              icon: const Icon(Icons.shopping_bag_outlined),
              label: const Text('Start shopping'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

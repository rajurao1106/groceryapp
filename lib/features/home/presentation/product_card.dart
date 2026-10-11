import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/cart/domain/cart_controller.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/home/presentation/catalog_product_image.dart';

class ProductCard extends ConsumerWidget {
  const ProductCard({
    required this.product,
    super.key,
    this.isFavourite,
    this.onFavouriteTap,
    this.onAddTap,
    this.onTap,
    this.compact = false,
  });

  final HomeProduct product;
  final bool? isFavourite;
  final VoidCallback? onFavouriteTap;
  final VoidCallback? onAddTap;
  final VoidCallback? onTap;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorite = isFavourite ?? product.isFavourite;
    final cart = ref.watch(cartControllerProvider);
    final item = cart
        .where((entry) => entry.product.id == product.id)
        .firstOrNull;
    final quantity = item?.quantity ?? 0;
    final isOutOfStock = product.stock <= 0;
    final priceText = '₹${product.sellingPrice.toStringAsFixed(0)}';
    final mrpText = '₹${product.mrp.toStringAsFixed(0)}';

    Future<void> handleAdd() async {
      if (onAddTap != null) {
        onAddTap!.call();
        return;
      }
      if (isOutOfStock) {
        return;
      }
      await ref.read(cartControllerProvider.notifier).addProduct(product);
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: compact ? 110 : 180,
        padding: EdgeInsets.all(compact ? 8 : 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(compact ? 16 : 18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: SizedBox(
                    height: compact ? 66 : 84,
                    width: double.infinity,
                    child: CatalogProductImage(
                      image: product.imageUrl,
                      emojiFontSize: 48,
                    ),
                  ),
                ),
                if (isOutOfStock)
                  Positioned(
                    left: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Out of stock',
                        style: TextStyle(
                          fontSize: 9,
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: GestureDetector(
                    onTap: onFavouriteTap,
                    child: AnimatedScale(
                      scale: isFavorite ? 1.08 : 1,
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOutBack,
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 180),
                          switchInCurve: Curves.easeOutBack,
                          switchOutCurve: Curves.easeIn,
                          child: Icon(
                            key: ValueKey(isFavorite),
                            isFavorite
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                            size: 16,
                            color: isFavorite
                                ? AppColors.primaryGreen
                                : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: compact ? 7 : 10),
            Text(
              product.name,
              maxLines: compact ? 1 : 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(
                fontSize: compact ? 12 : null,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: compact ? 2 : 4),
            Text(
              product.packSize,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
                fontSize: compact ? 10 : null,
              ),
            ),
            SizedBox(height: compact ? 5 : 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      priceText,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontSize: compact ? 13 : null,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      mrpText,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: compact ? 9 : null,
                        color: AppColors.textMuted,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: compact ? 5 : 8),
            if (compact)
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${product.discountPercent}% OFF',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 9,
                        color: AppColors.primaryGreen,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  if (isOutOfStock)
                    const Icon(Icons.remove_shopping_cart_outlined, size: 16)
                  else if (quantity > 0)
                    _CompactQuantityControl(
                      quantity: quantity,
                      onDecrease: () => ref
                          .read(cartControllerProvider.notifier)
                          .decrease(product.id),
                      onIncrease: () => ref
                          .read(cartControllerProvider.notifier)
                          .increase(product.id),
                    )
                  else
                    SizedBox(
                      width: 30,
                      height: 28,
                      child: FilledButton(
                        onPressed: handleAdd,
                        style: FilledButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(9),
                          ),
                        ),
                        child: const Icon(Icons.add_rounded, size: 18),
                      ),
                    ),
                ],
              )
            else
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${product.discountPercent}% OFF',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.primaryGreen,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (isOutOfStock)
                    const Text(
                      'Unavailable',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w700,
                      ),
                    )
                  else if (quantity > 0)
                    Container(
                      height: 34,
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            padding: EdgeInsets.zero,
                            style: IconButton.styleFrom(
                              minimumSize: const Size(20, 20),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 20,
                              minHeight: 20,
                            ),
                            onPressed: () async {
                              await ref
                                  .read(cartControllerProvider.notifier)
                                  .decrease(product.id);
                            },
                            icon: const Icon(Icons.remove, size: 16),
                            color: AppColors.primaryGreen,
                          ),
                          Text(
                            quantity.toString(),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          IconButton(
                            padding: EdgeInsets.zero,
                            style: IconButton.styleFrom(
                              minimumSize: const Size(20, 20),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 20,
                              minHeight: 20,
                            ),
                            onPressed: () async {
                              await ref
                                  .read(cartControllerProvider.notifier)
                                  .increase(product.id);
                            },
                            icon: const Icon(Icons.add, size: 16),
                            color: AppColors.primaryGreen,
                          ),
                        ],
                      ),
                    )
                  else
                    SizedBox(
                      height: 34,
                      child: FilledButton(
                        onPressed: handleAdd,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                        ),
                        child: const Text('ADD'),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _CompactQuantityControl extends StatelessWidget {
  const _CompactQuantityControl({
    required this.quantity,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final Future<void> Function() onDecrease;
  final Future<void> Function() onIncrease;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _QuantityButton(icon: Icons.remove, onPressed: onDecrease),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 3),
          child: Text(
            quantity.toString(),
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
          ),
        ),
        _QuantityButton(icon: Icons.add, onPressed: onIncrease),
      ],
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({required this.icon, required this.onPressed});

  final IconData icon;
  final Future<void> Function() onPressed;

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onPressed,
      radius: 14,
      child: Icon(icon, size: 15, color: AppColors.primaryGreen),
    );
  }
}

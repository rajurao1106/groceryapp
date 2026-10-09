import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/cart/domain/cart_controller.dart';
import 'package:grocery_app/features/cart/domain/cart_count_provider.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/home/presentation/catalog_product_image.dart';
import 'package:grocery_app/features/home/presentation/product_card.dart';
import 'package:grocery_app/features/product_detail/data/mock_product_detail_repository.dart';
import 'package:grocery_app/features/product_detail/domain/product_detail_repository.dart';
import 'package:grocery_app/features/wishlist/presentation/wishlist_controller.dart';
import 'package:shimmer/shimmer.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({required this.productId, super.key});

  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  final PageController _galleryController = PageController();
  int _activeImageIndex = 0;
  int _selectedVariantIndex = 0;
  bool _notified = false;

  @override
  void dispose() {
    _galleryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detailState = ref.watch(productDetailProvider(widget.productId));
    final cartCount = ref.watch(cartItemCountProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Text(
          detailState.value?.product.name ?? 'Product',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            tooltip: 'Share product',
            onPressed: detailState.value == null
                ? null
                : () => _shareProduct(detailState.value!.product),
            icon: const Icon(Icons.ios_share_outlined),
          ),
          IconButton(
            tooltip: 'View cart',
            onPressed: () => context.go('/cart'),
            icon: _CartActionIcon(count: cartCount),
          ),
        ],
      ),
      body: detailState.when(
        data: (detail) => detail == null
            ? const _ProductNotFound()
            : _buildProduct(context, detail),
        error: (error, stackTrace) => _ProductLoadError(
          onRetry: () =>
              ref.invalidate(productDetailProvider(widget.productId)),
        ),
        loading: () => const _ProductDetailShimmer(),
      ),
      bottomNavigationBar: detailState.value == null
          ? null
          : _buildBottomBar(context, detailState.value!),
    );
  }

  Widget _buildProduct(BuildContext context, ProductDetail detail) {
    final variantIndex = _selectedVariantIndex.clamp(
      0,
      detail.variants.length - 1,
    );
    final variant = detail.variants[variantIndex];
    final product = variant.applyTo(detail.product);
    final wishlist = ref.watch(wishlistControllerProvider);
    final isFavourite = wishlist.contains(product.id);
    final isOutOfStock = variant.stock <= 0;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ProductGallery(
            images: detail.images,
            controller: _galleryController,
            activeIndex: _activeImageIndex,
            onPageChanged: (index) => setState(() => _activeImageIndex = index),
            isFavourite: isFavourite,
            onFavouriteTap: () => ref
                .read(wishlistControllerProvider.notifier)
                .toggle(product.id),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        product.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    if (product.discountPercent > 0)
                      _DiscountTag(percent: product.discountPercent),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  product.packSize,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                if (detail.variants.length > 1) ...[
                  const _SectionHeading('Select size'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (
                        var index = 0;
                        index < detail.variants.length;
                        index++
                      )
                        ChoiceChip(
                          label: Text(detail.variants[index].label),
                          selected: index == variantIndex,
                          onSelected: (_) => setState(() {
                            _selectedVariantIndex = index;
                            _notified = false;
                          }),
                          selectedColor: AppColors.primaryGreen.withValues(
                            alpha: 0.14,
                          ),
                          side: BorderSide(
                            color: index == variantIndex
                                ? AppColors.primaryGreen
                                : AppColors.border,
                          ),
                          labelStyle: TextStyle(
                            color: index == variantIndex
                                ? AppColors.primaryGreen
                                : AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
                Row(
                  children: [
                    Text(
                      '₹${product.sellingPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 23,
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '₹${product.mrp.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textMuted,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const Spacer(),
                    if (isOutOfStock)
                      const Text(
                        'Out of stock',
                        style: TextStyle(
                          color: AppColors.error,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                const _DeliveryEstimate(),
                const SizedBox(height: 24),
                const _SectionHeading('Highlights'),
                const SizedBox(height: 10),
                ...detail.highlights.entries.map(
                  (entry) =>
                      _HighlightRow(label: entry.key, value: entry.value),
                ),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.border),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  childrenPadding: const EdgeInsets.only(bottom: 16),
                  title: const Text(
                    'Product details',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        detail.description,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 1, color: AppColors.border),
                if (isOutOfStock)
                  _ProductRail(
                    title: 'Similar products',
                    products: detail.alternativeProducts,
                  ),
                if (detail.relatedProducts.isNotEmpty)
                  _ProductRail(
                    title: 'You might also like',
                    products: detail.relatedProducts,
                  ),
                if (!isOutOfStock && detail.alternativeProducts.isNotEmpty)
                  _ProductRail(
                    title: 'Similar products',
                    products: detail.alternativeProducts,
                  ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, ProductDetail detail) {
    final variantIndex = _selectedVariantIndex.clamp(
      0,
      detail.variants.length - 1,
    );
    final variant = detail.variants[variantIndex];
    final product = variant.applyTo(detail.product);
    final cart = ref.watch(cartControllerProvider);
    final quantity =
        cart
            .where((item) => item.product.id == product.id)
            .firstOrNull
            ?.quantity ??
        0;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: variant.stock <= 0
            ? SizedBox(
                height: 50,
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _notified
                      ? null
                      : () {
                          setState(() => _notified = true);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'We will notify you when it is back.',
                              ),
                            ),
                          );
                        },
                  icon: const Icon(Icons.notifications_active_outlined),
                  label: Text(_notified ? 'You will be notified' : 'Notify me'),
                ),
              )
            : quantity > 0
            ? Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 50,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            tooltip: 'Decrease quantity',
                            onPressed: () => ref
                                .read(cartControllerProvider.notifier)
                                .decrease(product.id),
                            icon: const Icon(Icons.remove),
                            color: AppColors.primaryGreen,
                          ),
                          Text(
                            '$quantity',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          IconButton(
                            tooltip: 'Increase quantity',
                            onPressed: quantity >= variant.stock
                                ? null
                                : () => ref
                                      .read(cartControllerProvider.notifier)
                                      .increase(product.id),
                            icon: const Icon(Icons.add),
                            color: AppColors.primaryGreen,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/cart'),
                    icon: const Icon(Icons.shopping_bag_outlined, size: 18),
                    label: const Text('View cart'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryGreen,
                      minimumSize: const Size(126, 50),
                      side: const BorderSide(color: AppColors.primaryGreen),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              )
            : SizedBox(
                height: 50,
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => ref
                      .read(cartControllerProvider.notifier)
                      .addProduct(product),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'ADD  ·  ₹${product.sellingPrice.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  Future<void> _shareProduct(HomeProduct product) async {
    await Clipboard.setData(
      ClipboardData(text: 'https://grocerygo.app/product/${product.id}'),
    );
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Product link copied')));
    }
  }
}

class _ProductGallery extends StatelessWidget {
  const _ProductGallery({
    required this.images,
    required this.controller,
    required this.activeIndex,
    required this.onPageChanged,
    required this.isFavourite,
    required this.onFavouriteTap,
  });

  final List<String> images;
  final PageController controller;
  final int activeIndex;
  final ValueChanged<int> onPageChanged;
  final bool isFavourite;
  final VoidCallback onFavouriteTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 280,
      child: Stack(
        children: [
          PageView.builder(
            controller: controller,
            itemCount: images.length,
            onPageChanged: onPageChanged,
            itemBuilder: (context, index) => ColoredBox(
              color: AppColors.surfaceVariant,
              child: CatalogProductImage(
                image: images[index],
                emojiFontSize: 120,
              ),
            ),
          ),
          Positioned(
            top: 14,
            right: 16,
            child: Material(
              color: AppColors.surface.withValues(alpha: 0.94),
              shape: const CircleBorder(),
              child: IconButton(
                tooltip: isFavourite
                    ? 'Remove from wishlist'
                    : 'Add to wishlist',
                onPressed: onFavouriteTap,
                icon: Icon(
                  isFavourite ? Icons.favorite : Icons.favorite_border,
                  color: isFavourite ? AppColors.error : AppColors.textPrimary,
                ),
              ),
            ),
          ),
          if (images.length > 1)
            Positioned(
              bottom: 14,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var index = 0; index < images.length; index++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: index == activeIndex ? 18 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: index == activeIndex
                            ? AppColors.primaryGreen
                            : AppColors.textMuted.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _CartActionIcon extends StatelessWidget {
  const _CartActionIcon({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 34,
      height: 34,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          const Positioned(
            left: 0,
            bottom: 0,
            child: Icon(Icons.shopping_cart_outlined),
          ),
          if (count > 0)
            Positioned(
              top: -5,
              right: -7,
              child: Container(
                constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: const BoxDecoration(
                  color: AppColors.primaryOrange,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  count > 99 ? '99+' : '$count',
                  style: const TextStyle(
                    fontSize: 9,
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DiscountTag extends StatelessWidget {
  const _DiscountTag({required this.percent});

  final int percent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryOrange.withValues(alpha: 0.17),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$percent% OFF',
        style: const TextStyle(
          color: AppColors.primaryOrangeDark,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _DeliveryEstimate extends StatelessWidget {
  const _DeliveryEstimate();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: const Row(
        children: [
          Icon(Icons.bolt_rounded, color: AppColors.primaryGreen, size: 20),
          SizedBox(width: 8),
          Text(
            'Delivery in 10 mins',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading(this.title);

  final String title;

  @override
  Widget build(BuildContext context) => Text(
    title,
    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
  );
}

class _HighlightRow extends StatelessWidget {
  const _HighlightRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 104,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductRail extends ConsumerWidget {
  const _ProductRail({required this.title, required this.products});

  final String title;
  final List<HomeProduct> products;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlist = ref.watch(wishlistControllerProvider);
    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeading(title),
          const SizedBox(height: 12),
          SizedBox(
            height: 275,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: products.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final product = products[index];
                return SizedBox(
                  width: 170,
                  child: ProductCard(
                    product: product,
                    isFavourite: wishlist.contains(product.id),
                    onTap: () => context.push('/product/${product.id}'),
                    onFavouriteTap: () => ref
                        .read(wishlistControllerProvider.notifier)
                        .toggle(product.id),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductDetailShimmer extends StatelessWidget {
  const _ProductDetailShimmer();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceVariant,
      highlightColor: AppColors.surface,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 280, width: double.infinity),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _skeletonLine(width: 220, height: 22),
                  const SizedBox(height: 12),
                  _skeletonLine(width: 90, height: 14),
                  const SizedBox(height: 24),
                  _skeletonLine(width: 155, height: 18),
                  const SizedBox(height: 12),
                  _skeletonLine(width: double.infinity, height: 48),
                  const SizedBox(height: 28),
                  _skeletonLine(width: 115, height: 18),
                  const SizedBox(height: 12),
                  for (var index = 0; index < 4; index++) ...[
                    _skeletonLine(width: double.infinity, height: 16),
                    const SizedBox(height: 12),
                  ],
                  const SizedBox(height: 16),
                  _skeletonLine(width: 180, height: 18),
                  const SizedBox(height: 14),
                  Row(
                    children: List.generate(
                      2,
                      (index) => Container(
                        width: 150,
                        height: 220,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _skeletonLine({required double width, required double height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(6),
      ),
    );
  }
}

class _ProductNotFound extends StatelessWidget {
  const _ProductNotFound();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.inventory_2_outlined,
              size: 48,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 12),
            const Text(
              'Product not found',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text('This item may no longer be available.'),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Go back'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductLoadError extends StatelessWidget {
  const _ProductLoadError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Could not load this product.'),
          const SizedBox(height: 8),
          TextButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    );
  }
}
